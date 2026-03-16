import os
from typing import AsyncGenerator

SYSTEM_PROMPT = """You are GenomeCanvas AI, an expert molecular biologist and bioinformatics guide. You help users explore proteins, diseases, drugs, and their relationships.

When explaining proteins, reference their 3D structure, function, and clinical relevance. Be concise but informative. Aim for 2-3 paragraphs max.

You can include UI commands in your response using these markers (they will be parsed by the frontend):
- [HIGHLIGHT:protein:UNIPROT_ID] - Highlight a protein in the universe
- [NAVIGATE:disease:DISEASE_NAME] - Navigate knowledge graph to a disease
- [LOAD_STRUCTURE:UNIPROT_ID] - Load protein structure in viewer
- [FILTER_UNIVERSE:QUERY] - Filter the 3D universe

Always be scientifically accurate. If you're unsure about something, say so. This is an educational tool, not medical advice."""


async def generate_response(
    message: str, context: dict = {}
) -> AsyncGenerator[str, None]:
    api_key = os.environ.get("ANTHROPIC_API_KEY")

    if api_key:
        try:
            import anthropic

            client = anthropic.AsyncAnthropic(api_key=api_key)

            context_str = ""
            if context.get("selected_protein"):
                context_str = (
                    f"\n\nCurrently selected protein: {context['selected_protein']}"
                )

            stream = await client.messages.create(
                model="claude-sonnet-4-20250514",
                max_tokens=1024,
                system=SYSTEM_PROMPT + context_str,
                messages=[{"role": "user", "content": message}],
                stream=True,
            )

            async for event in stream:
                if event.type == "content_block_delta" and hasattr(
                    event.delta, "text"
                ):
                    yield event.delta.text
            return
        except Exception as e:
            yield f"[API Error: {str(e)}] "

    # Fallback mock responses when no API key
    responses = {
        "brca1": (
            "BRCA1 (Breast Cancer Type 1 Susceptibility Protein) is a crucial tumor "
            "suppressor protein encoded by the BRCA1 gene. It plays a central role in "
            "DNA damage repair through the homologous recombination pathway, maintaining "
            "genomic stability.\n\n"
            "[LOAD_STRUCTURE:P38398]\n\n"
            "The protein contains several critical domains: an N-terminal RING domain "
            "that mediates E3 ubiquitin ligase activity, and C-terminal BRCT domains "
            "that recognize phosphorylated proteins at DNA damage sites. Mutations in "
            "BRCA1 significantly increase the risk of breast and ovarian cancer.\n\n"
            "[HIGHLIGHT:protein:P38398]\n\n"
            "BRCA1-mutated cancers are particularly sensitive to PARP inhibitors like "
            "Olaparib, which exploit synthetic lethality \u2014 the cancer cells cannot "
            "repair DNA damage through either homologous recombination (broken by BRCA1 "
            "mutation) or base excision repair (blocked by PARP inhibition)."
        ),
        "alzheimer": (
            "Alzheimer's disease involves several key proteins that drive its pathology. "
            "Let me highlight the most important ones:\n\n"
            "[FILTER_UNIVERSE:alzheimer]\n\n"
            "**APP (Amyloid Precursor Protein, P05067)** \u2014 When cleaved by beta and "
            "gamma secretases, it produces amyloid-beta peptides that aggregate into the "
            "toxic plaques characteristic of Alzheimer's. [LOAD_STRUCTURE:P05067]\n\n"
            "**PSEN1 (Presenilin-1, P49768)** \u2014 The catalytic subunit of "
            "gamma-secretase that cleaves APP. Mutations in PSEN1 are the most common "
            "cause of early-onset familial Alzheimer's.\n\n"
            "**MAPT (Tau, P10636)** \u2014 Forms neurofibrillary tangles when "
            "hyperphosphorylated, the other hallmark pathology of Alzheimer's alongside "
            "amyloid plaques.\n\n"
            "**APOE (Apolipoprotein E, P02649)** \u2014 The \u03b54 allele is the "
            "strongest genetic risk factor for late-onset Alzheimer's, affecting amyloid "
            "clearance and lipid metabolism in the brain.\n\n"
            "[NAVIGATE:disease:alzheimers]"
        ),
        "egfr": (
            "EGFR (Epidermal Growth Factor Receptor, P00533) is a transmembrane "
            "receptor tyrosine kinase that plays a key role in cell growth, "
            "proliferation, and survival signaling.\n\n"
            "[LOAD_STRUCTURE:P00533]\n\n"
            "When EGF or other ligands bind to its extracellular domain, EGFR dimerizes "
            "and autophosphorylates, activating downstream RAS-MAPK and PI3K-AKT "
            "signaling cascades. Overexpression or activating mutations in EGFR are "
            "found in many cancers, particularly non-small cell lung cancer (NSCLC) and "
            "glioblastoma.\n\n"
            "Several drug classes target EGFR:\n"
            "- **Small-molecule TKIs**: Erlotinib, Gefitinib, and Osimertinib "
            "competitively inhibit the kinase domain\n"
            "- **Monoclonal antibodies**: Cetuximab and Panitumumab block ligand "
            "binding to the extracellular domain\n\n"
            "[HIGHLIGHT:protein:P00533]\n\n"
            "The L858R mutation and exon 19 deletions are the most common activating "
            "mutations in NSCLC, both responsive to first-line Osimertinib treatment."
        ),
    }

    msg_lower = message.lower()
    for key, response in responses.items():
        if key in msg_lower:
            for char in response:
                yield char
            return

    default = (
        "I'd be happy to help you explore the protein universe! Here are some things "
        "you can ask me:\n\n"
        '- **"What does BRCA1 do?"** \u2014 I\'ll explain protein function and show '
        "its 3D structure\n"
        '- **"Show me proteins involved in Alzheimer\'s"** \u2014 I\'ll filter the '
        "universe and explain key proteins\n"
        '- **"Find drugs targeting EGFR"** \u2014 I\'ll show drug-target '
        "relationships\n\n"
        "Try clicking on any protein in the 3D universe to learn more about it, or "
        "ask me any question about proteins, diseases, or drug targets!"
    )

    for char in default:
        yield char
