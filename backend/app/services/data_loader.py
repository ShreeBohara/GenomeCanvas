import json
import os


def load_protein_data() -> dict:
    data_path = os.path.join(os.path.dirname(__file__), "..", "data", "proteins.json")
    if os.path.exists(data_path):
        with open(data_path) as f:
            proteins = json.load(f)
        return {p["uniprot_id"]: p for p in proteins}
    return {}
