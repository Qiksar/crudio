import mongoose, { Model } from "mongoose";

import { ICrudioConfig } from "./CrudioTypes";
import CrudioDataModel from "./CrudioDataModel";
import CrudioEntityDefinition from "./CrudioEntityDefinition";
import CrudioField from "./CrudioField";
import CrudioMongooseDataModel from "./CrudioMongooseDataModel";
import CrudioTable from "./CrudioTable";

/**
 * Provide basic data insertion capabilities to populate a database
 * @date 11/10/2022 - 14:28:24
 *
 * @export
 * @class CrudioMongooseWrapper
 * @typedef {CrudioMongooseWrapper}
 */
export default class CrudioMongooseWrapper {
    /**
     * Reference to the mongoose schema and models
     * @date 11/10/2022 - 14:28:24
     *
     * @private
     * @type {CrudioMongooseDataModel}
     */
    private data_model: CrudioMongooseDataModel;

    /**
     * Schema map
     * @date 11/10/2022 - 14:28:24
     *
     * @public
     * @readonly
     * @type {*}
     */
    public get Schema(): any {
        return this.data_model.Schema;
    }

    /**
     * Models map
     * @date 11/10/2022 - 14:28:24
     *
     * @public
     * @readonly
     * @type {*}
     */
    public get Models(): any {
        return this.data_model.Models;
    }

    /**
     * Get Mongoose model for specified collection
     * @date 11/10/2022 - 15:24:43
     *
     * @public
     * @param {string} name
     * @returns {Model<any>}
     */
    public GetModel(name: string): Model<any> {
        return this.Models[name] as Model<any>;
    }

    /**
     * Constructor
     * @date 7/18/2022 - 1:46:23 PM
     *
     * @constructor
     * @param {ICrudioConfig} config
     * @param {CrudioDataModel} crudio_model
     */
    constructor(private config: ICrudioConfig, private crudio_model: CrudioDataModel) {
        if (crudio_model.TargetDbSchema) this.config.schema = crudio_model.TargetDbSchema;

        this.data_model = new CrudioMongooseDataModel(config, crudio_model);
    }

    /**
     * Drop all collections in the database
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

    /**
     * Populate database tables from memory based tables
     * @date 11/10/2022 - 14:28:24
     *
     * @public
     * @async
     * @returns {Promise<void>}
     */
    public async PopulateDatabaseTables(): Promise<void> {
        for (var index = 0; index < this.crudio_model.Tables.length; index++) {
            const table: CrudioTable = this.crudio_model.Tables[index];

            if (!table.EntityDefinition.IsManyToManyJoin)
                await this.PopulateDatabaseTable(table);
        }

        await this.SetChildrenIds();
    }

    /**
     * Insert data into the specified table
     * @date 7/18/2022 - 1:46:23 PM
     *
     * @private
     * @param {CrudioTable} table
     */
    private async PopulateDatabaseTable(table: CrudioTable): Promise<void> {
        console.log("Loading ", table.TableName);

        var model = this.Models[table.TableName];

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

    /**
     * Get column names from the entity definition
     * @date 11/10/2022 - 14:28:24
     *
     * @private
     * @param {CrudioEntityDefinition} entity
     * @returns {string[]}
     */
    private GetColumns(entity: CrudioEntityDefinition): string[] {
        const table_field_list = [];

        // Create a list of SQL columns from the basic entity fields
        // The list of columns goes into the INSERT statement
        entity.fields.map((f: CrudioField) => {
            table_field_list.push(f.fieldName);
        });

        return table_field_list;
    }

    /**
     * Get the IDs of foreign tables which are referenced by entity values
     * @date 11/10/2022 - 14:28:24
     *
     * @private
     * @param {CrudioEntityDefinition} entity
     * @param {*} entity_values
     * @returns {*}
     */
    private GetForeignKeyValues(entity: CrudioEntityDefinition, entity_values: any): any {
        const key_map = {};

        // add foreign keys to insert columns for one to many
        entity.OneToManyRelationships.map(r => {
            const source = entity_values[r.FromColumn].dataValues;
            const entity = this.crudio_model.GetEntityDefinition(r.ToEntity);

            key_map[entity.TableName] = source[this.config.idField];
        });

        return key_map;
    }

    private async SetChildrenIds(): Promise<void> {
        for (var fi = 0; fi < this.data_model.ForeignKeys.length; fi++) {
            const r = this.data_model.ForeignKeys[fi];

            const parent_model = this.Models[r.parent];
            const child_model = this.Models[r.child];

            // Primary keys of all parent records
            const parent_keys = this.GetPrimaryKeyValues(r.parent);

            for (var i = 0; i < parent_keys.length; i++) {
                const parent_id = parent_keys[i];

                try {
                    // get children
                    const children = await child_model.find({ [r.parent]: parent_id }, { [this.config.idField]: 1 });

                    // get all keys of children
                    const child_keys = children.map(c => {
                        return c[this.config.idField]
                    });

                    const res = await parent_model.findOneAndUpdate({ [this.config.idField]: parent_id }, { [r.child]: child_keys });
                } catch (e) {
                    console.log(e);
                }
            }


        }
    }

    private GetPrimaryKeyValues(tablename: string): string[] {
        const keys = this.crudio_model.GetTable(tablename).DataRows.map(e => e.DataValues[this.config.idField]);
        return keys;
    }
}