import axios from 'axios';

export default class QikTrakHasura {

    constructor(private endpoint: string, private secret: string, private schema: string) {
    }

    public async CreateRelationships(relationship: any): Promise<void> {
        const array_rel_spec: any = {
            type: 'pg_create_array_relationship',

            args: {
                name: this.getArrayRelationshipName(relationship),

                table: {
                    schema: this.schema,
                    name: relationship.referenced_table,
                },

                using: {
                    manual_configuration: {
                        remote_table: {
                            schema: this.schema,
                            name: relationship.referencing_table,
                        },
                        column_mapping: {},
                    },
                },
            },
        };

        array_rel_spec.args.using.manual_configuration.column_mapping[relationship.referenced_key] = relationship.referencing_key;
        await this.CreateRelationship(array_rel_spec);

        const obj_rel_spec: any = {
            type: 'pg_create_object_relationship',

            args: {
                name: this.getObjectRelationshipName(relationship),

                table: {
                    schema: this.schema,
                    name: relationship.referencing_table,
                },
                using: {
                    manual_configuration: {
                        remote_table: {
                            schema: this.schema,
                            name: relationship.referenced_table,
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
    public async CreateRelationship(relSpec: any): Promise<void> {
        await this.RunGraphQL_Query('/v1/metadata', relSpec).catch(e => {
            console.error(e.response.data.error);
            //throw new Error(e.response.data.error);
        });
    }

    //--------------------------------------------------------------------------------------------------------------------------
    // Execute a Postgres SQL query via the Hasura API
    public async RunSQL_Query(sql_statement: string): Promise<any> {
        if (!sql_statement) throw 'sql_statement is required';

        var sqlQuery = {
            type: 'run_sql',
            args: {
                sql: sql_statement,
            },
        };

        return await this.RunGraphQL_Query('/v2/query', sqlQuery)
            .then((results) => {
                return results.data.result;
            })
            .catch((e) => {
                console.error('QIKTRAK: ERROR');
                console.error('SQL QUERY FAILED TO EXECUTE: ');

                if (!e.response) console.error('Error Message : ' + e);
                else console.error('Error Message : ' + JSON.stringify(e.response.data));

                console.error('SQL Statement:');
                console.error(sql_statement);

                throw e;
            });
    }

    //--------------------------------------------------------------------------------------------------------------------------
    // Execute a GraphQL query via the Hasura API
    public async RunGraphQL_Query(endpoint: string, query: any): Promise<any> {
        if (!endpoint) throw 'endpoint is required';
        if (!query) throw 'query is required';

        const requestConfig = {
            headers: {
                'X-Hasura-Admin-Secret': this.secret,
            },
        };

        return await axios.post(this.endpoint + endpoint, query, requestConfig);
    }

    //#region Name Handling

    //---------------------------------------------------------------------------------------------------------------------------
    // convert foreign_key_names into foreignKeyName
    getCamelCaseName(inputString: string) {
        if (!inputString) throw 'inputString is required';

        var text = inputString
            .toLowerCase()
            .replace(/[_-]/g, ' ') // Break up the words in my_foreign_key_name to be like my foreign key name
            .replace(/\s[a-z]/g, (s) => s.toUpperCase()) // capitalise each word
            .replace(' ', '') // remove the space to join the words back together
            .replace(/^[A-Z]/, (s) => s.toLowerCase()); // ensure the first word is lowercased
        return text;
    }

    //---------------------------------------------------------------------------------------------------------------------------
    // handle plural words which can easily be singularised
    getSingularName(inputString: string, singular: string) {
        if (!inputString) throw 'inputString is required';

        var text = inputString;

        // If the singular form of the name is required then use some simple logic to get the singular form
        // If the logic doesn't work, just return whatever text was created above
        if (singular) {
            if (['ies'].indexOf(text.slice(text.length - 3)) >= 0) {
                text = text.slice(0, text.length - 3) + 'y';
            } else if (['us', 'ss'].indexOf(text.slice(text.length - 2)) < 0) {
                if (text.slice(text.length - 1) == 's') {
                    text = text.slice(0, text.length - 1);
                }
            }
        }

        return text;
    }

    //---------------------------------------------------------------------------------------------------------------------------
    // Default relationship name builder
    getArrayRelationshipName(relationship: any) {
        const name = relationship.referencing_table;
        return name;
    }

    //---------------------------------------------------------------------------------------------------------------------------
    // Default relationship name builder
    getObjectRelationshipName(relationship: any) {
        var key: string = relationship.referencing_key;
        if (key.endsWith("Id"))
            key = key.substring(0, key.length - 2);
        else
            key = `_${key}`;

        return key;
    }

    //#endregion
}
