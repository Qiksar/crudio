import axios from "axios";
import CrudioDataModel from "./CrudioDataModel";
import CrudioRelationship from "./CrudioRelationship";
import { ICrudioConfig } from "./CrudioTypes";

export default class CrudioHasura {
	constructor(private config: ICrudioConfig, private datamodel: CrudioDataModel) { }

	public async Track() {
		await this.trackTables();
		await this.trackRelationships();
	}

	private async trackTables() {
		var tables = this.datamodel.Tables.map(t => t.TableName);

		for (var i = 0; i < tables.length; i++) {
			const table_name = tables[i];

			console.log(`Tracking table... ${this.config.schema}.${table_name}`);

			var query = {
				type: "pg_track_table",
				args: {
					table: {
						name: table_name,
						schema: this.config.schema,
					},
					configuration: {
						custom_name: this.TrackedTableName(table_name),
					}
				}
			};

			await this.ExecuteGraphqlCommand("/v1/metadata", query);
		}
	}

	private async trackRelationships() {
		const relationships: CrudioRelationship[] = [];
		this.datamodel.EntityDefinitions.map(e => e.OneToManyRelationships.map(r => relationships.push(r)));

		for (var i = 0; i < relationships.length; i++) {
			await this.CreateRelationships(relationships[i]);
		}
	}

	private async CreateRelationships(r: CrudioRelationship): Promise<void> {
		const array_rel_spec: any = {
			type: "pg_create_array_relationship",

			args: {
				name: this.datamodel.GetTableForEntityName(r.FromEntity).TableName,

				table: {
					schema: this.config.schema,
					name: this.datamodel.GetTableForEntityName(r.ToEntity).TableName,
				},

				using: {
					manual_configuration: {
						remote_table: {
							schema: this.config.schema,
							name: this.datamodel.GetTableForEntityName(r.FromEntity).TableName,
						},
						column_mapping: {},
					},
				},
			},
		};

		const col_id1 = this.ToColumnId(r.ToColumn);
		array_rel_spec.args.using.manual_configuration.column_mapping[col_id1] = this.ToColumnId(r.FromColumn);
		await this.CreateRelationship(array_rel_spec);

		const obj_rel_spec: any = {
			type: "pg_create_object_relationship",

			args: {
				name: r.ToEntity,

				table: {
					schema: this.config.schema,
					name: this.datamodel.GetTableForEntityName(r.FromEntity).TableName,
				},

				using: {
					manual_configuration: {
						remote_table: {
							schema: this.config.schema,
							name: this.datamodel.GetTableForEntityName(r.ToEntity).TableName,
						},
						column_mapping: {},
					},
				},
			},
		};

		const col_id = this.ToColumnId(r.FromColumn);
		obj_rel_spec.args.using.manual_configuration.column_mapping[col_id] = r.ToColumn;
		await this.CreateRelationship(obj_rel_spec);
	}

	// --------------------------------------------------------------------------------------------------------------------------
	// Create the specified relationship
	private async CreateRelationship(relSpec: any): Promise<void> {
		await this.ExecuteGraphqlCommand("/v1/metadata", relSpec).catch(e => {
			throw new Error(e.response.data.error);
		});
	}

	//--------------------------------------------------------------------------------------------------------------------------
	// Execute a Postgres SQL query via the Hasura API
	public async ExecuteSqlCommand(sql_statement: string): Promise<any> {
		if (!sql_statement) throw "sql_statement is required";

		var sqlQuery = {
			type: "run_sql",
			args: {
				sql: sql_statement,
			},
		};

		return await this.ExecuteGraphqlCommand("/v2/query", sqlQuery)
			.then(results => {
				return results.data.result;
			})
			.catch(e => {
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
	public async ExecuteGraphqlCommand(endpoint: string, query: any): Promise<any> {
		if (!endpoint) throw "endpoint is required";
		if (!query) throw "query is required";

		const requestConfig = {
			headers: {
				"X-Hasura-Admin-Secret": this.config.hasuraAdminSecret,
			},
		};

		return await axios.post(this.config.hasuraEndpoint + endpoint, query, requestConfig);
	}

	//#region Name Handling

	private ToColumnId(name: string): string {
		return name.toLowerCase().endsWith("id") ? name : name + "Id";
	}

	private TrackedTableName(table: string): string {
		const t = `${this.config.schema}_${table}`;
		return t;
	}

	//#endregion
}
