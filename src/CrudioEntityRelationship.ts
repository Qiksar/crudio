import { ISchemaRelationship } from "./CrudioTypes";

export default class CrudioEntityRelationship {
  constructor(private relationship: ISchemaRelationship) {
    if (!relationship.to)
      throw new Error(
        "Relationship schema must provide a 'to' field specifying the target entity"
      );

    if (!relationship.type)
      throw new Error(
        "Relationship schema must provide a 'type' field specifying the relationship cardinality of, one:one to many or many:many to many"
      );

    // The user can specify relationships in shorthand, where field values to default to the name of the target entity and its primary key
    if (!relationship.name) relationship.name = relationship.to;
    if (!relationship.from_column) relationship.from_column = relationship.to;
    if (!relationship.to_column) relationship.to_column = "id";
  }

  get FromEntity(): string {
    return this.relationship.from;
  }
  get FromColumn(): string {
    return this.relationship.from_column;
  }

  get ToEntity(): string {
    return this.relationship.to;
  }

  get ToColumn(): string {
    return this.relationship.to_column;
  }

  get RelationshipType(): string {
    return this.relationship.type;
  }

  get RelationshipName(): string {
    return this.relationship.name;
  }
}
