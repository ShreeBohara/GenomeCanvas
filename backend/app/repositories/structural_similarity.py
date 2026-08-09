"""Structural similarity between proteins, computed from their backbone traces.

The similarity endpoint used to rank proteins by Euclidean distance between the
`umap_*` coordinates in proteins.json. Those coordinates are hand-authored --
one decimal place, categories sitting in tidy rectangles -- so "similar" meant
"placed nearby by hand", and the answer was circular: it could only ever return
what the layout already asserted.

This computes it from the actual geometry instead. Every focus trace is exactly
180 alpha-carbon positions, arc-length resampled from the AlphaFold model and
already centroid-centred and divided by its own bounding radius. Equal length
gives a direct point correspondence, and the normalisation makes the comparison
scale-invariant: what is measured is backbone *shape*, not size.

Two notes on what this metric is and is not:

  - Correspondence is by arc-length position along the chain, not by sequence
    alignment. Two folds that superimpose well but differ in loop length will
    score worse here than under TM-align. That is a real limitation and the
    reason this is called a shape distance rather than a structural alignment.
  - The two proteins with no AlphaFold model carry procedural traces. They are
    excluded rather than ranked against real structures.

Optimal superposition uses Horn's quaternion method: build the 4x4 key matrix
from the cross-covariance and take its largest eigenvalue, from which the
minimum RMSD follows directly. No rotation matrix is ever formed, and no SVD is
needed, so this stays dependency-free.
"""

from __future__ import annotations

import math
from typing import Iterable, Sequence


Point = Sequence[float]
Trace = Sequence[Point]

# Jacobi rotation is quadratically convergent on a matrix this small; 64 sweeps
# is far beyond what 4x4 needs and still costs nothing.
_MAX_SWEEPS = 64
_EPSILON = 1e-12


def _cross_covariance(left: Trace, right: Trace) -> list[list[float]]:
    """3x3 sum of outer products, and the summed squared norms of both sets."""
    matrix = [[0.0] * 3 for _ in range(3)]
    for a, b in zip(left, right):
        for i in range(3):
            ai = a[i]
            row = matrix[i]
            for j in range(3):
                row[j] += ai * b[j]
    return matrix


def _inner_product(left: Trace, right: Trace) -> float:
    total = 0.0
    for a, b in zip(left, right):
        total += a[0] * a[0] + a[1] * a[1] + a[2] * a[2]
        total += b[0] * b[0] + b[1] * b[1] + b[2] * b[2]
    return total


def _horn_key_matrix(r: list[list[float]]) -> list[list[float]]:
    """Horn's symmetric 4x4 whose largest eigenvalue maximises the overlap."""
    xx, xy, xz = r[0]
    yx, yy, yz = r[1]
    zx, zy, zz = r[2]
    return [
        [xx + yy + zz, yz - zy, zx - xz, xy - yx],
        [yz - zy, xx - yy - zz, xy + yx, zx + xz],
        [zx - xz, xy + yx, -xx + yy - zz, yz + zy],
        [xy - yx, zx + xz, yz + zy, -xx - yy + zz],
    ]


def _largest_eigenvalue(matrix: list[list[float]]) -> float:
    """Largest eigenvalue of a small real symmetric matrix, by Jacobi rotation.

    Jacobi is used rather than power iteration because it is unconditionally
    convergent and does not degrade when the top two eigenvalues are close --
    which happens for near-symmetric structures.
    """
    n = len(matrix)
    a = [row[:] for row in matrix]

    for _ in range(_MAX_SWEEPS):
        off_diagonal = math.sqrt(
            sum(a[i][j] ** 2 for i in range(n) for j in range(n) if i != j)
        )
        if off_diagonal < _EPSILON:
            break

        for p in range(n - 1):
            for q in range(p + 1, n):
                if abs(a[p][q]) < _EPSILON:
                    continue
                theta = (a[q][q] - a[p][p]) / (2.0 * a[p][q])
                sign = 1.0 if theta >= 0 else -1.0
                t = sign / (abs(theta) + math.sqrt(theta * theta + 1.0))
                c = 1.0 / math.sqrt(t * t + 1.0)
                s = t * c

                for k in range(n):
                    akp, akq = a[k][p], a[k][q]
                    a[k][p] = c * akp - s * akq
                    a[k][q] = s * akp + c * akq
                for k in range(n):
                    apk, aqk = a[p][k], a[q][k]
                    a[p][k] = c * apk - s * aqk
                    a[q][k] = s * apk + c * aqk

    return max(a[i][i] for i in range(n))


def shape_rmsd(left: Trace, right: Trace) -> float:
    """Minimum RMSD between two equal-length traces under optimal rotation.

    Both inputs are assumed already centred on their centroid, which the asset
    builder guarantees. Returns 0.0 for identical shapes and grows with
    dissimilarity; because the traces are unit-normalised, the value is bounded
    by roughly 2.
    """
    if len(left) != len(right):
        raise ValueError(
            f"traces must be the same length to correspond point-wise: "
            f"{len(left)} != {len(right)}"
        )
    count = len(left)
    if count == 0:
        raise ValueError("cannot compare empty traces")

    e0 = _inner_product(left, right)
    key = _horn_key_matrix(_cross_covariance(left, right))
    eigenvalue = _largest_eigenvalue(key)

    # Floating point can push this marginally negative for identical inputs.
    mean_square = max(0.0, (e0 - 2.0 * eigenvalue) / count)
    return math.sqrt(mean_square)


def similarity_from_rmsd(rmsd: float) -> float:
    """Map a shape RMSD onto (0, 1], monotonically decreasing.

    The 0.5 scale is chosen so the interesting range of this dataset -- most
    real pairs land between 0.3 and 1.2 -- spreads across the middle of the
    output range rather than saturating near 1.
    """
    return 1.0 / (1.0 + (rmsd / 0.5))


def rank_neighbours(
    target_id: str,
    traces: dict[str, Trace],
    limit: int,
) -> list[tuple[str, float, float]]:
    """Nearest structural neighbours of one protein.

    Returns `(uniprot_id, similarity, rmsd)` ordered by decreasing similarity,
    with ties broken on accession so the output is stable across rebuilds.
    """
    target = traces.get(target_id)
    if target is None:
        return []

    scored: list[tuple[str, float, float]] = []
    for other_id, other in traces.items():
        if other_id == target_id:
            continue
        rmsd = shape_rmsd(target, other)
        scored.append((other_id, similarity_from_rmsd(rmsd), rmsd))

    scored.sort(key=lambda item: (-item[1], item[0]))
    return scored[:limit]


def build_neighbour_table(
    traces: dict[str, Trace],
    limit: int = 12,
) -> dict[str, list[dict[str, float | str]]]:
    """All-pairs shape comparison, reduced to a top-N table per protein.

    O(n^2) in the protein count and O(m) in trace length. At 54 proteins that is
    1,431 comparisons of 180 points each and runs in well under a second, so it
    is computed at build time and stored rather than served on demand.
    """
    return {
        uniprot_id: [
            {"uniprot_id": other, "similarity": round(score, 6), "rmsd": round(rmsd, 6)}
            for other, score, rmsd in rank_neighbours(uniprot_id, traces, limit)
        ]
        for uniprot_id in sorted(traces)
    }


def traces_from_assets(assets: Iterable[dict]) -> dict[str, Trace]:
    """Focus traces of every protein backed by a real AlphaFold model.

    Procedural traces are excluded: their shape is a seeded sine curve, so any
    distance computed against one describes the generator, not the protein.
    """
    return {
        asset["uniprot_id"]: asset["focus_trace"]["points"]
        for asset in assets
        if asset.get("structure_source") == "alphafold"
    }
