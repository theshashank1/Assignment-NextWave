"""
FastAPI Server for AI Question Workshop.
Provides REST endpoints for:
- Fetching sample reading material
- Generating 5 grounded questions via LangChain RAG
- Exporting approved questions in standardized tagged format
"""

import os
from typing import List, Optional, Dict, Any
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

from sample_material import SAMPLE_READING_MATERIAL
from rag_chain import chunk_material_with_langchain, generate_questions, format_to_tagged_output

load_dotenv()

app = FastAPI(
    title="AI Question Workshop API",
    description="Transforms reading materials into a 5-question assessment group using LangChain RAG",
    version="1.0.0"
)

# Enable CORS for React frontend (default Vite port 5173 and all local origins)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class GenerateRequest(BaseModel):
    material: str
    api_key: Optional[str] = None


class ExportRequest(BaseModel):
    questions: List[Dict[str, Any]]
    topic: Optional[str] = "Python Functions Assessment"


@app.get("/")
def health_check():
    has_key = bool(os.getenv("GOOGLE_API_KEY", "").strip())
    return {
        "status": "online",
        "service": "AI Question Workshop (LangChain RAG)",
        "has_api_key": has_key,
        "active_model": "gemini-3.5-flash" if has_key else "offline_sample",
        "docs_url": "/docs"
    }


@app.get("/api/sample")
def get_sample():
    """Returns the bundled Python Functions reading material."""
    has_key = bool(os.getenv("GOOGLE_API_KEY", "").strip())
    chunks = chunk_material_with_langchain(SAMPLE_READING_MATERIAL)
    return {
        "topic": "Python Functions: Arguments, Return Values, and Scope",
        "material": SAMPLE_READING_MATERIAL,
        "chunks": chunks,
        "has_api_key": has_key,
        "active_model": "gemini-3.5-flash" if has_key else "offline_sample"
    }


@app.post("/api/generate")
def generate(req: GenerateRequest):
    """
    Chunks the input markdown with LangChain and generates 5 questions:
    - 2 Theory MCQs
    - 2 True/False (1 True, 1 False)
    - 1 Code Analysis
    """
    if not req.material or not req.material.strip():
        raise HTTPException(status_code=400, detail="Reading material cannot be empty.")
    
    try:
        result = generate_questions(
            markdown_text=req.material.strip(),
            custom_api_key=req.api_key.strip() if req.api_key else None
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Generation failed: {str(e)}")


@app.post("/api/export")
def export_tagged(req: ExportRequest):
    """Formats the questions into standard tagged XML."""
    if not req.questions:
        raise HTTPException(status_code=400, detail="No questions provided to export.")
    
    tagged_xml = format_to_tagged_output(req.questions, topic=req.topic or "Assessment Group")
    return {
        "tagged_xml": tagged_xml,
        "total_questions": len(req.questions),
        "approved_count": sum(1 for q in req.questions if q.get("is_approved"))
    }


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)

