import axios from "axios";

import { ICrudioConfig } from "./CrudioTypes";

export default class CrudioGQL {
	config: ICrudioConfig;

	constructor(config: ICrudioConfig) {
		this.config = config;
	}

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
			console.log("");
			console.log("");
			console.log("** ERROR");
			console.log("GQL Error :");
			console.log(e.response.data);

			throw e;
		}
	}

	async ExecuteSQL(sql_statement: string): Promise<any> {
		if (!sql_statement) {
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
			var results: any = await axios.post(this.config.hasuraQueryEndpoint, sqlQuery, requestConfig);
			if (results.data.errors && results.data.errors.length > 0) {
				throw new Error(results.data.errors);
			}

			return results.data.result;
		} catch (e: any) {
			if (e.code === "ECONNREFUSED") {
				console.log("Error whilst executing SQL statement: CONNECTION REFUSED. Are the database and graphql containers running?");
			} else {
				console.log("Error: Failed to execute SQL statement.");
				console.log(e.response.data ?? e.response);
			}

			throw e;
		}
	}

	async TranslateJsonToTable(sql: string, parseJson: boolean = true, jsonIndex: number = 0, sql_columns: {}[] = []): Promise<{}> {
		var input_rows: any = await this.ExecuteSQL(sql);

		// return empty array if no data rows exist
		if (input_rows.length === 0) {
			return [];
		}

		// track column names from all JSON and SQL columns
		var columnKeys: string[] = [];

		// add sql column names to list of keys
		sql_columns.map((col: any) => columnKeys.push(col.label));

		// map input rows to output blending SQL columns with data from JSON object
		var output_rows: {}[] = [];
		input_rows.splice(1).map((current_row: any[]) => {
			var output: any = {};

			// add data from sql columns to output record
			sql_columns.map((sqlCol: any) => {
				var sqlValue: any = current_row[sqlCol.index];
				output[sqlCol.label] = sqlValue;
			});

			// get values from the JSON object
			// the JSON maybe a text column or a JSON object
			var currentJson: any = parseJson ? JSON.parse(current_row[jsonIndex]) : current_row[jsonIndex];

			// add JSON values to output record
			Object.keys(currentJson).map(key => {
				var value: any = currentJson[key];
				output[key] = value;

				// add any missing keys to the key list
				if (!columnKeys.includes(key)) {
					columnKeys.push(key);
				}
			});

			output_rows.push(output);
		});

		return {
			column_headers: columnKeys,
			data_rows: output_rows,
		};
	}

	async GetColumnValues(sql: string, columnIndex: number = 0): Promise<any[]> {
		// get rows of data
		var data: [][] = ((await this.ExecuteSQL(sql)) as [][]).splice(1);

		// extract the required column value into an array
		var values: string[] = [];
		data.map((r: any[]) => {
			values.push(r[columnIndex]);
		});

		return values;
	}
}
