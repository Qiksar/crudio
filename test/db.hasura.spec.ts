import CrudioDataModel from "../src/CrudioDataModel";
import CrudioHasura from "../src/CrudioHasura";
import { ICrudioDataWrapper } from "../src/CrudioTypes";
import CrudioHasuraWrapper from "../src/DataWrappers/CrudioHasuraWrapper";
import config from "./config/hasura-config";

describe("Save datamodel", () => {
	jest.setTimeout(120000);

	test("Populate PostgreSQL and track in Hasura", async () => {
		const datamodel = CrudioDataModel.FromJson(config, true);

		const db: ICrudioDataWrapper = new CrudioHasuraWrapper(config, datamodel);
		expect(db).not.toBeNull;

		try{
		await db.CreateDatabaseSchema();
		await db.PopulateDatabaseTables();
		await datamodel.ExecuteStreams(db);

		const tracker = new CrudioHasura(config, datamodel);
		await tracker.Track();
		}
		catch(e){
			throw e;
		}
	});
});
