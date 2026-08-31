import urllib.request
import socket

def check(url):
    try:
        req = urllib.request.Request(url)
        with urllib.request.urlopen(req, timeout=3) as resp:
            print(f"[{url}] HTTP {resp.status}")
            return True
    except Exception as e:
        print(f"[{url}] Exception: {e}")
        return False

print("--- Service Reachability Check ---")
check("http://localhost:5173")
check("http://localhost:8080/api/v1/auth/me")
check("http://localhost:8000/health")
