// tslint:disable: max-line-length
// tslint:disable: no-unused-expression

import { stringify, parse } from "flatted";

import CrudioFakeDb from "../../src/CrudioFakeDb";
import CrudioEntityInstance from "../../src/CrudioEntityInstance";
import CrudioRepositoryTable from "../../src/CrudioRepositoryTable";
import { ICrudioConfig } from "../../src/CrudioTypes";
import CrudioDataWrapper from "../../src/CrudioDataWrapper";

import TestRepository from "./input/test_repo";

describe("Create fake data", () => {
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
    const repo = CrudioFakeDb.FromJson("test/unit/input/repo.json");

    expect(() => repo.GetTable("Entitys")).toThrow();

    const cactii: CrudioRepositoryTable = repo.GetTable("Cactii");
    expect(cactii).not.toBeNull();
    expect(cactii.rows.length).toBeGreaterThan(0);

    const users: CrudioEntityInstance[] = repo.GetTable("Users").rows;
    expect(users.length).toBeGreaterThan(0);
  });

  test("Use typescript defined repository", () => {
    const repo: CrudioFakeDb = new CrudioFakeDb(TestRepository);

    expect(() => repo.GetTable("Entitys")).toThrow();

    const users: CrudioEntityInstance[] = repo.GetTable("Users").rows;
    const organizations: CrudioEntityInstance[] =
      repo.GetTable("Organisations").rows;
    const cohorts: CrudioEntityInstance[] = repo.GetTable("Cohorts").rows;
    const clients: CrudioEntityInstance[] = repo.GetTable("Clients").rows;
    const programs: CrudioEntityInstance[] = repo.GetTable("Programs").rows;
    const surveys: CrudioEntityInstance[] = repo.GetTable("Surveys").rows;

    expect(users).not.toBeNull();
    expect(organizations).not.toBeNull();
    expect(cohorts).not.toBeNull();
    expect(clients).not.toBeNull();
    expect(programs).not.toBeNull();
    expect(surveys).not.toBeNull();

    expect(users.length).toEqual(4000);
    expect(organizations.length).toBeGreaterThan(0);
    expect(cohorts.length).toBeGreaterThan(0);
    expect(clients.length).toBeGreaterThan(0);
    expect(programs.length).toBeGreaterThan(0);
    expect(surveys.length).toBeGreaterThan(0);

    // Let's get the first organisation
    const first_org: any = organizations[0];

    // Now get the Users for the organisation
    const orgUsers = first_org.values["Users"];

    // Let's make sure we got 4000 users
    expect(orgUsers.length).toEqual(4000);

    const firstUser = orgUsers[0];
    expect(firstUser).not.toBeNull();

    var cohortsAddedToPrograms: number = 0;
    programs.map(
      (p) => (cohortsAddedToPrograms += (p as any).values.Cohorts.length)
    );

    expect(cohortsAddedToPrograms).toBeGreaterThan(0);

    const firstPerson: any = users[0];
    expect(firstPerson).not.toBeNull();
    expect(firstPerson.fullname).not.toBeNull();

    const firstOrganisation: any = organizations[0];
    expect(firstOrganisation).not.toBeNull();
    expect(firstOrganisation.name).not.toBeNull();

    expect(firstPerson.values.Organisation).not.toBeNull();
    expect(firstPerson.values.Organisation).not.toBeUndefined();

    expect(firstOrganisation.values.Users).not.toBeNull();
    expect(firstOrganisation.values.Users).not.toBeUndefined();
    expect(firstOrganisation.values.Users.length).toBeGreaterThan(0);

    const cohort: any = cohorts[0] as any;
    expect(cohort.values.Clients.length).toBeGreaterThan(0);
  });

  test("Save and load database using flatted form", () => {
    const demo: CrudioFakeDb = new CrudioFakeDb(TestRepository);
    demo.Save("test/unit/output/fake.flat.json");

    const db = CrudioFakeDb.FromString(demo.ToString());
    expect(db).not.toBeNull();

    const users: CrudioEntityInstance[] = db.GetTable("Users").rows;
    const organizations: CrudioEntityInstance[] =
      db.GetTable("Organisations").rows;
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
    const config: ICrudioConfig = {
      hasuraEndpoint: "http://localhost:6789",
      hasuraQueryEndpoint: "http://localhost:6789/v2/query",
      hasuraAdminSecret: "crudio",
      idFieldName: "id",
      readonlyFields: [],
    };

    const repo = CrudioFakeDb.FromJson("test/unit/input/repo.json");
    const db = new CrudioDataWrapper(config, repo);
    expect(db).not.toBeNull;
    expect(db.gql).not.toBeNull;

    await db.DropTables();
    await db.CreateTables();
  });
});
