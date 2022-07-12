"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const CrudioField_1 = __importDefault(require("./CrudioField"));
const CrudioEntityInstance_1 = __importDefault(require("./CrudioEntityInstance"));
const CrudioUtils_1 = __importDefault(require("./CrudioUtils"));
class CrudioEntityType {
    name;
    abstract;
    tableAlias = "";
    tableName;
    fields = [];
    relationships = [];
    editor = "none";
    icon = "none";
    caption = "none";
    source = "";
    constructor(name, table = null) {
        if (!table)
            table = CrudioUtils_1.default.Plural(name);
        this.name = name;
        this.tableName = table;
    }
    SetAlias(alias) {
        //console.log(`SetAlias ${this.entityTypeName} -> ${alias}`);
        // hak ignore aliasing or now
        this.tableAlias = this.name;
        return this;
    }
    GetFieldNames() {
        var names = [];
        this.fields.map((f) => names.push(f.fieldName));
        return names;
    }
    GetField(fieldName, failIfNotFound) {
        var fields = this.fields.filter((f) => f.fieldName === fieldName);
        if (fields.length > 1) {
            throw new Error("'" +
                fieldName +
                "' matches multiple fields on entity '" +
                this.name +
                "'");
        }
        if (failIfNotFound && fields.length !== 1) {
            throw new Error("'" +
                fieldName +
                "' is not a valid data field on entity '" +
                this.name +
                "'");
        }
        return fields[0];
    }
    GetKey() {
        var fields = this.fields.filter((f) => f.fieldOptions.isKey);
        return fields.length > 0 ? fields[0] : null;
    }
    AddKey(fieldName, fieldType) {
        if (this.GetKey() !== null) {
            throw new Error("a key field is already defined on entity '" + this.name + "'");
        }
        if (this.GetField(fieldName)) {
            throw new Error("'" + fieldName + "' is already defined on entity '" + this.name + "'");
        }
        var keyField = new CrudioField_1.default(fieldName, fieldType || "number", fieldName);
        keyField.fieldOptions.isKey = true;
        keyField.fieldOptions.readonly = true;
        this.fields.push(keyField);
        return this;
    }
    AddString(fieldName, caption, options) {
        this.AddField(fieldName, "string", caption, options);
        return this;
    }
    AddNumber(fieldName, caption, options) {
        this.AddField(fieldName, "number", caption, options);
        return this;
    }
    AddBoolean(fieldName, caption, options) {
        this.AddField(fieldName, "boolean", caption, options);
        return this;
    }
    AddDate(fieldName, caption, options) {
        this.AddField(fieldName, "date", caption, options);
        return this;
    }
    AddField(fieldName, fieldType, caption, options) {
        if (this.GetField(fieldName)) {
            throw new Error("'" + fieldName + "' is already defined on entity '" + this.name + "'");
        }
        this.fields.push(new CrudioField_1.default(fieldName, fieldType, caption, options));
        return this;
    }
    AddGraphField(entityName, fieldList, fieldOptions) {
        if (!fieldOptions) {
            fieldOptions = {
                isKey: false,
            };
        }
        var options = {
            ...fieldOptions,
            isKey: fieldOptions.isKey,
            readonly: true,
            entityName: entityName,
            fieldList: fieldList,
        };
        this.fields.push(new CrudioField_1.default("Field" + this.fields.length, "string", "Graph Field", options));
        return this;
    }
    AddRelation(rel) {
        this.relationships.push(rel);
        return this;
    }
    CreateInstance(values) {
        return new CrudioEntityInstance_1.default(this, values);
    }
}
exports.default = CrudioEntityType;
//# sourceMappingURL=CrudioEntityType.js.map