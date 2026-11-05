"""
LangChain RAG pipeline for reading material chunking and question generation.
"""

import os
import json
import re
from typing import List, Dict, Any, Optional
from langchain_text_splitters import MarkdownHeaderTextSplitter, RecursiveCharacterTextSplitter
from langchain_core.prompts import ChatPromptTemplate
from sample_material import SAMPLE_QUESTIONS, SAMPLE_READING_MATERIAL


def chunk_material_with_langchain(markdown_text: str) -> List[Dict[str, Any]]:
    """
    Uses LangChain MarkdownHeaderTextSplitter to chunk markdown reading material
    by sections and headers, preserving context and code snippets.
    """
    headers_to_split_on = [
        ("#", "Header 1"),
        ("##", "Header 2"),
        ("###", "Header 3"),
    ]
    
    header_splitter = MarkdownHeaderTextSplitter(
        headers_to_split_on=headers_to_split_on,
        strip_headers=False
    )
    
    docs = header_splitter.split_text(markdown_text)
    
    # If chunks are too large, split with RecursiveCharacterTextSplitter
    text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=100)
    split_docs = text_splitter.split_documents(docs)
    
    chunk_list = []
    for i, doc in enumerate(split_docs, 1):
        # Extract title from metadata
        title_parts = [v for k, v in doc.metadata.items() if "Header" in k]
        title = " > ".join(title_parts) if title_parts else f"Section {i}"
        
        # Extract code blocks if any
        code_blocks = re.findall(r"```(?:python)?\s*(.*?)\s*```", doc.page_content, re.DOTALL)
        
        chunk_list.append({
            "chunk_id": i,
            "title": title,
            "content": doc.page_content.strip(),
            "code_snippets": code_blocks
        })
        
    return chunk_list


def build_rag_context(chunks: List[Dict[str, Any]]) -> str:
    """Formats retrieved LangChain chunks into a structured prompt context."""
    context_lines = []
    for chunk in chunks:
        context_lines.append(f"--- CHUNK {chunk['chunk_id']}: {chunk['title']} ---")
        context_lines.append(chunk["content"])
        context_lines.append("")
    return "\n".join(context_lines)


def generate_with_gemini_langchain(chunks: List[Dict[str, Any]], api_key: str) -> List[Dict[str, Any]]:
    """
    Uses LangChain and ChatGoogleGenerativeAI to generate a 5-question group
    strictly grounded in the retrieved chunks.
    """
    from langchain_google_genai import ChatGoogleGenerativeAI

    context_str = build_rag_context(chunks)

    prompt_template = ChatPromptTemplate.from_messages([
        ("system", """You are an expert technical curriculum designer.
Your task is to create exactly ONE group of 5 assessment questions based STRICTLY and ONLY on the provided reading material chunks.

CRITICAL GROUNDING RULES:
1. Every question must test a concept explicitly taught in the chunks. Do NOT introduce external concepts not mentioned.
2. Produce exactly 5 questions with these exact types:
   - Question 1: Type 'theory_mcq' (Theoretical Multiple Choice Question with 4 options: A, B, C, D)
   - Question 2: Type 'theory_mcq' (Theoretical Multiple Choice Question with 4 options: A, B, C, D)
   - Question 3: Type 'true_false' (True/False question with 2 options: True and False)
   - Question 4: Type 'true_false' (True/False question with 2 options: True and False. One T/F must be True, the other False)
   - Question 5: Type 'code_analysis' (Code-Analysis question containing a real code snippet from the chunks and 4 options: A, B, C, D)
3. For each question, you MUST identify the source chunk title and include an exact verbatim quote from the text that proves the answer.

Output MUST be a single raw JSON array of 5 question objects, matching this exact schema:
[
  {{
    "id": 1,
    "type": "theory_mcq",
    "type_label": "Theory MCQ 1",
    "prompt": "Question text here",
    "code_snippet": "",
    "options": [
      {{"key": "A", "text": "Option text", "is_correct": false}},
      {{"key": "B", "text": "Option text", "is_correct": true}},
      {{"key": "C", "text": "Option text", "is_correct": false}},
      {{"key": "D", "text": "Option text", "is_correct": false}}
    ],
    "correct_answer": "B",
    "explanation": "Explanation explaining why B is correct referencing the text",
    "source_chunk": "Chunk title",
    "source_quote": "Exact sentence quoted from chunk",
    "is_approved": false
  }}
]
Do not wrap in markdown quotes if possible, output pure JSON.
"""),
        ("user", "Here are the retrieved reading material chunks:\n\n{context}\n\nGenerate the 5-question group now:")
    ])

    # Try models in order of availability
    for model_name in ["gemini-2.0-flash", "gemini-1.5-flash"]:
        try:
            llm = ChatGoogleGenerativeAI(
                model=model_name,
                google_api_key=api_key,
                temperature=0.2
            )
            chain = prompt_template | llm
            response = chain.invoke({"context": context_str})
            content = response.content.strip()

            # Clean JSON if wrapped in markdown code fence
            if "```json" in content:
                content = content.split("```json")[1].split("```")[0].strip()
            elif "```" in content:
                content = content.split("```")[1].split("```")[0].strip()

            data = json.loads(content)
            if isinstance(data, list) and len(data) == 5:
                # Assign labels and initial approval state
                type_labels = {
                    1: "Theory MCQ 1",
                    2: "Theory MCQ 2",
                    3: "True / False 1",
                    4: "True / False 2",
                    5: "Code Analysis"
                }
                for i, q in enumerate(data, 1):
                    q["id"] = i
                    q["type_label"] = type_labels.get(i, f"Question {i}")
                    q["is_approved"] = False
                return data
        except Exception as e:
            print(f"Error generating with {model_name}: {e}")
            continue

    raise RuntimeError("Failed to generate questions with Google Gemini API.")


def generate_questions(markdown_text: str, custom_api_key: Optional[str] = None) -> Dict[str, Any]:
    """
    Main entry point:
    1. Chunks markdown text using LangChain
    2. Runs generation via Gemini if API key is available
    3. Falls back smoothly to sample demonstration data if no key is configured
    """
    api_key = custom_api_key or os.getenv("GOOGLE_API_KEY")
    chunks = chunk_material_with_langchain(markdown_text)

    mode = "offline_demo"
    questions = []

    if api_key and api_key.strip():
        try:
            questions = generate_with_gemini_langchain(chunks, api_key.strip())
            mode = "live_gemini"
        except Exception as err:
            print(f"Live generation failed, using demo fallback: {err}")
            mode = f"demo_fallback (Error: {str(err)[:80]})"
            questions = [dict(q) for q in SAMPLE_QUESTIONS]
    else:
        # Offline demo mode
        mode = "offline_demo"
        questions = [dict(q) for q in SAMPLE_QUESTIONS]

    return {
        "mode": mode,
        "total_chunks": len(chunks),
        "chunks": chunks,
        "questions": questions
    }


def format_to_tagged_output(questions: List[Dict[str, Any]], topic: str = "Python Assessment") -> str:
    """
    Formats the finalized questions into the standardized XML tagged format.
    """
    output = []
    output.append(f'<question_group topic="{topic}" total_questions="{len(questions)}">')
    
    for q in questions:
        status = "approved" if q.get("is_approved") else "draft"
        q_type = q.get("type", "mcq")
        q_id = q.get("id", 1)
        
        output.append(f'  <question id="{q_id}" type="{q_type}" status="{status}">')
        output.append(f'    <prompt>{q.get("prompt", "")}</prompt>')
        
        if q.get("code_snippet"):
            output.append('    <code_snippet><![CDATA[')
            output.append(f'{q.get("code_snippet")}')
            output.append('    ]]></code_snippet>')
            
        output.append('    <options>')
        for opt in q.get("options", []):
            is_corr = "true" if opt.get("is_correct") else "false"
            output.append(f'      <option key="{opt.get("key")}" correct="{is_corr}">{opt.get("text")}</option>')
        output.append('    </options>')
        
        output.append(f'    <correct_answer>{q.get("correct_answer")}</correct_answer>')
        output.append(f'    <explanation>{q.get("explanation", "")}</explanation>')
        output.append(f'    <source_chunk>{q.get("source_chunk", "")}</source_chunk>')
        output.append(f'    <source_quote>{q.get("source_quote", "")}</source_quote>')
        output.append('  </question>')
        
    output.append('</question_group>')
    return "\n".join(output)

