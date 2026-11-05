"""
Quick verification of RAG pipeline and LangChain chunking.
"""
from rag_chain import chunk_material_with_langchain, generate_questions, format_to_tagged_output
from sample_material import SAMPLE_READING_MATERIAL

def test_pipeline():
    print("1. Testing LangChain Markdown Chunker...")
    chunks = chunk_material_with_langchain(SAMPLE_READING_MATERIAL)
    print(f"   Success: {len(chunks)} chunks created:")
    for c in chunks:
        print(f"   - [Chunk {c['chunk_id']}] {c['title']} (Snippets: {len(c['code_snippets'])})")
    
    assert len(chunks) >= 3, "Should have at least 3 chunks"

    print("\n2. Testing Generation (Demo fallback)...")
    result = generate_questions(SAMPLE_READING_MATERIAL)
    questions = result["questions"]
    print(f"   Success: Generated {len(questions)} questions (Mode: {result['mode']})")
    assert len(questions) == 5, "Should generate exactly 5 questions"
    
    # Check types
    types = [q["type"] for q in questions]
    assert types == ["theory_mcq", "theory_mcq", "true_false", "true_false", "code_analysis"]
    print(f"   Question types verified: {types}")

    print("\n3. Testing Tagged XML Formatter...")
    tagged_xml = format_to_tagged_output(questions, topic="Python Functions")
    assert "<question_group" in tagged_xml
    assert "</question_group>" in tagged_xml
    assert 'type="theory_mcq"' in tagged_xml
    assert 'type="code_analysis"' in tagged_xml
    print("   Tagged XML Output Preview:")
    for line in tagged_xml.split("\n")[:12]:
        print("   " + line)
    print("   ... (truncated)")

    print("\nALL BACKEND TESTS PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    test_pipeline()

