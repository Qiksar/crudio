import Mongoose from "mongoose";
import CrudioDataModel from "../../src/CrudioDataModel";
import CrudioMongooseWrapper from "../../src/CrudioMongooseWrapper";
import config from "./config/mongoose-config"

describe("mongodb interaction", () => {
    jest.setTimeout(30000);


    test("Populate MongoDB", async () => {
        const model: any = CrudioDataModel.FromJson(config, true);

        expect(model.DataModel.snippets.id.name).toEqual("_id");

        const db = new CrudioMongooseWrapper(config, model);
        expect(db).not.toBeNull;

        await db.CreateDatabaseSchema();
        await db.PopulateDatabaseTables();

        await db.Close();
    });

    test("gets organisation with employees", async () => {
        const model: any = CrudioDataModel.FromJson(config, true);
        const db = new CrudioMongooseWrapper(config, model);

        const organisations = db.GetModel("Organisations");

        expect(organisations).toBeDefined();
        const arrow = await organisations.findOne({ name: "Arrow Corporation" })
        expect(arrow.name).toEqual("Arrow Corporation");

        try {
            const arrow = await organisations.findOne({ name: "Arrow Corporation" }).populate(["Employees", "OrganisationDepartments"]);
            expect(arrow.Employees.length).toBeGreaterThan(0);
            expect(arrow.OrganisationDepartments.length).toBeGreaterThan(0);
        } catch (e) {
            console.log(e);
        }

        await db.Close();
    });
});
