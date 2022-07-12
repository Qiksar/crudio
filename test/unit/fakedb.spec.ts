// tslint:disable: max-line-length
// tslint:disable: no-unused-expression

import { stringify, parse } from "flatted";

import CrudioRepository from "../../src/CrudioRepository";
import CrudioEntityInstance from "../../src/CrudioEntityInstance";
import CrudioTable from "../../src/CrudioTable";
import { ICrudioConfig } from "../../src/CrudioTypes";
import CrudioDataWrapper from "../../src/CrudioDataWrapper";

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
    const repo = CrudioRepository.FromJson("repo/repo.json");

    expect(() => repo.GetTable("Entitys")).toThrow();

    const cactii: CrudioTable = repo.GetTable("Cactii");
    expect(cactii).not.toBeNull();
    expect(cactii.rows.length).toBeGreaterThan(0);

    const users: CrudioEntityInstance[] = repo.GetTable("Users").rows;
    expect(users.length).toBeGreaterThan(0);
  });

  test("Save and load database using flatted form", () => {
    const repo = CrudioRepository.FromJson("repo/repo.json");
    repo.Save("test/unit/output/fake.flat.json");

    const db = CrudioRepository.FromString(repo.ToString());
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
      schema: "public"
    };

    const repo = CrudioRepository.FromJson("repo/repo.json");
    const db = new CrudioDataWrapper(config, repo);
    expect(db).not.toBeNull;
    expect(db.gql).not.toBeNull;

    await db.CreateEmptySchema();
    await db.CreateTables();
  });
});
