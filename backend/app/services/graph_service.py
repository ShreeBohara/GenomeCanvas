from __future__ import annotations

from collections import deque

from app.core.text import contains_term, overlap_score, significant_tokens, starts_term
from app.models.schemas import GraphData, GraphEdge, GraphNode, GraphPathResponse, GraphQueryRequest
from app.repositories.fixture_repository import FixtureRepository


# Weak token overlap is not evidence. A single shared word between a long user
# message and a long disease label used to clear the old `best > 0` bar, which is
# how "show me the app" resolved to "Congenital bilateral absence of the vas
# deferens" (shared token: "the"). 0.34 means roughly a third of the query's
# meaningful tokens have to land.
MIN_SEARCH_SCORE = 0.34


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

    def search_nodes(
        self,
        query: str,
        node_type: str | None = None,
        limit: int = 20,
        min_score: float = MIN_SEARCH_SCORE,
    ) -> list[GraphNode]:
        return [node for _, node in self.rank_nodes(query, node_type, limit, min_score)]

    def rank_nodes(
        self,
        query: str,
        node_type: str | None = None,
        limit: int = 20,
        min_score: float = MIN_SEARCH_SCORE,
    ) -> list[tuple[float, GraphNode]]:
        """Score nodes against a query. Callers that need the confidence use this."""
        nodes = self.repository.list_nodes()
        if node_type:
            nodes = [node for node in nodes if node.type == node_type]

        trimmed = query.strip()
        if not trimmed:
            return [(0.0, node) for node in sorted(nodes, key=lambda n: (n.type, n.label))[:limit]]

        # A query made only of stopwords carries no retrieval signal. Scoring it
        # against every stringified property value used to return unrelated drugs
        # at 1.0, because "the" is a substring of the property value "Therapeutic".
        if not significant_tokens(trimmed):
            return []

        ranked: list[tuple[float, GraphNode]] = []
        for node in nodes:
            haystacks = [node.label, node.id, *(str(value) for value in node.properties.values())]
            best = 0.0
            for haystack in haystacks:
                if contains_term(haystack, trimmed):
                    best = 1.0
                    break
                if starts_term(haystack, trimmed):
                    best = max(best, 0.85)
                    continue
                best = max(best, overlap_score(trimmed, haystack))
            if best >= min_score:
                ranked.append((best, node))

        ranked.sort(key=lambda item: (-item[0], item[1].label))
        return ranked[:limit]

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
