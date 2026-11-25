# Points format, version 0

One position and one category for every protein on the flat map, for first paint.
Written by `forge.points` (Python) and read by `decodePoints` in
`packages/query` (TypeScript). Both are tested against the worked example below.

Media type in the manifest: `"format": "points/0"`. File extension: `.bin`.

## Layout

Every multi-byte value is **little-endian**. With `n` rows:

| Offset | Size | Type | Field | Value |
|---|---|---|---|---|
| 0 | 4 | bytes | magic | ASCII `GCPT` (`47 43 50 54`) |
| 4 | 2 | uint16 | format version | `0` |
| 6 | 2 | uint16 | header length in bytes | `16` |
| 8 | 4 | uint32 | row count `n` | |
| 12 | 4 | uint32 | reserved | `0` |
| 16 | 4n | float32 × n | x position of each row | finite |
| 16 + 4n | 4n | float32 × n | y position of each row | finite |
| 16 + 8n | n | uint8 × n | category of each row | an index into the manifest's `categories` |

The file is exactly `16 + 9n` bytes. There is nothing after the last category byte.

Rules a reader enforces, each with its own error:

- The file is at least 16 bytes, and the magic is `GCPT`.
- The format version is `0`. Any other version is refused, not guessed at.
- The header length is `16`.
- The reserved field is `0`.
- The length is exactly `16 + 9n`. Shorter is truncated; longer is refused too.
- `n` equals the manifest's `row_count`.
- Every x and y is finite: no NaN, no infinity.
- Every category byte is less than the number of categories in the manifest.

## Why it looks like this

- **Columns, not rows.** x, y and category are each one contiguous block, so a
  reader can view them as `Float32Array` and `Uint8Array` without copying, and the
  GPU takes them as instance attributes directly.
- **Aligned.** The header is 16 bytes and each float block is a multiple of 4, so
  both float arrays start on a 4-byte boundary.
- **Two dimensions.** The map is flat (plan section 3.6, rule 8). Version 1's
  `umap_z` is not carried.
- **float32.** Positions are layout coordinates, not measurements; float32 is
  what the GPU uses. Values are rounded to the nearest float32 when written, so
  `0.8` is stored as `0.800000011920929`.
- **Row order is the protein index's row order.** Row `i` here is row `i` of the
  release's `protein-index/0` file. The pipeline sorts rows by accession.
- **The category byte is an index, not a code.** Its meaning comes from the
  manifest's `categories` list, which also carries the words a reader sees.

## Worked example

Two rows:

| Row | x | y | category |
|---|---|---|---|
| 0 | 1.5 | −2.0 | 0 |
| 1 | 0.25 | 4.0 | 3 |

All four positions are exact in float32 (1.5 = `0x3FC00000`, 0.25 = `0x3E800000`,
−2.0 = `0xC0000000`, 4.0 = `0x40800000`). The file is `16 + 9 × 2 = 34` bytes:

```
offset  bytes                      meaning
0       47 43 50 54                magic "GCPT"
4       00 00                      version 0
6       10 00                      header length 16
8       02 00 00 00                n = 2
12      00 00 00 00                reserved
16      00 00 c0 3f                x[0] = 1.5
20      00 00 80 3e                x[1] = 0.25
24      00 00 00 c0                y[0] = -2.0
28      00 00 80 40                y[1] = 4.0
32      00                         category[0] = 0
33      03                         category[1] = 3
```

As one hex string, which both test suites compare against:

```
474350540000100002000000000000000000c03f0000803e000000c0000080400003
```

## The release around it

A release folder holds `manifest.json` and data files named
`<stem>.<first 16 hex digits of the file's SHA-256>.<extension>`. The manifest is
the only fixed name. For each file it gives the path, the byte length, the full
SHA-256 and the format. A reader checks the length and the hash before decoding.

The protein index (`protein-index/0`) is UTF-8 JSON:
`{"format": "protein-index/0", "rows": [{"accession", "category", "gene_symbol", "name"}, …]}`,
with keys sorted and rows in the same order as the points.

## Changes

A new version gets a new number and a new document. Version 0 is never changed
in place, because files written in it are immutable.
