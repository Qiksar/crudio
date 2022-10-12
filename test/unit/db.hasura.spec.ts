import CrudioDataModel from "../../src/CrudioDataModel";
import CrudioHasura from "../../src/CrudioHasura";
import CrudioPostgresWrapper from "../../src/CrudioPostgresWrapper";

import config from "./config/hasura-config";

describe("Save datamodel", () => {
	jest.setTimeout(15000);
	
	test("Populate PostgreSQL and track in Hasura", async () => {
		config.datamodel = "datamodel/datamodel.json";
		const datamodel = CrudioDataModel.FromJson(config, true);

		const db = new CrudioPostgresWrapper(config, datamodel);
		expect(db).not.toBeNull;

		await db.CreateDatabaseSchema();
		await db.PopulateDatabaseTables();

		const tracker = new CrudioHasura(config, datamodel);
		await tracker.Track();
	});
});
