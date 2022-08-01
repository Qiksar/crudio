[HOME](../README.md)

# Crudio Syntax Introduction

Crudio provides a convenient and powerful way of describing a data model, that in turn describes how a database should be created and populated with test data.

For example, we can quickly describe an Organisation, Departments, and Roles, then place people in those roles and departments. 

But moreover, we can create many Organisations, and each will be automatically populated with Users spread across the multiple departmens, and every user will be assigned a role. 

Crudio creats test data very quickly, and requires no user input after configuration, therefore it is perfect for quickly generating awesome databases for prototype apps and services.

Read on to understand how to:

- describe a data model
- populate the data model with Entities
- ensure Entities have data values which look sensible, even though they are randomly created
- connect Entities using relationships

# Quick Reference - Extracts from an Example Data Model

Let's peek at the [base_generators.json](../repo/base_generators.json) file to understand a data model by beginning with the end in mind. 

Crudio can create a database filled with great looking data. How does it do that?

First of all we need to think about the types of data that we will store. Let's think about people as a datatype. In our model `Users` and `Clients` are a `Person`, so if we figure out how to create names for people, then we have a good start on creating users and clients.

## Introducing Generators

Generators are the feature used to create values that are assigned to the data fields of our entities, e.g. the names of people...

```json
{
	"$schema": "https://raw.githubusercontent.com/Qiksar/crudio/main/schema/crudio.json",
	"generators": [
		{
			"name": "title",
			"values": "Dr;Mr;Miss;Mrs;Ms;Sir;Lady;Prof;"
		},
		{
			"name": "firstname",
			"values": "Emma;Isabella;Emily;Madison;Ava;Olivia;Sophia;Abigail;Elizabeth;Chloe;Samantha;Addison;Natalie;Mia;Alexis;Alyssa;Hannah;"
		},
		{
			"name": "lastname",
			"values": "Smith;Johnson;Williams;Brown;Jones;Garcia;Miller;Davis;Rodriguez;Martinez;Hernandez;Lopez;Gonzalez;Wilson;Anderson;"
		},
		{
			"name": "fullname",
			"values": "[title] [firstname] [lastname]"
		}
}
```

In order to generate a person we need multiple data fields, such as a `title`, `firstname` and `lastname`.  We could also create a single `fullname` data fiel`d, which adds all of the other name parts together. This is exactly what the generators above enable us to do.  

##  Entities Use Generators

First of all, the term `Entities` relates to a concept, it's like saying that there are different types of things in the world.

Then, the related term `Entity` refers to a specific type of data, like a person, organisation, or customer. 

An Entity can either be a fully described piece of data, such as a `ThermometerReading`, which could have a temperature, date and time, or a `Person`, as seen in our example datamodel, which is `abstract`, meaning it is a building block used to create more specific entities. 

`Person` is `abstract`, so Crudio will not create such a table in the database. Instead, any other Entity that `inherits` `Person` will copy the fields from `Person`, and they will be populated by the same generators, so our data will be consistent.  

From: [base_generators.json](../repo/repo.json)
```
  "entities": {
  		"Person": {
			"abstract": true,
			"inherits": "Entity",
			"snippets": [
				"firstname",
				"lastname",
				"address",
				"email"
			],
			"fields": {
				"dob": {
					"type": "date",
					"name": "dob",
					"generator": "[dob]"
				},
				"height": {
					"type": "integer",
					"name": "height",
					"generator": "[height]"
				},
				"weight": {
					"type": "integer",
					"name": "weight",
					"generator": "[weight]"
				}
			}
		},
}
```

In the `Person` Entity we see it using `snippets`, more on that below. `Person` defines fields for date of birth and height , and those field definitions are using generators for `[dob]`, `[weight]` and `[height]`.

## Entities Use Snippets

Snippets are just predefined fields that can be used on any other Entity. So rather than `Person` defining what a firstname and lastname are, we use the `firstname` and `lastname` snippets. We prefer to keep the most common snippets in `base_snippets.json`.

Each snippet is a field definition which can be used on any other Entity, just as we saw in our `Person` example above.

```json
	"snippets": {
		"id": {
			"type": "uuid",
			"name": "id",
			"key": true,
			"generator": "[uuid]"
		},
		"firstname": {
			"type": "string",
			"name": "firstname",
			"generator": "[firstname]"
		},
		"lastname": {
			"type": "string",
			"name": "lastname",
			"generator": "[lastname]"
		},
		"address": {
			"type": "string",
			"name": "address",
			"generator": "[address]"
		},
		"email": {
			"type": "string",
			"name": "email",
			"generator": "[!firstname].[!lastname]@[server].[tld]"
		}
	}
```

So to complete the story of our data model...

`Person` is not actually going to be a table in our database. Rather, `User` will be a table in the database, and so will `Client`, and both of these Entities inherit (copy fields from) `Person`. 

Any fields that a `Person` has, the `User` and `Client` will also have. So, using `inherit` reuses parts of our data model, increasing our speed of development and consistency within our datamodel.

```
"User": {
  "count": 50,
  "inherits": "Person",
  "fields": {
    "email": {
      "unique": true,
      "generator": "[user_email]"
    }
  },
  "relationships": [
    {
      "type": "one",
      "to": "Organisation"
    },
    {
      "type": "one",
      "to": "OrganisationDepartment"
    },
    {
      "type": "one",
      "to": "OrganisationRole"
    }
  ]
},
```

## Example Complex Generator

We say that Crudio creates great looking data. Here is why...

In the above example of `User` we see the `email` field using the `[user_email]` generator. Most data generation tools might create a 'randomtext@email.com'.

If you read into the example repo, you will see this:

```
{
        "name": "user_email",
        "values": "[!~firstname].[!~lastname]@[!~Organisation.name].com"
},
```

The `User` will have its own randomly generated `firstname` and `lastname`, so the email address will use that exact name, and the organisation that the user is connected to, in order to create the perfect email address. So when we look at users and their emails, they will all make sense. It is so much easier to test and explain issues, or demonstrate your prototype to people, when the data just looks this great!

## Wrapping up the Quick Start
Do take time to read the additional documentation and example JSON files in the `repo` folder. These files are intended to help us automatically test Crudio, thoroughly, but are also intended to be a resource from which you can learn.

# Describing a Data Model - Key Aspects

## Background
Crudio started out as a way of creating random data objects which could be participants in surveys, and then random answers for those surveys. But the idea grew and we needed more and more ways to create data, which looked sensible.

Put another way... If you rely on people to create test data, a few things generally happen:

- They get bored, and you start to see text like this appearing in fields: "asjboijbfi aihioaghoiadhg lhfgshdfgdhf". Now if you get a bug in your system, and you try to debug it, and attempt to form an image of the data which is involved, it gets hard! Well, it just doesn't make sense that customer "saldlsfjj flsdhig" bought 10 "isgoihogihoh iudsfuhfiufdg" and then asked a question on the chat channel "sfsddsh1767221212".
- People tend not to create "enough" test data. They create a few rows of data, and then say the system works. But to load test your system, you sometimes want thousands of records.
- People don't test all of the possible scenarios, all of the time. When we first think of a way to break our system, we test very carefully. But months down the track, our attention moves to new problems, so we stop looking for regressions.
- People are likely to play by the rules. We tend to avoid breaking things, which is not a good habbit as a tester. So we tend not to try typing "Apple" in to date fields. So we never know if our user interface can handle such instances.

So the mission for Crudio started out with needing to create lots of data, that looked like people might have created it, but which included a good range of values, and lots and lots of rows where required.

## Entities
Entities can be thought of as data objects and rows of data in a database table.

Examples of an Entity could be Organisation, Employee, Department, IoT Device, etc.

Think of the data model as a world, and inside that world there are types of objects (Entity Definitions), and instances (Entity Instances). 

`Person` is an example of an Entity Definition, it is generic, a general description of a person, such as the name, age and address they live at.

`You` are a great example of an Entity Instance. You are a `Person`, and the data which is captured about you, is defined by the `Person` Entity Definition.

## Fields
Fields are the attributes of an Entity and contain data values. Just like you have an `age` attribute, which has a value of how old you are.

Other examples of attributes are `name`, `address`, and `height`.

## Generators

Generators are the means by which data is randomly created, and assigned to Entity Fields.

An example of a Generator is, `transport: "car;boat;plane;scooter;bus;train"`, which instructs Crudio to randomly select one of the possible values.

Also, `age: "10>87"`, instructs Crudio to create a random number within the specified range.


## Generators in More Detail

## Relationships

One of two relationship types are available to connect Entities to each other:

`one to many` - For example, an employee has an employer, therefore the employee record carries the ID field of the employer organisation.

and

`many to many` - For example, a blog tag and blog post, where the blog tag can be used on many blog posts. Therefore neither record can have the ID field of the other. 

Instead, we use a join table, where a row in such a table, carries the ID of the blog post, and the ID of a blog tag. Many rows are created in the join table, showing that blogs have many tags, and there can be many blog posts. 

`one to many` and `many to many` relationship types are very common, in database design. If these concepts are unfamiliar to you, it is worth taking some time to study a little bit more about database design. It will help you understand even more about why Crudio is so useful.  

## Scripts (Triggers)

Currently, the concept of a Script is only applied to what is internally referred to as a Trigger, in Crudio. Meaning, when a new instance of an Entity is created, Crudio looks for scripts that have to be run for that new Entity instance. This is how Organisations, Users, Roles and Departments are all perfectly interconnected when a new Organisation is created.

The term `Triggers` is used to describe actions which are executed when a specfic event occurs, currently only when a new Entity Instance is created.

When setting up complex data models, Crudio can handle special cases where entity relationships exist within a very contrained context. The best way to describe how Scripts work is to think of them like triggers, which are executed every time an Entity is created.

In the example data model provided in Crudio, we create Organisations, and when each Organisation is created, we create related Users, and some Users are placed in special roles, and all Users are placed in departments. 

An example is a CEO role, being assigned to a specific User. When Crudio creates the Organisation, only one of its Users is assigned the role of CEO. This demonstrates that Crudio can create very specific relationships between objects in accordance with our requirements.

### Dates
Here is a quick and easy way to create dates. 
TODO: We actually need to improve date creation though.

```json
		"day": "1>28",
		"month": "1>12",
		"year": "1970>2021",
```

The generators above create a random day, month and year ranging from the low number to the high number, i.e. "low>high"
This is great, but not awesome. We want to avoid creating a date for 31st of February, which is why our day generator is "1>28"

### Technical Data

See how the generators below all interconnect to create ranges of IP Addresses and MAX addresses.

It all a simple question of how do you create a little snippet of information, that looks sensible, and then use snippets to build more complex types of data.

```json
    "positive_byte": "1>255",
    "byte": "0>255",
    "hex_digit": "0;1;2;3;4;5;6;7;8;9;A;B;C;D;E;F;",
    "hex": "[hex_digit][hex_digit]",
    "mac_address": "[hex]:[hex]:[hex]:[hex]:[hex]:[hex]",
    "ipaddress": "[positive_byte].[byte].[byte].[byte]",
    "ipv6address": "[hex][hex]:[hex][hex]:[hex][hex]:[hex][hex]:[hex][hex]:[hex][hex]:[hex][hex]:[hex][hex]",
```

### Using Lookup and Cleanup

Consider the following generator
```
		"user_email": "[!~firstname].[!~lastname]@[!~Organisation.name].com",
```

Get the firstname field from the current record then make it lower case and remove any spaces `[!~firstname]`
Same for lastname `[!~lastname]`

Next, get the name field from the Organisation, which is connected to the current record, and remove spaces and make it lowercase `[!~Organisation.name]`

This is really powerful, because now when we generate users, their emails can look like they below to the organisation which they are connected to. 

All we have to do is use the `[user_email]` generator like this:

```json
    "User": {
        "count": 0,
        "inherits": "Person",
        "email": {
            "unique": true,
            "generator": "[user_email]"
        },
        "relationships": [
            {
                "type": "one",
                "to": "Organisation"
            },
            {
                "type": "one",
                "to": "OrganisationDepartment"
            },
            {
                "type": "one",
                "to": "OrganisationRole"
            }
        ]
    }
```

# Describing Entities in the Data model

Let's being with a simple example of a blog and blog tag, describing how a blog post can have several tags applied, involving what we would call a many to many relationship.

The `inherits` field tells Crudio to copy fields from a related object. You can only have one `inherits` per data object.

If you refer to the repo file, you can see how a `User` inherits all of the field of a `Person`. But, `Person` is also marked as `abstract` so a database table is not created for `Person`, instead, we just get a table for `Users` and `Clients`. 

`Clients` is also built by inheriting the `Person` date fields, so now you can see how a base record can ensure that two other records maintain a consistent set of fields.

`required` specifies that the data field must have a value.

`unique` specifies that the data field must have a value which is unique to that table.

Both `required` and `unique` will be implemented in the database as constraints.

```json
		"Tag": {
			"count": "[tag]",
			"inherits": "Entity",
			"name": {
				"unique": true,
				"required": true,
				"generator": "[tag]"
			}
		},
		"Blog": {
			"count": 20,
			"inherits": "Entity",
			"article": {
				"generator": "[article]"
			},
			"published_date": {
				"type": "timestamp",
				"name": "published_date",
				"generator": "[timestamp]"
			},
			"relationships": [
				{
					"type": "many",
					"to": "Tag",
					"name": "BlogTags",
					"count": 2
				},
				{
					"type": "one",
					"to": "User",
					"name": "Author"
				}
			]
		}
```

# Specify Required Number of Objects 

There is something very powerful going on in this example and it is here in these parts:

Let's start with the blog post, as it's easy to understand that we are requesting 20 blog posts should be created.

For `Blog`
```
"count": 20,
```

If we do not provide a `count` value, then by default Crudio will create 50 objects. 

However, please read more below about the `unique` constraint as it can conflict with `count` and cause errors, where it is not possible for Crudio to create sufficient unique values.

Continuing to the blog tag, we see a different way of stating how many objects are to be created. 

For `Tag`
```
"count": "[tag]",
```

We might think of `Tag` as a lookup type, i.e. it is a list of values having unique names. So if we create random tags from "a;b;c;d", we can only have a maximum of 4 tag values, as all the values are to be unique. Note that the name field of `tag` has the `unique` constraint applied. 

So by using the `[tag]` text as the value of count, we are telling Crudio to only allow as many blog tags, as there are values available from its generator, which might look like "cars;pets;food", hence three values is the maximum. Put simply, we just let Crudio figure out what to do. 

Please take a moment to truly understand the implications here. It means Crudio will do a lot of heavy lifting for you, i.e. create tables, where rows can have unique values for each row.

Use numbers where you want to have a large number of data objects created, and use the generator name, e.g. `"[tag]"` where you want to limit the number of objects based on the number of values available in the generator. 

# Describing Relationships

This snippet is taken from the above description of blogs and tags.

```json
    "relationships": [
        {
            "type": "many",
            "to": "Tag",
            "name": "BlogTags",
            "count": 2
        },
        {
            "type": "one",
            "to": "User",
            "name": "Author"
        }
```

Here we see relationships between a blog post, and a user which is the author of the blog post. There is only one author of a blog post, so we use a one to many relationship. Crudio takes care of everything here. Creating the blog, the authoer and the connection between the two.

Next, we see a blog poast can have many blog tags. In database designs, it's normal to create a join table, i.e. a table is created, and each row of the table has a reference to a blog post and a blog tag. This way we can have "Blog 1" connected to multiple tags, "tag1,tag2,tag3".

Crudio will again take care of everything. Our earlier descriptions express how we want blogs and tags to be created. Crudio will populate the many to many join table (BlogTags), ensuring that every blog post has tags, and that any tag only occurs once for each blog post.

Finally, if we omit the name of the relationship (i.e. the name of the join table) then Crudio will form it by joining the related table names together, e.g. BlogTag.

# Crudio Triggers 

Below is a simple description of an `Organisation` data object, which will lead to the creation of an `Organisations` data table in the database.

Normally, if we leave out the `count` field, by default Crudio will create 50 objects in the table. But in the following example, we will see it's not sufficient to simply create 50 random `Users`. Rather, we want randomly created users to be placed in very specific relationships with the `Organisation`.

Complex relationships between users, roles and departments are required, so we want to create the data a different way. 

So we specify a `count:20` which tells Crudio to automatically generate 20 `Organisation` entities.

```json		
"Organisation": {
    "count": 20,
    "inherits": "Entity",
    "fields":{
        "name": {
            "required": true,
            "unique": true,
            "generator": "[organisation_name]"
        },
        "address": {
            "generator": "[address]"
        },
        "email": {
            "generator": "contact@[!name].org.au"
        }
    }
```

In the datamodel, The `triggers` node contains instructions about what to do each time an `Organisation` is created...

```json
"triggers": [
    {
        "entity": "Organisation",
        "scripts": [
            "Users(0).OrganisationRole?name=CEO",
            "Users(0).OrganisationDepartment?name=Board",
            "Users(1).OrganisationRole?name=CFO",
            "Users(1).OrganisationDepartment?name=Board",
            "Users(2).OrganisationRole?name=COO",
            "Users(2).OrganisationDepartment?name=Board",
            "Users(3).OrganisationRole?name=Head of Sales",
            "Users(3).OrganisationDepartment?name=Sales",
            "Users(4).OrganisationRole?name=Head of HR",
            "Users(4).OrganisationDepartment?name=HR",
            "Users(5).OrganisationRole?name=Head of Marketing",
            "Users(5).OrganisationDepartment?name=Marketing",
            "Users(6-10).OrganisationRole?name=Staff",
            "Users(6-10).OrganisationDepartment?name=Sales",
            "Users(10-20).OrganisationRole?name=Staff",
            "Users(10-20).OrganisationDepartment?name=Marketing",
            "Users(21-30).OrganisationRole?name=Staff",
            "Users(21-30).OrganisationDepartment?name=HR",
            "Users(31-40).OrganisationRole?name=Staff",
            "Users(31-40).OrganisationDepartment?name=IT"
        ]
    }
]
```

Imagine a typical organisation structure, having one CEO, one CFO, one Head of HR, but many people working in HR, Marketing and IT, then lots of other people in the role of Staff being assigned to various departments.

In plain English, it is easy to say, "every organisation must have one CEO, one CFO, one head of department, for each department, which has many staff working within it".

This is achieved in our `triggers` as described above.

The triggers say:
- Everytime we create an `Organisation`
- Create a user and place it in the CEO role and in the Board department.
- Do the same for the CFO role, and heads of each department.

Now, everytime we create a head of department, we need to create their team...

```json
    "Users(0).OrganisationRole?name=CEO",
    "Users(0).OrganisationDepartment?name=Board",
```

In this example, we say that users 6 to 10 in the organisations list of users, will all be placed in the Sales department. Crudio creates the users, assigns their roles and departments, and connects them to the `Organisation`.