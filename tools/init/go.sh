echo "Run docker to build the containers."
echo "Warning: Please ensure that the default port (6789) is not already in use"

docker-compose down --rmi local
docker-compose up -d

echo "Wait for containers to stabilise..."
sleep 5

echo
echo "Build the database and populate with data"

npx @qiksar/crudio@latest -v -w -m datamodel/datamodel.json 

echo "Browse to http://localhost:6789 to view the Hasura GraphQL console"
echo
echo "Remember to go to the DATA tab and setup table and relationship tracking."
echo "Refer to the README file for exanmple queries if you are unfamiliar with GraphQL"
