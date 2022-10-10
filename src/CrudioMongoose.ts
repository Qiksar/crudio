import mongoose, { Schema } from "mongoose";

import CrudioDataModel from "./CrudioDataModel";
import CrudioEntityDefinition from "./CrudioEntityDefinition";
import CrudioField from "./CrudioField";
import CrudioTable from "./CrudioTable";
import { ICrudioConfig } from "./CrudioTypes";
import CrudioUtils from "./CrudioUtils";


export default class CrudioMongoose {
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

    public async PopulateDatabaseTables(): Promise<void> {

        for (var index = 0; index < this.datamodel.Tables.length; index++) {
            const table: CrudioTable = this.datamodel.Tables[index];
            {
                await this.InsertData(table);
            }
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
        var schema = new Schema({ any: {} }, { strict: false });
        var model = mongoose.model(table.TableName, schema);

        console.log("Loading ", table.TableName);

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

            try {
                var row = new model({ any: values });
                const result = await row.save();
            } catch (e) {
                console.log("Failed to save", values, "\n\n", e);
            }
        }
    }

    /**
     * Acquire the SQL columns required to support the entity data fields
     * @date 7/18/2022 - 1:46:23 PM
     *
     * @private
     * @param {CrudioEntityDefinition} entity
     * @param {SqlInstructionList} instructions
     */
    private GetColumns(entity: CrudioEntityDefinition): string[] {
        const table_field_list = [];

        // Add the primary key
        table_field_list.push(entity.KeyField.fieldName);

        // Create a list of SQL columns from the basic entity fields
        // The list of columns goes into the INSERT statement
        entity.fields.map((f: CrudioField) => {
            if (f.fieldName != entity.KeyField.fieldName) {
                table_field_list.push(f.fieldName);
            }
        });

        // add foreign keys to insert columns for one to many
        entity.OneToManyRelationships.map(r => {
            var column = CrudioUtils.ToColumnId(r.FromColumn);
            table_field_list.push(column);
        });

        return table_field_list;
    }
}