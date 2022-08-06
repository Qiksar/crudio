import * as fs from "fs";

import CrudioDataModel from "../../src/CrudioDataModel";
import CrudioDataWrapper from "../../src/CrudioDataWrapper";
import config from "./test-config"

describe("Save to database", () => {
    jest.setTimeout(120000);

    test("Populate database", async () => {
        const repo = CrudioDataModel.FromJson("repo/repo.json", true, "repo/iot.json");
        const db = new CrudioDataWrapper(config, repo);
        expect(db).not.toBeNull;

        try {
            await db.CreateDatabaseSchema();
            await db.PopulateDatabaseTables();
        } catch (e: any) {
            fs.writeFileSync("test/unit/output/db.log.json", JSON.stringify(e) + "\r\n");
            throw e;
        }
    })
});