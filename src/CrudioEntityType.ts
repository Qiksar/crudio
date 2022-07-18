import { ICrudioFieldOptions } from "./CrudioTypes";

import CrudioField from "./CrudioField";
import CrudioEntityInstance from "./CrudioEntityInstance";
import CrudioEntityRelationship from "./CrudioEntityRelationship";
import CrudioUtils from "./CrudioUtils";
import CrudioRepository from "./CrudioRepository";

/**
 * Entity definition, the concrete form of an entity schema
 * These objects are important to track unique values created for fields on Entity Instances, to ensure values are globally unique
 * @date 7/18/2022 - 2:17:32 PM
 *
 * @export
 * @class CrudioEntityType
 * @typedef {CrudioEntityType}
 */
export default class CrudioEntityType {
	/**
	 * Name of the entity definition
	 * @date 7/18/2022 - 2:17:32 PM
	 *
	 * @public
	 * @type {string}
	 */
	public name: string;
	/**
	 * Abstract indicates that the definition is used to inherit from, and doesn't require a table of it's own
	 * @date 7/18/2022 - 2:17:32 PM
	 *
	 * @public
	 * @type {boolean}
	 */
	public abstract: boolean;
	/**
	 * Alias for the entity table name
	 * @date 7/18/2022 - 2:17:32 PM
	 *
	 * @public
	 * @type {string}
	 */
	public tableAlias: string = "";
	/**
	 * Name to use for the database table
	 * @date 7/18/2022 - 2:17:32 PM
	 *
	 * @public
	 * @type {string}
	 */
	public tableName: string;
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
	 * @type {CrudioEntityRelationship[]}
	 */
	public relationships: CrudioEntityRelationship[] = [];
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
	public max_row_count: number = CrudioRepository.DefaultNumberOfRowsToGenerate;
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
	 * @type {CrudioEntityRelationship[]}
	 */
	public get OneToManyRelationships(): CrudioEntityRelationship[] {
		return this.relationships.filter(r => r.RelationshipType.toLowerCase() === "one");
	}

	/**
	 * List of many to many relationship definitions
	 * @date 7/18/2022 - 2:17:32 PM
	 *
	 * @public
	 * @readonly
	 * @type {CrudioEntityRelationship[]}
	 */
	public get ManyToManyRelationships(): CrudioEntityRelationship[] {
		return this.relationships.filter(r => r.RelationshipType.toLowerCase() === "many");
	}

	/**
	 * Creates an instance of CrudioEntityType.
	 * @date 7/18/2022 - 2:17:32 PM
	 *
	 * @constructor
	 * @param {string} name
	 * @param {(string | null)} [table=null]
	 */
	constructor(name: string, table: string | null = null) {
		if (!table) table = CrudioUtils.Plural(name);

		this.name = name;
		this.tableName = table;
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
	 * Assign a value for the table alias name
	 * @date 7/18/2022 - 2:17:32 PM
	 *
	 * @public
	 * @param {string} alias
	 * @returns {CrudioEntityType}
	 */
	public SetAlias(alias: string): CrudioEntityType {
		this.tableAlias = alias ?? this.name;
		return this;
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
			throw new Error("'" + fieldName + "' matches multiple fields on entity '" + this.name + "'");
		}

		if (failIfNotFound && fields.length !== 1) {
			throw new Error("'" + fieldName + "' is not a valid data field on entity '" + this.name + "'");
		}

		return fields[0];
	}

	/**
	 * Add a key field
	 * @date 7/18/2022 - 2:17:32 PM
	 *
	 * @param {string} fieldName
	 * @param {?string} [fieldType]
	 * @returns {CrudioEntityType}
	 */
	AddKey(fieldName: string, fieldType?: string): CrudioEntityType {
		if (this.KeyField !== null) {
			throw new Error("a key field is already defined on entity '" + this.name + "'");
		}

		if (this.GetField(fieldName)) {
			throw new Error("'" + fieldName + "' is already defined on entity '" + this.name + "'");
		}

		var keyField: CrudioField = new CrudioField(fieldName, fieldType || "number", fieldName);
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
	 * @param {?string} [caption]
	 * @param {?ICrudioFieldOptions} [options]
	 * @returns {CrudioEntityType}
	 */
	AddString(fieldName: string, caption?: string, options?: ICrudioFieldOptions): CrudioEntityType {
		this.AddField(fieldName, "string", caption, options);

		return this;
	}

	/**
	 * Add a numeric field
	 * @date 7/18/2022 - 2:17:32 PM
	 *
	 * @param {string} fieldName
	 * @param {?string} [caption]
	 * @param {?ICrudioFieldOptions} [options]
	 * @returns {CrudioEntityType}
	 */
	AddNumber(fieldName: string, caption?: string, options?: ICrudioFieldOptions): CrudioEntityType {
		this.AddField(fieldName, "number", caption, options);

		return this;
	}

	/**
	 * Add a boolean field
	 * @date 7/18/2022 - 2:17:32 PM
	 *
	 * @param {string} fieldName
	 * @param {?string} [caption]
	 * @param {?ICrudioFieldOptions} [options]
	 * @returns {CrudioEntityType}
	 */
	AddBoolean(fieldName: string, caption?: string, options?: ICrudioFieldOptions): CrudioEntityType {
		this.AddField(fieldName, "boolean", caption, options);

		return this;
	}

	/**
	 * Add a date field
	 * @date 7/18/2022 - 2:17:32 PM
	 *
	 * @param {string} fieldName
	 * @param {?string} [caption]
	 * @param {?ICrudioFieldOptions} [options]
	 * @returns {CrudioEntityType}
	 */
	AddDate(fieldName: string, caption?: string, options?: ICrudioFieldOptions): CrudioEntityType {
		this.AddField(fieldName, "date", caption, options);

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
	 * @returns {CrudioEntityType}
	 */
	AddField(fieldName: string, fieldType: string, caption?: string, options?: ICrudioFieldOptions): CrudioEntityType {
		var field = this.GetField(fieldName);

		if (!field) {
			// If the field does not exist, create it
			field = new CrudioField(fieldName, fieldType, caption, options);
			this.fields.push(field);
		} else {
			// Else allow a type which inherits fields from a base, to override the values of the inherited field
			if (caption) field.caption = caption;
			if (options) field.fieldOptions = options;
		}

		return this;
	}


	/**
	 * Add a relationship
	 * @date 7/18/2022 - 2:17:32 PM
	 *
	 * @param {CrudioEntityRelationship} rel
	 * @returns {CrudioEntityType}
	 */
	AddRelation(rel: CrudioEntityRelationship): CrudioEntityType {
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
	CreateInstance(values: {}): CrudioEntityInstance {
		return new CrudioEntityInstance(this, values);
	}
}
