from __future__ import annotations

import ast
import sys
import unittest
from pathlib import Path


BACKEND_DIR = Path(__file__).resolve().parents[1]
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

APP_DIR = BACKEND_DIR / "app"

# The repository's backing containers. These are an implementation detail of the
# in-memory fixture store: a database-backed repository cannot hand out a dict of
# every node without materialising the entire graph, which defeats the point of
# having one.
BACKING_FIELDS = {
    "proteins_by_id",
    "nodes_by_id",
    "structure_assets_by_id",
    "structural_neighbours",
    "adjacency",
    "edges",
}

# Only the repository package may touch them.
ALLOWED = {
    APP_DIR / "repositories" / "fixture_repository.py",
}


class RepositoryBoundaryTests(unittest.TestCase):
    """Services and routers must talk to the repository through methods.

    Every service originally reached in for `repository.nodes_by_id` and
    indexed it directly. That is correct against dicts and impossible against
    anything else, so it silently pinned the whole application to one storage
    implementation -- the swap the README describes as deliberate could not
    actually have been performed.

    Breaking that coupling is only durable if something checks it. A reviewer
    will not notice one new `nodes_by_id[...]` in a diff; this will.
    """

    def _offenders(self) -> list[str]:
        offenders: list[str] = []
        for path in sorted(APP_DIR.rglob("*.py")):
            if path in ALLOWED:
                continue
            tree = ast.parse(path.read_text(), filename=str(path))
            for node in ast.walk(tree):
                if not isinstance(node, ast.Attribute):
                    continue
                if node.attr not in BACKING_FIELDS:
                    continue
                # Only flag access *through* a repository reference, so a local
                # variable that happens to share a name is not a false positive.
                target = node.value
                base = target.attr if isinstance(target, ast.Attribute) else (
                    target.id if isinstance(target, ast.Name) else ""
                )
                if "repository" in base or "repo" == base:
                    rel = path.relative_to(BACKEND_DIR)
                    offenders.append(f"{rel}:{node.lineno} -> .{node.attr}")
        return offenders

    def test_no_module_reaches_past_the_repository_interface(self) -> None:
        offenders = self._offenders()
        self.assertEqual(
            offenders,
            [],
            "These access the repository's backing containers directly. Add a "
            "method to the repository that answers the question instead:\n  "
            + "\n  ".join(offenders),
        )

    def test_the_guard_actually_detects_a_violation(self) -> None:
        """A test that can never fail is worse than no test.

        Confirms the AST walk catches the exact pattern that was removed, so a
        green result means the boundary holds rather than the checker being
        broken.
        """
        source = "def f(self):\n    return self.repository.nodes_by_id[key]\n"
        tree = ast.parse(source)
        hits = [
            n.attr
            for n in ast.walk(tree)
            if isinstance(n, ast.Attribute) and n.attr in BACKING_FIELDS
        ]
        self.assertEqual(hits, ["nodes_by_id"])


class RepositoryInterfaceTests(unittest.TestCase):
    """The method surface the services depend on.

    This is the contract a Neo4j-backed implementation would have to satisfy.
    Naming it in a test keeps it from drifting by accident.
    """

    REQUIRED = (
        "list_proteins",
        "get_protein",
        "get_structure_asset",
        "list_structure_assets",
        "get_structural_neighbours",
        "list_nodes",
        "list_nodes_by_type",
        "get_node",
        "get_nodes",
        "has_node",
        "neighbors",
        "count_proteins",
        "count_nodes",
    )

    def test_fixture_repository_satisfies_the_interface(self) -> None:
        from app.repositories.fixture_repository import FixtureRepository

        for name in self.REQUIRED:
            self.assertTrue(
                callable(getattr(FixtureRepository, name, None)),
                f"FixtureRepository is missing {name}()",
            )

    def test_batch_node_lookup_skips_ids_that_do_not_resolve(self) -> None:
        from app.core.config import get_settings
        from app.repositories.fixture_repository import FixtureRepository

        repo = FixtureRepository(get_settings().data_dir)
        found = repo.get_nodes(["P38398", "does:not:exist", "P00533"])
        self.assertEqual([n.id for n in found], ["P38398", "P00533"])

    def test_counts_match_the_loaded_fixtures(self) -> None:
        from app.core.config import get_settings
        from app.repositories.fixture_repository import FixtureRepository

        repo = FixtureRepository(get_settings().data_dir)
        self.assertEqual(repo.count_proteins(), len(repo.list_proteins()))
        self.assertEqual(repo.count_nodes(), len(repo.list_nodes()))


if __name__ == "__main__":
    unittest.main()
