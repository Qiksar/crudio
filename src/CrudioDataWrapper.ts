import {
	ICrudioDataWrapper,
	ICrudioConfig,
	ICrudioDbSchema,
	ISchemaTable,
	ISchemaRelationship,
	ISchemaColumn,
	ICrudioEntityType,
	ICrudioFieldOptions,
	ICrudioReadResult,
	ICrudioEntityInstance
} from './CrudioTypes';

import CrudioGQL from './CrudioGQL';
import CrudioEntityType from './CrudioEntityType';
import CrudioEntityInstance from './CrudioEntityInstance';
import CrudioQuery from './CrudioQuery';

export default class CrudioDataWrapper implements ICrudioDataWrapper {
	entities: CrudioEntityType[] = [];
	gql: CrudioGQL;
	table_sql: string;
	foreignKey_sql: string;
	column_sql: string;
	config: ICrudioConfig;
	aliases: any = {};
	graphFields: any = {};
	augment: any = {};

	constructor(config: ICrudioConfig, augment: any = null) {
		this.config = config;
		this.augment = augment;

		this.gql = new CrudioGQL(this.config);

		this.table_sql = `
        SELECT table_name AS TableName FROM information_schema.tables WHERE table_schema = '${config.targetSchema}'
        UNION
        SELECT table_name AS TableName FROM information_schema.views WHERE table_schema = '${config.targetSchema}'
        ORDER BY TableName;
        `;

		this.foreignKey_sql = `
        SELECT tc.table_name AS Source, kcu.column_name AS SourceColumn, ccu.table_name AS Target, ccu.column_name AS TargetColumn
        FROM information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu ON tc.constraint_name = kcu.constraint_name AND kcu.constraint_schema = '${config.targetSchema}'
        JOIN information_schema.constraint_column_usage AS ccu ON ccu.constraint_name = tc.constraint_name AND ccu.constraint_schema = '${config.targetSchema}'
        WHERE constraint_type = 'FOREIGN KEY'
        AND tc.table_schema = '${config.targetSchema}'
        ORDER BY Source, SourceColumn;
        `;

		this.column_sql = `
        SELECT tc.table_name AS TableName, tc.column_name AS ColumnName, tc.ordinal_position AS Position, tc.column_default AS DefaultValue, tc.is_nullable AS IsNullable, tc.data_type AS DataType, tc.character_maximum_length AS MaximumLength, tc.is_identity AS IsKey, tc.is_generated AS IsGenerated
        FROM information_schema.columns AS tc
        WHERE tc.table_schema = '${config.targetSchema}'
        ORDER BY TableName, Position;
        `;
	}

	//#region AUGMENT SCHEMA

	AugmentSchema(): ICrudioDataWrapper {
		if (this.augment && this.augment.flatten) {
			this.FlattenGraphFields(this.augment.flatten);
		}

		return this;
	}

	FlattenGraphFields(flatten: any): void {
		Object.keys(flatten).map((k) => {
			var entity: ICrudioEntityType | null = this.GetEntityDefinition(k, true);
			var mapping: any = flatten[k];

			Object.keys(mapping).map((entityName) => {
				var fieldList: string = mapping[entityName];
				entity!.AddGraphField(entityName, fieldList);
			});
		});
	}

	//#endregion

	//#region MANAGE ENTITIES

	public AddEntityToModel(name: string, table?: string): CrudioEntityType {
		// de-pluralize Customers = Customer
		var n: string;
		var t: string;

		if (!name || name.length === 0) {
			throw new Error('name is required');
		}

		if (!table) {
			t = name;
			n = t.substring(0, t.length - 1);
		} else {
			n = name;
			t = table;
		}

		var entity: CrudioEntityType = new CrudioEntityType(n, t);
		this.entities.push(entity);

		return entity;
	}

	public GetEntityDefinitionFromTableName(name: string, failIfNotFound: boolean = true): CrudioEntityType | null {
		if (this.entities.length === 0) {
			if (failIfNotFound) {
				throw new Error("No entities are registered in the model, therefore cannot find '" + name + "'");
			}

			return null;
		}

		for (var i: number = 0; i < this.entities.length; i++) {
			if (this.entities[i].tableName === name) {
				return this.entities[i];
			}
		}

		if (failIfNotFound) {
			throw new Error("Model does not contain entity '" + name + "'");
		}

		return null;
	}

	public GetEntityDefinition(name: string, failIfNotFound?: boolean): ICrudioEntityType | null {
		if (this.entities.length === 0) {
			if (failIfNotFound) {
				throw new Error("No entities are registered in the model, therefore cannot find '" + name + "'");
			}

			return null;
		}

		for (var i: number = 0; i < this.entities.length; i++) {
			if (this.entities[i].name === name || this.entities[i].tableAlias === name) {
				return this.entities[i];
			}
		}

		if (failIfNotFound) {
			throw new Error("Model does not contain entity '" + name + "'");
		}

		return null;
	}

	//#endregion

	//#region SQL COMMANDS

	public async ExecuteSQL(sql_statement: string): Promise<{}[]> {
		// console.log(sql_statement);
		var data: [][] = await this.gql.ExecuteSQL(sql_statement);

		if (!data || data.length === 0) {
			return [];
		}

		var headers: [] = data[0];
		var objects: {}[] = [];
		var row: number = 1;

		while (row < data.length) {
			var values: [] = data[row];
			var obj: {} = {};

			for (var i: number = 0; i < headers.length; i++) {
				obj[headers[i]] = values[i];
			}

			objects.push(obj);
			row++;
		}

		return objects;
	}

	//#endregion

	//#region QUERY / MUTATIONS

	public async ReadFlat(query: CrudioQuery, limit?: number, offset?: number): Promise<{}[]> {
		var graphResult: ICrudioReadResult = await this.Read(query);
		return this.FlattenDataset(graphResult.graphData);
	}

	public async Read(query: CrudioQuery, limit?: number, offset?: number): Promise<ICrudioReadResult> {
		query.limit = limit;
		query.offset = offset;

		var tableName: string = query.entity.tableName;
		var request: any = this.gql.GetGqlQuery(this, query);

		var result: any = await this.gql.Execute(request);

		if (result.errors && result.errors.length > 0) {
			console.log('*************************************************************');
			console.log(request);
			console.log('*************************************************************');
			console.log(result);
	
			throw new Error('Read error : ' + result.errors[0].message);
		}

		var key: string = tableName + '_aggregate';

		return {
			totalItems: result.data[key].aggregate.count,
			graphData: result.data[tableName],
			query: request.query
		} as ICrudioReadResult;
	}

	public async Insert(entity: ICrudioEntityInstance): Promise<any> {
		var request: {} = this.gql.GetGqlInsertAndGetId(entity);
		var result: any = await this.gql.Execute(request);
		// console.log(result);

		if (result.errors && result.errors.length > 0) {
			throw new Error('Insert mutation error : ' + result.errors[0].message);
		}

		var id: number = (Object.values(result.data)[0] as any).returning[0].Id;

		entity.values.Id = id;

		if (id < 1) {
			throw new Error('Create: expected insert statement to return an entity id > 0');
		}

		return id;
	}

	public async Update(entity: CrudioEntityInstance): Promise<any> {
		entity.CheckId(entity);

		var request: {} = this.gql.GetGqlUpdate(entity);
		var result: any = await this.gql.Execute(request);

		if (result.errors && result.errors.length > 0) {
			throw new Error('Update mutation error : ' + result.errors[0].message);
		}

		var row_count: number = (Object.values(result.data)[0] as any).affected_rows;

		if (row_count !== 1) {
			throw new Error(
				'Update: statement is expected to affect 1 row but the number of rows affected was ' + row_count
			);
		}

		return true;
	}

	public async Delete(entity: CrudioEntityInstance): Promise<any> {
		entity.CheckId(entity);

		if (!entity.values || !entity.values.Id) {
			throw new Error('Delete: entity must have values and values.Id must be non-zero');
		}

		var request: {} = this.gql.GetGqlDelete(entity);
		var result: any = await this.gql.Execute(request);

		if (result.errors && result.errors.length > 0) {
			throw new Error('Delete mutation error : ' + result.errors[0].message);
		}

		var row_count: number = (Object.values(result.data)[0] as any).affected_rows;

		if (row_count !== 1) {
			throw new Error(
				'Delete: statement is expected to affect 1 row but the number of rows affected was ' + row_count
			);
		}

		return true;
	}

	//#endregion

	//#region IMPORT MODEL FROM DATABASE

	public async ImportSchema(readonlyFields?: string[]): Promise<CrudioDataWrapper> {
		var tables: ISchemaTable[] = (await this.ExecuteSQL(this.table_sql)) as ISchemaTable[];
		var relationships: ISchemaRelationship[] = (await this.ExecuteSQL(
			this.foreignKey_sql
		)) as ISchemaRelationship[];
		var columns: ISchemaColumn[] = (await this.ExecuteSQL(this.column_sql)) as ISchemaColumn[];

		var schema: ICrudioDbSchema = {
			tables,
			relationships,
			columns,
			readonlyFields: readonlyFields
		};

		this.BuildFromSchema(schema);
		this.AugmentSchema();

		return this;
	}

	private BuildFromSchema(schema: ICrudioDbSchema): CrudioDataWrapper {
		this.entities = [];

		// build entities with columns
		schema.tables.map((t) => {
			var entity: ICrudioEntityType = this.AddEntityToModel(t.tablename);
			var columns: ISchemaColumn[] = schema.columns.filter((c) => c.tablename === t.tablename);

			if (columns.length < 1) {
				throw new Error(`BuildFromSchema: '${entity.name}' has no columns`);
			}

			columns.map((c) => {
				var options: ICrudioFieldOptions = { canSort: true };
				var caption: string = this.GetFieldCaption(c.columnname);

				if (c.iskey === 'YES' || c.columnname === 'Id') {
					entity.AddKey(c.columnname, caption);
				} else {
					entity.AddField(c.columnname, this.GetDbType(c.datatype), caption, options);
				}
			});
		});

		// relationships between entities
		schema.tables.map((table) => {
			var entity: CrudioEntityType | null = this.GetEntityDefinitionFromTableName(table.tablename, true);
			var entityRelationships: ISchemaRelationship[] = schema.relationships.filter(
				(rel) => rel.source === table.tablename
			);

			entityRelationships.map((r) => {
				var name: string = this.GetRelationshipName(entity!.name, entityRelationships, r);

				var target: CrudioEntityType | null = this.GetEntityDefinitionFromTableName(r.target);

				var alias: string = r.sourcecolumn;
				alias = alias.substr(0, alias.length - 2);
				target!.SetAlias(alias);

				entity!.AddRelation(entity!, r.sourcecolumn, target!, r.targetcolumn, name);
			});
		});

		// set read-only state on specific fields
		schema.tables.map((t) => {
			var entity: ICrudioEntityType | null = this.GetEntityDefinitionFromTableName(t.tablename);

			entity!.fields.map((f) => {
				if (this.config.readonlyFields.includes(f.fieldName)) {
					f.fieldOptions.readonly = true;
				}
			});
		});

		return this;
	}

	GetRelationshipName(
		entityTypeName: string,
		entityRelationships: ISchemaRelationship[],
		relationship: ISchemaRelationship
	): string {
		var relname: string = entityTypeName;
		var multiRel: ISchemaRelationship[] = entityRelationships.filter((mr) => mr.target === relationship.target);

		if (multiRel.length > 1) {
			var col: string = relationship.sourcecolumn;
			if (col.toLowerCase().endsWith('id')) {
				col = col.substring(0, col.length - 2);
			}

			relname = relname + '_' + col;
		}

		return relname;
	}

	private GetFieldCaption(fieldName: string): string {
		return fieldName.split(/(?=[A-Z])/).join(' ').trim();
	}

	private GetDbType(inType: string): string {
		switch (inType) {
			case 'bigint':
			case 'integer':
			case 'smallint':
				return 'number';

			case 'boolean':
				return 'boolean';

			case 'real':
			case 'money':
			case 'double precision':
				return 'number';

			case 'text':
			case 'character varying':
				return 'string';

			case 'date':
			case 'time':
			case 'time without time zone':
			case 'time with time zone':
				return 'date';

			case 'timestamp':
			case 'timestamp with time zone':
			case 'timestamp without time zone':
				return 'timestamp';

			case 'uuid':
				return 'uuid';

			default:
				throw new Error(`${inType} is not handled by Crudio`);
		}
	}

	//#endregion

	//#region PROCESS DATA SETS

	private FlattenDataset(graph: {}[]): {}[] {
		var data: {}[] = [];

		for (var index: number = 0; index < graph.length; index++) {
			var row: any = {};
			var source: any = graph[index];

			Object.keys(source).map((key) => {
				var value: any = source[key];

				if (value) {
					if (typeof value === 'object') {
						Object.keys(value).map((vk) => {
							row[vk] = value[vk];
						});
					} else {
						row[key] = value;
					}
				}
			});
			data.push(row);
		}

		return data;
	}

	//#endregion
}
