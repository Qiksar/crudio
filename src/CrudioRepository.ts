import { stringify, parse } from "flatted";
import * as fs from "fs";
import { randomUUID } from "crypto";
import { DateTime } from "luxon";

import { ICrudioFieldOptions, ICrudioSchemaDefinition, ISchemaRelationship } from "./CrudioTypes";
import CrudioEntityType from "./CrudioEntityType";
import CrudioEntityInstance from "./CrudioEntityInstance";
import CrudioField from "./CrudioField";
import CrudioEntityRelationship from "./CrudioEntityRelationship";
import CrudioTable from "./CrudioTable";

export default class CrudioRepository {
	//#region Properties

	// This entity properties are ignored when looking for fields to populate with random data
	private ignoreFields = ["inherits", "abstract", "relationships", "count", "seed_by"];
	public defaultRowCount = 50;

	public generators: Record<string, unknown> = {};
	public tables: CrudioTable[] = [];
	public entities: CrudioEntityType[] = [];
	public relationships: CrudioEntityRelationship[] = [];

	private entityId: number = 1;
	public getEntityId(): number {
		return this.entityId++;
	}

	//#endregion

	constructor(repo: ICrudioSchemaDefinition) {
		this.ProcessIncludes(repo);

		this.generators = { ...repo.generators };

		this.LoadEntityDefinitions(repo);
		this.CreateDataTables(this.entities);
		this.FillDataTables();
	}

	//#region Initialise repository, entities and relationships

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

	private ProcessIncludes(repo: ICrudioSchemaDefinition): void {
		if (repo.include) {
			repo.include.map((filename: any) => {
				this.Merge(filename, repo);
			});
		}
	}

	// Merge an external repository into the current one
	// This works recursively so the repository being merged can also include (merge) other repositories
	private Merge(filename: string, repo: ICrudioSchemaDefinition) {
		const input: ICrudioSchemaDefinition = CrudioRepository.LoadJson(filename);

		if (input.include) this.ProcessIncludes(input);

		if (input.generators) {
			Object.values(input.generators).map((group: any) => {
				repo.generators = { ...repo.generators, ...group };
			});
		}

		if (input.entities) repo.entities = { ...repo.entities, ...input.entities };

		if (input.relationships) repo.relationships = { ...repo.relationships, ...input.relationships };
	}

	private LoadEntityDefinitions(repo: ICrudioSchemaDefinition): void {
		this.entities = [];

		var eKeys: string[] = Object.keys(repo.entities);

		// create the basic entity structures
		for (var index: number = 0; index < eKeys.length; index++) {
			var entityname: string = eKeys[index];
			var entitySchema: any = repo.entities[entityname];
			this.CreateEntity(entitySchema, entityname);
		}
	}

	private CreateEntity(entityDefinition: any, entityname: string) {
		var entity: CrudioEntityType = this.CreateEntityType(entityname);
		entity.max_row_count = entityDefinition.count ?? this.defaultRowCount;

		var fKeys: string[] = Object.keys(entityDefinition).filter(f => !this.ignoreFields.includes(f));

		if (entityDefinition.abstract) entity.abstract = true;

		// copy inherited fields from the base entity
		if (entityDefinition.inherits) {
			this.InheritBaseFields(entityDefinition.inherits, entity);
		}

		for (var findex: number = 0; findex < fKeys.length; findex++) {
			var fieldname: string = fKeys[findex];
			var fieldSchema: any = entityDefinition[fieldname];

			const fieldOptions: ICrudioFieldOptions = {
				isUnique: fieldSchema.unique,
				generator: fieldSchema.generator,
				isKey: fieldSchema.key,
				sensitiveData: fieldSchema.sensitiveData === undefined ? false : fieldSchema.sensitiveData,
				defaultValue: fieldSchema.default === undefined ? null : fieldSchema.default,
			};

			entity.AddField(fieldname, fieldSchema.type, fieldname, fieldOptions);
		}

		if (entityDefinition.relationships) {
			entityDefinition.relationships.map((r: ISchemaRelationship) => {
				const new_rel = new CrudioEntityRelationship({
					from: entity.name,
					...r,
				});

				entity.relationships.push(new_rel);

				// cache relationships globally
				this.relationships.push(new_rel);
			});
		}
	}

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

	// Find an entity type which has already been defined in the repo
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

	public GetTableForEntityName(name: string): CrudioTable {
		return this.tables.filter(t => t.entity === name)[0];
	}

	// Create an entity type based on its definition in the repo
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

	private CreateDataTables(entities: CrudioEntityType[]) {
		entities.map((e: CrudioEntityType) => {
			if (!e.abstract) {
				var t: CrudioTable = new CrudioTable();
				t.name = this.GetClassName(e.tableName);
				t.entity = this.GetClassName(e.name);

				this.tables.push(t);
			}
		});
	}

	GetClassName(input: string): string {
		var converter: any = function (matches: string[]) {
			return matches[1].toUpperCase();
		};

		var result: any = input.replace(/(\-\w)/g, converter);
		result = result.charAt(0).toUpperCase() + result.slice(1);

		return result;
	}

	private ConnectRelationships(): void {
		this.entities.map(e => {
			e.relationships.map(r => {
				if (r.RelationshipType === "one") {
					this.JoinOneToMany(r);
				}
			});
		});
	}

	private JoinOneToMany(r: CrudioEntityRelationship): void {
		var sourceTable: CrudioTable = this.GetTableForEntity(r.FromEntity)!;
		var targetTable: CrudioTable = this.GetTableForEntity(r.ToEntity)!;

		if (sourceTable === null) {
			throw new Error(`Can not find source '${r.FromEntity}'`);
		}

		if (targetTable === null) {
			throw new Error(`Can not find target '${r.ToEntity}'`);
		}

		// initialise all target entities with an empty array to receive referencing entities
		targetTable.rows.map((row: CrudioEntityInstance) => {
			if (row.values[r.FromEntity] === undefined) {
				row.values[sourceTable.name] = [];
			}
		});

		var index: number = 0;
		// randomly distribute the source records over the target table
		sourceTable.rows.map((sourceRow: CrudioEntityInstance) => {
			// every target must get at least one source record connected to it
			// as this avoids having empty arrays
			// use index to assign the first n relationships and after that use
			// random values to distribute the records
			var targetRow: CrudioEntityInstance = targetTable.rows[index > targetTable.rows.length - 1 ? CrudioRepository.GetRandomNumber(0, targetTable.rows.length - 1) : index++];

			// the source points to a single target record
			sourceRow.values[targetTable.entity] = targetRow;

			// the target has a list of records which it points back to
			targetRow.values[sourceTable.name].push(sourceRow);
		});
	}

	// Get the datatable of values for an entity type
	public GetTable(name: string): CrudioTable {
		var matches: CrudioTable[] = this.tables.filter((t: CrudioTable) => t.name === name);

		if (matches.length === 0) {
			throw new Error(`Table '${name}' not found`);
		}

		return matches[0];
	}

	// Get the datatable of values for an entity type
	public GetTableForEntity(name: string): CrudioTable {
		var matches: CrudioTable[] = this.tables.filter((t: CrudioTable) => t.entity === name);

		if (matches.length === 0) {
			throw new Error(`Table for entity '${name}' not found`);
		}

		return matches[0];
	}
	//#endregion

	//#region Serialisation

	public static FromJson(filename: string): CrudioRepository {
		const json_object = this.LoadJson(filename);
		return new CrudioRepository(json_object);
	}

	public static LoadJson(filename: string): any {
		var input = fs.readFileSync(filename, "utf8");
		const json_object = JSON.parse(input);

		return json_object;
	}

	public static FromString(input: string): CrudioRepository {
		input = input.trim();

		// wrap JSON in array
		if (input[0] != "[") input = "[" + input + "]";

		const repo: CrudioRepository = parse(input);
		CrudioRepository.SetPrototypes(repo);

		return repo;
	}

	public ToString(): string {
		var serialised: string = stringify(this);

		if (serialised.length === 0) {
			throw new Error("Serialization error - empty string returned from stringify");
		}

		return serialised;
	}

	public Save(filename: string): void {
		fs.writeFileSync(filename, this.ToString());
	}

	//#endregion

	//#region Fill data tables

	private FillDataTables(): void {
		this.DropData();

		// create data for each table
		const tables = this.tables.filter((t: any) => !t.abstract);

		tables.map((t: CrudioTable) => {
			this.FillTable(t);
		});

		// process relationships and connect entities
		this.ConnectRelationships();
		this.ProcessTokensInAllTables();
	}

	FillTable(table: CrudioTable): void {
		var entity: CrudioEntityType | null = this.GetEntityDefinition(table.entity, true);
		var records: CrudioEntityInstance[] = [];

		for (var c: number = 0; c < entity.max_row_count; c++) {
			records.push(this.CreateEntityInstance(entity));
		}

		table.rows = records;
	}

	private CreateEntityInstance(entityType: CrudioEntityType): CrudioEntityInstance {
		var entity: CrudioEntityInstance = entityType.CreateInstance({});

		entityType.fields.map(field => {
			var generator: string | undefined = field.fieldOptions.generator;
			entity.values[field.fieldName] = generator;
		});

		return entity;
	}

	private DropData(): void {
		this.tables.map((t: CrudioTable) => {
			delete t.rows;
		});
	}

	//#endregion

	//#region Get data from tables

	GetAllRows(tableName: string): CrudioEntityInstance[] {
		var t: CrudioTable | null = this.GetTable(tableName);
		if (t !== null) {
			return t.rows;
		} else {
			throw new Error(`${tableName} : table not found`);
		}
	}

	GetRowByID(rows: CrudioEntityInstance[], id: number): CrudioEntityInstance | null {
		for (var index: number = 0; index < rows.length; index++) {
			if (rows[index].values._id === id) {
				return rows[index];
			}
		}

		return null;
	}

	//#endregion

	//#region Populate entity data fields

	private CreateUniqueKeyCache(entityTypeName: string): any {
		const unique_keys = {};

		const entityType = this.GetEntityDefinition(entityTypeName);
		entityType.fields.map(f => {
			if (f.fieldOptions.isUnique) {
				unique_keys[f.fieldName] = [];
			}
		});

		return unique_keys;
	}

	private ProcessTokensInAllTables(): void {
		this.tables.map(table => {
			const unique_keys = this.CreateUniqueKeyCache(table.entity);
			table.rows.map(entityInstance => {
				var ok = false;
				var maxtries = 1000;

				while (!ok && maxtries-- > 0) {
					if (maxtries == 0) {
						throw new Error(`Error: Failed to create unique value for ${table.name}`);
					}

					ok = this.ProcessTokensInEntity(entityInstance, unique_keys);
				}
			});
		});
	}

	private ProcessTokensInEntity(entityInstance: CrudioEntityInstance, unique_keys: {}): boolean {
		// as we generate the entity a field may require unique values, like a unique database constrain on a field
		// field values can be based on the values of other fields in the entity, like email:first.last@email.com
		// if the email value created is not unique, the entire entity is rejected so a new first and last name can be created, to form a new unique email
		// so, for that reason we have to create a duplicate entity, and only overwrite the input entity on complete successful generation of the correct field values

		const new_instance = new CrudioEntityInstance(entityInstance.entityType);
		new_instance.values = { ...entityInstance.values };

		const keys = Object.keys(new_instance.values);

		for (var i = 0; i < keys.length; i++) {
			const field_name = keys[i];
			const field_value: string = new_instance.values[field_name];
			var value_type = typeof field_value;

			if (value_type === "string" && field_value.indexOf("[") >= 0) {
				const detokenised_value = this.ReplaceTokens(field_value, new_instance);
				new_instance.values[field_name] = detokenised_value;

				if (detokenised_value.indexOf("[") >= 0) {
					throw new Error(`Error: Detokenisation failed in ${new_instance.entityType.name}- ${field_name}`);
				}
				const entity_field = new_instance.entityType.GetField(field_name);

				// keep track of unique field values
				if (entity_field && entity_field.fieldOptions.isUnique) {
					if (unique_keys[field_name].indexOf(detokenised_value.toLowerCase().trim()) >= 0) {
						return false;
					}

					unique_keys[field_name].push(detokenised_value.toLowerCase().trim());
				}
			} else {
				// it's ok that the field is defined but there is no default value or generated value specified
			}
		}

		entityInstance.values = { ...new_instance.values };
		return true;
	}

	private ProcessTokensInField(entity: CrudioEntityInstance, fieldName: string, clean: boolean): string {
		var value = entity.values[fieldName];

		if (!value) {
			// we failed to get a value, but it's likely because we have a generator which is referencing a related entity, like organisation.name
			const path = fieldName.split(".");
			var source = entity;

			for (var i = 0; i < path.length - 1; i++) {
				const child_entity_name = path[i];
				source = source.values[child_entity_name];
			}

			const source_field_name = path[path.length - 1];
			value = source.values[source_field_name];
		}

		value = clean ? value.trim().replaceAll(" ", "").toLowerCase() : value;

		return value;
	}

	private ReplaceTokens(fieldValue: string, entity: CrudioEntityInstance): string {
		var tokens: string[] | null = fieldValue.match(/\[.*?\]+/g);
		var value: any;

		if (tokens === null) {
			// there are no tokens to process, just a hardcoded value in the entity definition, like, name: "Bob"
			return fieldValue;
		}

		tokens.map(t => {
			var token: string = t.replace(/\[|\]/g, "");
			var fieldName: string = token;

			// find parameter characters:
			// ! : get field from context
			// ~ : remove all spaces and convert to lower case
			var params: string[] = fieldName.match(/^\?|!|~|\*/g) || [];
			fieldName = fieldName.slice(params.length);

			const lookup = params.indexOf("!") >= 0;
			const clean = params.indexOf("~") >= 0;

			if (lookup) {
				// get field value from current context
				value = this.ProcessTokensInField(entity, fieldName, clean);
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
		});

		return fieldValue;
	}

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

	public static GetRandomNumber(min: number, max: number): number {
		var rndValue: number = Math.random();
		return Math.floor((max - min) * rndValue) + min;
	}

	//#endregion
}
