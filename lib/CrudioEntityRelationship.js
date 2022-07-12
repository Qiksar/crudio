"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class CrudioEntityRelationship {
    relationship;
    constructor(relationship) {
        this.relationship = relationship;
        if (!relationship.to)
            throw new Error("Relationship schema must provide a 'to' field specifying the target entity");
        if (!relationship.type)
            throw new Error("Relationship schema must provide a 'type' field specifying the relationship cardinality of, one:one to many or many:many to many");
        // The user can specify relationships in shorthand, where field values to default to the name of the target entity and its primary key
        if (!relationship.name)
            relationship.name = relationship.to;
        if (!relationship.from_column)
            relationship.from_column = relationship.to;
        if (!relationship.to_column)
            relationship.to_column = "id";
    }
    get From() {
        return this.relationship.from;
    }
    get FromColumn() {
        return this.relationship.from_column;
    }
    get To() {
        return this.relationship.to;
    }
    get ToColumn() {
        return this.relationship.to_column;
    }
    get RelationshipType() {
        return this.relationship.type;
    }
    get RelationshipName() {
        return this.relationship.name;
    }
}
exports.default = CrudioEntityRelationship;
//# sourceMappingURL=CrudioEntityRelationship.js.map