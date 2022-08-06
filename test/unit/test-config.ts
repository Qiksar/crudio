import { ICrudioConfig } from "../../src/CrudioTypes";

const config: ICrudioConfig = {
    hasuraEndpoint: "http://localhost:6789",
    hasuraAdminSecret: "crudio",
    idField: "id",
    readonlyFields: [],
    schema: "crudio_test",
    wipe: true,
    repo: "repo/repo.json",
    include: "repo/include.json",
};

export default config;