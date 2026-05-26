"""Quick test script for the /analyze endpoint."""
import httpx
import json

EXCEL_PATH = r"c:\Users\samid\Downloads\influencer-ai-assignment\assingment\influencer_database.xlsx"
API_URL = "http://127.0.0.1:8000/analyze"

with open(EXCEL_PATH, "rb") as f:
    file_bytes = f.read()

print("Sending request to /analyze ...")
with httpx.Client(timeout=600.0) as client:
    response = client.post(
        API_URL,
        files={
            "file": (
                "influencer_database.xlsx",
                file_bytes,
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            )
        },
    )

print(f"Status: {response.status_code}")

if response.status_code == 200:
    data = response.json()
    print(f"Shortlisted: {data['total_shortlisted']}")
    print(f"Rejected: {data['total_rejected']}")
    print(f"Budget used: {data['budget_used']:,.0f}")
    print(f"Remaining: {data['remaining_budget']:,.0f}")
    print(f"Tier 2/3 %: {data['tier23_percentage']}")
    print()

    print("=== FIRST 3 SHORTLISTED ===")
    for inf in data["shortlisted"][:3]:
        print(f"  {inf['Name']} | Score: {inf['score']} | {inf['influencer_type']} | {inf['tier']}")
        review = inf["ai_review"][:150]
        print(f"    AI Review: {review}...")
        reasons = inf.get("reasons", [])
        for r in reasons[:2]:
            print(f"    + {r}")
        print()

    print("=== FIRST 3 REJECTED ===")
    for inf in data["rejected"][:3]:
        print(f"  {inf['Name']} | Score: {inf['score']}")
        reasons = inf.get("rejection_reasons", [])
        for r in reasons[:2]:
            print(f"    - {r}")
        print()

    # Save full response to file for inspection
    with open("test_response.json", "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    print("Full response saved to test_response.json")
else:
    print(f"Error: {response.text[:500]}")
