#!/bin/bash
wget -q https://raw.githubusercontent.com/Qiksar/crudio/main/repo/base.json -P repo
wget -q https://raw.githubusercontent.com/Qiksar/crudio/main/repo/base_entity.json -P repo
wget -q https://raw.githubusercontent.com/Qiksar/crudio/main/repo/base_generators.json -P repo
wget -q https://raw.githubusercontent.com/Qiksar/crudio/main/repo/base_snippets.json -P repo
wget -q https://raw.githubusercontent.com/Qiksar/crudio/main/repo/iot.json -P repo
wget -q https://raw.githubusercontent.com/Qiksar/crudio/main/repo/repo.json -P repo
wget -q https://raw.githubusercontent.com/Qiksar/crudio/main/docker-compose.yml

docker-compose up -d

npx -y @qiksar/crudio@latest -v -w -r repo/repo.json -i repo/iot.json
