import CrudioRepository from "./CrudioRepository";
import CrudioField from "./CrudioField";
import CrudioGQL from "./CrudioGQL";
import CrudioTable from "./CrudioTable";
import { ICrudioConfig } from "./CrudioTypes";
import CrudioEntityType from "./CrudioEntityType";

class SqlInstructionList {
	table_field_list = [];
	table_column_definitions = "";
	table_column_names = "";

	create_foreign_key_tables = "";
	create_foreign_keys = "";

	insert_table_rows = "";
	insert_many_to_many_rows = "";
}

export default class CrudioDataWrapper {
	gql: CrudioGQL;
	config: ICrudioConfig;
	repo: CrudioRepository;

	constructor(config: ICrudioConfig, repo: CrudioRepository) {
		this.config = config;
		this.gql = new CrudioGQL(this.config);
		this.repo = repo;
	}

	public async CreateEmptySchema() {
		await this.gql.ExecuteSQL(`DROP SCHEMA IF EXISTS "${this.config.schema}" CASCADE; CREATE SCHEMA "${this.config.schema}"`);
	}

	public async CreateTables() {
		var instructions = new SqlInstructionList();

		for (var index = 0; index < this.repo.tables.length; index++) {
			const table: CrudioTable = this.repo.tables[index];
			const entity = this.repo.GetEntityDefinition(table.entity);

			this.BuildSqlColumnsForTable(entity, instructions);
			this.AppendOneToManyKeys(entity, table, instructions);
			this.AppendManyToManyKeys(entity, table, instructions);

			// -------------- Create the data table

			await this.gql.ExecuteSQL(this.BuildCreateTableStatement(entity, table, instructions));

			// -------------- Build insert rows

			this.BuildInsertData(table, instructions);
			await this.gql.ExecuteSQL(instructions.insert_table_rows);
		}

		await this.ProcessForeignKeys(instructions);
	}

	private async ProcessForeignKeys(instructions: SqlInstructionList): Promise<void> {
		// -------------- Create many to many join tables

		await this.gql.ExecuteSQL(instructions.create_foreign_key_tables, false);

		// -------------- Add foreign keys to tables

		await this.gql.ExecuteSQL(instructions.create_foreign_keys, false);

		this.BuildInsertManyToManyData(instructions);
		await this.gql.ExecuteSQL(instructions.insert_many_to_many_rows, false);
	}

	private BuildSqlColumnsForTable(entity: CrudioEntityType, instructions: SqlInstructionList) {
		instructions.table_column_names = "";
		instructions.table_column_definitions = "";
		instructions.table_field_list = [];

		// Add the primary key
		instructions.table_field_list.push(entity.KeyField.fieldName);

		// Create a list of SQL columns from the basic entity fields
		// The list of columns goes into the INSERT statement
		entity.fields.map((f: CrudioField) => {
			if (f.fieldName != entity.KeyField.fieldName) {
				instructions.table_column_definitions += `"${f.fieldName}" ${f.GetDatabaseFieldType} ${f.fieldOptions.isUnique ? "UNIQUE" : ""},
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

	private AppendOneToManyKeys(entity: CrudioEntityType, table: CrudioTable, instructions: SqlInstructionList): void {
		entity.OneToManyRelationships.map(r => {
			const target = this.repo.tables.filter(t => t.entity === r.ToEntity)[0];

			if (!target) {
				throw new Error(`Unable to find a table for ${JSON.stringify(r)} using name ${r.ToEntity}. Ensure entity names are singular, like Article, not Articles.`);
			}

			instructions.create_foreign_keys += `
			ALTER TABLE "${this.config.schema}"."${table.name}"
			ADD CONSTRAINT FK_${r.RelationshipName}
			FOREIGN KEY("${r.FromColumn}") 
			REFERENCES "${this.config.schema}"."${target.name}"("${r.ToColumn}");
			`;
		});
	}

	private AppendManyToManyKeys(entity: CrudioEntityType, table: CrudioTable, instructions: SqlInstructionList): void {
		var create_foreign_keys = "";

		entity.ManyToManyRelationships.map(relationship_definition => {
			const from_table = this.repo.tables.filter(t => t.entity === relationship_definition.FromEntity)[0];
			const to_table = this.repo.tables.filter(t => t.entity === relationship_definition.ToEntity)[0];

			if (!from_table) {
				throw new Error(`Many to Many - Unable to find a table for ${JSON.stringify(relationship_definition)} using name ${relationship_definition.FromEntity}. Ensure entity names are singular, like Article, not Articles.`);
			}

			if (!to_table) {
				throw new Error(`Many to Many - Unable to find a table for ${JSON.stringify(relationship_definition)} using name ${relationship_definition.ToEntity}. Ensure entity names are singular, like Article, not Articles.`);
			}

			const fk_table_name = relationship_definition.RelationshipName ?? `${from_table.name}_${to_table.name}`;

			instructions.create_foreign_key_tables += `
				CREATE TABLE "${this.config.schema}"."${fk_table_name}" 
				(
				"id" uuid DEFAULT gen_random_uuid() PRIMARY KEY,
				"${relationship_definition.FromEntity}" uuid NOT NULL,
				"${relationship_definition.ToEntity}" uuid NOT NULL
				);
				`;

			instructions.create_foreign_keys += `
				ALTER TABLE "${this.config.schema}"."${fk_table_name}"
				ADD CONSTRAINT FK_${fk_table_name}_FROM
				FOREIGN KEY("${relationship_definition.FromEntity}") 
				REFERENCES "${this.config.schema}"."${from_table.name}"("id");
				`;

			instructions.create_foreign_keys += `
				ALTER TABLE "${this.config.schema}"."${fk_table_name}"
				ADD CONSTRAINT FK_${fk_table_name}_TO
				FOREIGN KEY("${relationship_definition.ToEntity}") 
				REFERENCES "${this.config.schema}"."${to_table.name}"("id");
				`;
		});
	}

	private BuildInsertData(table: CrudioTable, instructions: SqlInstructionList): void {
		instructions.insert_table_rows = "";

		var insert_rows = `INSERT INTO "${this.config.schema}"."${table.name}" (${instructions.table_column_names}) VALUES`;
		const rows = table.rows;

		for (var r = 0; r < rows.length; r++) {
			const entity = rows[r];
			if (!entity) throw new Error("NULL data row");

			var values = "";

			instructions.table_field_list.map(i => {
				var v = entity.values[i];

				// Save foreign key values
				// Check if the value is an object which as an id field
				// If so, take the id of the object and use it as the field value
				if (v && v.values) {
					v = v.values.id;
				}

				//Escape ' characters
				var insert_value = v;
				if (typeof insert_value === "string") {
					insert_value = v.replaceAll("'", "''").trim();
				}

				values += `${insert_value ? "'" + insert_value + "'" : "NULL"},`;
			});

			values = values.substring(0, values.length - 1);

			insert_rows += `(${values}),`;

			if (values.indexOf("[") >= 0) {
				throw new Error(`Error: Found an unprocessed token in ${values}`);
			}
		}

		instructions.insert_table_rows = insert_rows.substring(0, insert_rows.length - 1);
	}

	private BuildInsertManyToManyData(instructions: SqlInstructionList): void {
		instructions.insert_many_to_many_rows = "";
		for (var index = 0; index < this.repo.tables.length; index++) {
			const table: CrudioTable = this.repo.tables[index];
			const entity = this.repo.GetEntityDefinition(table.entity);
			const many_to_many = entity.relationships.filter(r => r.RelationshipType.toLowerCase() === "many");

			many_to_many.map(async relationship_definition => {
				const from_table = this.repo.GetTableForEntityName(relationship_definition.FromEntity);
				const to_table = this.repo.GetTableForEntityName(relationship_definition.ToEntity);
				const fk_table_name = relationship_definition.RelationshipName ?? `${from_table.name}_${to_table.name}`;

				var create_many_to_many_rows = `INSERT INTO "${this.config.schema}"."${fk_table_name}" ("${relationship_definition.FromEntity}","${relationship_definition.ToEntity}")
				VALUES
				`;

				from_table.rows.map(r => {
					var unique_index = [];

					while (unique_index.length < relationship_definition.NumberOfSeededRelations) {
						const row_index = CrudioRepository.GetRandomNumber(0, to_table.rows.length);

						if (unique_index.indexOf(row_index) >= 0) {
							// Try again, as we've created a duplicate number
							continue;
						}

						unique_index.push(row_index);
						const target_id = to_table.rows[row_index].values.id;

						create_many_to_many_rows += `('${r.values.id}','${target_id}'),`;
					}
				});

				create_many_to_many_rows = create_many_to_many_rows.slice(0, create_many_to_many_rows.length - 1) + ";";
			});
		}
	}

	private BuildCreateTableStatement(entity: CrudioEntityType, table: CrudioTable, instructions: SqlInstructionList): string {
		const addKeySQL = `"${entity.KeyField.fieldName}" uuid DEFAULT gen_random_uuid() PRIMARY KEY,`;
		const sql = `
		CREATE TABLE "${this.config.schema}"."${table.name}" 
		(${addKeySQL} ${instructions.table_column_definitions});
		`;

		return sql;
	}
}
