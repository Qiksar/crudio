import config from "./config/hasura-config";

import ICrudioDataWrapper from "../src/datamodel/types/ICrudioDataWrapper";
import CrudioDataModel from "../src/datamodel/definition/CrudioDataModel";
import CrudioHasuraTracker from "../src/wrappers/CrudioHasuraTracker";
import CrudioHasuraWrapper from "../src/wrappers/CrudioHasuraWrapper";

describe("Save datamodel", () => {
  jest.setTimeout(120000);

  test("Populate PostgreSQL and track in Hasura", async () => {
    try {
      const datamodel = CrudioDataModel.FromJson(config, true);

      const db: ICrudioDataWrapper = new CrudioHasuraWrapper(config, datamodel);
      expect(db).not.toBeNull;

      await db.CreateDatabaseSchema();
      await db.PopulateDatabaseTables();
      await datamodel.ExecuteStreams(db);

      const tracker = new CrudioHasuraTracker(config, datamodel);
      await tracker.Track();
    } catch (e) {
      console.log(e);
      throw e;
    }
  });
});
