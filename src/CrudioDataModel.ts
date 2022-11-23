import * as fs from "fs";
import { stringify } from "flatted";
import { randomUUID } from "crypto";
import { DateTime } from "luxon";

import { ICrudioAssignment, ICrudioConfig, ICrudioEntityDefinition, ICrudioFieldOptions, ICrudioGenerator, ICrudioSchemaDefinition, ICrudioTrigger, ISchemaRelationship } from "./CrudioTypes";
import CrudioEntityDefinition from "./CrudioEntityDefinition";
import CrudioEntityInstance from "./CrudioEntityInstance";
import CrudioField from "./CrudioField";
import CrudioRelationship from "./CrudioRelationship";
import CrudioTable from "./CrudioTable";
import CrudioUtils from "./CrudioUtils";
import { CrudioJson } from "./CrudioJson";

/**
 * Concrete implementation of the data model description and state
 * @date 7/18/2022 - 3:39:38 PM
 *
 * @export
 * @class CrudioDataModel
 * @typedef {CrudioDataModel}
 */
export default class CrudioDataModel {
	//#region Properties

	/**
	 * List of hard coded value assignments
	 * @date 8/2/2022 - 12:35:28 PM
	 *
	 * @private
	 * @type {string[]}
	 */
	private assign: ICrudioAssignment[] = [];

	/**
	 * List of triggers to run when entities are created
	 * @date 7/31/2022 - 9:31:00 AM
	 *
	 * @private
	 * @type {[]}
	 */
	private triggers = {};

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
	private generators: Record<string, ICrudioGenerator> = {};

	/**
	 * List of in memory datatables which hold the entity instances
	 * @date 7/18/2022 - 3:39:38 PM
	 *
	 * @public
	 * @type {CrudioTable[]}
	 */
	private tables: CrudioTable[] = [];

	/**
	 * One to Many relationships
	 * @date 11/10/2022 - 17:39:59
	 *
	 * @public
	 * @readonly
	 * @type {CrudioRelationship[]}
	 */
	public get OneToManyRelationships(): CrudioRelationship[] {
		return this.relationships.filter(r => r.RelationshipType === "one");
	}

	/**
	 * Many to Many relationships
	 * @date 11/10/2022 - 17:39:59
	 *
	 * @public
	 * @readonly
	 * @type {CrudioRelationship[]}
	 */
	public get ManyToManyRelationships(): CrudioRelationship[] {
		const relationships: CrudioRelationship[] = [];

		this.entityDefinitions.map(d =>
			d.ManyToManyRelationships.map(r => {
				relationships.push(r);
			})
		);

		return relationships;
	}

	/**
	 * Get entity definitions that represent many to many joins
	 * @date 11/10/2022 - 18:12:39
	 *
	 * @public
	 * @readonly
	 * @type {CrudioEntityDefinition[]}
	 */
	public get ManyToManyDefinitions(): CrudioEntityDefinition[] {
		return this.entityDefinitions.filter(e => e.IsManyToManyJoin);
	}

	/**
	 * Date format to use
	 * @date 7/26/2022 - 12:53:10 PM
	 *
	 * @public
	 * @readonly
	 * @type {CrudioTable[]}
	 */
	private date_format = "yyyy-MM-dd HH:mm:ss";
	/**
	 * Description placeholder
	 * @date 11/10/2022 - 17:39:59
	 *
	 * @public
	 * @readonly
	 * @type {string}
	 */
	public get DateFormat(): string {
		return this.date_format;
	}

	/**
	 * List of in memory datatables which hold the entity instances
	 * @date 7/26/2022 - 12:53:10 PM
	 *
	 * @public
	 * @readonly
	 * @type {CrudioTable[]}
	 */
	public get Tables(): CrudioTable[] {
		return this.tables;
	}

	/**
	 * Description placeholder
	 * @date 11/10/2022 - 17:39:59
	 *
	 * @private
	 * @type {CrudioEntityDefinition[]}
	 */
	private entityDefinitions: CrudioEntityDefinition[] = [];

	/**
	 * List of entity type definitions (entity schema)
	 * @date 7/18/2022 - 3:39:38 PM
	 *
	 * @public
	 * @type {CrudioEntityDefinition[]}
	 */
	get EntityDefinitions(): CrudioEntityDefinition[] {
		return this.entityDefinitions;
	}

	/**
	 * List of relationships
	 * @date 7/18/2022 - 3:39:38 PM
	 *
	 * @public
	 * @type {CrudioRelationship[]}
	 */
	private relationships: CrudioRelationship[] = [];

	/**
	 * Database schema in which tables are created
	 * @date 7/18/2022 - 3:39:38 PM
	 *
	 * @public
	 * @type {string}
	 */
	public TargetDbSchema: string = null;

	/**
	 * Explicit data setup instructions
	 * @date 7/18/2022 - 3:39:38 PM
	 *
	 * @public
	 * @type {string[]}
	 */
	private scripts: string[];

	/**
	 * Description placeholder
	 * @date 11/10/2022 - 17:39:59
	 *
	 * @public
	 * @readonly
	 * @type {ICrudioSchemaDefinition}
	 */
	public get DataModel(): ICrudioSchemaDefinition {
		return this.data_model;
	}
	//#endregion

	/**
	 * Initialise an instance of CrudioDataModel.
	 * @date 7/18/2022 - 3:39:38 PM
	 *
	 * @constructor
	 * @param {ICrudioSchemaDefinition} data_model
	 */
	constructor(private data_model: ICrudioSchemaDefinition, private config: ICrudioConfig, autoPopulate = true) {
		this.PreProcessDataModelDefinition(data_model, config.include);

		if (autoPopulate) {
			this.FillDataTables();
		}
	}

	//#region Initialise data model, entities and relationships

	/**
	 * When deserialising, ensure the correct prototypes are applied and initialise other default data values
	 * @date 7/18/2022 - 3:39:38 PM
	 *
	 * @private
	 * @static
	 * @param {CrudioDataModel} schema
	 */
	private static SetPrototypes(schema: CrudioDataModel) {
		if (!schema.entityDefinitions) schema.entityDefinitions = [];
		if (!schema.generators) schema.generators = {};
		if (!schema.relationships) schema.relationships = [];

		Object.setPrototypeOf(schema, CrudioDataModel.prototype);

		schema.entityDefinitions.map((e: any) => {
			Object.setPrototypeOf(e, CrudioEntityDefinition.prototype);

			e.fields.map((f: any) => {
				Object.setPrototypeOf(f, CrudioField.prototype);
			});
		});

		schema.Tables.map((t: CrudioTable) => {
			Object.setPrototypeOf(t, CrudioTable.prototype);
			t.DataRows.map((r: any) => Object.setPrototypeOf(r, CrudioEntityInstance.prototype));
		});
	}

	/**
	 * Process includes and ensure default values are in place before connecting the concrete data model to aspects of the schema definition
	 * @date 7/18/2022 - 3:39:38 PM
	 *
	 * @private
	 * @param {ICrudioSchemaDefinition} dataModel
	 */
	private PreProcessDataModelDefinition(dataModel: ICrudioSchemaDefinition, include: string = null): void {
		if (!dataModel.include) {
			dataModel.include = [];
		}

		if (!dataModel.generators) {
			dataModel.generators = [];
		}

		if (!dataModel.triggers) {
			dataModel.triggers = [];
		}

		if (!dataModel.assign) {
			dataModel.assign = [];
		}

		if (include) {
			dataModel.include = [include, ...dataModel.include];
		}

		dataModel.include.map((filename: any) => {
			this.Merge(filename, dataModel);
		});

		this.LoadGenerators(dataModel.generators);
		this.LoadTriggers(dataModel.triggers);

		// Patch the id field snippet to use the name specified in the config
		if ((dataModel.snippets as any).id.name) {
			(dataModel.snippets as any).id.name = this.config.idField;
		}

		this.ExpandAllSnippets(dataModel);
		this.LoadEntityDefinitions(dataModel);
		this.LoadAssignments(dataModel);
	}

	/**
	 * Merge a specified JSON file into the nomintated schema definition
	 * @date 7/18/2022 - 3:39:38 PM
	 *
	 * @private
	 * @param {string} filename
	 * @param {ICrudioSchemaDefinition} datamodel
	 */
	private Merge(filename: string, datamodel: ICrudioSchemaDefinition) {
		const input: ICrudioSchemaDefinition = CrudioJson.LoadJson(filename, this.filestack);

		if (input.include) this.PreProcessDataModelDefinition(input);

		if (input.generators) {
			datamodel.generators = [...datamodel.generators, ...input.generators];
		}

		if (input.snippets) {
			datamodel.snippets = { ...datamodel.snippets, ...input.snippets };
		}

		if (input.entities) {
			datamodel.entities = { ...input.entities, ...datamodel.entities };
		}

		if (input.triggers) {
			datamodel.triggers = [...datamodel.triggers, ...input.triggers];
		}

		if (input.assign) {
			datamodel.assign = [...datamodel.assign, ...input.assign];
		}
	}

	/**
	 * Load entity definitions from the schema
	 * @date 7/18/2022 - 3:39:38 PM
	 *
	 * @private
	 * @param {ICrudioSchemaDefinition} datamodel
	 */
	private LoadEntityDefinitions(datamodel: ICrudioSchemaDefinition): void {
		this.entityDefinitions = [];
		var entity_names: string[] = Object.keys(datamodel.entities);

		for (var index: number = 0; index < entity_names.length; index++) {
			var entityname: string = entity_names[index];
			var entitySchema: any = datamodel.entities[entityname];
			this.CreateEntityDefinition(entitySchema, entityname);
		}

		// create entities for many to many joins
		// currently, these are abstract types as the data wrapper creates the tables
		this.CreateManyToManyJoinTables();
	}

	/**
	 * Create join tables for many to many joins
	 * @date 7/27/2022 - 10:54:24 AM
	 *
	 * @private
	 */
	private CreateManyToManyJoinTables() {
		const m2m = this.ManyToManyRelationships;

		m2m.map(r => {
			const many_entity = new CrudioEntityDefinition(this.config, r.FromEntity + r.ToEntity, false, true);

			// many to many join tables need to trace back to the relationship they were spawned from
			// to assist with data generation
			many_entity.SourceRelationship = r;

			many_entity
				.AddKey("uuid")
				.AddRelation(
					new CrudioRelationship(
						{
							type: "one",
							name: r.FromEntity,
							from: many_entity.Name,
							from_column: CrudioUtils.ToColumnId(r.FromEntity),
							to: r.FromEntity,
							to_column: this.config.idField,
							required: true,
						},
						this.config
					)
				)
				.AddRelation(
					new CrudioRelationship(
						{
							type: "one",
							name: r.ToEntity,
							from: many_entity.Name,
							from_column: CrudioUtils.ToColumnId(r.ToEntity),
							to: r.ToEntity,
							to_column: this.config.idField,
							required: true,
						},
						this.config
					)
				);

			const key = many_entity.GetField(this.config.idField);
			key.fieldOptions.generator = "[uuid]";

			// add any additional fields to the many to many join
			if (r.Fields != undefined) {
				Object.keys(r.Fields).map((f: string) => {
					const field: any = r.Fields[f];
					const opts: ICrudioFieldOptions = {};

					if (field.generator) {
						opts.generator = field.generator;
					}
					many_entity.AddField(field.name ?? f, field.type, opts);
				});
			}

			this.entityDefinitions.push(many_entity);
		});
	}

	/**
	 * Expand snippets in the schema, to ensure inheritence works between generic and concrete entity types, e.g. person and user
	 * @date 7/18/2022 - 3:39:38 PM
	 *
	 * @private
	 * @param {ICrudioSchemaDefinition} datamodel
	 */
	private ExpandAllSnippets(datamodel: ICrudioSchemaDefinition) {
		Object.keys(datamodel.entities).map(e => {
			const entity = datamodel.entities[e];
			const entity_snippets = entity.snippets as string[];

			if (entity_snippets) {
				entity_snippets.map(s => {
					const snippet = datamodel.snippets[s];
					entity.fields[snippet.name] = { ...snippet };
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
	private CreateEntityDefinition(entityDefinition: ICrudioEntityDefinition, entityname: string): void {
		var entityType: CrudioEntityDefinition = this.CreateEntityType(entityname, entityDefinition.abstract, false);
		entityType.MaxRowCount = entityDefinition.count;

		if (!entityDefinition.abstract && entityType.MaxRowCount == undefined) entityType.MaxRowCount = CrudioDataModel.DefaultNumberOfRowsToGenerate;

		if (entityDefinition.inherits) {
			if (typeof entityDefinition.inherits === "string") {
				this.InheritBaseFields(entityDefinition.inherits, entityType);
			} else if (Array.isArray(entityDefinition.inherits)) {
				(entityDefinition.inherits as []).map((i: string) => {
					this.InheritBaseFields(i, entityType);
				});
			}
		}

		var fKeys: string[] = Object.keys(entityDefinition.fields ?? {}).filter(f => !this.ignoreFields.includes(f));

		for (var findex: number = 0; findex < fKeys.length; findex++) {
			var fieldname: string = fKeys[findex];
			var fieldSchema: any = entityDefinition.fields[fieldname];

			const fieldOptions: ICrudioFieldOptions = {
				isKey: fieldSchema.key,
				isUnique: fieldSchema.unique,
				isRequired: fieldSchema.required ?? false,
				generator: fieldSchema.generator,
				sensitiveData: fieldSchema.sensitiveData === undefined ? false : fieldSchema.sensitiveData,
				defaultValue: fieldSchema.default === undefined ? null : fieldSchema.default,
			};

			entityType.AddField(fieldname, fieldSchema.type ?? "string", fieldOptions);
		}

		if (entityDefinition.relationships) {
			entityDefinition.relationships.map((r: ISchemaRelationship) => {
				const new_rel = new CrudioRelationship(
					{
						...r,
						from: entityType.Name,
					},
					this.config
				);

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
	 * @param {CrudioEntityDefinition} targetEntity
	 */
	private InheritBaseFields(baseEntityName: string, targetEntity: CrudioEntityDefinition): void {
		var baseEntity: CrudioEntityDefinition = this.GetEntityDefinition(baseEntityName)!;

		baseEntity.fields.map((f: CrudioField) => {
			if (f.fieldName.toLocaleLowerCase() != "abstract") {
				if (targetEntity.GetField(f.fieldName)) {
					throw new Error(`InheritFields - child:'${targetEntity.Name}' base:'${baseEntity.Name}' : can not have fields in child which are already specifified in base. field:'${f.fieldName}'`);
				}

				// Duplicate the field from the base type onto the child entity
				targetEntity.fields.push(new CrudioField(f.fieldName, f.fieldType, f.fieldOptions));
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
	 * @returns {(CrudioEntityDefinition | null)}
	 */
	public GetEntityDefinition(entityName: string, failIfNotFound: boolean = true): CrudioEntityDefinition | null {
		var matches: CrudioEntityDefinition[] = this.entityDefinitions.filter((e: CrudioEntityDefinition) => e.Name === entityName);

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
	 * @returns {(CrudioEntityDefinition | null)}
	 */
	public GetEntityDefinitionFromTableName(tableName: string): CrudioEntityDefinition {
		const table = this.GetTable(tableName);
		return table.EntityDefinition;
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
		return this.Tables.filter(t => t.EntityDefinition.Name === name)[0];
	}

	/**
	 * Create an entity type based on its definition in the repo
	 * @date 7/18/2022 - 3:39:38 PM
	 *
	 * @private
	 * @param {string} name
	 * @returns {CrudioEntityDefinition}
	 */
	private CreateEntityType(name: string, isAbstract, isManyToMany): CrudioEntityDefinition {
		var exists: CrudioEntityDefinition | null = this.GetEntityDefinition(name, false);

		if (exists !== null) {
			throw new Error(`CreateEntityType: '${name}' already exists in model`);
		}

		var entityDefinition: CrudioEntityDefinition | null = (entityDefinition = this.GetEntityDefinition(name, false));

		if (entityDefinition === null) {
			entityDefinition = new CrudioEntityDefinition(this.config, name, isAbstract, isManyToMany);
			this.entityDefinitions.push(entityDefinition);

			return entityDefinition;
		}

		throw new Error(`Entity '${name} already exists'`);
	}

	/**
	 * Create datatables for a list of entity types
	 * @date 7/18/2022 - 3:39:38 PM
	 *
	 * @private
	 * @param {CrudioEntityDefinition[]} entities
	 */
	private CreateInMemoryDataTables() {
		const tables = this.entityDefinitions.filter(e => !e.IsManyToManyJoin && !e.IsAbstract);
		const joins = this.entityDefinitions.filter(e => e.IsManyToManyJoin);

		tables.map((e: CrudioEntityDefinition) => {
			const t: CrudioTable = new CrudioTable(CrudioUtils.TitleCase(e.TableName), this.GetEntityDefinition(CrudioUtils.TitleCase(e.Name)));
			this.Tables.push(t);
		});

		joins.map((e: CrudioEntityDefinition) => {
			const t: CrudioTable = new CrudioTable(CrudioUtils.TitleCase(e.TableName), this.GetEntityDefinition(CrudioUtils.TitleCase(e.Name)));
			this.Tables.push(t);
		});
	}

	/**
	 * Connect entities through their relationships
	 * @date 7/18/2022 - 3:39:38 PM
	 *
	 * @private
	 */
	private ConnectOneToManyRelationships(): void {
		const definitions = this.entityDefinitions.filter(e => !e.IsManyToManyJoin);

		definitions.map(e => {
			e.relationships
				.filter(r => !r.DefaultTargetQuery && !e.IsManyToManyJoin)
				.map(r => {
					if (r.RelationshipType === "one") {
						this.JoinOneToMany(r);
					}
				});
		});
	}

	/**
	 * Process all data rows and connect entities to referenced enties, e.g. user -> organisations
	 * @date 7/18/2022 - 3:39:38 PM
	 *
	 * @private
	 * @param {CrudioRelationship} r
	 */
	private JoinOneToMany(r: CrudioRelationship): void {
		var sourceTable: CrudioTable = this.GetTableForEntityDefinition(r.FromEntity)!;
		var targetTable: CrudioTable = this.GetTableForEntityDefinition(r.ToEntity)!;

		if (sourceTable === null) {
			throw new Error(`Can not find source '${r.FromEntity}'`);
		}

		if (targetTable === null) {
			throw new Error(`Can not find target '${r.ToEntity}'`);
		}

		var index: number = 0;

		sourceTable.DataRows.map((sourceRow: CrudioEntityInstance) => {
			// row_num is intended to ensure every entity on the "many" side gets at least one
			// entity assigned. so 1 user to 1 organisation, is an organisation with many users (at least one)
			const row_num = index > targetTable.DataRows.length - 1 ? CrudioUtils.GetRandomNumber(0, targetTable.DataRows.length) : index++;
			if (row_num < targetTable.DataRows.length) {
				const targetRow = targetTable.DataRows[row_num];
				this.ConnectRows(sourceRow, targetRow);
			}
		});
	}

	/**
	 * Connect entities through their relationships
	 * @date 7/18/2022 - 3:39:38 PM
	 *
	 * @private
	 */
	private ConnectManyToManyRelationships(): void {
		const definitions = this.ManyToManyDefinitions;

		definitions.map(d => this.JoinManyToMany(d));
	}

	/**
	 * Process all data rows and connect entities to referenced enties, e.g. user -> organisations
	 * @date 7/18/2022 - 3:39:38 PM
	 *
	 * @private
	 * @param {CrudioRelationship} r
	 */
	private JoinManyToMany(d: CrudioEntityDefinition): void {
		var joinTable: CrudioTable = this.GetTableForEntityDefinition(d.Name);
		var sourceTable: CrudioTable = this.GetTableForEntityDefinition(d.SourceRelationship.FromEntity);
		var targetTable: CrudioTable = this.GetTableForEntityDefinition(d.SourceRelationship.ToEntity);

		const source_ids = sourceTable.DataRows.map(r => r.DataValues[this.config.idField]);
		const target_ids = targetTable.DataRows.map(r => r.DataValues[this.config.idField]);

		// Iterate through every entity in the source table, e.g.Blog
		source_ids.map((source_id: string) => {
			const options = [...target_ids];
			const c = Math.min(options.length, d.SourceRelationship.NumberOfSeededRelations);

			// add the required number of target objects, e.g. Tag
			for (var i = 0; i < c; i++) {
				const row_num = CrudioUtils.GetRandomNumber(0, options.length);
				options.slice(row_num, 1);

				this.CreateManyToManyRow(joinTable, source_id, options[row_num]);
			}
		});
	}

	/**
	 * Create a new entry in a many to many join table
	 * @date 8/8/2022 - 3:39:38 PM
	 *
	 * @private
	 */
	private CreateManyToManyRow(joinTable: CrudioTable, source_id: string, target_id: string): void {
		const row = this.CreateEntityInstance(joinTable.EntityDefinition);

		row.DataValues[CrudioUtils.ToColumnId(row.EntityDefinition.SourceRelationship.FromEntity)] = source_id;
		row.DataValues[CrudioUtils.ToColumnId(row.EntityDefinition.SourceRelationship.ToEntity)] = target_id;

		joinTable.DataRows.push(row);

		this.SetupEntityGenerators(row);
		this.ProcessTokensInEntity(row);
	}

	/**
	 * Connect entities through their relationships
	 * @date 7/18/2022 - 3:39:38 PM
	 *
	 * @private
	 */
	private ConnectDefaultRelationships(postfix = false): void {
		this.entityDefinitions.map(e => {
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
	 * Connect specific entities in a relationship
	 * For example an organisation has one CEO, so assign only one user to this role in an organisation
	 * @date 7/18/2022 - 3:39:38 PM
	 *
	 * @private
	 * @param {CrudioRelationship} r
	 */
	private JoinNamedRelationships(r: CrudioRelationship): void {
		var sourceTable: CrudioTable = this.GetTableForEntityDefinition(r.FromEntity)!;
		var targetTable: CrudioTable = this.GetTableForEntityDefinition(r.ToEntity)!;

		if (sourceTable === null) throw new Error(`Can not find source '${r.FromEntity}'`);

		if (targetTable === null) throw new Error(`Can not find target '${r.ToEntity}'`);

		const enumerated_table = this.GetTableForEntityDefinition(r.EnumeratedTable);

		// process relationships where there is only one instance allowed, e.g. one user as CEO of an organisation

		// for each organisation...
		enumerated_table.DataRows.map(parent => {
			var source_index: number = 0;
			const sourceRows = parent.DataValues[sourceTable.TableName];

			if (r.SingularRelationshipValues.length > sourceRows.length)
				throw new Error(
					`Error: Singular relationship involving Enumerated:${enumerated_table.TableName} Source:${sourceTable.TableName} Target:${targetTable.TableName} - the number of singular values exceeds the number of rows in ${sourceTable.TableName} `
				);

			// for each instance of the singular relationship
			r.SingularRelationshipValues.map(sing_name => {
				// find the role to assign
				const targetRow = targetTable.DataRows.filter(row => {
					const f = row.DataValues[r.SingularRelationshipField];
					return f === sing_name;
				})[0];

				// find the user to assign to the role, where the user is fetched from the related organisations
				const sourceRow = sourceRows[source_index++];

				// connect the user from the organisation with the role
				this.ConnectRows(sourceRow, targetRow);

				sourceRow.skip = true;
			});
		});

		// assign the remaining rows with the default named relationship, e.g. assign Staff to all other users
		sourceTable.DataRows.filter((fr: any) => fr.skip === undefined || !fr.skip).map((sourceRow: CrudioEntityInstance) => {
			const parts = r.DefaultTargetQuery.split(":");
			const field = parts[0].trim();
			const value = parts[1].trim();

			const targetRow = targetTable.DataRows.filter(row => {
				const f = row.DataValues[field];
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

		const sourceTable = this.GetTableForEntityDefinition(sourceRow.EntityDefinition.Name);
		const targetTable = this.GetTableForEntityDefinition(targetRow.EntityDefinition.Name);

		// the source points to a single target record... user 1 -> 1 organisation
		sourceRow.DataValues[targetTable.EntityDefinition.Name] = targetRow;

		// initialise all target entities with an empty array to receive referencing entities
		if (!targetRow.DataValues[sourceTable.TableName] || targetRow.DataValues[sourceTable.TableName] === undefined) {
			targetRow.DataValues[sourceTable.TableName] = [];
		}

		// the target has a list of records which it points back to... organisation 1 -> * user
		targetRow.DataValues[sourceTable.TableName].push(sourceRow);
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
		var matches: CrudioTable[] = this.Tables.filter((t: CrudioTable) => t.TableName === name);

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
	public GetTableForEntityDefinition(name: string): CrudioTable {
		var matches: CrudioTable[] = this.Tables.filter((t: CrudioTable) => t.EntityDefinition.Name === name);

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
	 * @returns {CrudioDataModel}
	 */
	public static FromJson(config: ICrudioConfig, autoPopulate = true): CrudioDataModel {
		const json_object = CrudioJson.LoadJson(config.datamodel);
		return new CrudioDataModel(json_object, config, autoPopulate);
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
	 * Output the data model as a Mermaid diagram
	 * @date 7/31/2022 - 9:31:00 AM
	 *
	 * @public
	 * @returns {string}
	 */
	public ToMermaid(addH1 = true): string {
		var output = "# Entity Relationship Diagram\r\r";
		output += "```mermaid\rerDiagram\r";

		this.entityDefinitions.map(e => {
			output += `${e.Name} {\r`;

			e.fields.map(f => {
				output += `${f.fieldType} ${f.fieldName}\r`;
			});

			output += `}\r`;

			e.relationships
				.filter(r => r.RelationshipType === "one")
				.map(r => {
					const rel = r.RelationshipType === "one" ? "}o--||" : "}o--o{";
					output += `${r.FromEntity} ${rel} ${r.ToEntity} : "has"\r`;
				});
		});

		return output + "\r```\r";
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
	 * @public
	 */
	public FillDataTables(): void {
		this.ClearAllInMemoryTables();
		this.CreateInMemoryDataTables();

		// create data for each table, but skip abstract and many to many join tables
		const tables = this.Tables.filter((t: CrudioTable) => !t.EntityDefinition.IsAbstract && !t.EntityDefinition.IsManyToManyJoin);

		tables.map((t: CrudioTable) => {
			// Only fill tables which have not yet been populated
			if (t.DataRows.length == 0) this.FillTable(t);
		});

		// connect entities with basic one to many relationships
		this.ConnectOneToManyRelationships();

		// Process hard coded assignment of values
		// This will replace tokens in objects, allowing the user to place specific values in the object graph
		this.ProcessAssignments();

		// we have to connect relationships first so that token processing can use generators that
		// lookup values in related objects
		this.ProcessTokensInAllTables();

		// connect entities with many to many relationships
		this.ConnectManyToManyRelationships();

		// Run over all relationships again to handle cases
		// where a relationship has a constraint, such as one user in the role of CEO in an organisation
		// This must be done after token processing, because that is the step in the process where all
		// value generators have executed, which enables the lookups to complete
		this.ConnectDefaultRelationships();
	}

	/**
	 * Fill an in-memory datatable with entity instances whose fields are populated with generated data
	 * @date 7/18/2022 - 3:39:38 PM
	 *
	 * @param {CrudioTable} table
	 *
	 * @private
	 */
	private FillTable(table: CrudioTable): void {
		var records: CrudioEntityInstance[] = [];
		var count = 0;
		var values: string[] = [];
		const generator: string = table.EntityDefinition.MaxRowCount as string;

		if (typeof table.EntityDefinition.MaxRowCount === "string") {
			const g = this.GetGenerator(generator.replace(/\[|\]/g, ""));
			const v = g.values;
			values = v.split(";").filter(f => f && f.length > 0);
			count = values.length;

			if (count == 0) {
				throw new Error(`Error: Unable to determine entity count for ${table.TableName} using "${v}" `);
			}
		} else if (typeof table.EntityDefinition.MaxRowCount === "number") {
			count = table.EntityDefinition.MaxRowCount;
		} else {
			count = CrudioDataModel.DefaultNumberOfRowsToGenerate;
		}

		const field = table.EntityDefinition.fields.filter(f => f.fieldOptions.generator === generator)[0];

		for (var c = 0; c < count; c++) {
			const entity = this.CreateEntityInstance(table.EntityDefinition);

			if (field) {
				entity.DataValues[field.fieldName] = values[c];
			}

			records.push(entity);
			this.ProcessTriggersForEntity(entity);
		}

		table.DataRows = records;
	}

	/**
	 * Clear all data from in-memory datatables
	 * @date 7/18/2022 - 3:39:38 PM
	 *
	 * @private
	 */
	private ClearAllInMemoryTables(): void {
		this.Tables.map((t: CrudioTable) => {
			delete t.DataRows;
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
			return t.DataRows;
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
	 * @param {CrudioEntityDefinition} entityType
	 * @returns {CrudioEntityInstance}
	 */
	private CreateEntityInstance(entityType: CrudioEntityDefinition): CrudioEntityInstance {
		var entity: CrudioEntityInstance = entityType.CreateInstance();
		this.SetupEntityGenerators(entity);
		entity.DataValues[this.config.idField] = randomUUID();

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
		entity.EntityDefinition.fields.map(field => {
			var generator: string | undefined = field.fieldOptions.generator;
			entity.DataValues[field.fieldName] = generator;
		});
	}

	//#endregion

	//#region Token Processing and value generation

	/**
	 * Load generator definitions
	 * @date 8/2/2022 - 12:32:13 PM
	 *
	 * @private
	 * @param {ICrudioGenerator[]} generators
	 */
	private LoadGenerators(generators: ICrudioGenerator[]): void {
		generators.map(g => {
			this.generators[g.name] = g;
		});
	}

	/**
	 * Process all tokens in entities for all tables
	 * @date 7/18/2022 - 3:39:38 PM
	 *
	 * @private
	 */
	private ProcessTokensInAllTables(): void {
		this.Tables.map(table => {
			this.ProcessAllTokensInTable(table);
		});
	}

	/**
	 Process all tokens in entities stored in a specified table
	 * @date 7/31/2022 - 10:10:33 AM
	 *
	 * @private
	 * @param {CrudioTable} table
	 */
	private ProcessAllTokensInTable(table: CrudioTable) {
		table.DataRows.map(entityInstance => {
			this.ProcessTokensInEntity(entityInstance);
		});
	}

	/**
	 * Process all tokens in an entity instance
	 * @date 7/18/2022 - 3:39:38 PM
	 *
	 * @private
	 * @param {CrudioEntityInstance} entityInstance
	 * @returns {boolean}
	 */
	private ProcessTokensInEntity(entityInstance: CrudioEntityInstance): void {
		// Entites may require fields to have unique values, and therefore
		// can not violate the unique database constraint for the field.
		//
		// Because generators may not create a unique value, we will have to try again, and to try again we need to retain
		// the original entity with it's tokens ([generator]) intact. This is why we have a temporary entity below.
		//
		// The temporary entity gets the generated value, and if any unique contraints are violated, it is discarded.

		const temporary_entity = new CrudioEntityInstance(this.config, entityInstance.EntityDefinition);
		const keys = Object.keys(entityInstance.DataValues);

		var maxtries = 1000;

		while (maxtries-- > 0) {
			var ok = true;
			temporary_entity.DataValues = { ...entityInstance.DataValues };

			for (var i = 0; i < keys.length; i++) {
				const field_name = keys[i];
				const field_value: string = temporary_entity.DataValues[field_name];

				if (typeof field_value === "string" && field_value.indexOf("[") >= 0) {
					const detokenised_value = this.ReplaceTokens(field_value, temporary_entity);
					temporary_entity.DataValues[field_name] = detokenised_value;

					if (detokenised_value.indexOf("[") >= 0) {
						throw new Error(`Error: Detokenisation failed in Entity:${temporary_entity.EntityDefinition.Name} - ${field_name}`);
					}
					const entity_field = temporary_entity.EntityDefinition.GetField(field_name);

					// keep track of unique field values
					if (entity_field && entity_field.fieldOptions.isUnique) {
						if (entityInstance.EntityDefinition.HasUniqueValue(field_name, detokenised_value)) {
							if (maxtries == 0) {
								throw new Error(
									`Error: Failed to create unique value for ${entityInstance.EntityDefinition.Name}.${entity_field.fieldName}. Try to define a generator that will create more random values. Adding a random number component may help.`
								);
							}

							ok = false;
							break;
						}

						entityInstance.EntityDefinition.AddUniqueValue(field_name, detokenised_value);
					}
				} else {
					// it's ok that the field is defined but there is no default value or generated value specified
				}
			}

			if (ok) {
				break;
			}
		}

		entityInstance.DataValues = temporary_entity.DataValues;
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
		var value = entity.DataValues[fieldName];

		if (!value) {
			// we failed to get a value, but it's likely because we have a generator which is referencing a related entity, like organisation.name
			value = this.GetEntityFieldValueFromPath(fieldName, entity);
		}

		value = clean ? value.trim().replaceAll(" ", "").toLowerCase() : value;

		return value;
	}

	/**
	 * Replace all tokens with their generated values.
	 * This works recursively where tokens substitute in additional tokens, e.g. [user_email] is replaced with [name]@[organisation].com
	 * @date 7/18/2022 - 3:39:38 PM
	 *
	 * @private
	 * @param {string} fieldValue
	 * @param {CrudioEntityInstance} entity
	 * @returns {string}
	 */
	private ReplaceTokens(fieldValue: string, entity: CrudioEntityInstance | null = null): string {
		do {
			var tokens: string[] | null = fieldValue.match(/\[.*?\]+/g);
			var value: any;

			if (tokens === null) {
				// there are no tokens to process, just a hardcoded value in the entity definition, like, name: "Bob"
				return fieldValue;
			}

			var loop = false;

			tokens.map(t => {
				var token: string = t.replace(/\[|\]/g, "");
				var fieldName: string = token;

				// find parameter characters:
				// ! : get field from context
				// ~ : remove all spaces and convert to lower case
				var params: string[] = fieldName.match(/^\?|!|~|\*/g) || [];
				fieldName = fieldName.slice(params.length);

				const lookup = params.indexOf("!") >= 0;

				// ~ option means remove all spaces and convert to lower case. Useful to create email and domain names
				// We don't clean when deferred otherwise we will change the case of field names used in generators
				const clean = params.indexOf("~") >= 0;

				var query = params.indexOf("?") >= 0;

				if (lookup) {
					// get field value from current context
					if (entity) {
						value = this.ProcessTokensInField(entity, fieldName, clean);
					} else {
						throw new Error(`Error: entity must be specified when using '!' to lookup: ${fieldValue}`);
					}
				} else if (query) {
					if (entity) value = `[${this.GetEntityFieldValueFromPath(fieldName, entity)}]`;
					else throw new Error(`Error: entity must be specified when using '!' to lookup: ${fieldValue}`);
				} else {
					// use a generator
					value = this.GetGeneratedValue(fieldName);
				}

				if (value && clean) {
					value = value.trim().replaceAll(" ", "").toLowerCase();
				}

				fieldValue = fieldValue.replace(`[${token}]`, value);
			});

			// repeat the process if there are still more tokens in the string
			loop = typeof value === "string" && value.includes("[") && value.includes("]");
		} while (loop);

		return fieldValue;
	}

	/**
	 * Get a value from a specified generator
	 * @date 7/18/2022 - 3:39:38 PM
	 *
	 * @private
	 * @param {string} generator_name
	 * @returns {*}
	 */
	public GetGeneratedValue(generator_name: string): any {
		if (!generator_name) throw new Error("generator must specify a standard or customer generator");
		var generator = this.GetGenerator(generator_name);

		if (generator && generator.values) {
			var json_args = null;
			var generator_values = "";

			if (typeof generator.values === "object") {
				generator_values = Object.keys(generator.values)[0];

				if (!generator.values) throw `GetGeneratedValue: '${generator_name}' - could not read generator.values`;

				json_args = generator.values[generator_values];
			} else {
				var content: string = generator.values ?? generator_name;
				generator_values = content.split(" ")[0].toLowerCase().replaceAll("[", "").replaceAll("]", "");
			}

			switch (generator_values) {
				case "uuid":
					return randomUUID();

				case "datetime":
					const dt = CrudioUtils.DateDuration(json_args);
					return DateTime.utc().plus(dt).toFormat(this.date_format);

				case "timestamp":
					const ts = new Date(Date.now()).toISOString().replace("Z", "");
					return ts;
			}
		}

		var value: any = "";

		if (generator) value = generator.values;

		if (value.indexOf("[") >= 0) return value;

		if (!value) value = generator_name;

		if (value.includes(";")) {
			value = CrudioUtils.GetRandomStringFromList(value);
		} else if (value.includes(">")) {
			var vals: string[] = value.split(">");
			value = CrudioUtils.GetRandomNumber(parseInt(vals[0], 10), parseInt(vals[1], 10));
		}

		return value;
	}

	/**
	 * Get a data generator by name
	 * @date 7/28/2022 - 1:30:00 PM
	 *
	 * @private
	 * @param {string} generatorName
	 * @returns {string}
	 */
	private GetGenerator(generatorName: string): ICrudioGenerator {
		return this.generators[generatorName];
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
	public GetEntityFieldValueFromPath(fieldName: string, entity: CrudioEntityInstance): string {
		const path = fieldName.split(".");
		var source = entity;

		for (var i = 0; i < path.length - 1; i++) {
			const child_entity_name = path[i];
			source = source.DataValues[child_entity_name];

			if (!source) throw new Error(`Field '${child_entity_name}' did not resolve from entity type '${entity.EntityDefinition.Name}'`);
		}

		if (!source) {
			throw "whoops";
		}

		const source_field_name = path[path.length - 1];
		const value = source.DataValues[source_field_name];

		if (!value) {
			throw "whoops";
		}

		return value;
	}

	//#endregion

	//#region Triggers

	/**
	 * Load triggers which get executed when a specific entity type is created
	 * @date 7/25/2022 - 9:41:03 AM
	 *
	 * @private
	 */
	private LoadTriggers(triggers: ICrudioTrigger[]): void {
		triggers.map(t => {
			this.triggers[t.entity] = t.scripts;
		});
	}

	/**
	 * When an entity is created, scripts can be triggered which build and connect a related object graph
	 *
	 * @date 7/25/2022 - 9:41:03 AM
	 *
	 * @private
	 * @param {CrudioEntityInstance} entityInstance
	 * @param {ICrudioTriggers} triggers
	 */
	private ProcessTriggersForEntity(entityInstance: CrudioEntityInstance): void {
		// We have to detokenise the entity as other entities which are connected to it through a trigger, may be using lookups

		// For each new entity, run the script
		const triggers = this.triggers[entityInstance.EntityDefinition.Name];
		if (!triggers) return;

		triggers.map((s: any) => {
			this.ExecuteTrigger(entityInstance, s);
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
	private ExecuteTrigger(parent_entity: CrudioEntityInstance, script: string): void {
		const query_index = script.indexOf("?");
		const query = script.slice(query_index + 1);
		const parts = script.slice(0, query_index).split(".");
		var field_name = parts[0];
		var entity_type = parts[1];
		var row_index = -1;

		const bracket = field_name.indexOf("(");
		if (bracket > -1) {
			if (field_name.indexOf(")") < 0) {
				throw new Error(`Error: Syntax error - missing ')' in ${script}`);
			}

			const index_text = field_name.slice(bracket + 1, field_name.indexOf(")", bracket + 1));
			const row_parts = index_text.split("-");
			var row_start = Number(row_parts[0]);
			var row_end: number;

			row_end = row_parts.length == 2 ? Number(row_parts[1]) : (row_end = row_start);

			if (row_start === NaN || row_end === NaN) {
				throw new Error(`Error: Syntax error - invalid row index in ${script}`);
			}

			row_index = row_start;

			field_name = field_name.slice(0, bracket).replaceAll("]", "");
		}

		// When we get the entity by index below, it will be connected to this target entity
		var rows = this.ExecuteCrudioQuery(entity_type, query);
		if (rows.length == 0) {
			throw new Error(`Error: Failed to find ${entity_type} matching query: ${query}`);
		}

		const target_connection = rows[0];

		for (var ri = row_start; ri <= row_end; ri++) {
			this.ConnectChildWithRelatedEntity(parent_entity, field_name, row_index, target_connection);
		}
	}

	/**
	 * For a given entity type, get data rows matching a simple query, e.g. user=Bob
	 * @date 7/25/2022 - 9:41:03 AM
	 *
	 * @private
	 * @param {string} entityDefinition
	 * @param {string} query
	 * @returns {CrudioEntityInstance}
	 */
	public ExecuteCrudioQuery(entityDefinition: string, query: string | null): CrudioEntityInstance[] {
		const table = this.GetTableForEntityDefinition(entityDefinition);

		// If a table is requested during the construction of the object graph, then we have to try and fill it with data
		// So that referencing entities will have target rows to connect to
		if (table.DataRows.length == 0) {
			this.FillTable(table);
			this.ProcessAllTokensInTable(table);
		}

		const rows = table.DataRows;

		if (rows.length == 0) {
			throw new Error(`Error: Source table ${entityDefinition} has no rows, executing query ${query ?? "*"}`);
		}

		if (!query || query === "*" || (query && query.trim().length == 0)) {
			return rows;
		}

		const parts = query.split("=");
		const field = parts[0];
		const value = parts[1];

		if (!parts || !field || !value) throw new Error(`Error: Querying entity type: ${entityDefinition}. Syntax error in query: ${query}. Format is ?fieldname=value `);

		const results = table.DataRows.filter(r => r.DataValues[field] === value);

		return results;
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
		if (!parent_entity.DataValues[field_name]) {
			parent_entity.DataValues[field_name] = [];
		}

		// get the Users list from the organisation
		const parent_array: CrudioEntityInstance[] = parent_entity.DataValues[field_name];
		const entity_definition = this.GetEntityDefinitionFromTableName(field_name);

		// if we are, for example, requesting User[3] then we need to ensure the Users array for the Organisation has
		// at least 3 entities. If not we just create enough entities to fill the array up to the required index value
		if (parent_array.length < row_index + 1) {
			while (parent_array.length < row_index + 1) {
				const new_entity = this.CreateEntityInstance(entity_definition);
				const global_table = this.GetTableForEntityName(entity_definition.Name);

				// add the new entity to the global table
				global_table.DataRows.push(new_entity);

				this.ConnectRows(new_entity, parent_entity);

				if (new_entity.EntityDefinition.HasManyToManyRelationship(target_connection.EntityDefinition)) {
					const joinTable = this.GetManyToManyTable(new_entity.EntityDefinition, target_connection.EntityDefinition);
					this.CreateManyToManyRow(joinTable, new_entity.DataValues[this.config.idField], target_connection.DataValues[this.config.idField]);
				} else {
					this.ConnectRows(new_entity, target_connection);
				}
			}
		} else if (entity_definition.HasManyToManyRelationship(target_connection.EntityDefinition)) {
			const source = parent_array[row_index];
			const joinTable = this.GetManyToManyTable(entity_definition, target_connection.EntityDefinition);
			this.CreateManyToManyRow(joinTable, source.DataValues[this.config.idField], target_connection.DataValues[this.config.idField]);
		}

		if (row_index > parent_array.length) {
			throw new Error(`Error: Failed to generate entity for index ${row_index} in ${parent_entity.EntityDefinition}`);
		}
	}

	/**
	 * Description placeholder
	 * @date 11/10/2022 - 17:39:59
	 *
	 * @private
	 * @param {CrudioEntityDefinition} source
	 * @param {CrudioEntityDefinition} target
	 * @returns {CrudioTable}
	 */
	private GetManyToManyTable(source: CrudioEntityDefinition, target: CrudioEntityDefinition): CrudioTable {
		const table = this.Tables.filter(t => t.EntityDefinition.SourceRelationship && t.EntityDefinition.SourceRelationship.FromEntity === source.Name && t.EntityDefinition.SourceRelationship.ToEntity === target.Name);

		return table[0];
	}

	//#endregion

	//#region hard code value assignments

	/**
	 * Load hard coded assignments
	 * @date 8/2/2022 - 12:57:37 PM
	 *
	 * @private
	 * @param {*} datamodel
	 */
	private LoadAssignments(datamodel: ICrudioSchemaDefinition): void {
		this.assign = datamodel.assign;
	}

	/**
	 * Assign hard coded values to specified entity fields
	 * @date 8/2/2022 - 12:32:13 PM
	 *
	 * @private
	 */
	private ProcessAssignments(): void {
		this.assign.map(a => {
			this.ProcessAssignment(a);
		});
	}

	/**
	 * Description placeholder
	 * @date 8/2/2022 - 12:57:37 PM
	 *
	 * @private
	 * @param {string} instruction
	 */
	private ProcessAssignment(assignment: ICrudioAssignment): void {
		const target: CrudioEntityInstance = this.GetObjectFromPath(assignment.target);

		if (!target) {
			throw new Error(`Error: can not retrieve the target object specified in '${assignment.target}'`);
		}

		Object.keys(assignment.fields).map(f => {
			if (target[f] == undefined) {
				throw new Error(`Error: Invalid assignment. Field ${f} does not exist on entity type ${target.EntityDefinition.Name}.`);
			}
			target[f] = assignment.fields[f];
		});
	}

	/**
	 * Description placeholder
	 * @date 8/2/2022 - 12:57:37 PM
	 *
	 * @private
	 * @param {string} path
	 * @returns {CrudioEntityInstance}
	 */
	private GetObjectFromPath(path: string): CrudioEntityInstance {
		const parts = path.split(".");

		if (parts.length < 1) {
			throw new Error(`Error: invalid assignment syntax in '${path}'`);
		}

		var obj = null;

		for (var i = 0; i < parts.length; i++) {
			var p = parts[i];

			var index = -1;
			var start = p.indexOf("(") + 1;

			if (start > 0) {
				var end = p.indexOf(")");
				var val = p.substring(start, end);
				index = Number.parseInt(val);
				p = p.substring(0, start - 1);

				if (index === NaN) {
					throw new Error(`Error: failed to find a numeric index for ${p} in '${path}'`);
				}
			}

			obj = this.GetTable(p).DataRows;
			if (index >= 0) {
				obj = obj[index].DataValues;
			}
		}

		return obj;
	}

	//#endregion
}
