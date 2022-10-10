import Mongoose from "mongoose";
import { mongoose_config as TestConfig } from "./test-config"

describe("test mongoose", () => {
    test("mongoose works", async () => {
        Mongoose.connect(TestConfig.dbconnection ?? "");

        const schema = new Mongoose.Schema({
            name: String,
            age: Number
        });

        const model = Mongoose.model("test_record", schema);
        const instance = new model({name: "test person", age:31});
        await instance.save();

        await Mongoose.connection.db.dropCollection("test_records");
    });
});