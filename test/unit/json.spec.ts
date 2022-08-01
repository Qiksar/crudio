import { CrudioJson } from "./../../src/CrudioJson";

describe("JSON schema validation", () => {
	test("Valid datamodel should comply with schema", () => {
		const repo = CrudioJson.LoadJson("repo/repo.json");
		CrudioJson.AddSchema("schema/crudio.json", "crudio");
		const result = CrudioJson.Validate(repo, "crudio");
		expect(result.valid).toEqual(true);
	});
});
