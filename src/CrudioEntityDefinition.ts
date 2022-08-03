import { ICrudioFieldOptions } from "./CrudioTypes";

import CrudioField from "./CrudioField";
import CrudioEntityInstance from "./CrudioEntityInstance";
import CrudioRelationship from "./CrudioRelationship";
import CrudioUtils from "./CrudioUtils";
import CrudioDataModel from "./CrudioDataModel";

/**
 * Entity definition, the concrete form of an entity schema
 * These objects are important to track unique values created for fields on Entity Instances, to ensure values are globally unique
 * @date 7/18/2022 - 2:17:32 PM
 *
 * @export
 * @class CrudioEntityType
 * @typedef {CrudioEntityDefinition}
 */
export default class CrudioEntityDefinition {
	//#region Properties

	/**
	 * Name of the entity definition
	 * @date 7/18/2022 - 2:17:32 PM
	 *
	 * @public
	 * @type {string}
	 */
	private name: string;
	/**
	 * Get name of entity definition
	 * @date 7/27/2022 - 7:58:39 PM
	 *
	 * @public
	 * @readonly
	 * @type {string}
	 */
	public get Name(): string {
		return this.name;
	}
	/**
	 * Abstract indicates that the definition is used to inherit from, and doesn't require a table of it's own
	 * @date 7/18/2022 - 2:17:32 PM
	 *
	 * @public
	 * @type {boolean}
	 */
	private abstract: boolean;
	/**
	 * Indicates that the entity does not require a table in the database
	 * @date 7/27/2022 - 10:59:45 AM
	 *
	 * @public
	 * @readonly
	 * @type {boolean}
	 */
	public get IsAbstract(): boolean {
		return this.abstract;
	}
	/**
	 * Indicates that the table is a join table to connect multiple entities in a a many to many relationship
	 * @date 7/27/2022 - 10:59:45 AM
	 *
	 * @type {boolean}
	 */
	private many_to_many: boolean;
	/**
	 * Indicates that the table is a join table to connect multiple entities in a a many to many relationship
	 * @date 7/27/2022 - 10:59:45 AM
	 *
	 * @public
	 * @readonly
	 * @type {boolean}
	 */
	public get IsManyToManyJoin(): boolean {
		return this.many_to_many;
	}

	/**
	 * The relationship which gave rise to this table, if many to many join
	 * @date 7/27/2022 - 7:58:39 PM
	 *
	 * @private
	 * @type {CrudioRelationship}
	 */
	private source_relationship: CrudioRelationship;
	/**
	 * The relationship which gave rise to this table, if many to many join
	 * @date 7/27/2022 - 7:58:39 PM
	 *
	 * @public
	 * @type {CrudioRelationship}
	 */
	public get SourceRelationship(): CrudioRelationship {
		return this.source_relationship;
	}
	/**
	 * The relationship which gave rise to this table, if many to many join
	 * @date 7/27/2022 - 7:58:39 PM
	 *
	 * @public
	 * @type {*}
	 */
	public set SourceRelationship(r: CrudioRelationship) {
		this.source_relationship = r;
	}
	/**
	 * Name to use for the database table
	 * @date 7/18/2022 - 2:17:32 PM
	 *
	 * @public
	 * @type {string}
	 */
	private tableName: string;
	/**
	 * The name of the table
	 * @date 7/27/2022 - 7:58:39 PM
	 *
	 * @public
	 * @readonly
	 * @type {string}
	 */
	public get TableName(): string {
		return this.tableName;
	}

	/**
	 * List of field definitions
	 * @date 7/18/2022 - 2:17:32 PM
	 *
	 * @public
	 * @type {CrudioField[]}
	 */
	public fields: CrudioField[] = [];
	/**
	 * List of relationships between entities
	 * @date 7/18/2022 - 2:17:32 PM
	 *
	 * @public
	 * @type {CrudioRelationship[]}
	 */
	public relationships: CrudioRelationship[] = [];
	/**
	 * Editor to use
	 * @date 7/18/2022 - 2:17:32 PM
	 *
	 * @public
	 * @type {string}
	 */
	public editor: string = "none";
	/**
	 * Icon to use in UI
	 * @date 7/18/2022 - 2:17:32 PM
	 *
	 * @public
	 * @type {string}
	 */
	public icon: string = "none";
	/**
	 * Caption to use for UI field
	 * @date 7/18/2022 - 2:17:32 PM
	 *
	 * @public
	 * @type {string}
	 */
	public caption: string = "none";
	/**
	 * Maximum number of data rows to create
	 * @date 7/18/2022 - 2:17:32 PM
	 *
	 * @public
	 * @type {number}
	 */
	private max_row_count: number | string = CrudioDataModel.DefaultNumberOfRowsToGenerate;
	public set MaxRowCount(value: string | number) {
		this.max_row_count = value;
	}

	public get MaxRowCount(): string | number {
		return this.max_row_count as number;
	}

	/**
	 * Snippets imported to enable short-hand inclusion of pre-defined fields
	 * @date 7/18/2022 - 2:17:32 PM
	 *
	 * @public
	 * @type {?string[]}
	 */
	public snippets?: string[] = [];

	/**
	 * Track unique values assigned to all unique fields of this entity type
	 * @date 7/18/2022 - 2:17:32 PM
	 *
	 * @private
	 * @type {{}}
	 */
	private unique_keys_values = {};

	/**
	 * List of one to many relationship definitions
	 * @date 7/18/2022 - 2:17:32 PM
	 *
	 * @public
	 * @readonly
	 * @type {CrudioRelationship[]}
	 */
	public get OneToManyRelationships(): CrudioRelationship[] {
		return this.relationships.filter(r => r.RelationshipType.toLowerCase() === "one");
	}

	/**
	 * List of many to many relationship definitions
	 * @date 7/18/2022 - 2:17:32 PM
	 *
	 * @public
	 * @readonly
	 * @type {CrudioRelationship[]}
	 */
	public get ManyToManyRelationships(): CrudioRelationship[] {
		return this.relationships.filter(r => r.RelationshipType.toLowerCase() === "many");
	}
	//#endregion

	/**
	 * Creates an instance of CrudioEntityDefinition.
	 * @date 7/27/2022 - 10:59:45 AM
	 *
	 * @constructor
	 * @param {string} name
	 * @param {boolean} isAbstract
	 * @param {boolean} isManyToMany
	 * @param {(string | null)} [tableName=null]
	 */
	constructor(name: string, isAbstract: boolean, isManyToMany: boolean, tableName: string | null = null) {
		if (!tableName) tableName = CrudioUtils.Plural(name);

		this.name = name;
		this.tableName = tableName;
		this.abstract = isAbstract;
		this.many_to_many = isManyToMany;
	}

	/**
	 * List of fields which require unique values
	 * @date 7/18/2022 - 2:17:32 PM
	 *
	 * @public
	 * @readonly
	 * @type {CrudioField[]}
	 */
	public get UniqueFields(): CrudioField[] {
		const fields: CrudioField[] = [];

		this.fields.map(f => {
			if (f.fieldOptions.isUnique) {
				fields.push(f);
			}
		});

		return fields;
	}

	/**
	 * Initialise the cache for unique values
	 * @date 7/18/2022 - 2:17:32 PM
	 */
	InitialiseUniqueKeyValues() {
		this.UniqueFields.map(f => {
			this.unique_keys_values[f.fieldName] = [];
		});
	}

	/**
	 * Check if a value already exists in the unique value cache
	 * @date 7/18/2022 - 2:17:32 PM
	 *
	 * @param {string} field_name
	 * @param {string} value
	 * @returns {boolean}
	 */
	HasUniqueValue(field_name: string, value: string): boolean {
		return this.unique_keys_values[field_name].indexOf(value) >= 0;
	}

	/**
	 * Add a new value to the unique value cache
	 * @date 7/18/2022 - 2:17:32 PM
	 *
	 * @param {string} field_name
	 * @param {string} value
	 */
	AddUniqueValue(field_name: string, value: string) {
		this.unique_keys_values[field_name].push(value);
	}

	/**
	 * The primary key field definition
	 * @date 7/18/2022 - 2:17:32 PM
	 *
	 * @public
	 * @readonly
	 * @type {(CrudioField | null)}
	 */
	public get KeyField(): CrudioField | null {
		var fields: CrudioField[] = this.fields.filter(f => f.fieldOptions.isKey);
		return fields.length > 0 ? fields[0] : null;
	}

	/**
	 * Get a named field definition
	 * @date 7/18/2022 - 2:17:32 PM
	 *
	 * @public
	 * @param {string} fieldName
	 * @param {?boolean} [failIfNotFound]
	 * @returns {CrudioField}
	 */
	public GetField(fieldName: string, failIfNotFound?: boolean): CrudioField {
		var fields: CrudioField[] = this.fields.filter(f => f.fieldName === fieldName);

		if (fields.length > 1) {
			throw new Error("'" + fieldName + "' matches multiple fields on entity '" + this.Name + "'");
		}

		if (failIfNotFound && fields.length !== 1) {
			throw new Error("'" + fieldName + "' is not a valid data field on entity '" + this.Name + "'");
		}

		return fields[0];
	}

	/**
	 * Add a key field
	 * @date 7/18/2022 - 2:17:32 PM
	 *
	 * @param {string} fieldName
	 * @param {?string} [fieldType]
	 * @returns {CrudioEntityDefinition}
	 */
	AddKey(fieldName: string, fieldType?: string): CrudioEntityDefinition {
		if (this.KeyField !== null) {
			throw new Error("a key field is already defined on entity '" + this.Name + "'");
		}

		if (this.GetField(fieldName)) {
			throw new Error("'" + fieldName + "' is already defined on entity '" + this.Name + "'");
		}

		var keyField: CrudioField = new CrudioField(fieldName, fieldType || "uuid");
		keyField.fieldOptions.isKey = true;
		keyField.fieldOptions.readonly = true;

		this.fields.push(keyField);

		return this;
	}

	/**
	 * Add a string field
	 * @date 7/18/2022 - 2:17:32 PM
	 *
	 * @param {string} fieldName
	 * @param {?ICrudioFieldOptions} [options]
	 * @returns {CrudioEntityDefinition}
	 */
	AddString(fieldName: string, options?: ICrudioFieldOptions): CrudioEntityDefinition {
		this.AddField(fieldName, "string", options);

		return this;
	}

	/**
	 * Add a numeric field
	 * @date 7/18/2022 - 2:17:32 PM
	 *
	 * @param {string} fieldName
	 * @param {?ICrudioFieldOptions} [options]
	 * @returns {CrudioEntityDefinition}
	 */
	AddNumber(fieldName: string, options?: ICrudioFieldOptions): CrudioEntityDefinition {
		this.AddField(fieldName, "number", options);

		return this;
	}

	/**
	 * Add a boolean field
	 * @date 7/18/2022 - 2:17:32 PM
	 *
	 * @param {string} fieldName
	 * @param {?ICrudioFieldOptions} [options]
	 * @returns {CrudioEntityDefinition}
	 */
	AddBoolean(fieldName: string, options?: ICrudioFieldOptions): CrudioEntityDefinition {
		this.AddField(fieldName, "boolean", options);

		return this;
	}

	/**
	 * Add a date field
	 * @date 7/18/2022 - 2:17:32 PM
	 *
	 * @param {string} fieldName
	 * @param {?ICrudioFieldOptions} [options]
	 * @returns {CrudioEntityDefinition}
	 */
	AddDate(fieldName: string, options?: ICrudioFieldOptions): CrudioEntityDefinition {
		this.AddField(fieldName, "date", options);

		return this;
	}

	/**
	 * Create a new field
	 * @date 7/18/2022 - 2:17:32 PM
	 *
	 * @param {string} fieldName
	 * @param {string} fieldType
	 * @param {?string} [caption]
	 * @param {?ICrudioFieldOptions} [options]
	 * @returns {CrudioEntityDefinition}
	 */
	AddField(fieldName: string, fieldType: string, options?: ICrudioFieldOptions): CrudioEntityDefinition {
		var field = this.GetField(fieldName);

		if (!field) {
			// If the field does not exist, create it
			field = new CrudioField(fieldName, fieldType, options);
			this.fields.push(field);
		} else if (options) {
			// Else allow a type which inherits fields from a base, to override the values of the inherited field
			field.fieldOptions = options;
		}

		return this;
	}

	/**
	 * Add a relationship
	 * @date 7/18/2022 - 2:17:32 PM
	 *
	 * @param {CrudioRelationship} rel
	 * @returns {CrudioEntityDefinition}
	 */
	AddRelation(rel: CrudioRelationship): CrudioEntityDefinition {
		this.relationships.push(rel);

		return this;
	}

	/**
	 * Create a new instance from this entity definition
	 * @date 7/18/2022 - 2:17:32 PM
	 *
	 * @param {{}} values
	 * @returns {CrudioEntityInstance}
	 */
	CreateInstance(): CrudioEntityInstance {
		return new CrudioEntityInstance(this, {});
	}
}
