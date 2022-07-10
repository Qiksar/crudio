import StandardGenerators from "../../../src/CrudioStandardGenerators";
import { ICrudioRepository } from "../../../src/CrudioTypes";

const repository: ICrudioRepository = {
  include: [],

  schema: {
    Person: {
      id: { type: "string", name: "id", generator: "[uuid]" },
      firstname: {
        type: "string",
        name: "firstname",
        generator: "[firstname]",
      },
      middlename: {
        type: "string",
        name: "middlename",
        generator: "[middlename]",
      },
      lastname: { type: "string", name: "lastname", generator: "[lastname]" },
      fullname: {
        type: "string",
        name: "fullname",
        generator: "[!firstname] [!middlename] [!lastname]",
      },
      address: { type: "string", name: "address", generator: "[address]" },
      email: {
        type: "string",
        name: "email",
        generator: "[!firstname].[!lastname]@[server].[tld]",
      },
      dob: { type: "date", name: "dob", generator: "[dob]" },
    },

    Organisation: {
      id: { type: "string", name: "id", generator: "[uuid]" },
      name: { type: "string", name: "name", generator: "[organisation_name]" },
      address: { type: "string", name: "address", generator: "[address]" },
      email: {
        type: "string",
        name: "email",
        generator: "contact@[!name].org.au",
      },
    },

    Program: {
      id: { type: "string", name: "id", generator: "[uuid]" },
      name: { type: "string", name: "name", generator: "[program_name]" },
      mission: {
        type: "string",
        name: "mission",
        generator: "[program_mission]",
      },
    },

    Cohort: {
      id: { type: "string", name: "id", generator: "[uuid]" },
      name: { type: "string", name: "name", generator: "[cohort_name]" },
    },

    Survey: {
      id: { type: "string", name: "id", generator: "[uuid]" },
      name: { type: "string", name: "name", generator: "[survey_name]" },
    },

    Client: {
      inherits: "Person",
    },

    User: {
      inherits: "Person",
    },
  },

  generators: {
    ...StandardGenerators,

    cohort_name:
      "LGBTIQ,12-21yo;homeless women;unemployed youth;underemployed migrants;talented kids;bright spectrum;see me hear me",
    program_name:
      "Well, well, well;Mind the gap;Better Tomorrow;Ahead Together;Three heads are better than two;Cocre8 the Future;New Hub;Includer Alert;Kowerk",
    program_mission:
      "Very big mission, with lots of vision creating great impact;Small focussed mission, getting to the heart of the matter;Improving health and well-being in homeless populations;Improving mental health in underemployed youth;",
    survey1: "Measure;Assess;Understand;",
    survey2:
      "income;employment;mental health;homelessness;healthcare needs;transport needs;transport needs;",
    survey_name: "[survey1] [survey2] of the [cohort_name] community",
  },

  record_counts: {
    // We only want one organisation
    Organisations: 1,

    // ...and all 4000 users will be added into the one organisation
    Users: 4000,
  },

  relationships: [
    {
      from: "Users",
      to: "Organisations",
      type: "one",
    },
    {
      from: "Clients",
      to: "Cohorts",
      type: "one",
    },
    {
      from: "Cohorts",
      to: "Programs",
      type: "one",
    },
    {
      from: "Programs",
      to: "Organisations",
      type: "one",
    },
    {
      from: "Surveys",
      to: "Programs",
      type: "one",
    },
  ],

  entities: [],

  tables: [],
};

export default repository;
