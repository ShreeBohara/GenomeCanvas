from __future__ import annotations

from collections import deque

from app.core.text import overlap_score
from app.models.schemas import GraphData, GraphEdge, GraphNode, GraphPathResponse, GraphQueryRequest
from app.repositories.fixture_repository import FixtureRepository


class GraphService:
    def __init__(self, repository: FixtureRepository):
        self.repository = repository

    def get_neighborhood(self, node_id: str, hops: int = 1) -> GraphData:
        if node_id not in self.repository.nodes_by_id:
            return GraphData()

        visited = {node_id}
        frontier = {node_id}
        collected_edges: dict[tuple[str, str, str], GraphEdge] = {}

        for _ in range(hops):
            next_frontier: set[str] = set()
            for current_id in frontier:
                for neighbor_id, edge in self.repository.neighbors(current_id):
                    collected_edges[(edge.source, edge.target, edge.label)] = edge
                    if neighbor_id not in visited:
                        next_frontier.add(neighbor_id)
                        visited.add(neighbor_id)
            frontier = next_frontier
            if not frontier:
                break

        nodes = [self.repository.nodes_by_id[node_id] for node_id in sorted(visited)]
        edges = list(collected_edges.values())
        return GraphData(nodes=nodes, edges=edges)

    def search_nodes(self, query: str, node_type: str | None = None, limit: int = 20) -> list[GraphNode]:
        nodes = self.repository.list_nodes()
        if node_type:
            nodes = [node for node in nodes if node.type == node_type]

        if not query.strip():
            return sorted(nodes, key=lambda node: (node.type, node.label))[:limit]

        ranked: list[tuple[float, GraphNode]] = []
        query_lower = query.lower()
        for node in nodes:
            haystacks = [node.label.lower(), node.id.lower()]
            haystacks.extend(str(value).lower() for value in node.properties.values())
            best = 0.0
            for haystack in haystacks:
                if query_lower in haystack:
                    best = max(best, 1.0)
                else:
                    best = max(best, overlap_score(query_lower, haystack))
            if best > 0:
                ranked.append((best, node))

        ranked.sort(key=lambda item: (-item[0], item[1].label))
        return [node for _, node in ranked[:limit]]

    def find_path(self, start_id: str, end_id: str) -> GraphPathResponse:
        if start_id not in self.repository.nodes_by_id or end_id not in self.repository.nodes_by_id:
            return GraphPathResponse()

        queue: deque[str] = deque([start_id])
        parents: dict[str, tuple[str | None, GraphEdge | None]] = {start_id: (None, None)}

        while queue:
            current = queue.popleft()
            if current == end_id:
                break

            for neighbor_id, edge in self.repository.neighbors(current):
                if neighbor_id in parents:
                    continue
                parents[neighbor_id] = (current, edge)
                queue.append(neighbor_id)

        if end_id not in parents:
            return GraphPathResponse()

        path_ids: list[str] = []
        path_edges: list[GraphEdge] = []
        cursor = end_id
        while cursor is not None:
            path_ids.append(cursor)
            parent, edge = parents[cursor]
            if edge is not None:
                path_edges.append(edge)
            cursor = parent

        path_ids.reverse()
        path_edges.reverse()
        path_nodes = [self.repository.nodes_by_id[node_id] for node_id in path_ids]
        return GraphPathResponse(nodes=path_nodes, edges=path_edges, path_ids=path_ids)

    def query(self, request: GraphQueryRequest) -> GraphData:
        if request.entity_id:
            return self.get_neighborhood(request.entity_id, request.hops)

        if request.search:
            matches = self.search_nodes(request.search, request.node_type, request.limit)
            if len(matches) == 1:
                return self.get_neighborhood(matches[0].id, request.hops)
            return GraphData(nodes=matches, edges=[])

        if request.node_type:
            return GraphData(
                nodes=self.search_nodes("", request.node_type, request.limit),
                edges=[],
            )

        return GraphData(
            nodes=self.search_nodes("", None, request.limit),
            edges=[],
        )
