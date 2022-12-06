import { ICrudioConfig } from "../../src/CrudioTypes";

export const config: ICrudioConfig = {
    target: "m",
    idField: "_id",
    readonlyFields: [],
    schema: "test",
    wipe: true,
    datamodel: "datamodel/datamodel.json",
    dbconnection: "mongodb://crudio:crudio@localhost:27017/crudio?authSource=admin",
    version: "1.0.0",
    verbose: true
};

export default config;