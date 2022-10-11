import CrudioDataModel from "../../src/CrudioDataModel";
import CrudioHasura from "../../src/CrudioHasura";
import CrudioPostgresWrapper from "../../src/CrudioPostgresWrapper";
import CrudioMongooseWrapper from "../../src/CrudioMongooseWrapper";

import { postgres_config as pg_config } from "./test-config";
import { mongoose_config } from "./test-config";

describe("Save datamodel", () => {
	test("Populate PostgreSQL and track in Hasura", async () => {
		pg_config.datamodel = "datamodel/datamodel.json";
		const datamodel = CrudioDataModel.FromJson(pg_config, true);

		const db = new CrudioPostgresWrapper(pg_config, datamodel);
		expect(db).not.toBeNull;

		await db.CreateDatabaseSchema();
		await db.PopulateDatabaseTables();

		const tracker = new CrudioHasura(pg_config, datamodel);
		await tracker.Track();
	});

	test("Populate MongoDB", async () => {
		mongoose_config.datamodel = "datamodel/datamodel.json";
		const model:any = CrudioDataModel.FromJson(mongoose_config, true);

		expect(model.DataModel.snippets.id.name).toEqual("_id");

		const db = new CrudioMongooseWrapper(mongoose_config, model);
		expect(db).not.toBeNull;

		await db.CreateDatabaseSchema();
		await db.PopulateDatabaseTables();
	});
});
