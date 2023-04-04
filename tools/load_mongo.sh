# Create the docker environment and load MongoDB with test data
#
echo "Start docker, load PostgreSQL and automatically configure Hasura..."
npm run docker_up 
npm run build 
node dist/cjs/cli/crudio_cli.js   -v -w -m datamodel/datamodel.json --target m -k _id -c mongodb://crudio:crudio@localhost:27654/crudio?authSource=admin  

echo ""
echo "MongoDB loaded"
echo "Mongo Express is accessible at: http://localhost:8765"
echo ""
