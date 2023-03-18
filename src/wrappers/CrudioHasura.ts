import axios from "axios";
import CrudioDataModel from "../datamodel/CrudioDataModel";
import CrudioRelationship from "../datamodel/CrudioRelationship";
import CrudioUtils from "../utils/CrudioUtils";
import { ICrudioConfig } from "../types/ICrudioConfig";

/**
 * Simple interface to Hasura GraphQL API
 * @date 14/08/2022 - 12:52:30
 *
 * @export
 * @class CrudioHasura
 * @typedef {CrudioHasura}
 */
export default class CrudioHasura {
	/**
	 * Creates an instance of CrudioHasura.
	 * @date 14/08/2022 - 12:52:30
	 *
	 * @constructor
	 * @param {ICrudioConfig} config
	 * @param {CrudioDataModel} datamodel
	 */
	constructor(private config: ICrudioConfig, private datamodel: CrudioDataModel) {}

	/**
	 * Track all tables and relationships in the data model
	 * @date 14/08/2022 - 12:52:30
	 *
	 * @public
	 * @async
	 * @returns {*}
	 */
	public async Track() {
		await this.trackTables();
		await this.trackRelationships();
	}

	/**
	 * Track SQL tables
	 * @date 14/08/2022 - 12:52:30
	 *
	 * @private
	 * @async
	 * @returns {*}
	 */
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
					},
				},
			};

			await this.ExecuteGraphqlCommand("/v1/metadata", query);
		}
	}

	/**
	 * Track SQL relationships
	 * @date 14/08/2022 - 12:52:30
	 *
	 * @private
	 * @async
	 * @returns {*}
	 */
	private async trackRelationships() {
		const relationships: CrudioRelationship[] = [];
		this.datamodel.EntityDefinitions.map(e => e.OneToManyRelationships.map(r => relationships.push(r)));

		for (var i = 0; i < relationships.length; i++) {
			await this.CreateRelationships(relationships[i]);
		}
	}

	/**
	 * Create array and object relationships between tables
	 * @date 14/08/2022 - 12:52:30
	 *
	 * @private
	 * @async
	 * @param {CrudioRelationship} r
	 * @returns {Promise<void>}
	 */
	private async CreateRelationships(r: CrudioRelationship): Promise<void> {
		await this.CreateArrayRelationship(r);
		await this.CreateObjectRelationship(r);
	}

	/**
	 * Create an object relationship from the "one" side
	 * @date 14/08/2022 - 12:52:30
	 *
	 * @private
	 * @async
	 * @param {CrudioRelationship} r
	 * @returns {*}
	 */
	private async CreateObjectRelationship(r: CrudioRelationship) {
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

		const col_id = CrudioUtils.ToColumnId(r.FromColumn);
		obj_rel_spec.args.using.manual_configuration.column_mapping[col_id] = r.ToColumn;

		await this.CreateRelationship(obj_rel_spec);
	}

	/**
	 * Create an array relationship from the "many" end
	 * @date 14/08/2022 - 12:52:30
	 *
	 * @private
	 * @async
	 * @param {CrudioRelationship} r
	 * @returns {*}
	 */
	private async CreateArrayRelationship(r: CrudioRelationship) {
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

		const col_id1 = CrudioUtils.ToColumnId(r.ToColumn);
		array_rel_spec.args.using.manual_configuration.column_mapping[col_id1] = CrudioUtils.ToColumnId(r.FromColumn);

		await this.CreateRelationship(array_rel_spec);
	}

	/**
	 * Call the Hasura API to create the relationship
	 * @date 14/08/2022 - 12:52:30
	 *
	 * @private
	 * @async
	 * @param {*} relSpec
	 * @returns {Promise<void>}
	 */
	private async CreateRelationship(relSpec: any): Promise<void> {
		await this.ExecuteGraphqlCommand("/v1/metadata", relSpec).catch(e => {
			throw new Error(e.response.data.error);
		});
	}

	/**
	 * Execute an SQL command
	 * @date 14/08/2022 - 12:52:30
	 *
	 * @public
	 * @async
	 * @param {string} sql_statement
	 * @returns {Promise<any>}
	 */
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

				throw e;
			});
	}

	/**
	 * Execute a GraphQL command
	 * @date 14/08/2022 - 12:52:30
	 *
	 * @public
	 * @async
	 * @param {string} endpoint
	 * @param {*} query
	 * @returns {Promise<any>}
	 */
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

	/**
	 * Compose a table name by prepending the current schema name
	 * @date 14/08/2022 - 12:52:30
	 *
	 * @private
	 * @param {string} table
	 * @returns {string}
	 */
	private TrackedTableName(table: string): string {
		const t = `${this.config.schema}_${table}`;
		return t;
	}

	//#endregion
}
