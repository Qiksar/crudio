[HOME](../README.md)

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
