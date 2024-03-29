import * as fs from "fs";
import CrudioDataModel from "../src/datamodel/definition/CrudioDataModel";

import config from "./config/hasura-config";

describe("Produce diagrams from data model", () => {
  test("Create mermaid diagram", () => {
    config.datamodel = "datamodel/datamodel.json";
    const repo = CrudioDataModel.FromJson(config);
    const diagram = repo.ToMermaid();
    fs.writeFileSync("test/output/datamodel.mermaid.md", diagram);
  });
});
