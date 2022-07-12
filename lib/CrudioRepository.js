"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const flatted_1 = require("flatted");
const fs = __importStar(require("fs"));
const crypto_1 = require("crypto");
const luxon_1 = require("luxon");
const CrudioEntityType_1 = __importDefault(require("./CrudioEntityType"));
const CrudioEntityInstance_1 = __importDefault(require("./CrudioEntityInstance"));
const CrudioField_1 = __importDefault(require("./CrudioField"));
const CrudioEntityRelationship_1 = __importDefault(require("./CrudioEntityRelationship"));
const CrudioTable_1 = __importDefault(require("./CrudioTable"));
class CrudioRepository {
    //#region Properties
    generators = {};
    tables = [];
    entities = [];
    relationships = [];
    entityId = 1;
    getEntityId() {
        return this.entityId++;
    }
    //#endregion
    constructor(repo) {
        this.ProcessIncludes(repo);
        this.generators = { ...repo.generators };
        this.LoadEntities(repo);
        this.CreateDataTables(this.entities);
        Object.keys(repo.record_counts).map((k) => {
            this.SetTableRecordCount(k, repo.record_counts[k]);
        });
        this.FillDataTables();
    }
    //#region Initialise repository, entities and relationships
    static SetPrototypes(schema) {
        if (!schema.entities)
            schema.entities = [];
        if (!schema.generators)
            schema.generators = {};
        if (!schema.relationships)
            schema.relationships = [];
        Object.setPrototypeOf(schema, CrudioRepository.prototype);
        schema.entities.map((e) => {
            Object.setPrototypeOf(e, CrudioEntityType_1.default.prototype);
            e.fields.map((f) => {
                Object.setPrototypeOf(f, CrudioField_1.default.prototype);
            });
        });
        schema.tables.map((t) => {
            Object.setPrototypeOf(t, CrudioTable_1.default.prototype);
            t.rows.map((r) => Object.setPrototypeOf(r, CrudioEntityInstance_1.default.prototype));
        });
    }
    ProcessIncludes(repo) {
        if (repo.include) {
            repo.include.map((filename) => {
                this.Merge(filename, repo);
            });
        }
    }
    // Merge an external repository into the current one
    // This works recursively so the repository being merged can also include (merge) other repositories
    Merge(filename, repo) {
        const input = CrudioRepository.LoadJson(filename);
        if (input.include)
            this.ProcessIncludes(input);
        if (input.generators) {
            Object.values(input.generators).map((group) => {
                repo.generators = { ...repo.generators, ...group };
            });
        }
        if (input.entities)
            repo.entities = { ...repo.entities, ...input.entities };
        if (input.record_counts)
            repo.record_counts = { ...repo.record_counts, ...input.record_counts };
        if (input.relationships)
            repo.relationships = { ...repo.relationships, ...input.relationships };
    }
    LoadEntities(repo) {
        this.entities = [];
        var eKeys = Object.keys(repo.entities);
        // create the basic entity structures
        for (var index = 0; index < eKeys.length; index++) {
            var entityname = eKeys[index];
            var schema = repo.entities[entityname];
            this.CreateEntity(schema, entityname);
        }
        this.LoadRelationships(repo);
    }
    CreateEntity(schema, entityname) {
        var entity = this.CreateEntityType(entityname);
        var fKeys = Object.keys(schema).filter((f) => !["inherits", "abstract", "relationships"].includes(f));
        if (schema.abstract)
            entity.abstract = true;
        // copy inherited fields from the base entity
        if (schema.inherits)
            this.InheritBaseFields(schema.inherits, entity);
        for (var findex = 0; findex < fKeys.length; findex++) {
            var fieldname = fKeys[findex];
            var fieldSchema = schema[fieldname];
            const fieldOptions = {
                generator: fieldSchema.generator,
                isKey: fieldSchema.key,
                sensitiveData: fieldSchema.sensitiveData === undefined
                    ? false
                    : fieldSchema.sensitiveData,
                defaultValue: fieldSchema.default === undefined ? null : fieldSchema.default,
            };
            entity.AddField(fieldname, fieldSchema.type, fieldname, fieldOptions);
        }
        if (schema.relationships) {
            schema.relationships.map((r) => {
                const new_rel = new CrudioEntityRelationship_1.default({
                    from: entity.name,
                    ...r,
                });
                entity.relationships.push(new_rel);
                // cache relationships globally
                this.relationships.push(new_rel);
            });
        }
    }
    InheritBaseFields(baseEntityName, targetEntity) {
        var baseEntity = this.GetEntityDefinition(baseEntityName);
        baseEntity.fields.map((f) => {
            if (f.fieldName.toLocaleLowerCase() != "abstract") {
                if (targetEntity.GetField(f.fieldName)) {
                    throw new Error(`InheritFields - child:'${targetEntity.name}' base:'${baseEntity.name}' : can not have fields in child which are already specifified in base. field:'${f.fieldName}'`);
                }
                targetEntity.fields.push(f);
            }
        });
    }
    LoadRelationships(repo) {
        this.relationships = [];
        repo.relationships.map((r) => {
            var rel = new CrudioEntityRelationship_1.default(r);
            this.relationships.push(rel);
        });
    }
    // Find an entity type which has already been defined in the repo
    GetEntityDefinition(entityName, failIfNotFound = true) {
        var matches = this.entities.filter((e) => e.name === entityName);
        if (failIfNotFound && matches.length === 0) {
            throw new Error(`Entity '${entityName}' not found`);
        }
        if (matches.length === 0) {
            return null;
        }
        return matches[0];
    }
    // Create an entity type based on its definition in the repo
    CreateEntityType(name) {
        var exists = this.GetEntityDefinition(name, false);
        if (exists !== null) {
            throw new Error(`CreateEntityType: '${name}' already exists in model`);
        }
        var entity;
        entity = this.GetEntityDefinition(name, false);
        if (entity === null) {
            entity = new CrudioEntityType_1.default(name);
            this.entities.push(entity);
            return entity;
        }
        throw new Error(`Entity '${name} already exists'`);
    }
    CreateDataTables(entities) {
        entities.map((e) => {
            if (!e.abstract) {
                var t = new CrudioTable_1.default();
                t.name = this.GetClassName(e.tableName);
                t.entity = this.GetClassName(e.name);
                t.count = 50;
                this.tables.push(t);
            }
        });
    }
    ConnectRelationships() {
        this.entities.map((e) => {
            e.relationships.map((r) => {
                if (r.RelationshipType === "one")
                    this.JoinOneToMany(r);
            });
        });
        this.relationships.map((r) => {
            if (r.RelationshipType === "one") {
                this.JoinOneToMany(r);
            }
            else {
                throw new Error(`${r.RelationshipType} is not a valid relationship type`);
            }
        });
    }
    JoinOneToMany(r) {
        var sourceTable = this.GetTableForEntity(r.From);
        var targetTable = this.GetTableForEntity(r.To);
        if (sourceTable === null) {
            throw new Error(`Can not find source '${r.From}'`);
        }
        if (targetTable === null) {
            throw new Error(`Can not find target '${r.To}'`);
        }
        // initialise all target entities with an empty array to receive referencing entities
        targetTable.rows.map((row) => {
            if (row.values[r.From] === undefined) {
                row.values[sourceTable.name] = [];
            }
        });
        var index = 0;
        // randomly distribute the source records over the target table
        sourceTable.rows.map((sourceRow) => {
            // every target must get at least one source record connected to it
            // as this avoids having empty arrays
            // use index to assign the first n relationships and after that use
            // random values to distribute the records
            var targetRow = targetTable.rows[index > targetTable.rows.length - 1
                ? this.GetRandomNumber(0, targetTable.rows.length - 1)
                : index++];
            // the source points to a single target record
            sourceRow.values[targetTable.entity] = targetRow;
            // the target has a list of records which it points back to
            targetRow.values[sourceTable.name].push(sourceRow);
        });
    }
    // Get the datatable of values for an entity type
    GetTable(name) {
        var matches = this.tables.filter((t) => t.name === name);
        if (matches.length === 0) {
            throw new Error(`Table '${name}' not found`);
        }
        return matches[0];
    }
    // Get the datatable of values for an entity type
    GetTableForEntity(name) {
        var matches = this.tables.filter((t) => t.entity === name);
        if (matches.length === 0) {
            throw new Error(`Table for entity '${name}' not found`);
        }
        return matches[0];
    }
    //#endregion
    //#region Serialisation
    static FromJson(filename) {
        const json_object = this.LoadJson(filename);
        return new CrudioRepository(json_object);
    }
    static LoadJson(filename) {
        var input = fs.readFileSync(filename, "utf8");
        const json_object = JSON.parse(input);
        return json_object;
    }
    static FromString(input) {
        input = input.trim();
        // wrap JSON in array
        if (input[0] != "[")
            input = "[" + input + "]";
        const repo = (0, flatted_1.parse)(input);
        CrudioRepository.SetPrototypes(repo);
        return repo;
    }
    ToString() {
        var serialised = (0, flatted_1.stringify)(this);
        if (serialised.length === 0) {
            throw new Error("Serialization error - empty string returned from stringify");
        }
        return serialised;
    }
    Save(filename) {
        fs.writeFileSync(filename, this.ToString());
    }
    //#endregion
    //#region Data Handling
    SetTableRecordCount(name, count) {
        const tables = this.tables.filter((t) => t.name === name);
        if (tables.length > 0) {
            const table = tables[0];
            table.count = count;
        }
    }
    FillDataTables() {
        this.DropData();
        // create data for each table
        const tables = this.tables.filter((t) => !t.abstract);
        tables.map((t) => {
            this.FillTable(t);
        });
        // process relationships and connect entities
        this.ConnectRelationships();
    }
    DropData() {
        this.tables.map((t) => {
            delete t.rows;
        });
    }
    FillTable(table) {
        var count = table.count;
        if (count === undefined || count < 1) {
            console.log(`Table ${table.name} - no count specified, default to 10`);
            count = 10;
        }
        var entity = this.GetEntityDefinition(table.entity, false);
        if (entity === null) {
            throw new Error(`Invalid entity name '${table.entity}' for table '${table.name}'`);
        }
        var records = [];
        for (var c = 0; c < count; c++) {
            records.push(this.CreateEntityInstance(entity));
        }
        table.rows = records;
    }
    GetAllRows(tableName) {
        var t = this.GetTable(tableName);
        if (t !== null) {
            return t.rows;
        }
        else {
            throw new Error(`${tableName} : table not found`);
        }
    }
    GetRowByID(rows, id) {
        for (var index = 0; index < rows.length; index++) {
            if (rows[index].values._id === id) {
                return rows[index];
            }
        }
        return null;
    }
    GetClassName(input) {
        var converter = function (matches) {
            return matches[1].toUpperCase();
        };
        var result = input.replace(/(\-\w)/g, converter);
        result = result.charAt(0).toUpperCase() + result.slice(1);
        return result;
    }
    GetFieldType(fieldType) {
        if (typeof fieldType !== "string") {
            var typedec = fieldType[0];
            fieldType.slice(1).map((t) => {
                typedec += "|" + this.GetFieldType(t);
            });
            return typedec;
        }
        switch (fieldType) {
            case "array":
                return "[]";
            case "int":
            case "integer":
            case "double":
            case "float":
                return "number";
            case "date":
            case "datetime":
                return "DateTime";
        }
        return fieldType;
    }
    //#endregion
    //#region Entity data population
    CreateEntityInstance(entity) {
        var record = entity.CreateInstance({});
        entity.fields.map((field) => {
            var generator = field.fieldOptions.generator;
            if (generator && generator != "unknown") {
                var value = this.ReplaceTokens(generator, record);
                record.values[field.fieldName] = value;
            }
        });
        return record;
    }
    ReplaceTokens(definition, target) {
        var tokens = definition.match(/\[.*?\]+/g);
        if (tokens === null) {
            return definition;
        }
        var value;
        tokens.map((token) => {
            var tk = token.replace(/\[|\]/g, "");
            var name = tk;
            // find parameter characters:
            // ! : get field from context
            // - : remove all spaces and convert to lower case
            var params = name.match(/^\?|!|-|\*/g) || [];
            name = name.slice(params.length);
            if (params.includes("*")) {
                // get field value by fetching an array
                value = "ARRAY FETCH/BUILD NOT DONE YET -" + target.values[name];
            }
            else if (params.includes("?")) {
                // get field value by looking up an object
                value = "LOOKUP NOT DONE YET -" + target.values[name];
            }
            else if (params.includes("!")) {
                // get field value from current context
                value = target.values[name];
            }
            else {
                value = this.GetGeneratedValue(name);
                // recurse - there are still more tokens in the string
                if (typeof value === "string" &&
                    value.includes("[") &&
                    value.includes("]")) {
                    value = this.ReplaceTokens(value, target);
                }
            }
            if (params.includes("-")) {
                // remove spaces and convert to lower case
                value = value.replace(/\s/g, "");
                value = value.toLowerCase();
            }
            definition = definition.replace(`[${tk}]`, value);
        });
        return definition;
    }
    GetGeneratedValue(generatorName) {
        if (!generatorName)
            throw new Error("generatorName must specify a standard or customer generator");
        var value = "";
        if (!Object.keys(this.generators).includes(generatorName)) {
            throw new Error(`Generator name is invalid '${generatorName}'`);
        }
        switch (generatorName.toLowerCase()) {
            case "uuid":
                return (0, crypto_1.randomUUID)();
            case "date":
                return luxon_1.DateTime.utc().toFormat("dd-mm-yyyy");
            case "time":
                return luxon_1.DateTime.TIME_24_WITH_SECONDS;
            case "timestamp":
                //const v = new Date(Date.now()).toISOString().replace('T',' ').replace('Z','');
                const v = new Date(Date.now()).toISOString().replace("Z", "");
                return v;
        }
        var content = this.generators[generatorName];
        if (content.includes(";")) {
            var words = content.replace(/(^;)|(;$)/g, "").split(";");
            var rndWord = Math.random();
            var index = Math.floor(words.length * rndWord);
            value = words[index];
        }
        else if (content.includes(">")) {
            var vals = content.split(">");
            value = this.GetRandomNumber(parseInt(vals[0], 10), parseInt(vals[1], 10));
        }
        else {
            value = content;
        }
        return value;
    }
    GetRandomNumber(min, max) {
        var rndValue = Math.random();
        return Math.floor((max - min) * rndValue) + min;
    }
}
exports.default = CrudioRepository;
//# sourceMappingURL=CrudioRepository.js.map