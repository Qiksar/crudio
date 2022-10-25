# Create the docker environment and load Postgres DB with test data
#
echo "Start docker, load PostgreSQL and automatically configure Hasura..."
npm run docker_up 
npm run compile 
node lib/crudio_cli.js  -v -w -m datamodel/datamodel.json --target p -d test/unit/output/datamodel.mermaid.md 

echo ""
echo "PostgreSQL database loaded"
echo "Hasura configured and accessible at: http://localhost:6789"
echo ""
