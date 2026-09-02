import urllib.request
import os

plugins_dir = r"C:\Users\tunak\.Neo4jDesktop2\Data\dbmss\dbms-f2d8022d-3c0e-4115-802f-e4406a132c78\plugins"

urls_to_try = [
    "https://dist.neo4j.org/gds/neo4j-graph-data-science-2.12.0.jar",
    "https://dist.neo4j.org/gds/neo4j-graph-data-science-2.11.0.jar",
    "https://dist.neo4j.org/gds/neo4j-graph-data-science-2.6.0.jar",
    "https://graphdatascience.ninja/neo4j-graph-data-science-2.6.0.jar"
]

print("--- Attempting GDS Plugin Download ---")
for url in urls_to_try:
    filename = url.split("/")[-1]
    target_path = os.path.join(plugins_dir, filename)
    print(f"Trying download from: {url}")
    try:
        urllib.request.urlretrieve(url, target_path)
        size_mb = os.path.getsize(target_path) / (1024 * 1024)
        print(f"SUCCESSfully downloaded {filename} ({size_mb:.2f} MB) to {target_path}")
        break
    except Exception as e:
        print(f"Failed download from {url}: {e}")
