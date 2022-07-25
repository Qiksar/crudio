import { stringify, parse } from "flatted";
import * as fs from "fs";
import { randomUUID } from "crypto";
import { DateTime } from "luxon";

import { ICrudioEntityDefinition, ICrudioFieldOptions, ICrudioSchemaDefinition, ISchemaRelationship } from "./CrudioTypes";
import CrudioEntityType from "./CrudioEntityType";
import CrudioEntityInstance from "./CrudioEntityInstance";
import CrudioField from "./CrudioField";
import CrudioEntityRelationship from "./CrudioEntityRelationship";
import CrudioTable from "./CrudioTable";
import CrudioUtils from "./CrudioUtils";

/**
 * Concrete implementation of the data model description and state
 * @date 7/18/2022 - 3:39:38 PM
 *
 * @export
 * @class CrudioRepository
 * @typedef {CrudioRepository}
 */
export default class CrudioRepository {
	//#region Properties

	/**
	 * maintain an internal list of files loaded to prevent circular references
	 * @date 7/25/2022 - 9:41:03 AM
	 *
	 * @private
	 * @type {string[]}
	 */
	private filestack: string[] = [];

	/**
	 * JSON keys which should be ignored as they are not entity fields
	 * @date 7/18/2022 - 3:39:38 PM
	 *
	 * @private
	 * @type {{}}
	 */
	private ignoreFields = ["inherits", "abstract", "relationships", "count", "seed_by"];
	/**
	 * Default number of rows to create in datatables
	 * @date 7/18/2022 - 3:39:38 PM
	 *
	 * @public
	 * @type {number}
	 */
	public static DefaultNumberOfRowsToGenerate = 50;

	/**
	 * Grouped data generator definitions, e.g. people: {firstname:"Bob;Jen", lastname:"Smith;jones"}...
	 * @date 7/18/2022 - 3:39:38 PM
	 *
	 * @public
	 * @type {Record<string, unknown>}
	 */
	public generators: Record<string, unknown> = {};
	/**
	 * List of in memory datatables which hold the entity instances
	 * @date 7/18/2022 - 3:39:38 PM
	 *
	 * @public
	 * @type {CrudioTable[]}
	 */
	public tables: CrudioTable[] = [];
	/**
	 * List of entity type definitions (entity schema)
	 * @date 7/18/2022 - 3:39:38 PM
	 *
	 * @public
	 * @type {CrudioEntityType[]}
	 */
	public entities: CrudioEntityType[] = [];
	/**
	 * List of relationships
	 * @date 7/18/2022 - 3:39:38 PM
	 *
	 * @public
	 * @type {CrudioEntityRelationship[]}
	 */
	public relationships: CrudioEntityRelationship[] = [];
	/**
	 * Database schema in which tables are created
	 * @date 7/18/2022 - 3:39:38 PM
	 *
	 * @public
	 * @type {string}
	 */
	public target_db_schema: string = null;

	/**
	 * Explicit data setup instructions
	 * @date 7/18/2022 - 3:39:38 PM
	 *
	 * @public
	 * @type {string[]}
	 */
	private scripts: string[];
	//#endregion

	/**
	 * Creates an instance of CrudioRepository.
	 * @date 7/18/2022 - 3:39:38 PM
	 *
	 * @constructor
	 * @param {ICrudioSchemaDefinition} repo
	 */
	constructor(repo: ICrudioSchemaDefinition, include: string = null) {
		this.PreProcessRepositoryDefinition(repo, include);
		this.ExpandAllSnippets(repo);
		this.LoadEntityDefinitions(repo);
		this.CreateInMemoryDataTables(this.entities);
		this.FillDataTables();
		this.RunScripts();
	}

	//#region Initialise repository, entities and relationships

	/**
	 * When deserialising, ensure the correct prototypes are applied and initialise other default data values
	 * @date 7/18/2022 - 3:39:38 PM
	 *
	 * @private
	 * @static
	 * @param {CrudioRepository} schema
	 */
	private static SetPrototypes(schema: CrudioRepository) {
		if (!schema.entities) schema.entities = [];
		if (!schema.generators) schema.generators = {};
		if (!schema.relationships) schema.relationships = [];

		Object.setPrototypeOf(schema, CrudioRepository.prototype);

		schema.entities.map((e: any) => {
			Object.setPrototypeOf(e, CrudioEntityType.prototype);

			e.fields.map((f: any) => {
				Object.setPrototypeOf(f, CrudioField.prototype);
			});
		});

		schema.tables.map((t: any) => {
			Object.setPrototypeOf(t, CrudioTable.prototype);
			t.rows.map((r: any) => Object.setPrototypeOf(r, CrudioEntityInstance.prototype));
		});
	}

	/**
	 * Process includes and ensure default values are in place before connecting the concrete data model to aspects of the schema definition
	 * @date 7/18/2022 - 3:39:38 PM
	 *
	 * @private
	 * @param {ICrudioSchemaDefinition} repo
	 */
	private PreProcessRepositoryDefinition(repo: ICrudioSchemaDefinition, include: string = null): void {
		if (!repo.generators) {
			repo.generators = {};
		}

		if (!repo.snippets) {
			repo.snippets = {};
		}

		if (!repo.include) {
			repo.include = [];
		}

		if (include) {
			repo.include = [include, ...repo.include];
		}

		repo.include.map((filename: any) => {
			this.Merge(filename, repo);
		});

		this.generators = repo.generators;
		this.scripts = repo.scripts ?? [];
	}

	// Merge an external repository into the current one
	// This works recursively so the repository being merged can also include (merge) other repositories
	/**
	 * Merge a specified JSON file into the nomintated schema definition
	 * @date 7/18/2022 - 3:39:38 PM
	 *
	 * @private
	 * @param {string} filename
	 * @param {ICrudioSchemaDefinition} repo
	 */
	private Merge(filename: string, repo: ICrudioSchemaDefinition) {
		const input: ICrudioSchemaDefinition = CrudioRepository.LoadJson(filename, this.filestack);

		if (input.include) this.PreProcessRepositoryDefinition(input);

		if (input.generators) {
			repo.generators = { ...repo.generators, ...input.generators };
		}

		if (input.snippets) {
			repo.snippets = { ...repo.snippets, ...input.snippets };
		}

		if (input.entities) {
			repo.entities = { ...input.entities, ...repo.entities };
		}
	}

	// Create the basic entity structures
	/**
	 * Load entity definitions from the schema
	 * @date 7/18/2022 - 3:39:38 PM
	 *
	 * @private
	 * @param {ICrudioSchemaDefinition} repo
	 */
	private LoadEntityDefinitions(repo: ICrudioSchemaDefinition): void {
		this.entities = [];
		var entity_names: string[] = Object.keys(repo.entities);

		for (var index: number = 0; index < entity_names.length; index++) {
			var entityname: string = entity_names[index];
			var entitySchema: any = repo.entities[entityname];
			this.CreateEntityDefinition(entitySchema, entityname);
		}
	}

	/**
	 * Expand snippets in the schema, to ensure inheritence works between generic and concrete entity types, e.g. person and user
	 * @date 7/18/2022 - 3:39:38 PM
	 *
	 * @private
	 * @param {ICrudioSchemaDefinition} repo
	 */
	private ExpandAllSnippets(repo: ICrudioSchemaDefinition) {
		Object.keys(repo.entities).map(e => {
			const entity = repo.entities[e];
			const entity_snippets = entity.snippets as string[];

			if (entity_snippets) {
				entity_snippets.map(s => {
					entity[s] = { ...repo.snippets[s] };
				});

				// snippets can be deleted from the definition once they have been expanded
				delete entity["snippets"];
			}
		});
	}

	/**
	 * Create a concrete entity definition based on the schema
	 * @date 7/18/2022 - 3:39:38 PM
	 *
	 * @private
	 * @param {ICrudioEntityDefinition} entityDefinition
	 * @param {string} entityname
	 */
	private CreateEntityDefinition(entityDefinition: ICrudioEntityDefinition, entityname: string) {
		var entityType: CrudioEntityType = this.CreateEntityType(entityname);
		entityType.max_row_count = entityDefinition.count ?? CrudioRepository.DefaultNumberOfRowsToGenerate;

		if (entityDefinition.abstract) entityType.abstract = true;

		// copy inherited fields from the base entity
		if (entityDefinition.inherits) {
			this.InheritBaseFields(entityDefinition.inherits, entityType);
		}

		var fKeys: string[] = Object.keys(entityDefinition).filter(f => !this.ignoreFields.includes(f));

		for (var findex: number = 0; findex < fKeys.length; findex++) {
			var fieldname: string = fKeys[findex];
			var fieldSchema: any = entityDefinition[fieldname];

			const fieldOptions: ICrudioFieldOptions = {
				isKey: fieldSchema.key,
				isUnique: fieldSchema.unique,
				isRequired: fieldSchema.required ?? false,
				generator: fieldSchema.generator,
				sensitiveData: fieldSchema.sensitiveData === undefined ? false : fieldSchema.sensitiveData,
				defaultValue: fieldSchema.default === undefined ? null : fieldSchema.default,
			};

			entityType.AddField(fieldname, fieldSchema.type ?? "string", fieldname, fieldOptions);
		}

		if (entityDefinition.relationships) {
			entityDefinition.relationships.map((r: ISchemaRelationship) => {
				const new_rel = new CrudioEntityRelationship({
					from: entityType.name,
					...r,
				});

				entityType.relationships.push(new_rel);

				// cache relationships globally
				this.relationships.push(new_rel);
			});
		}

		entityType.InitialiseUniqueKeyValues();
	}

	/**
	 * Copy fields from a base entity to a target entity
	 * @date 7/18/2022 - 3:39:38 PM
	 *
	 * @private
	 * @param {string} baseEntityName
	 * @param {CrudioEntityType} targetEntity
	 */
	private InheritBaseFields(baseEntityName: string, targetEntity: CrudioEntityType): void {
		var baseEntity: CrudioEntityType = this.GetEntityDefinition(baseEntityName)!;

		baseEntity.fields.map((f: CrudioField) => {
			if (f.fieldName.toLocaleLowerCase() != "abstract") {
				if (targetEntity.GetField(f.fieldName)) {
					throw new Error(`InheritFields - child:'${targetEntity.name}' base:'${baseEntity.name}' : can not have fields in child which are already specifified in base. field:'${f.fieldName}'`);
				}

				// Duplicate the field from the base type onto the child entity
				targetEntity.fields.push(new CrudioField(f.fieldName, f.fieldType, f.caption, f.fieldOptions));
			}
		});
	}

	/**
	 * Get the definition of an entity by name
	 * @date 7/18/2022 - 3:39:38 PM
	 *
	 * @public
	 * @param {string} entityName
	 * @param {boolean} [failIfNotFound=true]
	 * @returns {(CrudioEntityType | null)}
	 */
	public GetEntityDefinition(entityName: string, failIfNotFound: boolean = true): CrudioEntityType | null {
		var matches: CrudioEntityType[] = this.entities.filter((e: CrudioEntityType) => e.name === entityName);

		if (failIfNotFound && matches.length === 0) {
			throw new Error(`Entity '${entityName}' not found`);
		}

		if (matches.length === 0) {
			return null;
		}

		return matches[0];
	}

	/**
	 * Get the entity definition associated with the table name
	 * @date 7/18/2022 - 3:39:38 PM
	 *
	 * @public
	 * @param {string} tableName
	 * @param {boolean} [failIfNotFound=true]
	 * @returns {(CrudioEntityType | null)}
	 */
	public GetEntityDefinitionFromTableName(tableName: string, failIfNotFound: boolean = true): CrudioEntityType | null {
		const entityName = this.GetTable(tableName).entity;
		return this.GetEntityDefinition(entityName);
	}

	/**
	 * Get a datatable using the name of its related entity
	 * @date 7/18/2022 - 3:39:38 PM
	 *
	 * @public
	 * @param {string} name
	 * @returns {CrudioTable}
	 */
	public GetTableForEntityName(name: string): CrudioTable {
		return this.tables.filter(t => t.entity === name)[0];
	}

	/**
	 * Create an entity type based on its definition in the repo
	 * @date 7/18/2022 - 3:39:38 PM
	 *
	 * @private
	 * @param {string} name
	 * @returns {CrudioEntityType}
	 */
	private CreateEntityType(name: string): CrudioEntityType {
		var exists: CrudioEntityType | null = this.GetEntityDefinition(name, false);

		if (exists !== null) {
			throw new Error(`CreateEntityType: '${name}' already exists in model`);
		}

		var entity: CrudioEntityType | null;
		entity = this.GetEntityDefinition(name, false);

		if (entity === null) {
			entity = new CrudioEntityType(name);
			this.entities.push(entity);
			return entity;
		}

		throw new Error(`Entity '${name} already exists'`);
	}

	/**
	 * Create datatables for a list of entity types
	 * @date 7/18/2022 - 3:39:38 PM
	 *
	 * @private
	 * @param {CrudioEntityType[]} entities
	 */
	private CreateInMemoryDataTables(entities: CrudioEntityType[]) {
		entities.map((e: CrudioEntityType) => {
			if (!e.abstract) {
				var t: CrudioTable = new CrudioTable();
				t.name = CrudioUtils.TitleCase(e.tableName);
				t.entity = CrudioUtils.TitleCase(e.name);

				this.tables.push(t);
			}
		});
	}

	/**
	 * Connect entities through their relationships
	 * @date 7/18/2022 - 3:39:38 PM
	 *
	 * @private
	 */
	private ConnectOneToManyRelationships(postfix = false): void {
		this.entities.map(e => {
			e.relationships
				.filter(r => !r.DefaultTargetQuery)
				.map(r => {
					if (r.RelationshipType === "one") {
						this.JoinOneToMany(r);
					}
				});
		});
	}

	/**
	 * Connect entities through their relationships
	 * @date 7/18/2022 - 3:39:38 PM
	 *
	 * @private
	 */
	private ConnectNamedRelationships(postfix = false): void {
		this.entities.map(e => {
			e.relationships
				.filter(r => r.DefaultTargetQuery)
				.map(r => {
					if (r.RelationshipType === "one") {
						this.JoinNamedRelationships(r);
					}
				});
		});
	}

	/**
	 * Process all data rows and connect entities to referenced enties, e.g. user -> organisations
	 * @date 7/18/2022 - 3:39:38 PM
	 *
	 * @private
	 * @param {CrudioEntityRelationship} r
	 */
	private JoinOneToMany(r: CrudioEntityRelationship): void {
		var sourceTable: CrudioTable = this.GetTableForEntity(r.FromEntity)!;
		var targetTable: CrudioTable = this.GetTableForEntity(r.ToEntity)!;

		if (sourceTable === null) {
			throw new Error(`Can not find source '${r.FromEntity}'`);
		}

		if (targetTable === null) {
			throw new Error(`Can not find target '${r.ToEntity}'`);
		}

		var index: number = 0;

		sourceTable.rows.map((sourceRow: CrudioEntityInstance) => {
			// row_num is intended to ensure every entity on the "many" side gets at least one
			// entity assigned. so 1 user to 1 organisation, is an organisation with many users (at least one)
			const row_num = index > targetTable.rows.length - 1 ? CrudioRepository.GetRandomNumber(1, targetTable.rows.length + 1) - 1 : index++;
			if (row_num < targetTable.rows.length) {
				const targetRow = targetTable.rows[row_num];
				this.ConnectRows(sourceRow, targetRow);
			}
		});
	}

	/**
	 * Connect specific entities in a relationship
	 * For example an organisation has one CEO, so assign only one user to this role in an organisation
	 * @date 7/18/2022 - 3:39:38 PM
	 *
	 * @private
	 * @param {CrudioEntityRelationship} r
	 */
	private JoinNamedRelationships(r: CrudioEntityRelationship): void {
		var sourceTable: CrudioTable = this.GetTableForEntity(r.FromEntity)!;
		var targetTable: CrudioTable = this.GetTableForEntity(r.ToEntity)!;

		if (sourceTable === null) throw new Error(`Can not find source '${r.FromEntity}'`);

		if (targetTable === null) throw new Error(`Can not find target '${r.ToEntity}'`);

		const enumerated_table = this.GetTableForEntity(r.EnumeratedTable);

		// process relationships where there is only one instance allowed, e.g. one user as CEO of an organisation

		// for each organisation...
		enumerated_table.rows.map(parent => {
			var source_index: number = 0;
			const sourceRows = parent.values[sourceTable.name];

			if (r.SingularRelationshipValues.length > sourceRows.length)
				throw new Error(`Error: Singular relationship involving Enumerated:${enumerated_table.name} Source:${sourceTable.name} Target:${targetTable.name} - the number of singular values exceeds the number of rows in ${sourceTable.name} `);

			// for each instance of the singular relationship
			r.SingularRelationshipValues.map(sing_name => {
				// find the role to assign
				const targetRow = targetTable.rows.filter(row => {
					const f = row.values[r.SingularRelationshipField];
					return f === sing_name;
				})[0];

				// find the user to assign to the role, where the user is fetched from the related organisations
				const sourceRow = sourceRows[source_index++];

				// connect the user from the organisation with the role
				this.ConnectRows(sourceRow, targetRow);

				// HAK - set a flag so we don't process the same row twice
				sourceRow.skip = true;
			});
		});

		// assign the remaining rows with the default named relationship, e.g. assign Staff to all other users
		sourceTable.rows
			.filter((fr: any) => fr.skip === undefined || !fr.skip)
			.map((sourceRow: CrudioEntityInstance) => {
				const parts = r.DefaultTargetQuery.split(":");
				const field = parts[0].trim();
				const value = parts[1].trim();

				const targetRow = targetTable.rows.filter(row => {
					const f = row.values[field];
					return f === value;
				})[0];

				this.ConnectRows(sourceRow, targetRow);
			});
	}

	/**
	 * connect a source row and target row together in a one to many relationship
	 * @date 7/18/2022 - 3:39:38 PM
	 *
	 * @private
	 * @param {CrudioEntityInstance} sourceRow
	 * @param {CrudioTable} sourceTable
	 * @param {CrudioEntityInstance} targetRow
	 * @param {CrudioTable} targetTable
	 */
	private ConnectRows(sourceRow: CrudioEntityInstance, targetRow: CrudioEntityInstance): void {
		if (!sourceRow) throw "Error: sourceRow must be specified";

		if (!targetRow) throw "Error: targetRow must be specified";

		const sourceTable = this.GetTableForEntity(sourceRow.entityType.name);
		const targetTable = this.GetTableForEntity(targetRow.entityType.name);

		// the source points to a single target record... user 1 -> 1 organisation
		sourceRow.values[targetTable.entity] = targetRow;

		// initialise all target entities with an empty array to receive referencing entities
		if (!targetRow.values[sourceTable.name] || targetRow.values[sourceTable.name] === undefined) {
			targetRow.values[sourceTable.name] = [];
		}

		// the target has a list of records which it points back to... organisation 1 -> * user
		targetRow.values[sourceTable.name].push(sourceRow);
	}

	/**
	 * Get an in-memory datatable by name
	 * @date 7/18/2022 - 3:39:38 PM
	 *
	 * @public
	 * @param {string} name
	 * @returns {CrudioTable}
	 */
	public GetTable(name: string): CrudioTable {
		var matches: CrudioTable[] = this.tables.filter((t: CrudioTable) => t.name === name);

		if (matches.length === 0) {
			throw new Error(`Table '${name}' not found`);
		}

		return matches[0];
	}

	/**
	 * Get the in-memory datatable for the named entity type
	 * @date 7/18/2022 - 3:39:38 PM
	 *
	 * @public
	 * @param {string} name
	 * @returns {CrudioTable}
	 */
	public GetTableForEntity(name: string): CrudioTable {
		var matches: CrudioTable[] = this.tables.filter((t: CrudioTable) => t.entity === name);

		if (matches.length === 0) {
			throw new Error(`Table for entity '${name}' not found`);
		}

		return matches[0];
	}
	//#endregion

	//#region Serialisation

	/**
	 * Load a schema definition from a JSON file
	 * @date 7/18/2022 - 3:39:38 PM
	 *
	 * @public
	 * @static
	 * @param {string} filename
	 * @returns {CrudioRepository}
	 */
	public static FromJson(filename: string, include: string = null): CrudioRepository {
		const json_object = this.LoadJson(filename);
		return new CrudioRepository(json_object, include);
	}

	/**
	 * Load a JSON object from a file
	 * @date 7/18/2022 - 3:39:38 PM
	 *
	 * @public
	 * @static
	 * @param {string} filename
	 * @returns {*}
	 */
	public static LoadJson(filename: string, filestack: string[] = []): any {
		if (filestack.indexOf(filename) >= 0) {
			throw new Error(`Error: Circular inclusion of files, reading ${filename}. Existing files ${filestack} `);
		}

		filestack.push(filename);

		var input = fs.readFileSync(filename, "utf8");
		const json_object = JSON.parse(input);

		return json_object;
	}

	/**
	 * Deserialise a schema definition from a text string
	 * @date 7/18/2022 - 3:39:38 PM
	 *
	 * @public
	 * @static
	 * @param {string} input
	 * @returns {CrudioRepository}
	 */
	public static FromString(input: string): CrudioRepository {
		input = input.trim();

		// wrap JSON in array
		if (input[0] != "[") input = "[" + input + "]";

		const repo: CrudioRepository = parse(input);
		CrudioRepository.SetPrototypes(repo);

		return repo;
	}

	/**
	 * Convert a schema definition to a text string
	 * @date 7/18/2022 - 3:39:38 PM
	 *
	 * @public
	 * @returns {string}
	 */
	public ToString(): string {
		var serialised: string = stringify(this);

		if (serialised.length === 0) {
			throw new Error("Serialization error - empty string returned from stringify");
		}

		return serialised;
	}

	/**
	 * Save the schema definition to a target file
	 * @date 7/18/2022 - 3:39:38 PM
	 *
	 * @public
	 * @param {string} filename
	 */
	public Save(filename: string): void {
		fs.writeFileSync(filename, this.ToString());
	}

	//#endregion

	//#region Fill datatables

	/**
	 * Fill in-memory datatables with entity instances whose fields are populated with generated data
	 * @date 7/18/2022 - 3:39:38 PM
	 *
	 * @private
	 */
	private FillDataTables(): void {
		this.ClearAllInMemoryTables();

		// create data for each table
		const tables = this.tables.filter((t: any) => !t.abstract);

		tables.map((t: CrudioTable) => {
			this.FillTable(t);
		});

		// connect entities with basic one to many relationships
		this.ConnectOneToManyRelationships();

		// we have to connect relationships first so that token processing can use generators that
		// lookup values in related objects
		this.ProcessTokensInAllTables();

		// Run over all relationships again to handle cases
		// where a relationship has a constraint, such as one user in the role of CEO in an organisation
		// This must be done after token processing, because that is the step in the process where all
		// value generators have executed, which enables the lookups to complete
		this.ConnectNamedRelationships();
	}

	/**
	 * Fill an in-memory datatable with entity instances whose fields are populated with generated data
	 * @date 7/18/2022 - 3:39:38 PM
	 *
	 * @param {CrudioTable} table
	 */
	FillTable(table: CrudioTable): void {
		var entity: CrudioEntityType | null = this.GetEntityDefinition(table.entity, true);
		var records: CrudioEntityInstance[] = [];

		for (var c: number = 0; c < entity.max_row_count; c++) {
			records.push(this.CreateEntityInstance(entity));
		}

		table.rows = records;
	}

	/**
	 * Clear all data from in-memory datatables
	 * @date 7/18/2022 - 3:39:38 PM
	 *
	 * @private
	 */
	private ClearAllInMemoryTables(): void {
		this.tables.map((t: CrudioTable) => {
			delete t.rows;
		});
	}

	//#endregion

	//#region Get data from tables

	/**
	 * Get all rows from an in-memory datatable
	 * @date 7/18/2022 - 3:39:38 PM
	 *
	 * @param {string} tableName
	 * @returns {CrudioEntityInstance[]}
	 */
	GetAllRows(tableName: string): CrudioEntityInstance[] {
		var t: CrudioTable | null = this.GetTable(tableName);
		if (t !== null) {
			return t.rows;
		} else {
			throw new Error(`${tableName} : table not found`);
		}
	}

	//#endregion

	//#region create entities and connect to generators

	/**
	 * Create a new entity instance and populate it with generator tags which can be substitude later when the object is fully connected into the data graph
	 * @date 7/18/2022 - 3:39:38 PM
	 *
	 * @private
	 * @param {CrudioEntityType} entityType
	 * @returns {CrudioEntityInstance}
	 */
	private CreateEntityInstance(entityType: CrudioEntityType): CrudioEntityInstance {
		var entity: CrudioEntityInstance = entityType.CreateInstance({});
		this.SetupEntityGenerators(entity);

		return entity;
	}

	/**
	 * Assign data generators to the entity instance
	 * @date 7/18/2022 - 3:39:38 PM
	 *
	 * @private
	 * @param {CrudioEntityInstance} entity
	 */
	private SetupEntityGenerators(entity: CrudioEntityInstance) {
		entity.entityType.fields.map(field => {
			var generator: string | undefined = field.fieldOptions.generator;
			entity.values[field.fieldName] = generator;
		});
	}

	//#endregion

	//#region create and populate entities

	/**
	 * Process all tokens in an entity instance
	 * @date 7/18/2022 - 3:39:38 PM
	 *
	 * @private
	 * @param {CrudioEntityInstance} entityInstance
	 * @returns {boolean}
	 */
	private ProcessTokensInEntity(entityInstance: CrudioEntityInstance): boolean {
		// as we generate the entity a field may require unique values, like a
		// unique database constraint on a field.
		//
		// field values can be based on the values of other fields in the entity, like email:first.last@email.com
		// if the email value created is not unique, the entire entity is rejected so a new first and last name can be created, to form a new unique email
		// so, for that reason we have to create a duplicate entity, and only overwrite the input entity on complete successful generation of the correct field values

		const new_instance = new CrudioEntityInstance(entityInstance.entityType);
		new_instance.values = { ...entityInstance.values };

		const keys = Object.keys(new_instance.values);

		for (var i = 0; i < keys.length; i++) {
			const field_name = keys[i];
			const field_value: string = new_instance.values[field_name];

			if (typeof field_value === "string" && field_value.indexOf("[") >= 0) {
				const detokenised_value = this.ReplaceTokens(field_value, new_instance);
				new_instance.values[field_name] = detokenised_value;

				if (detokenised_value.indexOf("[") >= 0) {
					throw new Error(`Error: Detokenisation failed in Entity:${new_instance.entityType.name} - ${field_name}`);
				}
				const entity_field = new_instance.entityType.GetField(field_name);

				// keep track of unique field values
				if (entity_field && entity_field.fieldOptions.isUnique) {
					if (entityInstance.entityType.HasUniqueValue(field_name, detokenised_value.toLowerCase().trim())) {
						return false;
					}

					entityInstance.entityType.AddUniqueValue(field_name, detokenised_value.toLowerCase().trim());
				}
			} else {
				// it's ok that the field is defined but there is no default value or generated value specified
			}
		}

		entityInstance.values = { ...new_instance.values };
		return true;
	}
	/**
	 * Process all tokens in entities for all tables
	 * @date 7/18/2022 - 3:39:38 PM
	 *
	 * @private
	 */
	private ProcessTokensInAllTables(): void {
		this.tables.map(table => {
			table.rows.map(entityInstance => {
				var ok = false;
				var maxtries = 1000;

				while (!ok && maxtries-- > 0) {
					if (maxtries == 0) {
						throw new Error(`Error: Failed to create unique value for ${table.name}`);
					}

					ok = this.ProcessTokensInEntity(entityInstance);
				}
			});
		});
	}

	/**
	 * Process all tokens in a specified field
	 * @date 7/18/2022 - 3:39:38 PM
	 *
	 * @private
	 * @param {CrudioEntityInstance} entity
	 * @param {string} fieldName
	 * @param {boolean} clean
	 * @returns {string}
	 */
	private ProcessTokensInField(entity: CrudioEntityInstance, fieldName: string, clean: boolean): string {
		var value = entity.values[fieldName];

		if (!value) {
			// we failed to get a value, but it's likely because we have a generator which is referencing a related entity, like organisation.name
			value = CrudioRepository.GetEntityFieldValueFromPath(fieldName, entity);
		}

		value = clean ? value.trim().replaceAll(" ", "").toLowerCase() : value;

		return value;
	}

	/**
	 * Extract a value from a JSON like path
	 * @date 7/18/2022 - 3:39:38 PM
	 *
	 * @private
	 * @param {string} fieldName
	 * @param {CrudioEntityInstance} entity
	 * @returns {string}
	 */
	public static GetEntityFieldValueFromPath(fieldName: string, entity: CrudioEntityInstance): string {
		const path = fieldName.split(".");
		var source = entity;

		for (var i = 0; i < path.length - 1; i++) {
			const child_entity_name = path[i];
			source = source.values[child_entity_name];
		}

		if (!source) throw "whoops";

		const source_field_name = path[path.length - 1];
		const value = source.values[source_field_name];
		return value;
	}

	/**
	 * Replace all tokens with their generated values. This works recursively where tokens substitute in additional tokens, e.g. [user_email] is replaced with [name]@[organisation].com
	 * @date 7/18/2022 - 3:39:38 PM
	 *
	 * @private
	 * @param {string} fieldValue
	 * @param {CrudioEntityInstance} entity
	 * @returns {string}
	 */
	private ReplaceTokens(fieldValue: string, entity: CrudioEntityInstance): string {
		var tokens: string[] | null = fieldValue.match(/\[.*?\]+/g);
		var value: any;

		if (tokens === null) {
			// there are no tokens to process, just a hardcoded value in the entity definition, like, name: "Bob"
			return fieldValue;
		}

		tokens.map(t => {
			var token: string = t.replace(/\[|\]/g, "");

			do {
				var fieldName: string = token;
				var loop = false;

				// find parameter characters:
				// ! : get field from context
				// ~ : remove all spaces and convert to lower case
				var params: string[] = fieldName.match(/^\?|!|~|\*/g) || [];
				fieldName = fieldName.slice(params.length);

				const lookup = params.indexOf("!") >= 0;
				const clean = params.indexOf("~") >= 0;
				var query = params.indexOf("?") >= 0;

				if (lookup) {
					// get field value from current context
					value = this.ProcessTokensInField(entity, fieldName, clean);
				} else if (query) {
					value = `[${CrudioRepository.GetEntityFieldValueFromPath(fieldName, entity)}]`;
					loop = true;
				} else {
					// use a generator
					value = this.GetGeneratedValue(fieldName);

					// recurse if there are still more tokens in the string
					if (typeof value === "string" && value.includes("[") && value.includes("]")) {
						value = this.ReplaceTokens(value, entity);
					}

					// ~ option means remove all spaces and convert to lower case. Useful to create email and domain names
					// We don't clean when deferred otherwise we will change the case of field names used in generators
					if (value && clean) {
						value = value.trim().replaceAll(" ", "").toLowerCase();
					}
				}

				fieldValue = fieldValue.replace(`[${token}]`, value);
				token = fieldValue.replace(/\[|\]/g, "");
			} while (loop);
		});

		return fieldValue;
	}

	/**
	 * Get a value from a specified generator
	 * @date 7/18/2022 - 3:39:38 PM
	 *
	 * @private
	 * @param {string} generatorName
	 * @returns {*}
	 */
	private GetGeneratedValue(generatorName: string): any {
		if (!generatorName) throw new Error("generatorName must specify a standard or customer generator");

		var value: any = "";

		if (!Object.keys(this.generators).includes(generatorName)) {
			throw new Error(`Generator name is invalid '${generatorName}'`);
		}

		switch (generatorName.toLowerCase()) {
			case "uuid":
				return randomUUID();

			case "date":
				return DateTime.utc().toFormat("dd-mm-yyyy");

			case "time":
				return DateTime.TIME_24_WITH_SECONDS;

			case "timestamp":
				//const v = new Date(Date.now()).toISOString().replace('T',' ').replace('Z','');
				const v = new Date(Date.now()).toISOString().replace("Z", "");
				return v;
		}

		var content: string = this.generators[generatorName] as string;

		if (content.includes(";")) {
			var words: string[] = content.replace(/(^;)|(;$)/g, "").split(";");
			var rndWord: number = Math.random();
			var index: number = Math.floor(words.length * rndWord);
			value = words[index];
		} else if (content.includes(">")) {
			var vals: string[] = content.split(">");
			value = CrudioRepository.GetRandomNumber(parseInt(vals[0], 10), parseInt(vals[1], 10));
		} else {
			value = content;
		}

		return value;
	}

	/**
	 * Get a random number >= min and <= max
	 * @date 7/18/2022 - 3:39:38 PM
	 *
	 * @public
	 * @static
	 * @param {number} min
	 * @param {number} max
	 * @returns {number}
	 */
	public static GetRandomNumber(min: number, max: number): number {
		var rndValue: number = Math.random();
		return Math.floor((max - min) * rndValue) + min;
	}

	//#endregion

	//#region scripts

	/**
	 * Run all scripts in the current repository
	 * @date 7/25/2022 - 9:41:03 AM
	 *
	 * @private
	 */
	private RunScripts(): void {
		this.scripts.map(filename => {
			const json: any = CrudioRepository.LoadJson(filename);
			this.ProcessScript(json);
		});
	}

	/**
	 * Run a collection of scripts loaded from a JSON file
	 * The format is 
	 * 
	 * TableName : { count: x, scripts:[] }
	 * where count is the numbe rof entities to create for the specified table
	 * and scripts is a list of script commands which will create and connected further entities
	 * 
	 * @date 7/25/2022 - 9:41:03 AM
	 *
	 * @private
	 * @param {*} json
	 */
	private ProcessScript(json: any): void {
		Object.keys(json).map((tableName: any) => {
			const table = this.GetTable(tableName);
			const table_node = json[tableName];

			const parent_entity = this.CreateEntityInstance(this.GetEntityDefinition(table.entity));
			this.ProcessTokensInEntity(parent_entity);
			table.rows.push(parent_entity);

			var count = table_node.count ?? 1;

			// For each new entity, run the script
			while (count-- > 0) {
				table_node.scripts.map((s: any) => {
					this.ExecuteScript(parent_entity, s);
				});
			}
		});
	}

	/**
	 * Execute scripts for a newly create parent entity which has already been inserted into the related table
	 * @date 7/25/2022 - 9:41:03 AM
	 *
	 * @private
	 * @param {CrudioEntityInstance} parent_entity
	 * @param {string} script
	 */
	private ExecuteScript(parent_entity: CrudioEntityInstance, script: string): void {
		const query_index = script.indexOf("?");
		const query = script.slice(query_index + 1);

		const parts = script.slice(0, query_index).split(".");
		var field_name = parts[0];
		var entity_type = parts[1];
		var row_index = -1;

		const bracket = field_name.indexOf("[");
		if (bracket > -1) {
			if (field_name.indexOf("]") < 0) {
				throw new Error(`Error: Syntax error - missing ']' in ${script}`);
			}

			const index_text = field_name.slice(bracket + 1, field_name.indexOf("]", bracket + 1));
			const row_parts = index_text.split("-");
			var row_start = Number(row_parts[0]);
			var row_end;

			if (row_parts.length == 2) row_end = Number(row_parts[1]);
			else row_end = row_start;

			if (row_start === NaN || row_end === NaN) throw new Error(`Error: Syntax error - invalid row index in ${script}`);

			row_index = row_start;

			field_name = field_name.slice(0, bracket).replaceAll("]", "");
		}

		// When we get the entity by index below, it will be connected to this target entity
		var target_connection = this.GetEntityFromQuery(entity_type, query);

		for (var ri = row_start; ri <= row_end; ri++) {
			this.ConnectChildWithRelatedEntity(parent_entity, field_name, row_index, target_connection);
		}
	}

	/**
	 * Get an entity using the query notation ?fieldname=search_value
	 * @date 7/25/2022 - 9:41:03 AM
	 *
	 * @private
	 * @param {string} entityType
	 * @param {string} query
	 * @returns {CrudioEntityInstance}
	 */
	private GetEntityFromQuery(entityType: string, query: string): CrudioEntityInstance {
		if (!query) throw new Error("Error: query parameter must be specified");

		const parts = query.split("=");
		const field = parts[0];
		const value = parts[1];

		if (!parts || !field || !value) throw new Error(`Error: Querying entity type: ${entityType}. Syntax error in query: ${query}. Format is ?fieldname=value `);

		const table = this.GetTableForEntityName(entityType);
		const match = table.rows.filter(r => r.values[field] === value)[0];

		if (!match) throw new Error(`Error: Failed to find math for Entity:${entityType} using query: ${query}`);

		return match;
	}

	/**
	 * Connect a child entity with a related target
	 * e.g. Having created an organisation, we need to get or create Users, then connect the users to their roles and departments
	 * @date 7/25/2022 - 9:41:02 AM
	 *
	 * @private
	 * @param {CrudioEntityInstance} parent_entity
	 * @param {string} field_name
	 * @param {number} row_index
	 * @param {CrudioEntityInstance} target_connection
	 */
	private ConnectChildWithRelatedEntity(parent_entity: CrudioEntityInstance, field_name: string, row_index: number, target_connection: CrudioEntityInstance) {
		// The organisation may not yet have a field for Users
		if (!parent_entity.values[field_name]) parent_entity.values[field_name] = [];

		// get the Users list from the organisation
		const parent_array = parent_entity.values[field_name] as [];
		const entity_definition = this.GetEntityDefinitionFromTableName(field_name);

		// if we are, for example, requesting User[3] then we need to ensure the Users array for the Organisation has
		// at least 3 entities. If not we just create enough entities to fill the array up to the required index value
		if (parent_array.length < row_index + 1) {
			var r = row_index;
			while (parent_array.length < row_index + 1) {
				const new_entity = this.CreateEntityInstance(entity_definition);
				const global_table = this.GetTableForEntityName(entity_definition.name);

				// add the new entity to the global table
				global_table.rows.push(new_entity);

				this.ConnectRows(new_entity, parent_entity);
				this.ConnectRows(new_entity, target_connection);

				// process tokens in the new User entity, like expanding the email address which contains the organisation name
				this.ProcessTokensInEntity(new_entity);

				r--;
			}
		} else {
			this.ConnectRows(parent_array[row_index], target_connection);
		}

		if (row_index > parent_array.length) {
			throw new Error(`Error: Failed to generate entity for index ${row_index} in ${parent_entity.entityType}`);
		}
	}
	//#endregion
}
