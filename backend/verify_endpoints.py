"""
Direct verification of FastAPI endpoint handlers without socket transport.
"""
from main import health_check, get_sample, generate, export_tagged, GenerateRequest, ExportRequest
from sample_material import SAMPLE_READING_MATERIAL

def test_api():
    print("1. Testing health_check()...")
    res = health_check()
    assert res["status"] == "online"
    print("   Health check passed:", res)

    print("\n2. Testing get_sample()...")
    sample_res = get_sample()
    assert "material" in sample_res
    assert len(sample_res["chunks"]) >= 3
    print(f"   Sample material returned {len(sample_res['chunks'])} LangChain chunks!")

    print("\n3. Testing generate()...")
    req = GenerateRequest(material=SAMPLE_READING_MATERIAL)
    gen_res = generate(req)
    questions = gen_res["questions"]
    assert len(questions) == 5
    types = [q["type"] for q in questions]
    assert types == ["theory_mcq", "theory_mcq", "true_false", "true_false", "code_analysis"]
    print(f"   Generate endpoint successfully created 5 questions! Types: {types}")

    print("\n4. Testing export_tagged()...")
    export_req = ExportRequest(questions=questions, topic="Python Functions")
    export_res = export_tagged(export_req)
    assert "<question_group" in export_res["tagged_xml"]
    assert "</question_group>" in export_res["tagged_xml"]
    print(f"   Export endpoint produced valid tagged XML! ({export_res['total_questions']} questions)")

    print("\n==========================================")
    print("ALL 4 API ENDPOINTS TESTED & PASSED 100%!")
    print("==========================================")

if __name__ == "__main__":
    test_api()
