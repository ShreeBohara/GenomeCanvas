import json
import os


class GraphService:
    def __init__(self):
        self.nodes = {}
        self.edges = []
        self._load_graph()

    def _load_graph(self):
        data_path = os.path.join(
            os.path.dirname(__file__), "..", "data", "knowledge_graph.json"
        )
        if os.path.exists(data_path):
            with open(data_path) as f:
                data = json.load(f)
            self.nodes = {n["id"]: n for n in data.get("nodes", [])}
            self.edges = data.get("edges", [])

    def get_neighborhood(self, node_id: str, hops: int = 1) -> dict:
        visited = {node_id}
        result_nodes = []
        result_edges = []

        current_ids = {node_id}
        for _ in range(hops):
            next_ids = set()
            for edge in self.edges:
                if edge["source"] in current_ids:
                    next_ids.add(edge["target"])
                    result_edges.append(edge)
                elif edge["target"] in current_ids:
                    next_ids.add(edge["source"])
                    result_edges.append(edge)
            current_ids = next_ids - visited
            visited |= next_ids

        for nid in visited:
            if nid in self.nodes:
                result_nodes.append(self.nodes[nid])

        # Deduplicate edges
        seen = set()
        unique_edges = []
        for e in result_edges:
            key = (e["source"], e["target"], e["label"])
            if key not in seen:
                seen.add(key)
                unique_edges.append(e)

        return {"nodes": result_nodes, "edges": unique_edges}

    def search_nodes(self, query: str, node_type: str = None) -> list:
        results = []
        q = query.lower()
        for node in self.nodes.values():
            if node_type and node["type"] != node_type:
                continue
            if q in node["label"].lower() or q in node.get("id", "").lower():
                results.append(node)
        return results[:20]


graph_service = GraphService()
