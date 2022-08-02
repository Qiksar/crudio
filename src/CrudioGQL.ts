import axios from "axios";

import { ICrudioConfig } from "./CrudioTypes";

/**
 * GraphQL wrapper
 * @date 7/18/2022 - 3:37:33 PM
 *
 * @export
 * @class CrudioGQL
 * @typedef {CrudioGQL}
 */
export default class CrudioGQL {
	/**
	 * System configuration
	 * @date 7/18/2022 - 3:37:33 PM
	 *
	 * @type {ICrudioConfig}
	 */
	config: ICrudioConfig;

	/**
	 * Creates an instance of CrudioGQL.
	 * @date 7/18/2022 - 3:37:33 PM
	 *
	 * @constructor
	 * @param {ICrudioConfig} config
	 */
	constructor(config: ICrudioConfig) {
		this.config = config;
	}

	/**
	 * Execute GraphQL command
	 * @date 7/18/2022 - 3:37:33 PM
	 *
	 * @async
	 * @param {{}} request
	 * @returns {Promise<{}>}
	 */
	async Execute(request: {}): Promise<{}> {
		if (!request) {
			throw "request is required";
		}

		let requestConfig: {} = {};

		if (this.config.hasuraAdminSecret) {
			requestConfig = {
				...requestConfig,
				headers: {
					"X-Hasura-Admin-Secret": this.config.hasuraAdminSecret,
				},
			};
		}

		try {
			var result: any = await axios.post(this.config.hasuraEndpoint, request, requestConfig);
			return result.data;
		} catch (e: any) {
			console.error("GQL Error :");
			console.error(e.response.data ?? e.response);

			throw e;
		}
	}

	/**
	 * Execute an SQL command
	 * @date 7/18/2022 - 3:37:33 PM
	 *
	 * @async
	 * @param {string} sql_statement
	 * @param {boolean} [failIfEmptyStatement=true]
	 * @returns {Promise<any>}
	 */
	async ExecuteSQL(sql_statement: string, failIfEmptyStatement = true): Promise<any> {
		if (!sql_statement) {
			if (!failIfEmptyStatement) return;

			throw new Error("sql_statement is required");
		}

		var sqlQuery: {} = {
			type: "run_sql",
			args: {
				sql: sql_statement,
			},
		};

		let requestConfig: {} = {};

		if (this.config.hasuraAdminSecret) {
			requestConfig = {
				...requestConfig,
				headers: {
					"X-Hasura-Admin-Secret": this.config.hasuraAdminSecret,
				},
			};
		}

		try {
			var results: any = await axios.post(this.config.hasuraEndpoint + "/v2/query", sqlQuery, requestConfig);
			if (results.data.errors && results.data.errors.length > 0) {
				throw new Error(results.data.errors);
			}

			return results.data.result;
		} catch (e: any) {
			if (e.code === "ECONNREFUSED") {
				console.error("Error whilst executing SQL statement: CONNECTION REFUSED. Are the database and graphql containers running?");
				throw new Error("Error whilst executing SQL statement: CONNECTION REFUSED. Are the database and graphql containers running?");
			} else {
				console.error("Error: Failed to execute SQL statement.");
				console.error(e.response.data ?? e.response);
			}

			throw e;
		}
	}
}
