import config from "./config/mongoose-config";

import ICrudioDataWrapper from "../src/datamodel/types/ICrudioDataWrapper";
import CrudioDataModel from "../src/datamodel/definition/CrudioDataModel";
import CrudioMongooseWrapper from "../src/wrappers/CrudioMongooseWrapper";

import { DbConnect, DbDrop } from "./utils/in_memory_mongodb";

// If you want to run with an in-memory MongoDB instance, then set this flag to true.
// If you wish to run against the docker container with MongoDB, then set it to false.
// If in-memory MongoDB fails to launch, refer to the READ ME for further information.
const in_memory = true;

beforeEach(async () => {
  if (in_memory) {
    const uri = await DbConnect();
    config.dbconnection = uri;
  }
});

afterEach(async () => {
  if (in_memory) {
    await DbDrop();
  }
});

describe("mongodb interaction", () => {
  jest.setTimeout(2400000);

  test("Populate MongoDB", async () => {
    const model: any = CrudioDataModel.FromJson(config, true);
    expect(model.DataModel.snippets.id.name).toEqual("_id");

    const db: ICrudioDataWrapper = new CrudioMongooseWrapper(config, model);
    expect(db).not.toBeNull;

    try {
      await db.CreateDatabaseSchema();
      await db.PopulateDatabaseTables();
      await model.ExecuteStreams(db);
    } catch (e) {
      console.log(e);
      throw e;
    }
  });

  test("gets organisation with employees", async () => {
    const model: any = CrudioDataModel.FromJson(config, true);
    const db = new CrudioMongooseWrapper(config, model);

    await db.CreateDatabaseSchema();
    await db.PopulateDatabaseTables();

    const organisations = db.GetModel("Organisations");
    expect(organisations).toBeDefined();

    const employees = db.GetModel("Employees");
    expect(employees).toBeDefined();

    const departments = db.GetModel("OrganisationDepartments");
    expect(departments).toBeDefined();

    const programs = db.GetModel("Programs");
    expect(programs).toBeDefined();

    const arrow = await organisations.findOne({ name: "Arrow Corporation" }).populate(["Employees", "Programs"]);
    expect(arrow).not.toBeNull();
    expect(arrow.Programs.length).toBeGreaterThan(0);
    expect(arrow.Employees.length).toBeGreaterThan(0);

    const william = await employees.findOne({ firstname: "William", lastname: "Tell" }).populate(["Organisations", "OrganisationDepartments", "OrganisationRoles"]);
    expect(william).not.toBeNull();
    expect(william.Organisations.name).toEqual(arrow.name);
    expect(william.OrganisationRoles.length).toBeGreaterThan(0);
    expect(william.OrganisationDepartments.name?.length).toBeGreaterThan(0);
  });
});
