import mongoose, { Schema } from "mongoose";

import CrudioDataModel from "./CrudioDataModel";
import CrudioEntityDefinition from "./CrudioEntityDefinition";
import CrudioField from "./CrudioField";
import CrudioTable from "./CrudioTable";
import { ICrudioConfig } from "./CrudioTypes";


export default class CrudioMongooseWrapper {
    private schema: any = {};

    /**
     * Creates an instance of CrudioMongoose.
     * @date 7/18/2022 - 1:46:23 PM
     *
     * @constructor
     * @param {ICrudioConfig} config
     * @param {CrudioDataModel} datamodel
     */
    constructor(private config: ICrudioConfig, private datamodel: CrudioDataModel) {
        if (datamodel.TargetDbSchema) this.config.schema = datamodel.TargetDbSchema;
    }

    /**
     * Drop schema and recreate with no tables
     * @date 7/18/2022 - 1:46:23 PM
     *
     * @public
     * @async
     * @returns {*}
     */
    public async CreateDatabaseSchema(): Promise<void> {
        await mongoose.connect(this.config.dbconnection).catch(e => {
            console.log("Mongoose failed to connect:", e);
        });

        const collectionNames = await mongoose.connection.db.listCollections().toArray();

        for (var index = 0; index < collectionNames.length; index++) {
            console.log("Dropped ", collectionNames[index].name);
            await mongoose.connection.db.dropCollection(collectionNames[index].name);
        }
    }

    public CreateMongooseSchema() {
        this.datamodel.Tables.map(t => {
            const schema = this.GetMongooseSchema(t);
            this.schema[t.TableName] = schema;
        });

        this.datamodel.Tables.map(t => {
            this.AssignForeignKeys(t.EntityDefinition);
        });
    }

    public async PopulateDatabaseTables(): Promise<void> {
        this.CreateMongooseSchema();

        for (var index = 0; index < this.datamodel.Tables.length; index++) {
            const table: CrudioTable = this.datamodel.Tables[index];

            if (!table.EntityDefinition.IsManyToManyJoin)
                await this.InsertData(table);
        }
    }

    /**
     * Build the SQL to insert values into data tables
     * @date 7/18/2022 - 1:46:23 PM
     *
     * @private
     * @param {CrudioTable} table
     * @param {SqlInstructionList} instructions
     */
    private async InsertData(table: CrudioTable): Promise<void> {
        console.log("Loading ", table.TableName);
        const schema = this.schema[table.TableName];

        var model = mongoose.model(table.TableName, schema);

        for (var r = 0; r < table.DataRows.length; r++) {
            let data = table.DataRows[r].DataValues;
            const values = {};

            this.GetColumns(table.EntityDefinition).map(k => {
                let datavalue = data[k]

                if (!datavalue && k.endsWith("Id")) {
                    // Field was renamed to ...Id, so remove it to get the
                    // orginal name in order to retrieve the field value
                    const column_name = k.slice(0, k.length - 2);
                    datavalue = data[column_name];
                }

                // If one to many join, read the ID of the target object
                if (datavalue && datavalue.DataValues) {
                    datavalue = datavalue.DataValues.id;
                }

                values[k] = datavalue;
            });

            const fkv = this.GetForeignKeyValues(table.EntityDefinition, data);
            Object.keys(fkv).map(k => {
                values[k] = fkv[k];
            })

            try {
                var row = new model(values);
                const result = await row.save();
            } catch (e) {
                console.log("Failed to save", values, "\n\n", e);
            }
        }
    }

    public GetMongooseSchema(table: CrudioTable): any {
        const schema = {
        }

        table.EntityDefinition.fields.map(f => {
            const field = {};
            field["type"] = this.GetMongooseFieldType(f.fieldType);
            schema[f.fieldName] = field;
        });

        return schema
    }

    public GetMongooseFieldType(fieldType: string): any {
        switch (fieldType.toLocaleLowerCase()) {
            case "uuid":
            case "string":
                return "String";

            case "boolean":
                return "Boolean";

            case "integer":
                return "Number";

            case "decimal":
                return "Number";

            case "timestamp":
            case "date":
                return "Date";

            case "array":
                return "Array;"

            case "jsonb":
                return "Map;"
        }
    }

    private GetColumns(entity: CrudioEntityDefinition): string[] {
        const table_field_list = [];

        // Create a list of SQL columns from the basic entity fields
        // The list of columns goes into the INSERT statement
        entity.fields.map((f: CrudioField) => {
            table_field_list.push(f.fieldName);
        });

        return table_field_list;
    }

    private AssignForeignKeys(entity: CrudioEntityDefinition): any {
        const key_map = {};

        // add foreign keys to insert columns for one to many
        entity.OneToManyRelationships.map(r => {

            const from_entity = this.datamodel.GetEntityDefinition(r.FromEntity);
            const to_entity = this.datamodel.GetEntityDefinition(r.ToEntity);
            const from_schema = this.schema[from_entity.TableName];
            const to_schema = this.schema[to_entity.TableName];

            from_schema[to_entity.TableName] = { type: String, ref: to_entity.TableName };
            to_schema[from_entity.TableName] = [{ type: String, ref: from_entity.TableName }];
        });

        return key_map;
    }

    private GetForeignKeyValues(entity: CrudioEntityDefinition, values: any): any {
        const key_map = {};

        // add foreign keys to insert columns for one to many
        entity.OneToManyRelationships.map(r => {
            const source = values[r.FromColumn].dataValues;
            const entity = this.datamodel.GetEntityDefinition(r.ToEntity);

            key_map[entity.TableName] = source[this.config.idField];
        });

        return key_map;
    }
}