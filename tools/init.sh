#!/bin/bash
wget -q -nc --no-check-certificate --content-disposition https://raw.githubusercontent.com/Qiksar/crudio/main/repo/repo.json -P repo
wget -q -nc --no-check-certificate --content-disposition https://raw.githubusercontent.com/Qiksar/crudio/main/repo/repo_entities.json -P repo
wget -q -nc --no-check-certificate --content-disposition https://raw.githubusercontent.com/Qiksar/crudio/main/repo/standard_generators.json -P repo
wget -q -nc --no-check-certificate --content-disposition https://raw.githubusercontent.com/Qiksar/crudio/main/docker-compose.yml

docker-compose up -d

npx @qiksar/crudio repo/repo.json
