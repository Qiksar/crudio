//
// The purpose of this code is to allow the caller to track all Postgres tables, views and relationships with a single call
// which goes to support continuous integration as you no longer have to use the Hasura UI to click the buttons to track all tables/relationships.
//
// The code also creates SQL views which can translate JSON values into SQL data columns
//

import { timeStamp } from "console";
import QikTrakHasura from "./QikTrakHasura";

export default class QikTrack {
    public Hasura: QikTrakHasura;

    private table_sql: string;
    private foreignKey_sql: string;

    constructor(private endpoint: string, private secret: string, private schema: string) {
        this.Hasura = new QikTrakHasura(endpoint, secret, schema);

        // --------------------------------------------------------------------------------------------------------------------------
        // SQL to acquire metadata

        this.table_sql = `
 SELECT table_name FROM information_schema.tables WHERE table_schema = '${schema}'
 UNION
 SELECT table_name FROM information_schema.views WHERE table_schema = '${schema}'
 ORDER BY table_name;
 `;

        this.foreignKey_sql = `
 SELECT tc.table_name, kcu.column_name, ccu.table_name AS foreign_table_name, ccu.column_name AS foreign_column_name 
 FROM information_schema.table_constraints AS tc 
 JOIN information_schema.key_column_usage AS kcu ON tc.constraint_name = kcu.constraint_name AND kcu.constraint_schema = '${schema}'
 JOIN information_schema.constraint_column_usage AS ccu ON ccu.constraint_name = tc.constraint_name AND ccu.constraint_schema = '${schema}'
 WHERE constraint_type = 'FOREIGN KEY' 
 AND tc.table_schema = '${schema}'
 ;`;
    }

    public async AutoTrack() {
        const results = await this.Hasura.RunSQL_Query(this.table_sql);
        var tables = results.map((t: any) => t[0]).splice(1);

        await this.trackTables(this.schema, tables)
        await this.trackRelationships();
    }

    private async trackTables(schema: string, tables: []) {
        for (var i = 0; i < tables.length; i++) {
            const table_name = tables[i];

            var query = {
                type: 'pg_track_table',
                args: {
                    schema: schema,
                    name: table_name,
                    configuration: {
                        custom_name: table_name,
                    },
                },
            };

            await this.Hasura.RunGraphQL_Query('/v1/metadata', query);
            console.log(`Tracked ${schema}.${table_name}`);
        }
    }

    private async trackRelationships() {
        const results = await this.Hasura.RunSQL_Query(this.foreignKey_sql)
        var relationships = results.splice(1)
            .map((fk: any) => {
                return {
                    referencing_table: fk[0],
                    referencing_key: fk[1],
                    referenced_table: fk[2],
                    referenced_key: fk[3],
                };
            });

        for (var i = 0; i < relationships.length; i++) {
            const r = relationships[i];
            await this.Hasura.CreateRelationships(r);
            console.log(`Tracked ${r.referencing_table}.${r.referencing_key} -> ${r.referenced_table}.${r.referenced_key}`);
        }
    }

}
