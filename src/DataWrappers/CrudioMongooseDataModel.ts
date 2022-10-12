import { model } from "mongoose";

import Mongoose from "mongoose";
import CrudioDataModel from "@/CrudioDataModel";
import CrudioRelationship from "@/CrudioRelationship";
import CrudioTable from "@/CrudioTable";
import { ICrudioConfig } from "@/CrudioTypes";

/**
 * Cache details of relationship between two tables
 * @date 11/10/2022 - 17:25:54
 *
 * @export
 * @interface IModelRelationship
 * @typedef {IModelRelationship}
 */
export interface IModelRelationship {
    /**
     * Many End
     * @date 11/10/2022 - 17:25:54
     *
     * @type {string}
     */
    parent: string;
    /**
     * Single End
     * @date 11/10/2022 - 17:25:54
     *
     * @type {string}
     */
    child: string;
}

/**
 * Definition of schema and models for Mongoose
 * @date 11/10/2022 - 14:31:36
 *
 * @export
 * @class CrudioMongooseDataModel
 * @typedef {CrudioMongooseDataModel}
 */
export default class CrudioMongooseDataModel {
    /**
     * Schema map
     * @date 11/10/2022 - 14:31:36
     *
     * @private
     * @type {*}
     */
    private schema: any = {};

    /**
     * Models map
     * @date 11/10/2022 - 14:31:36
     *
     * @private
     * @type {*}
     */
    private models: any = {};


    /**
     * Schema map
     * @date 11/10/2022 - 14:31:36
     *
     * @public
     * @readonly
     * @type {*}
     */
    public get Schema(): any {
        return this.schema;
    }

    /**
     * Models map
     * @date 11/10/2022 - 14:31:36
     *
     * @public
     * @readonly
     * @type {*}
     */
    public get Models(): any {
        return this.models;
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
        if (crudio_model.TargetDbSchema)
            this.config.schema = crudio_model.TargetDbSchema;
        this.CreateSchemaModels();
    }

    public ReleaseModels(): void {
        this.models = {};
        this.schema = {};

        Object.keys(Mongoose.connection.models).map(modelName => {
            Mongoose.connection.deleteModel(modelName);
        });
    }

    /**
     * Create all schema and models
     * @date 11/10/2022 - 14:31:36
     *
     * @private
     */
    private CreateSchemaModels() {
        // First pass create all required schema
        this.crudio_model.Tables.filter(t => !t.EntityDefinition.IsManyToManyJoin).map(t => {
            this.schema[t.TableName] = this.CreateSchemaForTable(t);
        });

        // Second pass connect foreign keys and create models
        this.AssignForeignKeys();

        // Build the models once all the fields and relationships are in place
        this.crudio_model.Tables.filter(t => !t.EntityDefinition.IsManyToManyJoin).map(t => {
            this.models[t.TableName] = model(t.TableName, this.schema[t.TableName]);
        });
    }

    /**
     * Create a schema for a table definition
     * @date 11/10/2022 - 14:31:36
     *
     * @private
     * @param {CrudioTable} table
     * @returns {*}
     */
    private CreateSchemaForTable(table: CrudioTable): any {
        const schema = {};

        table.EntityDefinition.fields.map(f => {
            const field = {};
            field["type"] = this.GetMongooseFieldType(f.fieldType);
            schema[f.fieldName] = field;
        });

        return schema;
    }

    /**
     * Convert a data type to Mongoose field type
     * @date 11/10/2022 - 14:31:36
     *
     * @private
     * @param {string} fieldType
     * @returns {*}
     */
    private GetMongooseFieldType(fieldType: string): any {
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
                return "Array;";

            case "jsonb":
                return "Map;";

            default:
                throw new Error(`'${fieldType}' has no assigned equivalent in Mongoose`);
        }
    }

    /**
     * Assign foreign keys to the one and many ends of a relationship
     * @date 11/10/2022 - 14:31:36
     *
     * @private
     * @param {CrudioEntityDefinition} entity
     * @returns {*}
     */
    private AssignForeignKeys(): void {
        const relationships: CrudioRelationship[] = [];

        // Ensure join tables are not incorporated into the list of relationships
        // as MongoDB uses arrays
        this.crudio_model.EntityDefinitions.filter(d => !d.IsManyToManyJoin).map(
            d => d.OneToManyRelationships.map(r => relationships.push(r))
        )

        // add foreign keys for one to many
        relationships.map(r => {
            const from_entity = this.crudio_model.GetEntityDefinition(r.FromEntity);
            const to_entity = this.crudio_model.GetEntityDefinition(r.ToEntity);
            const from_schema = this.schema[from_entity.TableName];
            const to_schema = this.schema[to_entity.TableName];

            from_schema[to_entity.TableName] = { type: String, ref: to_entity.TableName };
            to_schema[from_entity.TableName] = [{ type: String, ref: from_entity.TableName }];
        });

        // add foreign keys for many to many
        this.crudio_model.ManyToManyRelationships.map(r => {

            const from_entity = this.crudio_model.GetEntityDefinition(r.FromEntity);
            const to_entity = this.crudio_model.GetEntityDefinition(r.ToEntity);

            const from_schema = this.schema[from_entity.TableName];
            const to_schema = this.schema[to_entity.TableName];

            if (!from_entity || !to_entity || !from_schema || !to_schema)
                throw "bang"

            from_schema[to_entity.TableName] = [{ type: String, ref: to_entity.TableName }];
            to_schema[from_entity.TableName] = [{ type: String, ref: from_entity.TableName }];
        });
    }
}
