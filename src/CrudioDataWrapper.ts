import CrudioEntityInstance from "./CrudioEntityInstance";
import CrudioFakeDb from "./CrudioFakeDb";
import CrudioField from "./CrudioField";
import CrudioGQL from "./CrudioGQL";
import CrudioRepositoryTable from "./CrudioRepositoryTable";
import { ICrudioConfig } from "./CrudioTypes";

export default class CrudioDataWrapper {
  gql: CrudioGQL;
  config: ICrudioConfig;
  repo: CrudioFakeDb;

  constructor(config: ICrudioConfig, repo: CrudioFakeDb) {
    this.config = config;
    this.gql = new CrudioGQL(this.config);
    this.repo = repo;
  }

  public async DropTables() {
    const list = this.repo.tables;
    for (var index = 0; index < list.length; index++) {
      const t: CrudioRepositoryTable = list[index];
      const sql = `DROP TABLE IF EXISTS "public"."${t.name}" CASCADE;`;
      await this.gql.ExecuteSQL(sql);
    }
  }

  public async CreateTables() {
    const list = this.repo.tables;
    for (var index = 0; index < list.length; index++) {
      const t: CrudioRepositoryTable = list[index];
      const e = this.repo.GetEntityDefinition(t.entity);

      const key: CrudioField = e.GetKey();
      const keyField = `${key.fieldName} uuid DEFAULT gen_random_uuid() PRIMARY KEY`;

      var fields = "";

      const insert_fieldnames = [];
      var insert_fields = `"${key.fieldName}"`;
      insert_fieldnames.push(key.fieldName);

      e.fields.map((f: CrudioField) => {
        if (f.fieldName != key.fieldName) {
          fields += `,${f.fieldName} ${f.GetDatabaseFieldType} `;

          if (f.defaultValue) fields += `DEFAULT "${f.defaultValue} "`;

          insert_fields += `,"${f.fieldName}"`;
          insert_fieldnames.push(f.fieldName);
        }
      });

      var insert = `INSERT INTO "public"."${t.name}" (${insert_fields}) VALUES`;
      const rows = t.rows;

      for (var r = 0; r < rows.length; r++) {
        const entity = rows[r];
        if (!entity) throw new Error("NULL data row");

        var values = "";

        insert_fieldnames.map((i) => {
          values += `${
            entity.values[i] ? "'" + entity.values[i] + "'" : "NULL"
          },`;
        });

        values = values.substring(0, values.length - 1);

        insert += `(${values}),`;
      }
      insert = insert.substring(0, insert.length - 1);

      const sql = `CREATE TABLE "public"."${t.name}" (${keyField} ${fields});`;
      await this.gql.ExecuteSQL(sql);
      await this.gql.ExecuteSQL(insert);
    }
  }
}
