import CrudioCLI from "../src/CrudioCLI";
describe("Test command line options", () => {
    
    test("Should parse the command line arguments", () => {
        const args = ["-w", "-s", "crudio", "-m", "datamodel/datamodel.json", "-i", "repo/include.json"];
        const cli = new CrudioCLI(args);
        const cfg = cli.Config;

        expect(cfg.wipe).toEqual(true);
        expect(cfg.schema).toEqual("crudio")
        expect(cfg.datamodel).toEqual("datamodel/datamodel.json")
        expect(cfg.include).toEqual("repo/include.json")
    });
});