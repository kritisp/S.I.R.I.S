import logging
from app.graph.neo4j import neo4j_client

logging.basicConfig(level=logging.INFO)

driver = neo4j_client.get_driver()
session = driver.session()

health = session.run("RETURN 1 AS health").single()["health"]
print(f"Health Check (RETURN 1 AS health): {health}")

procs_count = session.run("SHOW PROCEDURES YIELD name WHERE name STARTS WITH 'gds' RETURN count(name) AS c").single()["c"]
print(f"Registered GDS Procedures Count: {procs_count}")

try:
    gds_ver = session.run("CALL gds.version() YIELD version RETURN version").single()["version"]
    print(f"GDS Version Returned: {gds_ver}")
except Exception as e:
    print(f"GDS Call Notice: {e}")
