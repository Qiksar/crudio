<table>
  <tr>
    <td> <img src="https://user-images.githubusercontent.com/45703746/182263014-7a817506-4c50-4418-8d77-06ccb61a6438.png"></td>
    <td> <h1>Crudio</h1> Prototype Faster</td>
   </tr> 
</table>

# Welcome to Crudio!

**HOT NEWS!** Crudio now populates MongoDB and demonstrates how to use an in-memory version of mongo for unit tests.

Imagine. Two minutes from now, you could have a PostgreSQL database fully integrated with Hasura, automatically populated with test data, and all you had to do was click the mouse!

Why? Creating test data is painful, and a copy of our production data doesn't support all of the edge cases that we need to test. Or...there is no production data, because your project is new, and / or you're simply not allowed to have a copy. 

How? A data model is described in a JSON file that contains descriptions of the types of entities and datavalues that you require for your prototype application. Your data model can leverage (include) pre-defined entities, such as organisations and users, and specify details of how to connect entities (e.g. organisations, departments, roles and employees). Crudio uses docker images for Postgres and Hasura, and can use MongoDB (and the in memory version of mongo), so you can build and run test cases, to support the rapid development of a new prototype app or API. 

Further information is available on the [Crudio WIKI](https://github.com/Qiksar/crudio/wiki/01.-Home)

# MongoDb - In-memory

The wonderful fact is that with the in-memory version of MongoDb you can run Crudio and have a database for testing, and you don't even have to run Docker images! This is very new, and we are clearly very excited about this...but it's early days. Still, we will continue to enhance crudio for loading Mongo, which is already fully implemented. Checkout our test code for tips on how to use Mongoose and the in-memory database. You may be shocked how simple it is!

## Using WSL (Ubuntu 22.04 LTS)

An issue exists whereby the in-memory mongo component fails to launch.

If you encounter an error whereby the component complains that `libssl1.1` is not installed, simply execute this in the environment that you are developing / testing in.

```
wget http://debian.mirror.ac.za/debian/pool/main/o/openssl/libssl1.1_1.1.1o-1_amd64.deb
sudo dpkg -i libssl1.1_1.1.1o-1_amd64.deb
```

# Quickly Build a Rich Demo

## Pre-requisites

**Important** You need to have the following already installed, before you can run the demo script described below:

- `docker` supports the database and Hasura containers
- `node` as we use npx in the demo script
- `npx` executes the Crudio CLI 

## How to Install npx
```
npm install -g npx
```

## Execute the initialisation Script from Github

Build a completely functional demo in just a few minutes with one command.

The command below creates a complete demonstration environment which includes, Postgres and Hasura GraphQL running in docker containers, with a fully populated Postgres database:

```
wget -O - https://raw.githubusercontent.com/qiksar/crudio/main/tools/init.sh | bash
```

This command:
- Fetches the initialisation script from Github and executes it
- The initialisation script uses a docker-compose file to build Postgres and Hasura docker containers
- Crudio then populates the database with awesome test data like organisations, departments, roles and users, IoT devices and their related data logs

**note - a MongoDB container is also built, but you would have to populate this by using the Crudio CLI with `-t m`, meaning target MongoDB)**

Once the script has executed, browse to [Hasura Console](http://localhost:6789) and select the `DATA` tab and click the buttons to track all tables and track all relationships.

There are example GraphQL queries below, and more on the [WIKI](https://github.com/Qiksar/crudio/wiki/05.-Example-GraphQL-Queries)

In less than 2 minutes you have created a database filled with rich demonstration data that could be used by your new prototype application.

By setting up tracking in Hasura, you have instantly gained a data management API to help you read and maintain the data.

You now have a prototype database to begin your next rapid prototyping project, and so far, you haven't had to write one line of code!

# Example GraphQL Queries - Hasura Console

Once the Crudio demo environment is running in Docker, browse to [Hasura Console](http://localhost:6789) (or whatever port you have used), to see the new database through Hasura GraphQL.

You can use the `API` tab, to execute the example GraphQL queries, and you will see that Crudio has built a complete database filled with great looking data:

**`IMPORTANT NOTE:`** When you run the initialisation script from Github, the database schema will be `crudio`, so the example queries below will work as is. 

But if you run the **unit tests**, the schema will be `crudio_test`, so you will have to prefix the tables like so... `crudio_test_Blogs` instead of `crudio_Blogs`

[More GraphQL Examples](https://github.com/Qiksar/crudio/wiki/Example-GraphQL-Queries)

## Get a list of blog posts with their related tags
```graphql
{
  crudio_Blogs {
    article
    BlogTags {
      Tag {
        name
      }
    }
  }
}
```

## Get a list of employees with their organisations and prove their email addresses match the organisation that they work for
```graphql
{
  crudio_Employees{
    firstname
    lastname
    email
    Organisation {
      name
    }
  }
}
```

# How to Remove the Crudio Demo environment

If you want to remove and clean-up the demo environment, follow these simple steps.

Run the following command in the same folder as the `docker-compose.yml` file, and the demonstration Postgres and Hasura containers, and their images, will be removed.

```
docker-compose down --rmi local
```

You can then delete all of the files that were fetched from the Github repository. You may need administrative rights to delete the `dbscripts` folder, which is created by Postgres.

# Using the CLI - Initialise a New Project

The CLI is very easy to use. It will create a Crudio project folder, fetch a demonstration data model and then build the docker containers.

A few utility scripts are included which are `go.sh` and `stop.sh` which will build and remove the Crudio containers.

```
npx @qiksar/crudio@latest -v -p crudio_test
cd crudio_test
chmod u+rwx *.sh
./go.sh
```

...and to stop and remove the docker containers...

```
./stop.sh
```

# Where to find the code and NPM package

Click here to find the Github project: [Github](https://github.com/Qiksar/crudio)

Click here to find the latest published package: [NPM](https://www.npmjs.com/package/@qiksar/crudio)

# More Information

When you are ready, and need more information about how to create your own data models and values, please explore the [Crudio WIKI](https://github.com/Qiksar/crudio/wiki/01.-Home)
