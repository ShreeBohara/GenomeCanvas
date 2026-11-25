import math

import pytest

from forge.points import Point, PointsEncodingError, encode_points, encoded_length

# The worked example in docs/formats/points-v0.md, byte for byte.
WORKED_EXAMPLE_HEX = (
    "47435054"
    "0000"
    "1000"
    "02000000"
    "00000000"  # header
    "0000c03f"
    "0000803e"  # x: 1.5, 0.25
    "000000c0"
    "00008040"  # y: -2.0, 4.0
    "0003"  # categories: 0, 3
)


def test_the_worked_example_in_the_specification() -> None:
    encoded = encode_points([Point(1.5, -2.0, 0), Point(0.25, 4.0, 3)])
    assert encoded.hex() == WORKED_EXAMPLE_HEX
    assert len(encoded) == encoded_length(2) == 34


def test_an_empty_file_is_just_a_header() -> None:
    assert encode_points([]).hex() == "47435054000010000000000000000000"


@pytest.mark.parametrize("bad", [math.nan, math.inf, -math.inf, 1e39])
def test_refuses_values_that_are_not_finite_float32(bad: float) -> None:
    with pytest.raises(PointsEncodingError, match="row 1: y"):
        encode_points([Point(0.0, 0.0, 0), Point(0.0, bad, 0)])


@pytest.mark.parametrize("bad", [-1, 256])
def test_refuses_categories_that_do_not_fit_in_a_byte(bad: int) -> None:
    with pytest.raises(PointsEncodingError, match="category"):
        encode_points([Point(0.0, 0.0, bad)])
