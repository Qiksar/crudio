#!/bin/bash
wget -q https://raw.githubusercontent.com/Qiksar/crudio/main/datamodel/base.json -P repo
wget -q https://raw.githubusercontent.com/Qiksar/crudio/main/datamodel/base_entity.json -P repo
wget -q https://raw.githubusercontent.com/Qiksar/crudio/main/datamodel/base_generators.json -P repo
wget -q https://raw.githubusercontent.com/Qiksar/crudio/main/datamodel/base_snippets.json -P repo
wget -q https://raw.githubusercontent.com/Qiksar/crudio/main/datamodel/datamodel/datamodel.json -P repo
wget -q https://raw.githubusercontent.com/Qiksar/crudio/main/docker-compose.yml

docker-compose up -d
sleep 5
npx -y @qiksar/crudio@latest -v -w -m datamodel/datamodel.json -i repo/iot.json
