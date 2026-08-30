import os
import json
import urllib.request
import urllib.error


def test_remote_qwen_connection():
    # Read environment variables
    env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env")
    qwen_url = "https://slots-ellis-there-mai.trycloudflare.com"

    if os.path.exists(env_path):
        with open(env_path, "r", encoding="utf-8") as f:
            for line in f:
                if "=" in line and not line.startswith("#"):
                    k, v = line.split("=", 1)
                    if k.strip() == "QWEN_API_URL":
                        qwen_url = v.strip()

    health_url = f"{qwen_url.rstrip('/')}/health"
    generate_url = f"{qwen_url.rstrip('/')}/generate"

    print(f"=======================================================")
    print(f" TESTING REMOTE QWEN SERVER: {qwen_url}")
    print(f"=======================================================")

    # Step 1: Health Check (GET /health)
    print(f"\n1. Testing GET {health_url}...")
    try:
        req = urllib.request.Request(health_url, method="GET")
        with urllib.request.urlopen(req, timeout=10) as resp:
            print(f"   HTTP Status: {resp.status}")
            health_res = resp.read().decode("utf-8")
            print(f"   Health Response: {health_res}")
    except Exception as e:
        print(f"   Health Check FAILED: {e}")

    # Step 2: Generation Request (POST /generate)
    print(f"\n2. Testing POST {generate_url}...")
    payload = {
        "prompt": "You are CrimeLens legal assistant. Explain theft under Indian law.",
        "temperature": 0.2
    }
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(generate_url, data=data, headers={"Content-Type": "application/json"})

    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            print(f"   HTTP Status: {resp.status}")
            gen_res = resp.read().decode("utf-8")
            print(f"\n   Response Output:")
            print("   " + "-" * 50)
            res_dict = json.loads(gen_res)
            print("   " + res_dict.get("response", "").strip())
            print("   " + "-" * 50)
    except Exception as e:
        print(f"   Generation Request FAILED: {e}")


if __name__ == "__main__":
    test_remote_qwen_connection()
