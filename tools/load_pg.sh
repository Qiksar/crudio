# Create the docker environment and load Postgres DB with test data
#
echo "Start docker, load PostgreSQL and automatically configure Hasura..."
npm run docker_up 
npm run build 
node dist/cjs/crudio_cli.js -w -v -m datamodel/datamodel.json --target p -d test/output/datamodel.mermaid.md 

echo ""
echo "PostgreSQL database loaded"
echo "Hasura configured and accessible at: http://localhost:6789"
echo ""
