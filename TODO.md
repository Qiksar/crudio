# Relationships
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