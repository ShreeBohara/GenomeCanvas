"""Make network access fail loudly for the rest of the process.

The sample profile promises never to touch the network. Its downloads are
already never attempted; this guard makes any accidental connection, from
any library, raise instead of quietly succeeding.
"""

from __future__ import annotations

import socket
from typing import NoReturn


class NetworkForbiddenError(RuntimeError):
    """Something tried to open a network connection in an offline build."""


def _refuse(*_args: object, **_kwargs: object) -> NoReturn:
    raise NetworkForbiddenError(
        "this build is offline: the sample profile never opens a connection"
    )


def forbid_network() -> None:
    socket.socket.connect = _refuse  # type: ignore[method-assign]
    socket.socket.connect_ex = _refuse  # type: ignore[method-assign]
    socket.create_connection = _refuse
    socket.getaddrinfo = _refuse
