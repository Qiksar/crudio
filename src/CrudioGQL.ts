import axios from 'axios';

import { ICrudioConfig, ICrudioQuery, ICrudioEntityInstance, ICrudioFilter, ICrudioField } from './CrudioTypes';
import CrudioInclude from './CrudioInclude';
import CrudioQuery from './CrudioQuery';
import CrudioField from './CrudioField';
import CrudioDataWrapper from './CrudioDataWrapper';

export default class CrudioGQL {
	config: ICrudioConfig;

	constructor(config: ICrudioConfig) {
		this.config = config;
	}

	GetGqlQuery(model: CrudioDataWrapper, query: CrudioQuery): {} {
		return { query: `{ ${this.GetEntityGql(model, query)} }` };
	}

	GetGqlSubscription(model: CrudioDataWrapper, query: CrudioQuery, limit: number, offset: number): {} {
		return { subscription: `{ ${this.GetEntityGql(model, query)} }` };
	}

	GetGqlInsertAndGetId(entity: ICrudioEntityInstance): {} {
		var values: string[] = this.GetWriteableValues(entity);

		var mutation: {} = {
			query: `
            mutation {
                insert_${entity.entityType.tableName}
                    (
                    objects: [{${values}}]
                    )
                {
                    returning
                    {
                        Id
                    }
                }
            }`
		};

		return mutation;
	}

	GetGqlUpdate(entity: ICrudioEntityInstance): {} {
		var values: string[] = this.GetWriteableValues(entity);

		var mutation: {} = {
			query: `
            mutation {
                update_${entity.entityType.tableName}
                (
                    where: {Id: {_eq: ${entity.values.Id}}},
                    _set: { ${values} }
                )
                { affected_rows }
            }`
		};

		return mutation;
	}

	private GetWriteableValues(entity: ICrudioEntityInstance): string[] {
		// only process fields which are not readonly and have a value

		var fields: ICrudioField[] = entity.entityType.fields.filter((f) => {
			if (entity.values[f.fieldName] !== null && (f.fieldOptions.readonly || false) !== true) {
				return true;
			} else {
				return false;
			}
		});

		var values: string[] = fields.map((f) => {
			return f.fieldName + ':' + `"${entity.values[f.fieldName]}"`;
		});

		if (values.length === 0) {
			throw new Error('GetWriteableValues - no writeable values found');
		}

		return values;
	}

	GetGqlDelete(entity: ICrudioEntityInstance): {} {
		var mutation: {} = {
			query: `
            mutation {
                delete_${entity.entityType.tableName}
                (
                    where: {Id: {_eq: ${entity.values.Id}}}
                )
                { affected_rows }
            }`
		};

		return mutation;
	}

	private GetEntityGql(model: CrudioDataWrapper, query: CrudioQuery): string {
		var whereClause: string = this.GetWhereClause(query) || '';
		var orderByClause: string = this.GetOrderByClause(model, query) || '';
		var pagingClause: string = this.GetPagingClause(query) || '';

		var w: string = whereClause.trim().length > 0 ? '(' + whereClause + ')' : '';
		var aggregateBlock: string = `${query.entity.tableName}_aggregate ${w} {aggregate { count }}`;

		var block: string = `${whereClause} ${orderByClause} ${pagingClause}`;
		if (block.trim() !== '') {
			block = '(' + block + ')';
		}

		var fields: CrudioField[] = query.entity.fields.filter(
			(f) => f.fieldOptions === null || !f.fieldOptions.entityName
		);

		var entityBlock: string = `
        ${query.entity.tableName}
        ${block}
        {
            ${fields.map((f) => f.fieldName)}
            ${query.include.map((i) => this.GetIncludeGql(i))}
        }
        `;

		var output: string = `
        ${aggregateBlock}
        ${entityBlock}
        `;

		/*
            console.log(output);
            model.LogQuery(output);
            console.log("Query logged in local storage");
            localStorage.LastQuery = `{ ${output} }`;
        */

		return output;
	}

	private GetIncludeGql(include: CrudioInclude): string {
		var query: string = `
        ${include.entityName}
        {
            ${include.fields.map((f) => f.fieldName)}
        }
        `;

		return query;
	}

	private GetWhereClause(query: ICrudioQuery): string | null {
		var filters: string[] = query.filters.map((f) => this.GetFilterClause(f));

		return filters.length > 0 ? `where: { ${filters} } ` : null;
	}

	private GetFilterClause(filter: ICrudioFilter): string {
		return `${filter.fieldName}: { ${filter.filterType}: "${filter.filterValue}" } `;
	}

	private GetOrderByClause(model: CrudioDataWrapper, query: ICrudioQuery): string | null {
		if (query.sortField && query.sortDirection) {
			if (query.sortField.fieldOptions.entityName) {
				return `order_by: { ${query.sortField.fieldOptions
					.entityName}: {${query.graphSortField}: ${query.sortDirection}} } `;
			}

			return `order_by: { ${query.sortField.fieldName}: ${query.sortDirection} } `;
		} else {
			return null;
		}
	}

	private GetPagingClause(query: CrudioQuery): string | null {
		if (!query || query === undefined) {
			throw new Error('query is a required parameter');
		}

    let limitSetting = null
    let offsetSetting = null

    if (query.limit) {
		  limitSetting = 'limit: ' + query.limit;
    }

    if (query.offset) {
      offsetSetting = 'offset: ' + query.offset;
    }

		var paging: string | null = limitSetting;

		if (paging) {
			if (offsetSetting) {
				paging += ', ' + offsetSetting;
			}

			paging += ', ';
		}

		return paging;
	}

	async Execute(request: {}): Promise<{}> {
		if (!request) {
			throw 'request is required';
		}

		let requestConfig: {} = {};

		if (this.config.hasuraAdminSecret) {
			requestConfig = {
				...requestConfig,
				headers: {
					'X-Hasura-Admin-Secret': this.config.hasuraAdminSecret
				}
			};
		}

		try {
			var result: any = await axios.post(this.config.hasuraEndpoint, request, requestConfig);
			return result.data;
		} catch (e:any) {
			console.log('');
			console.log('');
			console.log('** ERROR');
			console.log('GQL Error :');
			console.log(e.response.data);

			throw e;
		}
	}

	async ExecuteSQL(sql_statement: string): Promise<any> {
		if (!sql_statement) {
			throw new Error('sql_statement is required');
		}

		var sqlQuery: {} = {
			type: 'run_sql',
			args: {
				sql: sql_statement
			}
		};

		let requestConfig: {} = {};

		if (this.config.hasuraAdminSecret) {
			requestConfig = {
				...requestConfig,
				headers: {
					'X-Hasura-Admin-Secret': this.config.hasuraAdminSecret
				}
			};
		}

		try {
			var results: any = await axios.post(this.config.hasuraQueryEndpoint, sqlQuery, requestConfig);
			if(results.data.errors && results.data.errors.length > 0){
				throw new Error(results.data.errors)
			}

			return results.data.result;
		} catch (e:any) {
			console.log('** ERROR');
			console.log('SQL Error :');
			console.log(e.response.data);

			throw e;
		}
	}

	async TranslateJsonToTable(
		sql: string,
		parseJson: boolean = true,
		jsonIndex: number = 0,
		sql_columns: {}[] = []
	): Promise<{}> {
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
			Object.keys(currentJson).map((key) => {
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
			data_rows: output_rows
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
