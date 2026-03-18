from __future__ import annotations

from typing import Iterable

from app.models.schemas import (
    ChatCommand,
    ChatContext,
    ChatEnvelope,
    ChatSource,
    GraphNode,
    ProteinDetail,
)
from app.repositories.fixture_repository import FixtureRepository
from app.services.graph_service import GraphService
from app.services.llm_service import LLMNarrator
from app.services.protein_service import ProteinService


class ChatService:
    def __init__(
        self,
        repository: FixtureRepository,
        protein_service: ProteinService,
        graph_service: GraphService,
        narrator: LLMNarrator,
    ):
        self.repository = repository
        self.protein_service = protein_service
        self.graph_service = graph_service
        self.narrator = narrator

    async def build_response(self, message: str, context: ChatContext) -> ChatEnvelope:
        lower_message = message.lower()
        protein = self._resolve_protein(message, context)
        disease = self._resolve_disease(message)

        if disease and ("show" in lower_message or "involved" in lower_message or "disease" in lower_message):
            grounded = self._build_disease_response(disease)
        elif protein and ("drug" in lower_message or "target" in lower_message):
            grounded = self._build_drug_response(protein)
        elif protein:
            grounded = self._build_protein_response(protein)
        else:
            grounded = self._build_general_response()

        llm_payload = {
            "message": message,
            "context": context.model_dump(),
            "grounded_response": grounded.model_dump(),
        }
        llm_response = await self.narrator.narrate(llm_payload)
        return llm_response or grounded

    def _resolve_protein(self, message: str, context: ChatContext) -> ProteinDetail | None:
        if context.selected_protein_id:
            selected = self.protein_service.get_protein(context.selected_protein_id)
            if selected is not None:
                return selected

        lower_message = message.lower()
        for protein in self.repository.list_proteins():
            if protein.gene_name.lower() in lower_message or protein.uniprot_id.lower() in lower_message:
                return protein

        results = self.protein_service.search(message, limit=3)
        if results and results[0].score >= 0.75:
            return self.protein_service.get_protein(results[0].uniprot_id)
        return None

    def _resolve_disease(self, message: str) -> GraphNode | None:
        matches = self.graph_service.search_nodes(message, node_type="disease", limit=3)
        if not matches:
            return None
        return matches[0]

    def _build_protein_response(self, protein: ProteinDetail) -> ChatEnvelope:
        disease_labels = ", ".join(disease.name for disease in protein.diseases[:3]) or "no disease associations in the current fixture set"
        drug_labels = ", ".join(drug.name for drug in protein.drugs[:3]) or "no linked drugs in the current fixture set"
        response = (
            f"{protein.gene_name} ({protein.name}) is categorized here as a {protein.function_category} protein. "
            f"The fixture data describes it as {protein.function_description.lower()}\n\n"
            f"In this MVP dataset, {protein.gene_name} is connected to {disease_labels}. "
            f"Known linked therapeutics include {drug_labels}. The structure view is ready to load its AlphaFold model for closer inspection."
        )
        commands = [
            ChatCommand(type="highlight", target_id=protein.uniprot_id, target_ids=[protein.uniprot_id]),
            ChatCommand(type="set_graph_root", target_id=protein.uniprot_id),
            ChatCommand(type="load_structure", target_id=protein.uniprot_id),
            ChatCommand(type="set_viewport", viewport="focus", target_id=protein.uniprot_id),
        ]
        sources = list(self._protein_sources([protein]))
        return ChatEnvelope(response=response, commands=commands, sources=sources)

    def _build_disease_response(self, disease: GraphNode) -> ChatEnvelope:
        proteins = self.protein_service.proteins_for_disease(disease.label, limit=6)
        highlighted_ids = [protein.uniprot_id for protein in proteins]
        protein_labels = ", ".join(protein.gene_name for protein in proteins[:5]) or "no matching proteins"
        response = (
            f"{disease.label} is represented as a disease node in the current knowledge graph. "
            f"The strongest linked proteins in this fixture-backed MVP are {protein_labels}.\n\n"
            f"The universe can now focus on those proteins while the graph centers on {disease.label} so the relationships stay synchronized across panels."
        )
        commands = [
            ChatCommand(type="filter_universe", query=disease.label, target_ids=highlighted_ids),
            ChatCommand(type="highlight", target_id=disease.id, target_ids=[disease.id, *highlighted_ids]),
            ChatCommand(type="navigate", target_id=disease.id),
            ChatCommand(type="set_graph_root", target_id=disease.id),
        ]
        sources = [ChatSource(id=disease.id, label=disease.label, type="disease")]
        sources.extend(self._protein_sources(proteins[:3]))
        return ChatEnvelope(response=response, commands=commands, sources=sources)

    def _build_drug_response(self, protein: ProteinDetail) -> ChatEnvelope:
        graph = self.graph_service.get_neighborhood(protein.uniprot_id, hops=1)
        drug_nodes = [node for node in graph.nodes if node.type == "drug"]
        drug_labels = ", ".join(node.label for node in drug_nodes[:5]) or "no linked drugs"
        response = (
            f"The current fixture graph links {protein.gene_name} to {drug_labels}. "
            f"This gives the MVP a concrete drug-target exploration path for {protein.name}.\n\n"
            f"The graph has been centered on {protein.gene_name}, and the highlighted drug nodes can be inspected alongside the protein detail and structure views."
        )
        commands = [
            ChatCommand(
                type="highlight",
                target_id=protein.uniprot_id,
                target_ids=[protein.uniprot_id, *[node.id for node in drug_nodes]],
            ),
            ChatCommand(type="set_graph_root", target_id=protein.uniprot_id),
            ChatCommand(type="load_structure", target_id=protein.uniprot_id),
            ChatCommand(type="set_viewport", viewport="focus", target_id=protein.uniprot_id),
        ]
        sources = list(self._protein_sources([protein]))
        sources.extend(
            ChatSource(id=node.id, label=node.label, type=node.type) for node in drug_nodes[:3]
        )
        return ChatEnvelope(response=response, commands=commands, sources=sources)

    def _build_general_response(self) -> ChatEnvelope:
        response = (
            "GenomeCanvas is ready to explore proteins, diseases, drugs, and structure data from the local fixture set.\n\n"
            "Try asking about BRCA1, EGFR, or proteins involved in Alzheimer's disease, and the UI will coordinate the universe, graph, and structure panels together."
        )
        return ChatEnvelope(
            response=response,
            commands=[],
            sources=[
                ChatSource(id="fixture:proteins", label="Fixture protein catalog", type="dataset"),
                ChatSource(id="fixture:graph", label="Fixture knowledge graph", type="dataset"),
            ],
        )

    def _protein_sources(self, proteins: Iterable[ProteinDetail]) -> Iterable[ChatSource]:
        for protein in proteins:
            yield ChatSource(
                id=protein.uniprot_id,
                label=f"{protein.gene_name} in UniProt",
                type="protein",
                url=f"https://www.uniprot.org/uniprotkb/{protein.uniprot_id}",
            )
