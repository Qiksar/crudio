import * as fs from "fs";

import CrudioDataModel from "../../src/CrudioDataModel";
import CrudioDataWrapper from "../../src/CrudioDataWrapper";
import CrudioHasura from "../../src/CrudioHasura";

import config from "./test-config";

describe("Save to database", () => {
	jest.setTimeout(120000);

	test("Populate database", async () => {
		const datamodel = CrudioDataModel.FromJson("datamodel/datamodel.json"); //, true, "datamodel/blocks/iot.json");
		const db = new CrudioDataWrapper(config, datamodel);
		expect(db).not.toBeNull;

		try {
			await db.CreateDatabaseSchema();
			await db.PopulateDatabaseTables();

			const tracker = new CrudioHasura(config, datamodel);
			await tracker.Track();
		} catch (e: any) {
			fs.writeFileSync("test/unit/output/db.log.json", JSON.stringify(e) + "\r\n");
			throw e;
		}
	});
});
