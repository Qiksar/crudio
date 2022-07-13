# Relationships
- many to many relationships
  Built many to many join table and foreign keys
  TODO have to populate join tables with data

- don't add column on entity


# Entity definition

Compress entity definitin syntax

    "Tags": {
      "inherits": "Entity",
      "name": {
        "type": "string",
        "name": "name",
        "generator": "[tag]"
      }


Here it is implicit that name is a string using the `tag` generator.

    "Tags": {
      "inherits": "Entity",
      "name": "[tag]"
      }