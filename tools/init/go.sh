echo "Run docker to build the containers."
echo "Warning: Please ensure that the default port (6789) is not already in use"

docker-compose up -d

echo
echo "Build the database and populate with data"

npx -y @qiksar/crudio@latest -v -w -r repo/repo.json -i repo/iot.json

echo "Browse to http://localhost:6789 to view the Hasura GraphQL console"
echo
echo "Remember to go to the DATA tab and setup table and relationship tracking."
echo "Refer to the README file for exanmple queries if you are unfamiliar with GraphQL"
