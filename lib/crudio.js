"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const CrudioDataWrapper_1 = __importDefault(require("./CrudioDataWrapper"));
const CrudioRepository_1 = __importDefault(require("./CrudioRepository"));
setTimeout(async () => {
    const config = {
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
        console.log("repo_path.json is the path to the repository definition, which is a JSON file.");
        console.log();
        console.log("Refer to test/unit/input/repo.json for an example.");
        process.exit(-1);
    }
    console.log(`Loading Crudio repository definition from: "${def}"`);
    console.log();
    const repo = CrudioRepository_1.default.FromJson(def);
    console.log("Data repository definition loaded");
    const db = new CrudioDataWrapper_1.default(config, repo);
    console.log("Data repository populated");
    console.log(`Creating empty database schema ${config.schema}...`);
    await db.CreateEmptySchema();
    await db.CreateTables();
    console.log("Populating tables with data...");
    console.log();
    console.log("Database has been loaded.");
    console.log("Use Hasura console to setup tracking.");
}, 1000);
//# sourceMappingURL=crudio.js.map