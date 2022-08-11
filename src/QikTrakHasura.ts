import axios from "axios";

export default class QikTrakHasura {
	table_sql: string;
	foreignKey_sql: string;

	constructor(private endpoint: string, private secret: string, private schema: string) {
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

	public async Track() {
		const results = await this.RunSQL_Query(this.table_sql);
		var tables = results.map((t: any) => t[0]).splice(1);

		for (var i = 0; i < tables.length; i++) {
			const table_name = tables[i];

			var query = {
				type: "pg_track_table",
				args: {
					schema: this.schema,
					name: table_name,
					configuration: {
						custom_name: this.TrackedTableName(this.schema, table_name),
					},
				},
			};

			await this.RunGraphQL_Query("/v1/metadata", query);
			console.log(`Tracked ${this.schema}.${table_name}`);
		}

		await this.trackRelationships();
	}

	private async trackRelationships() {
		const results = await this.RunSQL_Query(this.foreignKey_sql);
		var relationships = results.splice(1).map((fk: any) => {
			return {
				referencing_table: fk[0],
				referencing_key: fk[1],
				referenced_table: fk[2],
				referenced_key: fk[3],
			};
		});

		for (var i = 0; i < relationships.length; i++) {
			const r = relationships[i];
			await this.CreateRelationships(r);

			console.log(`Tracked ${r.referencing_table}.${r.referencing_key} -> ${r.referenced_table}.${r.referenced_key}`);
		}
	}

	private async CreateRelationships(relationship: any): Promise<void> {
		const array_rel_spec: any = {
			type: "pg_create_array_relationship",

			args: {
				name: this.getArrayRelationshipName(relationship),

				table: {
					schema: this.schema,
					name: this.TrackedTableName(this.schema, relationship.referenced_table),
				},

				using: {
					manual_configuration: {
						remote_table: {
							schema: this.schema,
							name: this.TrackedTableName(this.schema, relationship.referencing_table),
						},
						column_mapping: {},
					},
				},
			},
		};

		array_rel_spec.args.using.manual_configuration.column_mapping[relationship.referenced_key] = relationship.referencing_key;
		await this.CreateRelationship(array_rel_spec);

		const obj_rel_spec: any = {
			type: "pg_create_object_relationship",

			args: {
				name: this.getObjectRelationshipName(relationship),

				table: {
					schema: this.schema,
					name: this.TrackedTableName(this.schema, relationship.referencing_table),
				},
				using: {
					manual_configuration: {
						remote_table: {
							schema: this.schema,
							name: this.TrackedTableName(this.schema, relationship.referenced_table),
						},
						column_mapping: {},
					},
				},
			},
		};

		obj_rel_spec.args.using.manual_configuration.column_mapping[relationship.referencing_key] = relationship.referenced_key;
		await this.CreateRelationship(obj_rel_spec);
	}

	// --------------------------------------------------------------------------------------------------------------------------
	// Create the specified relationship
	private async CreateRelationship(relSpec: any): Promise<void> {
		await this.RunGraphQL_Query("/v1/metadata", relSpec).catch(e => {
			console.error(e.response.data.error);
			//throw new Error(e.response.data.error);
		});
	}

	//--------------------------------------------------------------------------------------------------------------------------
	// Execute a Postgres SQL query via the Hasura API
	public async RunSQL_Query(sql_statement: string): Promise<any> {
		if (!sql_statement) throw "sql_statement is required";

		var sqlQuery = {
			type: "run_sql",
			args: {
				sql: sql_statement,
			},
		};

		return await this.RunGraphQL_Query("/v2/query", sqlQuery)
			.then(results => {
				return results.data.result;
			})
			.catch(e => {
				console.error("QIKTRAK: ERROR");
				console.error("SQL QUERY FAILED TO EXECUTE: ");

				if (!e.response) console.error("Error Message : " + e);
				else console.error("Error Message : " + JSON.stringify(e.response.data));

				console.error("SQL Statement:");
				console.error(sql_statement);

				throw e;
			});
	}

	//--------------------------------------------------------------------------------------------------------------------------
	// Execute a GraphQL query via the Hasura API
	public async RunGraphQL_Query(endpoint: string, query: any): Promise<any> {
		if (!endpoint) throw "endpoint is required";
		if (!query) throw "query is required";

		const requestConfig = {
			headers: {
				"X-Hasura-Admin-Secret": this.secret,
			},
		};

		return await axios.post(this.endpoint + endpoint, query, requestConfig);
	}

	//#region Name Handling

	private TrackedTableName(schema: string, table: string): string {
		const t = `${schema}_${table}`;
		return table;
	}

	//---------------------------------------------------------------------------------------------------------------------------
	// Default relationship name builder
	private getArrayRelationshipName(relationship: any) {
		const name = relationship.referencing_table;
		return name;
	}

	//---------------------------------------------------------------------------------------------------------------------------
	// Default relationship name builder
	private getObjectRelationshipName(relationship: any) {
		var key: string = relationship.referencing_key;
		if (key.endsWith("Id")) key = key.substring(0, key.length - 2);

		return key;
	}

	//#endregion
}
