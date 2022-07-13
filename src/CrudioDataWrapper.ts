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
    /*
    const list = this.repo.tables;
    for (var index = 0; index < list.length; index++) {
      var t: CrudioTable = list[index];
      var sql = `DROP TABLE IF EXISTS "${this.config.schema}"."${t.name}" CASCADE;`;
      await this.gql.ExecuteSQL(sql);
    }
    */

    await this.gql.ExecuteSQL(
      `DROP SCHEMA IF EXISTS "${this.config.schema}" CASCADE; CREATE SCHEMA "${this.config.schema}"`
    );
  }

  public async CreateTables() {
    const tables = this.repo.tables;
    var create_foreign_keys = "";

    for (var index = 0; index < tables.length; index++) {
      const table: CrudioTable = tables[index];
      const entity = this.repo.GetEntityDefinition(table.entity);

      const key: CrudioField = entity.GetKey();
      const keyField = `"${key.fieldName}" uuid DEFAULT gen_random_uuid() PRIMARY KEY`;

      var sql_fields_definitions = "";
      var sql_column_names = `"${key.fieldName}"`;
      const insert_fieldnames = [key.fieldName];

      // Create a list of SQL columns from the basic entity fields
      entity.fields.map((f: CrudioField) => {
        if (f.fieldName != key.fieldName) {
          sql_fields_definitions += `, "${f.fieldName}" ${f.GetDatabaseFieldType} `;

          if (f.defaultValue)
            sql_fields_definitions += `DEFAULT "${f.defaultValue} "`;

          sql_column_names += `, "${f.fieldName}"`;
          insert_fieldnames.push(f.fieldName);
        }
      });

      const one_to_many = entity.relationships.filter(
        (r) => r.RelationshipType.toLowerCase() === "one"
      );
      const many_to_many = entity.relationships.filter(
        (r) => r.RelationshipType.toLowerCase() === "many"
      );

      // add foreign keys to insert columns for one to many
      one_to_many.map((r) => {
        sql_column_names += `,"${r.FromColumn}"`;
        sql_fields_definitions += `, "${r.FromColumn}" uuid`;

        insert_fieldnames.push(r.FromColumn);
      });

      var create_fk_tables = "";


      // -------------- Build create table statement

      var create_table = `CREATE TABLE "${this.config.schema}"."${table.name}" (${keyField} ${sql_fields_definitions});`;

      var insert_rows = `INSERT INTO "${this.config.schema}"."${table.name}" (${sql_column_names}) VALUES`;
      const rows = table.rows;

      // -------------- Build foreign keys

      one_to_many.map((r) => {
        const target = tables.filter((t) => t.entity === r.ToEntity)[0];

        if (!target) {
          throw new Error(
            `Unable to find a table for ${JSON.stringify(r)} using name ${
              r.ToEntity
            }. Ensure entity names are singular, like Article, not Articles.`
          );
        }

        create_foreign_keys += `
        ALTER TABLE "${this.config.schema}"."${table.name}"
        ADD CONSTRAINT FK_${r.RelationshipName}
        FOREIGN KEY("${r.FromColumn}") 
        REFERENCES "${this.config.schema}"."${target.name}"("${r.ToColumn}");
        `;
      });

      many_to_many.map((relationship_definition) => {
        const from_table = tables.filter(
          (t) => t.entity === relationship_definition.FromEntity
        )[0];
        const to_table = tables.filter(
          (t) => t.entity === relationship_definition.ToEntity
        )[0];

        if (!from_table) {
          throw new Error(
            `Many to Many - Unable to find a table for ${JSON.stringify(
              relationship_definition
            )} using name ${
              relationship_definition.FromEntity
            }. Ensure entity names are singular, like Article, not Articles.`
          );
        }

        if (!to_table) {
          throw new Error(
            `Many to Many - Unable to find a table for ${JSON.stringify(
              relationship_definition
            )} using name ${
              relationship_definition.ToEntity
            }. Ensure entity names are singular, like Article, not Articles.`
          );
        }

        const rel_name = `${from_table.name}_${to_table.name}`;

        create_fk_tables += `
        CREATE TABLE "${this.config.schema}"."${rel_name}" 
        (
          "id" uuid DEFAULT gen_random_uuid() PRIMARY KEY,
          "${relationship_definition.FromEntity}" uuid NOT NULL,
          "${relationship_definition.ToEntity}" uuid NOT NULL
        );
        `;

        create_foreign_keys += `
        ALTER TABLE "${this.config.schema}"."${rel_name}"
        ADD CONSTRAINT FK_${rel_name}_FROM
        FOREIGN KEY("${relationship_definition.FromEntity}") 
        REFERENCES "${this.config.schema}"."${from_table.name}"("id");
        `;

        create_foreign_keys += `
        ALTER TABLE "${this.config.schema}"."${rel_name}"
        ADD CONSTRAINT FK_${rel_name}_TO
        FOREIGN KEY("${relationship_definition.ToEntity}") 
        REFERENCES "${this.config.schema}"."${to_table.name}"("id");
        `;

      });

      // -------------- Build insert rows

      for (var r = 0; r < rows.length; r++) {
        const entity = rows[r];
        if (!entity) throw new Error("NULL data row");

        var values = "";

        insert_fieldnames.map((i) => {
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
      }
      insert_rows = insert_rows.substring(0, insert_rows.length - 1);

      await this.gql.ExecuteSQL(create_table);
      await this.gql.ExecuteSQL(insert_rows);
    }

    if (create_fk_tables.length > 0)
      await this.gql.ExecuteSQL(create_fk_tables);

    if (create_foreign_keys.length > 0)
      await this.gql.ExecuteSQL(create_foreign_keys);
  }
}
