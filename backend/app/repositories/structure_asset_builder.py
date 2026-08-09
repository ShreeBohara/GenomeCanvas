from __future__ import annotations

import json
import logging
import math
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
from statistics import mean
from typing import Any

from app.repositories.structural_similarity import (
    build_neighbour_table,
    traces_from_assets,
)


LOGGER = logging.getLogger(__name__)


RawDict = dict[str, Any]
# 2 adds structure_error, drops confidence_palette for substituted structures,
# and adds the precomputed structural_neighbours table.
ASSET_VERSION = 2
ASSET_FILE_NAME = "protein_structure_assets.json"
# Deeper than any caller asks for, so the stored table can serve a larger
# `limit` later without a rebuild.
NEIGHBOUR_LIMIT = 12

CATEGORY_HALO_COLORS = {
    "enzyme": "#8de285",
    "signaling": "#f1766a",
    "structural": "#77b0ff",
    "transporter": "#f5b55f",
    "dna_repair": "#7de7dc",
}


def _seed_from_text(value: str) -> int:
    return sum((index + 1) * ord(char) for index, char in enumerate(value))


def _load_json(path: Path) -> Any:
    with path.open() as handle:
        return json.load(handle)


def _write_json(path: Path, payload: Any) -> None:
    with path.open("w") as handle:
        json.dump(payload, handle, indent=2)
        handle.write("\n")


def _fetch_json(url: str) -> Any:
    with urllib.request.urlopen(url, timeout=30) as response:
        return json.load(response)


def _fetch_text(url: str) -> str:
    with urllib.request.urlopen(url, timeout=30) as response:
        return response.read().decode("utf-8")


def _resolve_prediction_entry(api_url: str, uniprot_id: str) -> RawDict:
    entries = _fetch_json(api_url)
    if not isinstance(entries, list) or not entries:
        raise ValueError(f"No AlphaFold entries returned for {uniprot_id}")

    for entry in entries:
        if entry.get("uniprotAccession") == uniprot_id and entry.get("sequenceStart", 1) == 1:
            return entry
    return entries[0]


def _parse_pdb_trace(pdb_text: str) -> tuple[list[list[float]], list[float]]:
    points: list[list[float]] = []
    confidence: list[float] = []
    seen_residues: set[tuple[str, str]] = set()

    for line in pdb_text.splitlines():
        if not line.startswith("ATOM"):
            continue
        if line[12:16].strip() != "CA":
            continue

        chain_id = line[21:22].strip() or "A"
        residue_id = line[22:26].strip()
        residue_key = (chain_id, residue_id)
        if residue_key in seen_residues:
            continue
        seen_residues.add(residue_key)

        points.append(
            [
                float(line[30:38]),
                float(line[38:46]),
                float(line[46:54]),
            ]
        )
        confidence.append(float(line[60:66]))

    if len(points) < 6:
        raise ValueError("PDB trace did not contain enough CA atoms")
    return points, confidence


def _center_and_normalize(points: list[list[float]]) -> tuple[list[list[float]], float]:
    centroid = [mean(axis) for axis in zip(*points)]
    centered = [[point[i] - centroid[i] for i in range(3)] for point in points]
    bounds_radius = max(
        math.sqrt((point[0] ** 2) + (point[1] ** 2) + (point[2] ** 2))
        for point in centered
    )
    scale = bounds_radius or 1.0
    normalized = [[point[0] / scale, point[1] / scale, point[2] / scale] for point in centered]
    return normalized, bounds_radius


def _arc_lengths(points: list[list[float]]) -> list[float]:
    distances = [0.0]
    total = 0.0
    for first, second in zip(points, points[1:]):
        segment = math.dist(first, second)
        total += segment
        distances.append(total)
    return distances


def _resample_trace(
    points: list[list[float]],
    confidence: list[float],
    target_count: int,
) -> tuple[list[list[float]], list[float]]:
    if len(points) <= target_count:
        return points, confidence

    distances = _arc_lengths(points)
    total_length = distances[-1]
    if total_length == 0:
        return points[:target_count], confidence[:target_count]

    sampled_points: list[list[float]] = []
    sampled_confidence: list[float] = []
    cursor = 0
    for index in range(target_count):
        target = total_length * (index / (target_count - 1))
        while cursor < len(distances) - 2 and distances[cursor + 1] < target:
            cursor += 1

        start_distance = distances[cursor]
        end_distance = distances[cursor + 1]
        if end_distance == start_distance:
            ratio = 0.0
        else:
            ratio = (target - start_distance) / (end_distance - start_distance)

        start_point = points[cursor]
        end_point = points[cursor + 1]
        start_confidence = confidence[cursor]
        end_confidence = confidence[cursor + 1]
        sampled_points.append(
            [
                round(start_point[0] + ((end_point[0] - start_point[0]) * ratio), 5),
                round(start_point[1] + ((end_point[1] - start_point[1]) * ratio), 5),
                round(start_point[2] + ((end_point[2] - start_point[2]) * ratio), 5),
            ]
        )
        sampled_confidence.append(
            round(start_confidence + ((end_confidence - start_confidence) * ratio), 2)
        )

    return sampled_points, sampled_confidence


def _confidence_palette(confidence: list[float]) -> RawDict:
    count = len(confidence) or 1
    return {
        "average": round(mean(confidence), 2),
        "minimum": round(min(confidence), 2),
        "maximum": round(max(confidence), 2),
        "very_high_fraction": round(sum(value >= 90 for value in confidence) / count, 4),
        "confident_fraction": round(sum(70 <= value < 90 for value in confidence) / count, 4),
        "low_fraction": round(sum(50 <= value < 70 for value in confidence) / count, 4),
        "very_low_fraction": round(sum(value < 50 for value in confidence) / count, 4),
    }


def _camera_hint() -> RawDict:
    return {
        "position": [0.0, 0.0, 4.4],
        "target": [0.0, 0.0, 0.0],
        "fov": 34,
    }


def _procedural_trace(protein: RawDict) -> tuple[list[list[float]], list[float], float]:
    sequence_length = max(int(protein.get("sequence_length") or 240), 60)
    count = max(48, min(180, sequence_length // 8))
    seed = _seed_from_text(f"{protein['uniprot_id']}:{protein['gene_name']}")
    points: list[list[float]] = []
    confidence: list[float] = []

    for index in range(count):
        t = index / max(count - 1, 1)
        theta = (t * math.pi * (4 + (seed % 5))) + ((seed % 17) * 0.03)
        envelope = 0.35 + (0.18 * math.sin((t * math.pi * 3) + (seed % 11)))
        x = math.cos(theta) * (0.6 + envelope)
        y = ((t - 0.5) * 2.6) + (0.22 * math.sin((t * math.pi * 8) + (seed % 13)))
        z = math.sin(theta) * (0.42 + envelope)
        points.append([x, y, z])
        confidence.append(round(35 + (22 * abs(math.sin(theta * 0.7))), 2))

    normalized_points, bounds_radius = _center_and_normalize(points)
    estimated_radius = max(bounds_radius * (math.sqrt(sequence_length) / 2.6), 24.0)
    return normalized_points, confidence, estimated_radius


def _build_asset_record(protein: RawDict) -> RawDict:
    structure_source = "alphafold"
    structure_error: str | None = None
    pdb_url: str | None = None
    try:
        entry = _resolve_prediction_entry(protein["alphafold_url"], protein["uniprot_id"])
        pdb_url = entry.get("pdbUrl")
        if not pdb_url:
            raise ValueError(f"No AlphaFold pdbUrl returned for {protein['uniprot_id']}")

        trace_points, confidence = _parse_pdb_trace(_fetch_text(pdb_url))
        normalized_points, bounds_radius = _center_and_normalize(trace_points)
    except Exception as exc:
        # The fallback is deliberate -- AlphaFold DB publishes no single
        # full-length model above 2,700 residues, so BRCA2 and ATM 404 -- but it
        # used to be silent. At 54 proteins that hid two substitutions; against a
        # rate-limited API at ten thousand it would fabricate a large fraction of
        # the dataset and still report success. Record what failed and why.
        structure_source = "procedural"
        structure_error = f"{type(exc).__name__}: {exc}"
        pdb_url = None
        LOGGER.warning(
            "%s (%s): no AlphaFold structure, substituting a procedural trace -- %s",
            protein["gene_name"],
            protein["uniprot_id"],
            structure_error,
        )
        normalized_points, confidence, bounds_radius = _procedural_trace(protein)

    low_points, low_confidence = _resample_trace(
        normalized_points, confidence, min(24, len(normalized_points))
    )
    mid_points, mid_confidence = _resample_trace(
        normalized_points, confidence, min(72, len(normalized_points))
    )
    focus_points, focus_confidence = _resample_trace(
        normalized_points, confidence, min(180, len(normalized_points))
    )

    return {
        "uniprot_id": protein["uniprot_id"],
        "cluster_id": protein["function_category"],
        "halo_color": CATEGORY_HALO_COLORS.get(protein["function_category"], "#7de7dc"),
        "lod_key": protein["uniprot_id"],
        "bounds_radius": round(bounds_radius, 3),
        "low_trace": {"points": low_points, "confidence": low_confidence},
        "mid_trace": {"points": mid_points, "confidence": mid_confidence},
        "focus_trace": {"points": focus_points, "confidence": focus_confidence},
        "camera": _camera_hint(),
        # A procedural trace's "confidence" is a sine wave, not pLDDT. Reporting
        # a palette for it would put fabricated numbers next to real ones in the
        # same UI card, so there is no palette to report.
        "confidence_palette": (
            _confidence_palette(confidence) if structure_source == "alphafold" else None
        ),
        "alphafold_pdb_url": pdb_url,
        "structure_source": structure_source,
        "structure_error": structure_error,
        "similar_ids": [],
    }


def build_structure_assets(data_dir: Path, max_workers: int = 8) -> RawDict:
    """Fetch and reduce every AlphaFold model referenced by proteins.json.

    Almost all of the wall clock here is waiting on EBI: two requests per
    protein, and the arithmetic across all of them is a fifth of a second. The
    work is therefore pooled rather than serialised. Bounded at 8 to stay a
    polite client of a free public API; urllib releases the GIL around socket
    reads, so threads are sufficient and no event loop is needed.
    """
    proteins = _load_json(data_dir / "proteins.json")
    records: dict[str, RawDict] = {}

    with ThreadPoolExecutor(max_workers=max_workers) as pool:
        futures = {
            pool.submit(_build_asset_record, protein): protein for protein in proteins
        }
        for future in as_completed(futures):
            protein = futures[future]
            # _build_asset_record handles its own failures and falls back, so an
            # exception escaping it is a bug in the builder rather than a bad
            # response. Let it fail the build instead of silently dropping a
            # protein from the output.
            records[protein["uniprot_id"]] = future.result()

    substituted = sorted(
        uniprot_id
        for uniprot_id, record in records.items()
        if record["structure_source"] != "alphafold"
    )
    if substituted:
        LOGGER.warning(
            "%d of %d proteins have no AlphaFold structure and use a procedural "
            "trace: %s",
            len(substituted),
            len(records),
            ", ".join(substituted),
        )

    # Structural neighbours are derived from the traces above, so they are
    # computed here rather than at request time: it is an all-pairs comparison,
    # and the inputs only change when this builder runs.
    neighbours = build_neighbour_table(
        traces_from_assets(records.values()), limit=NEIGHBOUR_LIMIT
    )

    return {
        "version": ASSET_VERSION,
        "proteins": dict(sorted(records.items())),
        "structural_neighbours": neighbours,
    }


def write_structure_assets(data_dir: Path) -> RawDict:
    payload = build_structure_assets(data_dir)
    _write_json(data_dir / ASSET_FILE_NAME, payload)
    return payload
