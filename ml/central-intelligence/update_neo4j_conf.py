conf_p = r"C:\Users\tunak\.Neo4jDesktop2\Data\dbmss\dbms-f2d8022d-3c0e-4115-802f-e4406a132c78\conf\neo4j.conf"

with open(conf_p, "a") as f:
    f.write("\n\n# GDS Unrestricted Security Configuration\n")
    f.write("dbms.security.procedures.unrestricted=gds.*\n")
    f.write("dbms.security.procedures.allowlist=gds.*\n")

print("Added GDS procedure unrestricted settings to neo4j.conf successfully.")
