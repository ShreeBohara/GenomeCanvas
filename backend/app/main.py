from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import proteins, graph, chat
from app.services.data_loader import load_protein_data

app = FastAPI(title="GenomeCanvas API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

protein_data = {}


@app.on_event("startup")
async def startup():
    global protein_data
    protein_data = load_protein_data()
    app.state.protein_data = protein_data


app.include_router(proteins.router, prefix="/api/proteins", tags=["proteins"])
app.include_router(graph.router, prefix="/api/graph", tags=["graph"])
app.include_router(chat.router, prefix="/api/chat", tags=["chat"])


@app.get("/api/health")
async def health():
    return {
        "status": "ok",
        "proteins_loaded": len(app.state.protein_data)
        if hasattr(app.state, "protein_data")
        else 0,
    }
