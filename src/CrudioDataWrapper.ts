import CrudioRepository from "./CrudioRepository";
import CrudioField from "./CrudioField";
import CrudioGQL from "./CrudioGQL";
import CrudioTable from "./CrudioTable";
import { ICrudioConfig } from "./CrudioTypes";

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
		const tables = this.repo.tables;
		var create_foreign_keys = "";

		for (var index = 0; index < tables.length; index++) {
			const table: CrudioTable = tables[index];

			const entity = this.repo.GetEntityDefinition(table.entity);
			const one_to_many = entity.relationships.filter(r => r.RelationshipType.toLowerCase() === "one");
			const many_to_many = entity.relationships.filter(r => r.RelationshipType.toLowerCase() === "many");
			const key: CrudioField = entity.GetKey();

			var sql_fields_definitions = "";
			var sql_column_names = `"${key.fieldName}"`;
			const insert_fieldnames = [key.fieldName];

			// Create a list of SQL columns from the basic entity fields
			// The list of columns goes into the INSERT statement
			entity.fields.map((f: CrudioField) => {
				if (f.fieldName != key.fieldName) {
					sql_fields_definitions += `, "${f.fieldName}" ${f.GetDatabaseFieldType} `;

					if (f.defaultValue) sql_fields_definitions += `DEFAULT "${f.defaultValue} "`;

					sql_column_names += `, "${f.fieldName}"`;
					insert_fieldnames.push(f.fieldName);
				}
			});

			// add foreign keys to insert columns for one to many
			one_to_many.map(r => {
				sql_column_names += `,"${r.FromColumn}"`;
				sql_fields_definitions += `, "${r.FromColumn}" uuid`;

				insert_fieldnames.push(r.FromColumn);
			});

			var create_fk_tables = "";

			// -------------- Build create table statement

			const addKeySQL = `"${key.fieldName}" uuid DEFAULT gen_random_uuid() PRIMARY KEY`;
			var create_table = `CREATE TABLE "${this.config.schema}"."${table.name}" (${addKeySQL} ${sql_fields_definitions});`;

			// -------------- Build foreign keys

			one_to_many.map(r => {
				const target = tables.filter(t => t.entity === r.ToEntity)[0];

				if (!target) {
					throw new Error(`Unable to find a table for ${JSON.stringify(r)} using name ${r.ToEntity}. Ensure entity names are singular, like Article, not Articles.`);
				}

				create_foreign_keys += `
					ALTER TABLE "${this.config.schema}"."${table.name}"
					ADD CONSTRAINT FK_${r.RelationshipName}
					FOREIGN KEY("${r.FromColumn}") 
					REFERENCES "${this.config.schema}"."${target.name}"("${r.ToColumn}");
					`;
			});

			many_to_many.map(relationship_definition => {
				const from_table = tables.filter(t => t.entity === relationship_definition.FromEntity)[0];
				const to_table = tables.filter(t => t.entity === relationship_definition.ToEntity)[0];

				if (!from_table) {
					throw new Error(`Many to Many - Unable to find a table for ${JSON.stringify(relationship_definition)} using name ${relationship_definition.FromEntity}. Ensure entity names are singular, like Article, not Articles.`);
				}

				if (!to_table) {
					throw new Error(`Many to Many - Unable to find a table for ${JSON.stringify(relationship_definition)} using name ${relationship_definition.ToEntity}. Ensure entity names are singular, like Article, not Articles.`);
				}

				const fk_table_name = relationship_definition.RelationshipName ?? `${from_table.name}_${to_table.name}`;

				create_fk_tables += `
					CREATE TABLE "${this.config.schema}"."${fk_table_name}" 
					(
					"id" uuid DEFAULT gen_random_uuid() PRIMARY KEY,
					"${relationship_definition.FromEntity}" uuid NOT NULL,
					"${relationship_definition.ToEntity}" uuid NOT NULL
					);
		        	`;

				create_foreign_keys += `
					ALTER TABLE "${this.config.schema}"."${fk_table_name}"
					ADD CONSTRAINT FK_${fk_table_name}_FROM
					FOREIGN KEY("${relationship_definition.FromEntity}") 
					REFERENCES "${this.config.schema}"."${from_table.name}"("id");
        			`;

				create_foreign_keys += `
					ALTER TABLE "${this.config.schema}"."${fk_table_name}"
					ADD CONSTRAINT FK_${fk_table_name}_TO
					FOREIGN KEY("${relationship_definition.ToEntity}") 
					REFERENCES "${this.config.schema}"."${to_table.name}"("id");
					`;
			});

			// -------------- Create the data table

			await this.gql.ExecuteSQL(create_table);

			// -------------- Build insert rows

			var insert_rows = `INSERT INTO "${this.config.schema}"."${table.name}" (${sql_column_names}) VALUES`;
			const rows = table.rows;

			for (var r = 0; r < rows.length; r++) {
				const entity = rows[r];
				if (!entity) throw new Error("NULL data row");

				var values = "";

				insert_fieldnames.map(i => {
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
			insert_rows = insert_rows.substring(0, insert_rows.length - 1);
			await this.gql.ExecuteSQL(insert_rows);
		}

		// -------------- Create many to many join tables

		if (create_fk_tables.length > 0) {
			await this.gql.ExecuteSQL(create_fk_tables);
		}

		// -------------- Add foreign keys to tables

		if (create_foreign_keys.length > 0) {
			await this.gql.ExecuteSQL(create_foreign_keys);
		}

		// -------------- Populate many to many joins with random values

		for (var index = 0; index < tables.length; index++) {
			const table: CrudioTable = tables[index];
			const entity = this.repo.GetEntityDefinition(table.entity);
			const many_to_many = entity.relationships.filter(r => r.RelationshipType.toLowerCase() === "many");

			many_to_many.map(async relationship_definition => {
				const from_table = tables.filter(t => t.entity === relationship_definition.FromEntity)[0];
				const to_table = tables.filter(t => t.entity === relationship_definition.ToEntity)[0];
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

				await this.gql.ExecuteSQL(create_many_to_many_rows);
			});
		}
	}
}
