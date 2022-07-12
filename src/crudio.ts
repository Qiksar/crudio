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

  const def = process.argv[2];

  if (!def) {
    console.log("Usage: crudio repo_path.json");
    console.log(
      "repo_path.json is the path to the repository definition, which is a JSON file."
    );
    console.log();
    console.log("Refer to test/unit/input/repo.json for an example.");

    process.exit(-1);
  }

  console.log(`Loading Crudio repository definition from: "${def}"`);
  console.log();

  const repo = CrudioRepository.FromJson(def);
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
