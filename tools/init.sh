#!/bin/bash
mkdir datamodel
wget -q https://raw.githubusercontent.com/Qiksar/crudio/main/datamodel/base.json -P datamodel
wget -q https://raw.githubusercontent.com/Qiksar/crudio/main/datamodel/base_entity.json -P datamodel
wget -q https://raw.githubusercontent.com/Qiksar/crudio/main/datamodel/base_generators.json -P datamodel
wget -q https://raw.githubusercontent.com/Qiksar/crudio/main/datamodel/base_snippets.json -P datamodel
wget -q https://raw.githubusercontent.com/Qiksar/crudio/main/datamodel/datamodel.json -P datamodel
wget -q https://raw.githubusercontent.com/Qiksar/crudio/main/docker-compose.yml

docker-compose up -d
sleep 5
npx -y @qiksar/crudio@latest -v -w -t p -m  datamodel/datamodel.json 
