import CrudioCLI from "../../src/CrudioCLI";
describe("Test command line options", () => {
    
    test("Should parse the command line arguments", () => {
        const args = ["-w", "-s", "crudio", "-r", "repo/repo.json", "-i", "repo/include.json"];
        const cli = new CrudioCLI(args);
        const cfg = cli.Config;

        expect(cfg.wipe).toEqual(true);
        expect(cfg.schema).toEqual("crudio")
        expect(cfg.repo).toEqual("repo/repo.json")
        expect(cfg.include).toEqual("repo/include.json")
    });
});