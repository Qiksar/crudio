import { ISchemaRelationship } from "./CrudioTypes";

/**
 * An instance of a relationship between two entities
 * @date 7/18/2022 - 2:14:01 PM
 *
 * @export
 * @class CrudioEntityRelationship
 * @typedef {CrudioEntityRelationship}
 */
export default class CrudioEntityRelationship {
	/**
	 * Creates an instance of CrudioEntityRelationship.
	 * @date 7/18/2022 - 2:14:01 PM
	 *
	 * @constructor
	 * @param {ISchemaRelationship} relationship
	 */
	constructor(private relationship: ISchemaRelationship) {
		if (!relationship.to) throw new Error("Relationship schema must provide a 'to' field specifying the target entity");

		if (!relationship.type) throw new Error("Relationship schema must provide a 'type' field specifying the relationship cardinality of, one:one to many or many:many to many");

		relationship.type = relationship.type.toLowerCase().trim();

		// The user can specify relationships in shorthand, where field values to default to the name of the target entity and its primary key
		if (!relationship.name && relationship.type != "many") relationship.name = relationship.to;
		if (!relationship.from_column) relationship.from_column = relationship.to;
		if (!relationship.to_column) relationship.to_column = "id";
		if (!relationship.count) relationship.count = 0;
	}

	/**
	 * The referencing entity
	 * @date 7/18/2022 - 2:14:01 PM
	 *
	 * @readonly
	 * @type {string}
	 */
	get FromEntity(): string {
		return this.relationship.from;
	}
	/**
	 * The referencing column (field)
	 * @date 7/18/2022 - 2:14:01 PM
	 *
	 * @readonly
	 * @type {string}
	 */
	get FromColumn(): string {
		return this.relationship.from_column;
	}

	/**
	 * The referenced entity
	 * @date 7/18/2022 - 2:14:01 PM
	 *
	 * @readonly
	 * @type {string}
	 */
	get ToEntity(): string {
		return this.relationship.to;
	}

	/**
	 * Referenced column (field)
	 * @date 7/18/2022 - 2:14:01 PM
	 *
	 * @readonly
	 * @type {string}
	 */
	get ToColumn(): string {
		return this.relationship.to_column;
	}

	/**
	 * Type of relationship (one or many)
	 * @date 7/18/2022 - 2:14:01 PM
	 *
	 * @readonly
	 * @type {string}
	 */
	get RelationshipType(): string {
		return this.relationship.type;
	}

	/**
	 * Name of the relationship
	 * @date 7/18/2022 - 2:14:01 PM
	 *
	 * @readonly
	 * @type {string}
	 */
	get RelationshipName(): string {
		return this.relationship.name;
	}

	/**
	 * Number of connected entities to create, e.g. create two tags and attach them to a single blog article
	 * @date 7/18/2022 - 2:14:01 PM
	 *
	 * @readonly
	 * @type {number}
	 */
	get NumberOfSeededRelations():number {
		return this.relationship.count;
	}
}
