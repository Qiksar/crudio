import Mongoose from "mongoose";
import CrudioDataModel from "../../src/CrudioDataModel";
import CrudioMongooseWrapper from "../../src/CrudioMongooseWrapper";

import config from "./config/mongoose-config"

describe("mongodb interaction", () => {
    jest.setTimeout(15000);

    test("mongoose works", async () => {
        Mongoose.connect(config.dbconnection ?? "");

        const schema = new Mongoose.Schema({
            name: String,
            age: Number
        });

        const model = Mongoose.model("test_record", schema);
        const instance = new model({ name: "test person", age: 31 });
        await instance.save();

        await Mongoose.connection.db.dropCollection("test_records");
    });

    test("Populate MongoDB", async () => {
        config.datamodel = "datamodel/datamodel.json";
        const model: any = CrudioDataModel.FromJson(config, true);

        expect(model.DataModel.snippets.id.name).toEqual("_id");

        const db = new CrudioMongooseWrapper(config, model);
        expect(db).not.toBeNull;

        await db.CreateDatabaseSchema();
        await db.PopulateDatabaseTables();
    });

    test("gets organisation with employees", async () => {
        config.datamodel = "datamodel/datamodel.json";
        const model: any = CrudioDataModel.FromJson(config, true);
        const db = new CrudioMongooseWrapper(config, model);

        Mongoose.connect(config.dbconnection ?? "");
        const organisations = db.GetModel("Organisations");

        expect(organisations).toBeDefined();
        const arrow = await organisations.findOne({ name: "Arrow Corporation" })
        expect(arrow.name).toEqual("Arrow Corporation");

        try {
            const arrowEmployees = await organisations.findOne({ name: "Arrow Corporation" }).populate("Employees");
            const employees = arrowEmployees.Employees;
            expect(employees).toBeDefined();
            expect(employees.length).toBeGreaterThan(0);
        } catch (e) {
            console.log(e);
        }
    });
});
