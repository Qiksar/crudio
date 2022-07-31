import CrudioRepository from "./CrudioRepository";
import CrudioField from "./CrudioField";
import CrudioGQL from "./CrudioGQL";
import CrudioTable from "./CrudioTable";
import { ICrudioConfig } from "./CrudioTypes";
import CrudioEntityDefinition from "./CrudioEntityDefinition";

/**
 * Cache of SQL instructions which is built and executed to create tables, relationships and sample data
 * @date 7/18/2022 - 1:46:23 PM
 *
 * @class SqlInstructionList
 * @typedef {SqlInstructionList}
 */
class SqlInstructionList {
	/**
	 * List of fields on the current table
	 * @date 7/18/2022 - 1:46:23 PM
	 *
	 * @type {{}}
	 */
	public table_field_list: string[] = [];
	/**
	 * SQL definitions for the columns on the current table
	 * @date 7/18/2022 - 1:46:23 PM
	 *
	 * @type {string}
	 */
	public table_column_definitions: string = "";
	/**
	 * Concatenated version of field names
	 * @date 7/18/2022 - 1:46:23 PM
	 *
	 * @type {string}
	 */
	public table_column_names: string = "";

	/**
	 * SQL to create foreign key relationships for all tables
	 * @date 7/18/2022 - 1:46:23 PM
	 *
	 * @type {string}
	 */
	public create_foreign_keys: string = "";

	/**
	 * SQL to insert data table values
	 * @date 7/18/2022 - 1:46:23 PM
	 *
	 * @type {string}
	 */
	public insert_table_rows: string = "";
}

/**
 * Data management wrapper which interfaces with the database through the Hasura Grapql interface
 * @date 7/18/2022 - 1:46:23 PM
 *
 * @export
 * @class CrudioDataWrapper
 * @typedef {CrudioDataWrapper}
 */
export default class CrudioDataWrapper {
	/**
	 * GraphQL interface
	 * @date 7/18/2022 - 1:46:23 PM
	 *
	 * @type {CrudioGQL}
	 */
	private gql: CrudioGQL;
	/**
	 * System configuration
	 * @date 7/18/2022 - 1:46:23 PM
	 *
	 * @type {ICrudioConfig}
	 */
	private config: ICrudioConfig;
	/**
	 * Schema definition
	 * @date 7/18/2022 - 1:46:23 PM
	 *
	 * @type {CrudioRepository}
	 */
	private repo: CrudioRepository;

	/**
	 * Creates an instance of CrudioDataWrapper.
	 * @date 7/18/2022 - 1:46:23 PM
	 *
	 * @constructor
	 * @param {ICrudioConfig} config
	 * @param {CrudioRepository} repo
	 */
	constructor(config: ICrudioConfig, repo: CrudioRepository) {
		this.config = { ...config };
		if (repo.TargetDbSchema) this.config.schema = repo.TargetDbSchema;

		this.gql = new CrudioGQL(this.config);
		this.repo = repo;
	}

	/**
	 * Drop schema and recreate with no tables
	 * @date 7/18/2022 - 1:46:23 PM
	 *
	 * @public
	 * @async
	 * @returns {*}
	 */
	public async CreateDatabaseSchema(): Promise<void> {
		await this.gql.ExecuteSQL(`DROP SCHEMA IF EXISTS "${this.config.schema}" CASCADE; CREATE SCHEMA "${this.config.schema}"`);
	}

	/**
	 * Populate the database tables
	 * @date 7/18/2022 - 1:46:23 PM
	 *
	 * @public
	 * @async
	 * @returns {*}
	 */
	public async PopulateDatabaseTables(): Promise<void> {
		var instructions = new SqlInstructionList();

		for (var index = 0; index < this.repo.Tables.length; index++) {
			const table: CrudioTable = this.repo.Tables[index];

			this.BuildSqlColumnsForTable(table.EntityDefinition, instructions);
			this.BuildSqlForOneToManyKeys(table.EntityDefinition, table, instructions);

			// -------------- Create the data table

			const sql_create_tables = this.BuildCreateTableStatement(table.EntityDefinition, table, instructions);
			if (this.config.wipe) {
				await this.gql.ExecuteSQL(sql_create_tables);
			}

			// -------------- Build and insert rows

			this.BuildInsertData(table, instructions);
			await this.gql.ExecuteSQL(instructions.insert_table_rows);
		}

		await this.CreateForeignKeys(instructions);
	}

	/**
	 * Process foreign key relationships between entities and implement them in the database
	 * @date 7/18/2022 - 1:46:23 PM
	 *
	 * @private
	 * @async
	 * @param {SqlInstructionList} instructions
	 * @returns {Promise<void>}
	 */
	private async CreateForeignKeys(instructions: SqlInstructionList): Promise<void> {
		// -------------- Add foreign keys to tables
		if (this.config.wipe) {
			await this.gql.ExecuteSQL(instructions.create_foreign_keys, false);
		}
	}

	/**
	 * Acquire the SQL columns required to support the entity data fields
	 * @date 7/18/2022 - 1:46:23 PM
	 *
	 * @private
	 * @param {CrudioEntityDefinition} entity
	 * @param {SqlInstructionList} instructions
	 */
	private BuildSqlColumnsForTable(entity: CrudioEntityDefinition, instructions: SqlInstructionList) {
		instructions.table_column_names = "";
		instructions.table_column_definitions = "";
		instructions.table_field_list = [];

		// Add the primary key
		instructions.table_field_list.push(entity.KeyField.fieldName);

		// Create a list of SQL columns from the basic entity fields
		// The list of columns goes into the INSERT statement
		entity.fields.map((f: CrudioField) => {
			if (f.fieldName != entity.KeyField.fieldName) {
				instructions.table_column_definitions += `"${f.fieldName}" ${f.GetDatabaseFieldType} ${f.fieldOptions.isUnique ? "UNIQUE" : ""} ${f.fieldOptions.isRequired ? "NOT NULL" : ""},
				`;

				if (f.defaultValue) {
					instructions.table_column_definitions += `DEFAULT "${f.defaultValue} "`;
				}

				instructions.table_field_list.push(f.fieldName);
			}
		});

		// add foreign keys to insert columns for one to many
		entity.OneToManyRelationships.map(r => {
			instructions.table_column_definitions += `"${r.FromColumn}" uuid,`;
			instructions.table_field_list.push(r.FromColumn);
		});

		instructions.table_field_list.map(f => {
			instructions.table_column_names += `"${f}",`;
		});

		instructions.table_column_names = instructions.table_column_names.trim();
		instructions.table_column_names = instructions.table_column_names.slice(0, instructions.table_column_names.length - 1);

		instructions.table_column_definitions = instructions.table_column_definitions.trim();
		instructions.table_column_definitions = instructions.table_column_definitions.slice(0, instructions.table_column_definitions.length - 1);
	}

	/**
	 * Buid the SQL to implement one to many relationships
	 * @date 7/18/2022 - 1:46:23 PM
	 *
	 * @private
	 * @param {CrudioEntityDefinition} entity
	 * @param {CrudioTable} table
	 * @param {SqlInstructionList} instructions
	 */
	private BuildSqlForOneToManyKeys(entity: CrudioEntityDefinition, table: CrudioTable, instructions: SqlInstructionList): void {
		entity.OneToManyRelationships.map(r => {
			const target = this.repo.Tables.filter(t => t.EntityDefinition.Name === r.ToEntity)[0];

			if (!target) {
				throw new Error(`Unable to find a table for ${JSON.stringify(r)} using name ${r.ToEntity}. Ensure entity names are singular, like Article, not Articles.`);
			}

			instructions.create_foreign_keys += `
			ALTER TABLE "${this.config.schema}"."${table.TableName}"
			ADD CONSTRAINT FK_${r.RelationshipName}
			FOREIGN KEY("${r.FromColumn}") 
			REFERENCES "${this.config.schema}"."${target.TableName}"("${r.ToColumn}");
			`;
		});
	}

	/**
	 * Build the SQL to insert values into data tables
	 * @date 7/18/2022 - 1:46:23 PM
	 *
	 * @private
	 * @param {CrudioTable} table
	 * @param {SqlInstructionList} instructions
	 */
	private BuildInsertData(table: CrudioTable, instructions: SqlInstructionList): void {
		instructions.insert_table_rows = "";

		var insert_rows = `INSERT INTO "${this.config.schema}"."${table.TableName}" (${instructions.table_column_names}) VALUES`;
		const rows = table.DataRows;

		for (var r = 0; r < rows.length; r++) {
			const entity = rows[r];
			if (!entity) throw new Error("NULL data row");

			var values = "";

			instructions.table_field_list.map(i => {
				var v: any = entity.DataValues[i];

				// Save foreign key values
				// Check if the value is an object which has an id field
				// If so, take the id of the object and use it as the field value
				if (v && v.DataValues) {
					v = v.DataValues.id;
				}

				//Escape ' characters
				var insert_value = v;
				if (typeof insert_value === "string") {
					insert_value = v.replaceAll("'", "''").trim();
				}

				values += `${insert_value ? "'" + insert_value + "'" : "NULL"},`;
			});

			values = values.substring(0, values.length - 1);

			if (values.indexOf("[") >= 0) {
				throw new Error(`Error: Found an unprocessed token at row ${r} in ${values}`);
			}

			insert_rows += `(${values}),`;
		}

		instructions.insert_table_rows = insert_rows.substring(0, insert_rows.length - 1);
	}

	/**
	 * Build SQL to create data tables
	 * @date 7/18/2022 - 1:46:23 PM
	 *
	 * @private
	 * @param {CrudioEntityDefinition} entity
	 * @param {CrudioTable} table
	 * @param {SqlInstructionList} instructions
	 * @returns {string}
	 */
	private BuildCreateTableStatement(entity: CrudioEntityDefinition, table: CrudioTable, instructions: SqlInstructionList): string {
		const addKeySQL = `"${entity.KeyField.fieldName}" uuid DEFAULT gen_random_uuid() PRIMARY KEY,`;
		const sql = `
		CREATE TABLE "${this.config.schema}"."${table.TableName}" 
		(${addKeySQL} ${instructions.table_column_definitions});
		`;

		return sql;
	}
}
