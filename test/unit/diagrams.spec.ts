import * as fs from "fs";
import CrudioDataModel from "../../src/CrudioDataModel";

describe("Produce diagrams from data model", () => {

    test("Create mermaid diagram", () => {
        const repo = CrudioDataModel.FromJson("datamodel/datamodel.json");
        const diagram = repo.ToMermaid();
        fs.writeFileSync("test/unit/output/repo.md", diagram);
    });

});