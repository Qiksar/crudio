import * as fs from "fs";
import CrudioDataModel from "../../src/CrudioDataModel";

describe("Produce diagrams from data model", () => {

    test("Create mermaid diagram", () => {
        const repo = CrudioDataModel.FromJson("repo/repo.json");
        const diagram = repo.ToMermaid();
        fs.writeFileSync("test/unit/output/repo.md", diagram);
    });

});