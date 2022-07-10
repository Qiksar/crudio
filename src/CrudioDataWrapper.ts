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

      e.fields.map((f: CrudioField) => {
        if (f.fieldName != key.fieldName) {
          fields += `,${f.fieldName} ${f.GetDatabaseFieldType} `;

          if (f.defaultValue) fields += `DEFAULT "${f.defaultValue} "`;
        }
      });

      const sql = `CREATE TABLE "public"."${t.name}" (${keyField} ${fields});`;

      await this.gql.ExecuteSQL(sql);
    }
  }
}
