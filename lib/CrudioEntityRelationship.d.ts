import { ISchemaRelationship } from "./CrudioTypes";
export default class CrudioEntityRelationship {
    private relationship;
    constructor(relationship: ISchemaRelationship);
    get From(): string;
    get FromColumn(): string;
    get To(): string;
    get ToColumn(): string;
    get RelationshipType(): string;
    get RelationshipName(): string;
}
