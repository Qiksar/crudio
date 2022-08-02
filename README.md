# Crudio

Using Crudio will enable you to rapidly build a database filled with data based upon a data model which you build with a simple JSON file. Your data model can leverage pre-defined entities, such as organisations and users, and specify details of how to connect entities (e.g. organisations, departments, roles and users). 

Why use it? You might be building a prototype app and want a database that is filled with sensible data, so you can spend more time coding your prototype UI and less time trying to create meaningful test data.

This page provides a quick introduction and how to get started. Further information is available on the [Crudio WIKI](https://github.com/Qiksar/crudio/wiki)

## More Information

When you are ready, and need more information about how to create your own data models and values, please explore the [Crudio WIKI](https://github.com/Qiksar/crudio/wiki)

## Where to find the code and NPM package

Click here to find the Github project: [Github](https://github.com/Qiksar/crudio)

Click here to find the latest published package: [NPM](https://www.npmjs.com/package/@qiksar/crudio)

# Build a Rich Demo From Github

There are two ways to explore crudio. But you need to be sure you have Docker running.

The first is to use the `wget` command shown below. If you have Docker running, this simple command does everything required to build a demo environment, which you can use to explore Crudio further.

The second is to use the CLI, which is explained step by step further down this document.

Also, if you want to remove the demo environment, instructions on how to do so are also provided lower down.

## Execute the initialisation Script from Github

These instructions will help you to build a completely functional demo, with quite a complex data model, so you can explore specific things that Crudio does in terms of creating and connecting database rows in relationships.

Ensure `docker` is installed, and then run this command to run a complete demonstration environment which includes, Postgres and Hasura GraphQL, where the database is populated with great looking data, and Hasura is ready, with two simple clicks (track tables and track relationships). There are even some example GraphQL queries below:

```
wget -O - https://raw.githubusercontent.com/qiksar/crudio/main/tools/init.sh | bash
```

- Fetches the initialisation script from Github and executes it
- The initialisation script uses a docker-compose file to build Postgres and Hasura docker containers
- Crudio then populates the database with awesome test data like organisations, departments, roles and users, IoT devices and their related data logs

Once the script has executed, browse to [Hasura Console](http://localhost:6789) and select the `DATA` tab and click the buttons to track all tables and then, track all relationships.

In less than 2 minutes you have created a database filled with rich demonstration data that could be used by your new prototype application.

By setting up tracking in Hasura, you have instantly gained a data management API to help you read and maintain the data.

You now have a prototype database to beging your next rapid prototyping project, and so far, you haven't had to write one line of code!

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
      tagByTag {
        name
      }
    }
  }
}
```

## Get a list of users with their organisations and prove their email addresses match the orgniation they work for
```graphql
{
  crudio_Users{
    firstname
    lastname
    email
    organisationByOrganisation {
      name
    }
  }
}
```


# How to Remove the Crudio Demo environment

If you want to remove and clean-up the demo environment, follow these simple steps.

Run the following command in the same folder as the `docker-compose.yml` file, and the demonstration Postgres and Hasura containers, and their images, will be removed.

```
docker-compose down --rmi all
```

You can then delete all of the files that were fetched from the Github repository. You may need administrative rights to delete the `dbscripts` folder, which is created by Postgres.

# Using the CLI - Initialise a New Project

The steps below describe how to perform each step of the Crudio project setup. However, there is also now a more convenient way, which is:

```
npx -y @qiksar/crudio@latest -v -p crudio_test
cd crudio_test
chmod u+rwx *.sh
./go.sh
```

...and to stop and remove the docker containers...

```
./stop.sh
```
