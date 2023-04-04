import CrudioCLI from "../src/cli/CrudioCLI";

describe("Test command line options", () => {
  test("Should parse the command line arguments", () => {
    const args = ["-s", "crudio", "-m", "datamodel/datamodel.json", "-w"];
    const cli = new CrudioCLI(args);
    const cfg = cli.Config;

    expect(cfg.wipe).toEqual(true);
    expect(cfg.schema).toEqual("crudio");
    expect(cfg.datamodel).toEqual("datamodel/datamodel.json");
  });
});
