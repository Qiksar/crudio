# How Crudio works
It is worth understanding how Crudio actually works, as it may help you to achieve the greatest level of success in creating your test data.

It is reasonably straight forward to describe and understand, but you may need to think about the implications of how Crudio works, so you can avoid errors in the data generation process.

Just about everything in Crudio is random. But it just looks like it's not!

If we want to create data, we need a pretty straight forward process:

## High Level Process
- Describe some objects, like Organisation, User, Department, role
- Create rows of data for each object 
- Connect the objects together, where required
- Either keep the data in memory, where tests don't need a database, or save the data into a database, so then we can read, update and delete it using our apps and APIs.  

That is a pretty simple process to envision.

## Technical Process
So how Crudio follows the above process, is like this:

- Read a repo file, like `repo.json`, see if we need to include any other repo files, like `iot.json`
  Essentially we are building an in memory map of the data model, even if it is composed from many files.
  Using smaller files is a smart thing to do, as your repo snippets can be re-used to build many different, but consistent data models.
  So at this point we have all of our data objects described, along with the relationships needed to connect them, and finally, we know what data generators to use for each data field of the objects.

- Create data tables in memory
  Next we create data tables, where the rows in each table are instances of the data objects. So Organisations would have a list of Organisation data objects.
  
- Fill the data tables with data objects, where the field values for the objects are the names of the generators to use for each field
  Every table will then have data objects created, but the field values are not set, rather, each field is connected with the generator that will ultimately provide its value.
  So if you looked in these tables, you would see data objects with values like `name:"[firstname] [lastname]"`
  
- Connect the data objects together where the objects are in one to many relationships
  The next phase is quite technical, and to understand it, you'd have to submerge yourself in the code (you know you want to!).
  But, keeping things simple, the repo file clearly describes `one to many`, and `many to many` relationships, which connect our objects together (like user and role, and blog post to tags) 
  
- Process all of the generators to create actually values for the data fields
  Again, in detail this process is quite complicated. But now the objects are connected we can correctly run the generators to create all of the field values.
  If we didn't connect the objects first, when we tried to create the `[user_email]` value, we couldn't, because we wouldn't have a user connected to an organisation, which gives us a value for a sensible looking user email address.

- Connect the objects together in many to many relationships
  More techical stuff to look at the code for. Once we have generated all of the field values, this means we have created all of the unique id values for the data rows.
  We can now use the unique id of a Blog Post and unique ids of several Blog Tags, to populate a many to many join table, which connects each Blog Post to several Blog Tags.

We hope this gives you more insights into how Crudio works, so you can think about how to build your generators and connect them with entities to create great looking data.

# Crudio Syntax reference

## Describing Entities in the Data model

Below are two simple data objects of blog and blog tag, describing how a blog post can have several tags applied, which we would call a many to many relationship.

This a bit of a hack... If we left off the `count:25` field, then Crudio would by default, try to create 50 Tag objects with a random name taken from the `[tag]` generator.

But the tag generator only has 25 different values, and the name of tag has to be unique. So this is why we specify the `count` here, to help Crudio fill the tags table with tags having unique names. If we didn't lend a hand here, then Crudio would likely crash.

So just remember this approach. It means Crudio will do a lot of heavy lifting for you, i.e. create tables, where rows can have unique values for each row. 

The `inherits` field tells Crudio to copy fields from a related object. You can only have one `inherits` per data object.

If you refer to the repo file, you can see how a `User` inherits all of the field of a `Person`. But, `Person` is also marked as `abstract` so a database table is not created for `Person`, instead, we just get a table for `Users` and `Clients`. 

`Clients` is also built by inheriting the `Person` date fields, so now you can see how a base record can ensure that two other records maintain a consistent set of fields.

`required` specifies that the data field must have a value.

`unique` specifies that the data field must have a value which is unique to that table.

Both `required` and `unique` will be implemented in the database as constraints.

```json
		"Tag": {
			"count": 25,
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

## Describing Relationships

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

Crudio will again take care of everything. Our earlier descriptions describe how we want blogs and tags to be created. Crudio will populate the many to many join table, ensuring that every blog post has tags, and that any tag only occurs once for each blog post.

# Crudio Scripts

Below is a simple description of an `Organisation` data object, which will lead to the creation of an `Organisations` data table in the database.

Normally, if we leave out the `count` field, by default Crudio will create 50 objects in the table. 

But we have complex relationships between users, roles and departments, so we want to create the data a different way. So we specify `count:0` which tells Crudio not to automatically generate data, but rather, use our `scripts` which will create data and connect objects for us.

```json		
"Organisation": {
    "count": 0,
    "inherits": "Entity",
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

...lines removed...

    "scripts": ["repo/org_users.json"]

}
```

## Crudio Scripts - Creating Special Relationships Between Objects

The `sripts` node can specify multiple script files to import and use.

Imagine a typical organisation structure, having one CEO, one CFO, one Head of HR, but many people working in HR, Marketing and IT, then lots of other people in the role of Staff are assigned to departments, and these are not Head of Department, but more like Team Members.

In plain English, it is easy to say, "every organisation must have one CEO, one CFO, one head of department for each department", etc.

### Specifying Crudio Scripts

Refer to `org_users.json` for examples.

Crudio makes it really easy to build relationships between objects using a simple script notation.

The script below says:
- We are filling the Organisations table
- We are creating 4 data records
- Every Organisation data record gets connected to a bunch of users
- The users are automatically created
- Specific roles are then connected to a user, like CEO, CFO...
- Groups of users are created and connected to specific departments, like Board, HR, IT, etc.


```json
{
	"Organisations": {
		"count": 4,
		"scripts": [
			"Users(0).OrganisationRole?name=CEO",
			"Users(0).OrganisationDepartment?name=Board",
			"Users(3).OrganisationRole?name=Head of Sales",
			"Users(3).OrganisationDepartment?name=Sales",
			"Users(6-10).OrganisationRole?name=Staff",
			"Users(6-10).OrganisationDepartment?name=Sales",
		]
	}
}
```
The above is a snippet with lines deleted. Refer to `org_users.json` for complete file.

## How to Interpret Script Syntax

We specify `Organisations` first, as the primary table that we are thinking about, as we are building an organisation and its team.

We need to create a `User` next and assign it to the role of `CEO` with a department of `Board`:

```json
    "Users(0).OrganisationRole?name=CEO",
    "Users(0).OrganisationDepartment?name=Board",
```

We this approach over and over until we have populated all the key leadership roles.

Next, we need to create a lot of users, all with the `Staff` role, but placed in different departments, like Sales and Marketing teams:

Imagine we have built User 0, 1, 2, 3, 4...and  then connected them with specific roles and teams, we are gradually filling our list of users.

We continue to fill the list of users under the organisation, by using start - end notation, like (6-10).

So we continue creating user 6 to 10 and place them in the `Staff` role and `Sales` team.
Next, we create users 11 to 20 and place them in the `Staff` role and `Sales` team.

```json
    "Users(6-10).OrganisationRole?name=Staff",
    "Users(6-10).OrganisationDepartment?name=Sales",
    "Users(10-20).OrganisationRole?name=Staff",
    "Users(10-20).OrganisationDepartment?name=Marketing",
```

Basically, every time you ask for a record using the indexed notation `(record_number)` or `(start_record_number-end_record_number)`, Crudio will do its best to ensure that record exists.

OK, so now you can see how easy it is to build very specific scenarios, which commonly occur in data models. Lots of apps deal with organisations, people, teams, roles etc. We can use the pre-defined data models in Crudio, or start and build our own data model from the ground up. There are lots of useful examples in demonstration files in the `repo` folder.

# Generating Field values

## Background
Crudio started our as a way of creating random data objects which could be participants in surveys, and then random answers for those surveys. But the idea grew and we needed more and more ways to create data, which looked sensible.

Put another way... If you rely on people to create test data, a few things generally happen:

- They get bored, and you start to see text like this appearing in fields: "asjboijbfi aihioaghoiadhg lhfgshdfgdhf". Now if you get a bug in your system, and you try to debug it, and attempt to form an image of the data which is involved, it gets hard! Well, it just doesn't make sense that customer "saldlsfjj flsdhig" bought 10 "isgoihogihoh iudsfuhfiufdg" and then asked a question on the chat channel "sfsddsh1767221212".
- People tend not to create "enough" test data. They create a few rows of data, and then say the system works. But to load test your system, you sometimes want thousands of records.
- People don't test all of the possible scenarios, all of the time. When we first think of a way to break our system, we test very carefully. But months down the track, our attention moves to new problems, so we stop looking for regressions.
- People are likely to play by the rules. We tend to avoid breaking things, which is not a good habbit as a tester. So we tend not to try typing "Apple" in to date fields. So we never know if our user interface can handle such instances.

So the mission for Crudio started out with needing to create lots of data, that looked like people might have created it, but which included a good range of values, and lots and lots of rows where required.

## Getting started

Take a look in the `repo` folder at `base_generators.json`.

it doesn't need much explaination:

```json
    "title": "Dr;Mr;Miss;Mrs;Ms;Sir;Lady;Prof;",
    "firstname": "Emma;Isabella;Emily;Madison;Ava;Olivia;Sophia;Abigail;Elizabeth;Chloe;Samantha;Addison;",
    "lastname": "Smith;Johnson;Williams;Brown;Jones;",
    "fullname": "[title] [firstname] [lastname]",
```

This is just a simple way of sayin, whenver we need the title, firstname and lastname of a person, we can selet from these lists of words.

We can easily create a fullname, by taking a random word from the other generators and joining them all together in a string.

## Generating Different Types of Data

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