#!/bin/bash
mkdir repo
wget -nc --no-check-certificate --content-disposition https://github.com/qiksar/crudio/blob/main/docker-compose.yml 
wget -nc --no-check-certificate --content-disposition https://github.com/Qiksar/crudio/blob/main/repo/repo.json -P repo
wget -nc --no-check-certificate --content-disposition https://github.com/Qiksar/crudio/blob/main/repo/standard_generators.json -P repo
docker-compose up -d
npx @qiksar/crudio repo/repo.json
