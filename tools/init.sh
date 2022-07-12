#!/bin/bash
mkdir repo
wget -nc --no-check-certificate --content-disposition https://raw.githubusercontent.com/qiksar/crudio/main/docker-compose.yml 
wget -nc --no-check-certificate --content-disposition https://raw.githubusercontent.com/qiksar/crudio/main/repo/repo.json -P repo
wget -nc --no-check-certificate --content-disposition https://raw.githubusercontent.com/qiksar/crudio/main/repo/standard_generators.json -P repo
docker-compose up -d
npx @qiksar/crudio repo/repo.json
