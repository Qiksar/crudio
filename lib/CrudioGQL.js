"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
class CrudioGQL {
    config;
    constructor(config) {
        this.config = config;
    }
    async Execute(request) {
        if (!request) {
            throw 'request is required';
        }
        let requestConfig = {};
        if (this.config.hasuraAdminSecret) {
            requestConfig = {
                ...requestConfig,
                headers: {
                    'X-Hasura-Admin-Secret': this.config.hasuraAdminSecret
                }
            };
        }
        try {
            var result = await axios_1.default.post(this.config.hasuraEndpoint, request, requestConfig);
            return result.data;
        }
        catch (e) {
            console.log('');
            console.log('');
            console.log('** ERROR');
            console.log('GQL Error :');
            console.log(e.response.data);
            throw e;
        }
    }
    async ExecuteSQL(sql_statement) {
        if (!sql_statement) {
            throw new Error('sql_statement is required');
        }
        var sqlQuery = {
            type: 'run_sql',
            args: {
                sql: sql_statement
            }
        };
        let requestConfig = {};
        if (this.config.hasuraAdminSecret) {
            requestConfig = {
                ...requestConfig,
                headers: {
                    'X-Hasura-Admin-Secret': this.config.hasuraAdminSecret
                }
            };
        }
        try {
            var results = await axios_1.default.post(this.config.hasuraQueryEndpoint, sqlQuery, requestConfig);
            if (results.data.errors && results.data.errors.length > 0) {
                throw new Error(results.data.errors);
            }
            return results.data.result;
        }
        catch (e) {
            console.log('** ERROR');
            console.log('SQL Error :');
            console.log(e.response.data);
            throw e;
        }
    }
    async TranslateJsonToTable(sql, parseJson = true, jsonIndex = 0, sql_columns = []) {
        var input_rows = await this.ExecuteSQL(sql);
        // return empty array if no data rows exist
        if (input_rows.length === 0) {
            return [];
        }
        // track column names from all JSON and SQL columns
        var columnKeys = [];
        // add sql column names to list of keys
        sql_columns.map((col) => columnKeys.push(col.label));
        // map input rows to output blending SQL columns with data from JSON object
        var output_rows = [];
        input_rows.splice(1).map((current_row) => {
            var output = {};
            // add data from sql columns to output record
            sql_columns.map((sqlCol) => {
                var sqlValue = current_row[sqlCol.index];
                output[sqlCol.label] = sqlValue;
            });
            // get values from the JSON object
            // the JSON maybe a text column or a JSON object
            var currentJson = parseJson ? JSON.parse(current_row[jsonIndex]) : current_row[jsonIndex];
            // add JSON values to output record
            Object.keys(currentJson).map((key) => {
                var value = currentJson[key];
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
            data_rows: output_rows
        };
    }
    async GetColumnValues(sql, columnIndex = 0) {
        // get rows of data
        var data = (await this.ExecuteSQL(sql)).splice(1);
        // extract the required column value into an array
        var values = [];
        data.map((r) => {
            values.push(r[columnIndex]);
        });
        return values;
    }
}
exports.default = CrudioGQL;
//# sourceMappingURL=CrudioGQL.js.map