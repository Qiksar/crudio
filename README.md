
# Welcome to Crudio!

<table>
  <tr>
    <td> <img src="https://user-images.githubusercontent.com/45703746/182263014-7a817506-4c50-4418-8d77-06ccb61a6438.png"></td>
    <td> <h1>Crudio</h1> Prototype Faster</td>
    <td> 
    <ul>
    <li> <b>F</b>lexible data generation for <b>prototypes</b> </li>
    <li> <b>A</b>utomatically create data for <b>sales demonstrations</b> </li>
    <li> <b>S</b>tupendous in situations where <b>you can't have copies of production data</b> </li>
    <li> <b>T</b>est continuously with <b>data that changes constantly</b></li>
    </ul>
    </td>
   </tr> 
</table>

## What does it do?

**Crudio automatically creates test data. In fact, it does virtually everything it takes to get a data platform up and running, so you can quickly prototype, build or demonstrate your system, product or service.**

Crudio is perfect for:
- protyping, system testing, continuous integration and deployment and even sales demonstrations.
- powerful in situations where you don't have any data, like, you're a new startup, with no customers, no data, so how are you going to get started?
- liberating, when you can't get your hands on production data, because it's sensitive and risky, but you need test data that looks real.

## Tell me more...
People are terrible at creating data for testing and demonstration purposes. They copy/paste Lorem Ipsum ZZzzzzz and type in names and address that look like, ahsjsdflkjsdflk lfskljsdflkjsdf. How are you supposed to test accurately? How are you supposed to sell your vision, when your demo data looks like $ h ! t?

## Show me

Cool! In two minutes, you will have a PostgreSQL database filled with demo data, and fully integrated with Hasura for a powerful GraphQL API and all you need to do is copy/paste this command in you linux shell (WSL2 for Windows). You also need NPX and Docker installed (see below for more help if you need it):

```
wget -O - https://raw.githubusercontent.com/qiksar/crudio/main/tools/init.sh | bash
```

What it does:

- Downloads and executes a shell script from this Github repo
- Uses Docker to build the self-hosted environment with postgres, Hasura GraphQL and even mongodb to show that Crudio supports that too
- Uses NPX to execute Crudio on the command line to populate the database
- [Presents the GraphQL console](http://localhost:6789) so you can immediately explore the data
- [Find example graphql queries here](https://github.com/Qiksar/crudio/wiki/05.-Example-GraphQL-Queries)


## How it works

Crudio uses a rich JSON based data model to describe the data types and data values that you require for your scenario. Your data model can leverage (include) pre-defined entities, such as organisations and employees, departments and roles, and specify details of how to connect entities together, i.e. put some employees in leadership roles and ensure everyone is placed in a department.

By using a set of pre-defined rules (generators) Crudio can understand how to create values for the data fields in your data model. Once you've described the data types, like an employee and a department, you can describe the relationship between an employee and a role (either one to many, or many to many).

[Here is a fully defined data model](https://github.com/Qiksar/crudio/blob/main/datamodel/datamodel.json).

The data model describes an organisation with employees that service the community, which is divided into cohorts. There are all kinds of useful scenarios of employees, teams, people that write blogs with tags for the blogs. There are even IoT devices with data feeds for temperature, humidity and windspeed, and the data looks like it's been streamed for years.

## What makes Crudio so good?

Fake data generators tend to create random crap! Literally. Such data is useless when you're trying to sell your vision, and explain a concept to your team mates. 

With Crudio, when you create an employee, that automatically created person has an email that matches the name of their employer. Like wow, the data makes sense. That means you can tell meaningul stories which are supported by the data that appears in your prototypes or sales demonstrations.

## Visit the WIKI

Visit the WIKI for more information is available on the [Crudio WIKI](https://github.com/Qiksar/crudio/wiki/01.-Home)

# HOT NEWS! MongoDb & In-memory support for testing

Crudio now populates a MongoDB database which is hosted in memory, which this is perfect for CI/CD, where you don't want to consume cloud services, or build local databases for test cycles. 

The wonderful fact is that with the in-memory version of MongoDb you can run Crudio and have a database for testing, and you don't even have to run Docker images! This is very new, and we are clearly very excited about this.

MongoDB is also run in a Docker container by the demo script. So checkout our test code for tips on how to use MongoDB, Mongoose and the in-memory database. You may be shocked how simple it is!

## Using WSL (Ubuntu 22.04 LTS)

An issue exists whereby the in-memory MongoDB component may fail to launch. If you encounter an error whereby the component complains that `libssl1.1` is not installed, simply execute this in the environment that you are developing / testing in.

```
wget http://debian.mirror.ac.za/debian/pool/main/o/openssl/libssl1.1_1.1.1o-1_amd64.deb
sudo dpkg -i libssl1.1_1.1.1o-1_amd64.deb
```
## Pre-requisites

In order install and run Crudio you need three simple pre-requisites. Node, NPX and Docker.

**Important** You need to have the following already installed, before you can run the demo script:

- `docker` supports the database and Hasura containers
- `node` as we use npx in the demo script
- `npx` executes the Crudio CLI 

### How to Install npx
```
npm install -g npx
```
# Example GraphQL Queries - Hasura Console

Once the Crudio demo environment is running in Docker, browse to [Hasura Console](http://localhost:6789) (or whatever port you have used), to see the new database through Hasura GraphQL.

You can use the `API` tab, to execute the example GraphQL queries, and you will see that Crudio has built a complete database filled with great looking data:

**`IMPORTANT NOTE:`** When you run the initialisation script from Github, the database schema will be `crudio`, so the example queries below will work as is. 

But if you run the **unit tests**, the schema will be `crudio_test`, so you will have to prefix the tables like so... `crudio_test_Blogs` instead of `crudio_Blogs`

[More GraphQL Examples](https://github.com/Qiksar/crudio/wiki/05.-Example-GraphQL-Queries)

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
