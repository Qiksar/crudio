#!/bin/bash
mkdir repo
wget -O - -nc --no-check-certificate --content-disposition https://raw.githubusercontent.com/qiksar/crudio/main/docker-compose.yml -q
wget -O - -nc --no-check-certificate --content-disposition https://raw.githubusercontent.com/qiksar/crudio/main/repo/repo.json -P repo -q
wget -O - -nc --no-check-certificate --content-disposition https://raw.githubusercontent.com/qiksar/crudio/main/repo/standard_generators.json -P repo -q
docker-compose up -d
npx @qiksar/crudio repo/repo.json
