#!/usr/bin/env node

import CrudioDataWrapper from "./CrudioDataWrapper";
import CrudioRepository from "./CrudioRepository";
import { ICrudioConfig } from "./CrudioTypes";

setTimeout(async () => {
  const config: ICrudioConfig = {
    hasuraEndpoint: "http://localhost:6789",
    hasuraQueryEndpoint: "http://localhost:6789/v2/query",
    hasuraAdminSecret: "crudio",
    idFieldName: "id",
    readonlyFields: [],
    schema: "crudio",
  };

  const definition = process.argv[2];
  const target_schema = process.argv[3];

  if (target_schema) config.schema = target_schema;

  if (!definition) {
    console.log(
`Usage: crudio repo_path.json [target_schema]
        repo_path.json : the path to the repository definition, which is a JSON file.
        target_schema  : Optional schema name - default value is 'crudio'
`);

    console.log();
    console.log("Refer to test/unit/input/repo.json for an example.");

    process.exit(-1);
  }

  console.log(`Loading Crudio repository definition from: "${definition}"`);
  console.log();

  const repo = CrudioRepository.FromJson(definition);
  console.log("Data repository definition loaded");

  const db = new CrudioDataWrapper(config, repo);
  console.log("Data repository populated");

  console.log(`Creating empty database schema ${config.schema}...`);
  await db.CreateEmptySchema();

  await db.CreateTables();
  console.log("Populating tables with data...");
  console.log();
  console.log("Database has been loaded.");
  console.log("Use Hasura console to setup tracking.");
}, 1000);
