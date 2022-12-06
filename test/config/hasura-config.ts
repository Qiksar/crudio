import { ICrudioConfig } from "../../src/CrudioTypes";

const config: ICrudioConfig = {
    target: "p",
    hasuraEndpoint: "http://localhost:6789",
    hasuraAdminSecret: "crudio",
    idField: "id",
    readonlyFields: [],
    schema: "test",
    wipe: true,
    datamodel: "datamodel/datamodel.json",
    version: "1.0.0",
    verbose: true
};

export default config;