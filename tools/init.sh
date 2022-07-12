#!/bin/bash
mkdir repo
wget -O - -nc --no-check-certificate --content-disposition https://raw.githubusercontent.com/qiksar/crudio/main/repo/repo.json -P repo
wget -O - -nc --no-check-certificate --content-disposition https://raw.githubusercontent.com/qiksar/crudio/main/repo/standard_generators.json -P repo
wget -O - -nc --no-check-certificate --content-disposition https://raw.githubusercontent.com/qiksar/crudio/main/docker-compose.yml

docker-compose up -d

npx @qiksar/crudio repo/repo.json
