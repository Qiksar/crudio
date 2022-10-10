import { ICrudioConfig } from "../../src/CrudioTypes";

export const postgres_config: ICrudioConfig = {
    target: "p",
    hasuraEndpoint: "http://localhost:6789",
    hasuraAdminSecret: "crudio",
    idField: "id",
    readonlyFields: [],
    schema: "test",
    wipe: true,
    datamodel: "datamodel/datamodel.json",
    include: "repo/include.json",
    dbconnection: "mongodb://localhost",
    version: "1.0.0",
    verbose: true
};

export const mongoose_config: ICrudioConfig = {
    target: "p",
    idField: "id",
    readonlyFields: [],
    schema: "test",
    wipe: true,
    datamodel: "datamodel/datamodel.json",
    include: "repo/include.json",
    dbconnection: "mongodb://crudio:crudio@localhost:27017/crudio?authSource=admin",
    version: "1.0.0",
    verbose: true
};
