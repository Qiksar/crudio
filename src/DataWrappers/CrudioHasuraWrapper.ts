import CrudioDataModel from "../CrudioDataModel";
import CrudioField from "../CrudioField";
import CrudioTable from "../CrudioTable";
import { ICrudioConfig, ICrudioDataWrapper } from "../CrudioTypes";
import CrudioEntityDefinition from "../CrudioEntityDefinition";
import CrudioHasura from "../CrudioHasura";
import CrudioUtils from "../CrudioUtils";

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
 * @typedef {CrudioHasuraWrapper}
 */
export default class CrudioHasuraWrapper implements ICrudioDataWrapper {
	//#region Properties
	/**
	 * GraphQL interface
	 * @date 7/18/2022 - 1:46:23 PM
	 *
	 * @type {CrudioHasura}
	 */
	private gql: CrudioHasura;
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
	 * @type {CrudioDataModel}
	 */
	private datamodel: CrudioDataModel;
	//#endregion
	/**
	 * Creates an instance of CrudioDataWrapper.
	 * @date 7/18/2022 - 1:46:23 PM
	 *
	 * @constructor
	 * @param {ICrudioConfig} config
	 * @param {CrudioDataModel} datamodel
	 */
	constructor(config: ICrudioConfig, datamodel: CrudioDataModel) {
		this.config = { ...config };
		if (datamodel.TargetDbSchema) this.config.schema = datamodel.TargetDbSchema;

		this.gql = new CrudioHasura(this.config, this.datamodel);
		this.datamodel = datamodel;
	}

	/**
	 * Stub function - no need to close any connection
	 * @date 13/10/2022 - 07:36:01
	 *
	 * @public
	 * @async
	 * @returns {Promise<void>}
	 */
	public async Close(): Promise<void> {}

	/**
	 * Drop schema and recreate with no tables
	 * @date 7/18/2022 - 1:46:23 PM
	 *
	 * @public
	 * @async
	 * @returns {*}
	 */
	public async CreateDatabaseSchema(): Promise<void> {
		await this.gql.ExecuteSqlCommand(`DROP SCHEMA IF EXISTS "${this.config.schema}" CASCADE; CREATE SCHEMA "${this.config.schema}"`);
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

		for (var index = 0; index < this.datamodel.Tables.length; index++) {
			const table: CrudioTable = this.datamodel.Tables[index];

			console.log(table.TableName + "...");

			this.BuildSqlColumnsForTable(table.EntityDefinition, instructions);
			this.BuildSqlForOneToManyKeys(table.EntityDefinition, table, instructions);

			// -------------- Create the data table

			const sql_create_table = this.BuildCreateTableStatement(table.EntityDefinition, table, instructions);
			if (this.config.wipe) {
				await this.gql.ExecuteSqlCommand(sql_create_table);
			}

			// -------------- Build and insert rows

			if (table.DataRows.length > 0) {
				let offset = 0;
				const count = 100;

				while (this.BuildInsertData(table, instructions, offset, count)) {
					offset += count;
					await this.gql.ExecuteSqlCommand(instructions.insert_table_rows);
				}
			}
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
			await this.gql.ExecuteSqlCommand(instructions.create_foreign_keys);
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
			var column = CrudioUtils.ToColumnId(r.FromColumn);
			instructions.table_column_definitions += `"${column}" uuid,`; // TODO if required NOT NULL
			instructions.table_field_list.push(column);
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
			const target = this.datamodel.Tables.filter(t => t.EntityDefinition.Name === r.ToEntity)[0];

			if (!target) {
				throw new Error(`Unable to find a table for ${JSON.stringify(r)} using name ${r.ToEntity}. Ensure entity names are singular, like Article, not Articles.`);
			}

			instructions.create_foreign_keys += `
			ALTER TABLE "${this.config.schema}"."${table.TableName}"
			ADD CONSTRAINT FK_${r.RelationshipName}
			FOREIGN KEY("${CrudioUtils.ToColumnId(r.FromColumn)}") 
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
	private BuildInsertData(table: CrudioTable, instructions: SqlInstructionList, offset: number, count: number): number {
		instructions.insert_table_rows = "";

		var insert_rows = `INSERT INTO "${this.config.schema}"."${table.TableName}" (${instructions.table_column_names}) VALUES`;
		let inserted = 0;

		while (inserted < count && offset < table.DataRows.length) {
			const entity = table.DataRows[offset];

			if (!entity) throw new Error("NULL data row");

			var values = "";

			instructions.table_field_list.map(i => {
				var datavalue: any = entity.DataValues[i];

				if (!datavalue && i.endsWith("Id")) {
					// Field was renamed to ...Id, so remove it to get the
					// orginal name in order to retrieve the field value
					const column_name = i.slice(0, i.length - 2);
					datavalue = entity.DataValues[column_name];
				}

				// If one to many join, read the ID of the target object
				if (datavalue && datavalue.DataValues) {
					datavalue = datavalue.DataValues[this.config.idField];
				}

				//Escape ' characters
				var insert_value = datavalue;
				if (typeof insert_value === "string") {
					insert_value = datavalue.replaceAll("'", "''").trim();
				}

				values += `${insert_value ? "'" + insert_value + "'" : "NULL"},`;
			});

			values = values.substring(0, values.length - 1);

			if (values.indexOf("[") >= 0) {
				throw new Error(`Error: Found an unprocessed token at row ${offset} in ${values}`);
			}

			insert_rows += `(${values}),`;
			inserted++;
			offset++;
		}

		instructions.insert_table_rows = insert_rows.substring(0, insert_rows.length - 1);

		return inserted;
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
		const addKeySQL = `"${entity.KeyField.fieldName}" uuid PRIMARY KEY NOT NULL,`;
		const sql = `
		CREATE TABLE "${this.config.schema}"."${table.TableName}" 
		(${addKeySQL} ${instructions.table_column_definitions});
		`;

		return sql;
	}
}
