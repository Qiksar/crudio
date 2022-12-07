import { ICrudioConfig } from "../../src/CrudioTypes";

const config: ICrudioConfig = {
	version: "1.0.0",
	verbose: true,
	wipe: true,
	datamodel: "datamodel/datamodel.json",
	target: "p",
	idField: "id",
	schema: "test",
	hasuraEndpoint: "http://localhost:6789",
	hasuraAdminSecret: "crudio",
	readonlyFields: [],
};

export default config;