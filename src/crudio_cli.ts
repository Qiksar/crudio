#!/usr/bin/env node

// Crudio CLI
//
//  Usage: crudio repo_path.json [target_schema]
//
//        repo_path.json : the path to the repository definition, which is a JSON file.
//        target_schema  : Optional schema name - default value is 'crudio'
//

import CrudioCLI from "./CrudioCLI";
import CrudioDataWrapper from "./CrudioDataWrapper";
import CrudioRepository from "./CrudioRepository";
import { ICrudioConfig } from "./CrudioTypes";

setTimeout(async () => {
  const cli = new CrudioCLI(process.argv);
  const config = cli.Config;

  console.log(`Loading Crudio repository definition from: "${config.repo}"`);
  console.log();

  const repo = CrudioRepository.FromJson(config.repo);
  console.log("Data repository definition loaded");

  const db = new CrudioDataWrapper(config, repo);
  console.log("Data repository populated");

  console.log(`Creating empty database schema ${config.schema}...`);
  await db.CreateDatabaseSchema();

  await db.PopulateDatabaseTables();
  console.log("Populating tables with data...");
  console.log();
  console.log("Database has been loaded.");
  console.log("Use Hasura console to setup tracking.");
}, 1000);
