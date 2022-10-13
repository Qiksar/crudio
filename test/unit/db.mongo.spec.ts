import CrudioDataModel from "../../src/CrudioDataModel";
import CrudioMongooseWrapper from "../../src/DataWrappers/CrudioMongooseWrapper";
import { ICrudioDataWrapper } from "../../src/CrudioTypes";
import config from "./config/mongoose-config"

describe("mongodb interaction", () => {
    jest.setTimeout(30000);


    test("Populate MongoDB", async () => {
        const model: any = CrudioDataModel.FromJson(config, true);
        expect(model.DataModel.snippets.id.name).toEqual("_id");

        const db: ICrudioDataWrapper = new CrudioMongooseWrapper(config, model);
        expect(db).not.toBeNull;

        await db.CreateDatabaseSchema();
        await db.PopulateDatabaseTables();

        await db.Close();
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

        await db.Close();
    });
});
