# Crudio
Crudio is part of a vision to create a platform that supports rapid prototyping, particularly in the data and user interface domains.

# The stack
Crudio is built using Typescript and tested using Docker and Jest. The underlying database for traditional persistence is Postgres wrapped with Hasura GraphQL.

# Data
## Fake Data
Provides a means of creating data for prototype and test.

The low down: You're asked to build a system to gather feedback from the community which various organizations can use to measure stakeholder sentiment. But you don't have any data for organizations, their staff, the clients they service, the feedback surveys or responses to surveys. You got nothing! How might you quickly create a bunch of data so that you can build a UI and demonstrate to users to gather feedback?

Fake Data! Creates users and organizations, randomly assigns the users to organizations. Creates programs which organizations deliver services through. Randomly distributes programs to organizations. Creates clients and chorts. Randomly distributes clients into cohorts and cohorts to programs. 

Essentially, just be describing the data you want, Fake Data creates a complex object graph, generating data entities, and connecting them to each other...  user->organisation  client->cohort etc.


## Key Objectives
These are the key objectives of Fake Data

1. Fake data can be persisted so that when used for demonstration, the data is predictable and supports rehearsed story telling.
2. The definition of how to create the data and the data itself are managed as a unit, and can easily be version controlled, and tracing is possible from the data back to the rules which created it.
3. The data should be consistent based on the context of generated entities. For example, a generated Person with first and last name of Bob Smith has an email address of bob.smith@somewhere.com, as opposed to having random values.

Simply put, fake data should be useful to help developers quickly build systems that can be used to engage stakeholders for feedback, and as far as practicable, the data should be coherent and not create questions about why it doesn't appear to be sensible and relevant to the problem domain.

## Further Information

Folder: test/unit

*test_repo.ts* - This is the definition of a repository, which comprises the rules for data generation, and is augmented by the generation process to also contain the generated data.
*fake.spec.ts* - Demonstrates how to trigger the data generation process and access the generated data.


# CRUD Operations
The initial motivation for Crudio was to accelerate the building of CRUD components, as being able to quickly show a stakeholder the fundamental data management aspects of a system can be reassuring.

To support CRUD, Crudio essentially provides a quick means of Creating, Reading, Updating and Deleting data.
More advanced features are intended to support displaying data in grids, which automatically discover columns, hide irrelevant (not user-friendly) data, and provide pagination (and filtering later).

## Hasura
Hasura has been adopted as the default GraphQL engine over Postgres, but this makes the data handling extremely oppinionated. But for now, it will do for rapid prototyping.

## Postgres
Postgres has been adopted for data management, as together with Hasura it supports the intention of rapid prototyping.

## Docker
Docker containers are created for Postgres and Hasura and built with docker-compose, so very little prior knowledge of any of the related technologies is required.

## Further Information

Folder: test/unit

*crudio.spec.ts*

# Try it out
Build the docker containers using the docker-compose file in the *test* folder.

. Browse to hasura on http://localhost:6789

. Setup tracking for all tables and all relationships
    When building the docker containers a small test database was created and you should see tables
    listed in hasura with relationships

. Run the unit tests with Jest.
