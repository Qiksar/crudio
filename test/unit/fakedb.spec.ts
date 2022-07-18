// tslint:disable: max-line-length
// tslint:disable: no-unused-expression

import { stringify, parse } from "flatted";

import { ICrudioConfig } from "../../src/CrudioTypes";
import CrudioRepository from "../../src/CrudioRepository";
import CrudioEntityInstance from "../../src/CrudioEntityInstance";
import CrudioTable from "../../src/CrudioTable";
import CrudioDataWrapper from "../../src/CrudioDataWrapper";

const config: ICrudioConfig = {
	hasuraEndpoint: "http://localhost:6789",
	hasuraQueryEndpoint: "http://localhost:6789/v2/query",
	hasuraAdminSecret: "crudio",
	idFieldName: "id",
	readonlyFields: [],
	schema: "crudio_test",
	only_generate_data: false
};

describe("Create fake data", () => {
	jest.setTimeout(120000);

	test("Test flatted", () => {
		const input = {
			firstName: "Joe",
			lastName: "Bloggs",
		};

		const text = stringify(input);
		expect(text).toContain("Bloggs");

		const joe: any = parse(text);
		expect(joe.firstName).not.toBeNull;
	});
	

	test("Load repository definition from JSON file", () => {
		const repo = CrudioRepository.FromJson("repo/repo.json");

		expect(() => repo.GetTable("Entitys")).toThrow();

		const cactii: CrudioTable = repo.GetTable("Cactii");
		expect(cactii).not.toBeNull();
		expect(cactii.rows.length).toBeGreaterThan(0);

		const user = repo.GetEntityDefinition("User");
		expect(user).not.toBeNull;

		const users: CrudioEntityInstance[] = repo.GetTable("Users").rows;
		expect(users.length).toBeGreaterThan(0);
	});

	test("Check for unique email addresses", () => {
		const repo = CrudioRepository.FromJson("repo/repo.json");
		const users: CrudioEntityInstance[] = repo.GetTable("Users").rows;
		var uniqueKeys: string[] = [];

		users.map(u => {
			uniqueKeys.push(u.values.email);
		});

		// Run through all lists of unique values
		Object.keys(uniqueKeys).map(k => {
			// Slice the first item off the list, and then ensure a duplicate values has not remained in the list
			while (uniqueKeys.length > 1) {
				const removed = uniqueKeys.splice(0, 1);
				const dupe_index = uniqueKeys.indexOf(removed[0]);
				if (dupe_index >= 0) throw "Test failed: Found a duplicate value";
				expect(dupe_index).toBeLessThan(0);
				expect((removed[0] as string).indexOf("[")).toBeLessThan(0);
			}
		});
	});
	
	test("Check for unique tag names", () => {
		const repo = CrudioRepository.FromJson("repo/repo.json");
		const tags: CrudioEntityInstance[] = repo.GetTable("Tags").rows;
		var uniqueKeys: string[] = [];

		tags.map(u => {
			uniqueKeys.push(u.values.name);
		});

		// Run through all lists of unique values
		Object.keys(uniqueKeys).map(k => {
			// Slice the first item off the list, and then ensure a duplicate values has not remained in the list
			while (uniqueKeys.length > 1) {
				const removed = uniqueKeys.splice(0, 1);
				const dupe_index = uniqueKeys.indexOf(removed[0]);
				if (dupe_index >= 0) throw "Test failed: Found a duplicate value";
				expect(dupe_index).toBeLessThan(0);
				expect((removed[0] as string).indexOf("[")).toBeLessThan(0);
			}
		});
	});

	test("Save and load database using flatted form", () => {
		const repo = CrudioRepository.FromJson("repo/repo.json");
		repo.Save("test/unit/output/fake.flat.json");

		const db = CrudioRepository.FromString(repo.ToString());
		expect(db).not.toBeNull();

		const users: CrudioEntityInstance[] = db.GetTable("Users").rows;
		const organizations: CrudioEntityInstance[] = db.GetTable("Organisations").rows;
		const cohorts: CrudioEntityInstance[] = db.GetTable("Cohorts").rows;
		const clients: CrudioEntityInstance[] = db.GetTable("Clients").rows;
		const programs: CrudioEntityInstance[] = db.GetTable("Programs").rows;
		const surveys: CrudioEntityInstance[] = db.GetTable("Surveys").rows;

		expect(users).not.toBeNull();
		expect(organizations).not.toBeNull();
		expect(cohorts).not.toBeNull();
		expect(clients).not.toBeNull();
		expect(programs).not.toBeNull();
		expect(surveys).not.toBeNull();

		expect(users.length).toBeGreaterThan(0);
		expect(organizations.length).toBeGreaterThan(0);
		expect(cohorts.length).toBeGreaterThan(0);
		expect(clients.length).toBeGreaterThan(0);
		expect(programs.length).toBeGreaterThan(0);
		expect(surveys.length).toBeGreaterThan(0);

		const program: any = programs[0] as any;
		expect(program.values.Cohorts.length).toBeGreaterThan(0);

		const firstPerson: any = users[0];
		expect(firstPerson).not.toBeNull();
		expect(firstPerson.fullname).not.toBeNull();

		const firstOrganisation: any = organizations[0];
		expect(firstOrganisation).not.toBeNull();
		expect(firstOrganisation.name).not.toBeNull();

		expect(firstPerson.values.Organisation).not.toBeNull();
		expect(firstOrganisation.values.Users).not.toBeNull();

		const cohort: any = cohorts[0] as any;
		expect(cohort.values.Clients.length).toBeGreaterThan(0);
	});

	test("Populate database", async () => {
		const repo = CrudioRepository.FromJson("repo/repo.json");
		const db = new CrudioDataWrapper(config, repo);
		expect(db).not.toBeNull;
		expect(db.gql).not.toBeNull;

		await db.CreateDatabaseSchema();
		await db.PopulateDatabaseTables();
	});
});
