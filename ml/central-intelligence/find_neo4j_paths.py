import os
import glob

search_paths = [
    os.path.expanduser(r"~\.Neo4jDesktop"),
    os.path.expanduser(r"~\AppData\Local\Neo4j"),
    os.path.expanduser(r"~\AppData\Roaming\Neo4j Desktop"),
    r"C:\Program Files\Neo4j",
    r"C:\neo4j"
]

print("--- Searching for Neo4j installation directories ---")
for base in search_paths:
    if os.path.exists(base):
        print(f"Found base directory: {base}")
        # Search for plugins folders
        plugin_dirs = glob.glob(os.path.join(base, "**", "plugins"), recursive=True)
        for pd in plugin_dirs:
            print(f"  Plugins dir: {pd}")
            files = os.listdir(pd)
            print(f"  Files in plugins dir: {files}")

# Check for active neo4j processes to find exact path
import subprocess
try:
    output = subprocess.check_output('wmic process where "name like \'%java%\'" get Commandline', shell=True).decode('utf-8', errors='ignore')
    for line in output.splitlines():
        if "neo4j" in line.lower():
            print("\nFound running Neo4j process command line:")
            print(line[:300] + "...")
except Exception as e:
    print("Could not query wmic:", e)
