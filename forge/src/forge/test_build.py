"""The sample profile end to end: offline, deterministic, checked, and loud on bad input."""

from __future__ import annotations

import gzip
import hashlib
import json
import re
import shutil
import subprocess
import sys
from dataclasses import replace
from datetime import date
from pathlib import Path

import pytest

from forge import cli_build
from forge.ledger import DEFAULT_LEDGER, parse_ledger, read_ledger
from forge.pipeline.lock import FORGE_ROOT, Lock, read_lock
from forge.pipeline.manifest import build_release_files
from forge.pipeline.runner import BuildResult, run_build
from forge.stages import STAGES

TODAY = date(2026, 11, 25)


def _build(cache: Path, lock: Lock | None = None, forge_root: Path = FORGE_ROOT) -> BuildResult:
    return run_build(
        STAGES,
        lock=lock or read_lock(),
        ledger=parse_ledger(read_ledger(DEFAULT_LEDGER)),
        profile="sample",
        today=TODAY,
        cache_root=cache,
        fetch=None,
        forge_root=forge_root,
    )


@pytest.fixture(scope="module")
def sample(tmp_path_factory: pytest.TempPathFactory) -> BuildResult:
    return _build(tmp_path_factory.mktemp("cache"))


def _digests(files: dict[str, bytes]) -> dict[str, str]:
    return {name: hashlib.sha256(data).hexdigest() for name, data in files.items()}


def test_every_check_passes_on_the_sample(sample: BuildResult) -> None:
    assert [c.name for c in sample.checks if not c.passed] == []
    assert len(sample.checks) >= 20


def test_two_builds_from_empty_caches_are_byte_identical(
    sample: BuildResult, tmp_path: Path
) -> None:
    again = _build(tmp_path / "other-cache")
    assert _digests(build_release_files(sample)) == _digests(build_release_files(again))


def test_a_build_from_the_cache_is_byte_identical(sample: BuildResult, tmp_path: Path) -> None:
    _build(tmp_path / "cache")
    cached = _build(tmp_path / "cache")
    assert all(s.cached for s in cached.stages)
    assert _digests(build_release_files(sample)) == _digests(build_release_files(cached))


def test_the_manifest_describes_tables_sources_and_checks(sample: BuildResult) -> None:
    files = build_release_files(sample)
    manifest = json.loads(files["manifest.json"])
    assert manifest["release"] == "tables-sample"
    assert manifest["sample"] is True
    assert manifest["tables"]["proteins"]["rows"] == 200
    proteins = manifest["tables"]["proteins"]
    assert hashlib.sha256(files[proteins["path"]]).hexdigest() == proteins["sha256"]
    assert manifest["sources"]["uniprot"]["licence"] == "CC-BY-4.0"
    assert manifest["sources"]["hgnc"]["licence"] == "CC0-1.0"
    assert set(manifest["checks"]["results"].values()) == {"passed"}
    assert "seconds" not in files["manifest.json"].decode()


def test_the_awkward_cases_are_in_the_sample(sample: BuildResult) -> None:
    proteins = sample.tables["proteins"]
    by_accession = dict(
        zip(proteins.column("accession"), proteins.column("gene_symbol"), strict=True)
    )
    assert by_accession["Q8WZ42"] == "TTN"
    assert by_accession["P51587"] == "BRCA2"
    assert any(s is None for s in by_accession.values())
    sequences = sample.tables["sequences"]
    assert any("U" in s for s in sequences.column("nonstandard_residues"))  # type: ignore[operator]
    statuses = set(sample.tables["crosswalk"].column("ensembl_status"))
    assert statuses == {"unique", "ambiguous", "missing"}


def _mutated_root(tmp_path: Path, mutate: object) -> tuple[Path, Lock]:
    """A copy of forge/ whose sample XML is mutated and re-pinned, as if upstream shipped it."""
    root = tmp_path / "forge"
    shutil.copytree(FORGE_ROOT / "snapshots", root / "snapshots")
    lock = read_lock()
    artifact = lock.artifact("uniprot_human_xml")
    path = root / str(artifact.variant("sample").path)
    data = gzip.compress(mutate(gzip.decompress(path.read_bytes())), mtime=0)  # type: ignore[operator]
    path.write_bytes(data)
    pinned = replace(
        artifact.variant("sample"), bytes=len(data), sha256=hashlib.sha256(data).hexdigest()
    )
    variants = {**artifact.variants, "sample": pinned}
    return root, Lock({**lock.artifacts, artifact.id: replace(artifact, variants=variants)})


def _drop_titin(xml: bytes) -> bytes:
    marker = xml.index(b"<accession>Q8WZ42</accession>")
    start = xml.rindex(b"<entry ", 0, marker)
    end = xml.index(b"</entry>\n", marker) + len(b"</entry>\n")
    return xml[:start] + xml[end:]


@pytest.mark.parametrize(
    ("mutate", "caught_by"),
    [
        (
            # The first residue of the first sequence in the file, M becomes W;
            # the published checksum is left as it was.
            lambda x: re.sub(rb'(<sequence length="[^>]*>)M', rb"\1W", x, count=1),
            "sequences: checksum matches UniProt's CRC64",
        ),
        (
            # The first chain end in the file, moved far past any protein's length.
            lambda x: x.replace(b'<end position="', b'<end position="9', 1),
            "features: positions lie within the sequence",
        ),
        (_drop_titin, "proteins: count equals what UniProt reports for the release"),
    ],
)
def test_mutated_input_is_caught_by_the_check_written_for_it(
    tmp_path: Path, mutate: object, caught_by: str
) -> None:
    root, lock = _mutated_root(tmp_path, mutate)
    result = _build(tmp_path / "cache", lock=lock, forge_root=root)
    assert caught_by in [c.name for c in result.failed_errors]


def test_the_command_forbids_the_network_for_the_sample(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    calls: list[str] = []
    monkeypatch.setattr(cli_build, "forbid_network", lambda: calls.append("offline"))
    assert cli_build.build("sample", tmp_path / "out", tmp_path / "cache", TODAY) == 0
    assert calls == ["offline"]
    assert (tmp_path / "out" / "manifest.json").is_file()


def test_the_offline_guard_refuses_connections() -> None:
    code = (
        "from forge.pipeline.offline import forbid_network, NetworkForbiddenError\n"
        "import urllib.request\n"
        "forbid_network()\n"
        "try:\n"
        "    urllib.request.urlopen('https://example.org', timeout=1)\n"
        "except NetworkForbiddenError:\n"
        "    print('refused')\n"
        "except Exception as error:\n"
        "    print('other', type(error).__name__, error)\n"
    )
    out = subprocess.run([sys.executable, "-c", code], capture_output=True, text=True, check=True)  # noqa: S603
    assert out.stdout.strip() == "refused"
