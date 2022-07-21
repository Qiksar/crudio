#!/bin/bash
wget -q -nc --no-check-certificate --content-disposition https://raw.githubusercontent.com/Qiksar/crudio/main/repo/base.json -P repo
wget -q -nc --no-check-certificate --content-disposition https://raw.githubusercontent.com/Qiksar/crudio/main/repo/base_entity.json -P repo
wget -q -nc --no-check-certificate --content-disposition https://raw.githubusercontent.com/Qiksar/crudio/main/repo/base_generators.json -P repo
wget -q -nc --no-check-certificate --content-disposition https://raw.githubusercontent.com/Qiksar/crudio/main/repo/base_snippets.json -P repo
wget -q -nc --no-check-certificate --content-disposition https://raw.githubusercontent.com/Qiksar/crudio/main/docker-compose.yml

docker-compose up -d

npx @qiksar/crudio repo/repo.json
