import { ICrudioConfig } from './CrudioTypes';
export default class CrudioGQL {
    config: ICrudioConfig;
    constructor(config: ICrudioConfig);
    Execute(request: {}): Promise<{}>;
    ExecuteSQL(sql_statement: string): Promise<any>;
    TranslateJsonToTable(sql: string, parseJson?: boolean, jsonIndex?: number, sql_columns?: {}[]): Promise<{}>;
    GetColumnValues(sql: string, columnIndex?: number): Promise<any[]>;
}
