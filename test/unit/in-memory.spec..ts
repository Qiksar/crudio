// tslint:disable: max-line-length
// tslint:disable: no-unused-expression


import CrudioDataModel from "../../src/CrudioDataModel";
import CrudioEntityInstance from "../../src/CrudioEntityInstance";
import CrudioTable from "../../src/CrudioTable";
import CrudioDataWrapper from "../../src/CrudioDataWrapper";

describe("Create fake data", () => {
	jest.setTimeout(120000);

	test("Find Arrow Corporation and William Tell", () => {
		const repo = CrudioDataModel.FromJson("repo/repo.json");
		const rows = repo.GetTable("Organisations").DataRows;
		const arrow = rows[0];
		const william = arrow.DataValues.Users[0].DataValues;

		expect(arrow.DataValues.name).toEqual("Arrow Corporation");
		expect(william.firstname).toEqual("William");
		expect(william.lastname).toEqual("Tell");
	});

	test("Load repository definition from JSON file", () => {
		const repo = CrudioDataModel.FromJson("repo/repo.json");

		expect(() => repo.GetTable("Entitys")).toThrow();

		const cactii: CrudioTable = repo.GetTable("Cactii");
		expect(cactii).not.toBeNull();
		expect(cactii.DataRows.length).toBeGreaterThan(0);

		const user = repo.GetEntityDefinition("User");
		expect(user).not.toBeNull;

		const users: CrudioEntityInstance[] = repo.GetTable("Users").DataRows;
		expect(users.length).toBeGreaterThan(0);
	});

	test("All Blogs have at least one tag", () => {
		const repo = CrudioDataModel.FromJson("repo/repo.json");

		const blogs = repo.GetTable("Blogs");
		const tags = repo.GetTable("BlogTags");

		var count = 0;
		blogs.DataRows.map(blog_post => {
			const blog_tags = repo.ExecuteCrudioQuery(tags.EntityDefinition.Name, `Blog=${blog_post.DataValues.id}`);
			if (blog_tags.length == 0) count++;
		});

		// How many blogs don't have tags?
		expect(count).toEqual(0);
	});

	test("Load repository with include file", () => {
		const repo = CrudioDataModel.FromJson("repo/repo.json", true, "repo/iot.json");

		expect(() => repo.GetTable("Entitys")).toThrow();

		const devicetype: CrudioTable = repo.GetTable("DeviceTypes");
		const device: CrudioTable = repo.GetTable("Devices");
		const site: CrudioTable = repo.GetTable("DeviceSites");
		expect(devicetype).not.toBeNull();
		expect(device).not.toBeNull();
		expect(site).not.toBeNull();
	});

	test("Check for unique email addresses", () => {
		const repo = CrudioDataModel.FromJson("repo/repo.json");
		const users: CrudioEntityInstance[] = repo.GetTable("Users").DataRows;
		var uniqueKeys: string[] = [];

		users.map(u => {
			uniqueKeys.push(u.DataValues.email);
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
		const repo = CrudioDataModel.FromJson("repo/repo.json");
		const tags: CrudioEntityInstance[] = repo.GetTable("Tags").DataRows;
		var uniqueKeys: string[] = [];

		tags.map(u => {
			uniqueKeys.push(u.DataValues.name);
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
		const repo = CrudioDataModel.FromJson("repo/repo.json");
		repo.Save("test/unit/output/fake.flat.json");

		const db = CrudioDataModel.FromString(repo.ToString());
		expect(db).not.toBeNull();

		const users: CrudioEntityInstance[] = db.GetTable("Users").DataRows;
		const organizations: CrudioEntityInstance[] = db.GetTable("Organisations").DataRows;
		const cohorts: CrudioEntityInstance[] = db.GetTable("Cohorts").DataRows;
		const clients: CrudioEntityInstance[] = db.GetTable("Clients").DataRows;
		const programs: CrudioEntityInstance[] = db.GetTable("Programs").DataRows;
		const surveys: CrudioEntityInstance[] = db.GetTable("Surveys").DataRows;

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

		const program: CrudioEntityInstance = programs[0] as any;
		expect(program.DataValues.Cohorts.length).toBeGreaterThan(0);

		const firstPerson: CrudioEntityInstance = users[0];
		expect(firstPerson).not.toBeNull();
		expect(firstPerson.DataValues.fullname).not.toBeNull();

		const firstOrganisation: any = organizations[0];
		expect(firstOrganisation).not.toBeNull();
		expect(firstOrganisation.name).not.toBeNull();

		expect(firstPerson.DataValues.Organisation).not.toBeNull();
		expect(firstOrganisation.DataValues.Users).not.toBeNull();

		const cohort: any = cohorts[0] as any;
		expect(cohort.DataValues.Clients.length).toBeGreaterThan(0);
	});

});
