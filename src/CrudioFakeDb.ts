import { stringify, parse } from "flatted";
import * as fs from "fs";
import { randomUUID } from "crypto";
import { DateTime } from "luxon";
import YAML from "yaml";

import { ICrudioRepository } from "./CrudioTypes";
import CrudioEntityType from "./CrudioEntityType";
import CrudioEntityInstance from "./CrudioEntityInstance";
import CrudioField from "./CrudioField";
import CrudioRepositoryInclude from "./CrudioRepositoryInclude";
import CrudioRepositoryRelationship from "./CrudioRepositoryRelationship";
import CrudioRepositoryTable from "./CrudioRepositoryTable";
import StandardGenerators from "./CrudioStandardGenerators";

// let consumers provide a means of assigning generators to entity fields
export type GeneratorCallback = (
  entityName: string,
  fieldName: string,
  fieldType: string
) => string;

var logpath: string;

var defaultGeneratorCallBack: GeneratorCallback = (
  entityName: string,
  fieldName: string,
  fieldType
) => "unknown";

class CrudioFakeDb implements ICrudioRepository {
  public include: CrudioRepositoryInclude[] = [];
  public generators: any = {};
  public tables: CrudioRepositoryTable[] = [];
  public schema: any = {};
  public entities: CrudioEntityType[] = [];
  public relationships: CrudioRepositoryRelationship[] = [];

  private entityId: number = 1;
  getEntityId(): number {
    return this.entityId++;
  }

  public static LoadJSON(filename: string): ICrudioRepository {
    var input = fs.readFileSync(filename, "utf8");
    const json = JSON.parse(input);
    CrudioFakeDb.SetPrototypes(json);

    return json;
  }

  constructor(repo: ICrudioRepository) {
    defaultGeneratorCallBack = (a, b, c) => {
      return "unknown";
    };

    CrudioFakeDb.SetPrototypes(repo);

    if (repo !== null && repo !== undefined) {
      this.generators = repo.generators;
      this.schema = repo.schema;
      this.include = repo.include;

      this.LoadRepositoryTables(repo);
      this.LoadRepositoryRelationships(repo);
    }

    this.Initialise();

    Object.keys(repo.record_counts).map((k) => {
      this.SetTableRecordCount(k, repo.record_counts[k]);
    });

    this.CreateData();
  }

  Initialise(): void {
    this.ProcessHardcodedSchema(this.schema);
    this.ProcessIncludes(this.include);
    this.SetTables();
  }

  SetTables() {
    this.entities.map((e: CrudioEntityType) => {
      this.AddTable(
        this.GetClassName(e.tableName),
        this.GetClassName(e.name),
        50
      );
    });
  }

  LoadRepositoryTables(repo: ICrudioRepository): void {
    this.tables = [];

    repo.tables.map((t: any) => {
      if (!t.abstract) {
        var tbl: CrudioRepositoryTable = new CrudioRepositoryTable();

        tbl.name = t.name;
        tbl.entity = t.entity;
        tbl.count = t.tycountpe;

        this.tables.push(tbl);
      }
    });
  }

  LoadRepositoryRelationships(repo: any): void {
    this.relationships = [];

    repo.relationships.map((r: any) => {
      var rel: CrudioRepositoryRelationship =
        new CrudioRepositoryRelationship();

      rel.from = r.from;
      rel.to = r.to;
      rel.type = r.type;

      this.relationships.push(rel);
    });
  }

  Serialize(): string {
    var serialised: string = stringify(this);

    if (serialised.length === 0) {
      throw new Error(
        "Serialization error - empty string returned from stringify"
      );
    }

    return serialised;
  }

  static Deserialize(input: string): CrudioFakeDb {
    input = input.trim();

    // wrap JSON in array
    if (input[0] != "[") input = "[" + input + "]";

    const fkdb: CrudioFakeDb = parse(input);
    CrudioFakeDb.SetPrototypes(fkdb);

    return fkdb;
  }

  public Save(filename: string): void {
    fs.writeFileSync(filename, this.Serialize());
  }

  private static SetPrototypes(fkdb: any) {
    if (!fkdb.include) fkdb.include = [];
    if (!fkdb.generators) fkdb.generators = {};
    if (!fkdb.entities) fkdb.entities = [];
    if (!fkdb.tables) fkdb.tables = [];
    if (!fkdb.relationships) fkdb.relationships = [];

    Object.keys(StandardGenerators).map(
      (k) => (fkdb.generators[k] = StandardGenerators[k])
    );

    Object.setPrototypeOf(fkdb, CrudioFakeDb.prototype);

    fkdb.entities.map((e: any) => {
      Object.setPrototypeOf(e, CrudioEntityType.prototype);

      e.fields.map((f: any) => {
        Object.setPrototypeOf(f, CrudioField.prototype);
      });
    });

    fkdb.tables.map((t: any) => {
      Object.setPrototypeOf(t, CrudioRepositoryTable.prototype);
      t.rows.map((r: any) =>
        Object.setPrototypeOf(r, CrudioEntityInstance.prototype)
      );
    });
  }

  CreateData(): void {
    this.DropData();

    // create data for each table
    const tables = this.tables.filter((t: any) => !t.abstract);

    tables.map((t: CrudioRepositoryTable) => {
      this.FillTable(t);
    });

    // process relationships and connect entities
    this.CreateRelationships();
  }

  DropData(): void {
    this.tables.map((t: CrudioRepositoryTable) => {
      delete t.rows;
    });
  }

  GetDataRows(tableName: string): CrudioEntityInstance[] {
    var t: CrudioRepositoryTable | null = this.GetTable(tableName);
    if (t !== null) {
      return t.rows;
    } else {
      throw new Error(`${tableName} : table not found`);
    }
  }

  GetData(
    rows: CrudioEntityInstance[],
    id: number
  ): CrudioEntityInstance | null {
    for (var index: number = 0; index < rows.length; index++) {
      if (rows[index].values._id === id) {
        return rows[index];
      }
    }

    return null;
  }

  ProcessHardcodedSchema(schemaNode: any): void {
    this.entities = [];

    if (schemaNode === undefined) {
      return;
    }

    var eKeys: string[] = Object.keys(schemaNode);

    for (var index: number = 0; index < eKeys.length; index++) {
      var entityname: string = eKeys[index];
      var schema: any = schemaNode[entityname];

      var entity: CrudioEntityType = this.CreateEntityType(entityname);

      var fKeys: string[] = Object.keys(schema).filter(
        (f) => !["inherits"].includes(f)
      );

      for (var findex: number = 0; findex < fKeys.length; findex++) {
        var fieldname: string = fKeys[findex];
        var fieldSchema: any = schema[fieldname];

        entity.AddField(fieldname, fieldSchema.type, fieldname, {
          generator: fieldSchema.generator,
          sensitiveData:
            fieldSchema.sensitiveData === undefined
              ? false
              : fieldSchema.sensitiveData,
          defaultValue:
            fieldSchema.default === undefined ? null : fieldSchema.default,
        });
      }
    }

    // process inheritance
    Object.keys(this.schema).map((entityName: any) => {
      var schema_node: any = this.schema[entityName];

      if (schema_node.inherits) {
        this.InheritFields(schema_node.inherits, entityName);
      }
    });
  }

  ProcessIncludes(include: any): void {
    include.map((inc: any) => {
      var folder: string = inc.folder;
      var files: string[] = inc.files;
      var format: string = inc.format;

      files.map((f) => {
        if (format === "yaml") {
          var filename: string = folder + f;
          this.IncludeYaml(filename);
        }
      });
    });
  }

  IncludeYaml(path: string): void {
    var content: string = fs.readFileSync(path, "utf8");
    var yaml: any = YAML.parse(content);
    var schema_node: any;

    try {
      schema_node = yaml.spec.paths.components.schemas;
    } catch (e) {
      return;
    }

    var keys: string[] = Object.keys(schema_node);

    for (var index: number = 0; index < keys.length; index++) {
      var schema_node_name: string = keys[index];
      var entity_node: any = schema_node[schema_node_name];
      var schema_type: string = entity_node.type;

      if (schema_type === "object") {
        var entityName: string = this.GetClassName(schema_node_name);
        var entity: CrudioEntityType | null = this.GetEntityDefinition(
          entityName,
          false
        );

        if (entity === null) {
          entity = this.CreateEntityType(entityName);
          entity.source = path;
        } else {
          continue;
        }

        entity.caption = entity_node.caption || "none";
        entity.icon = entity_node.icon || "none";
        entity.editor = entity_node.editor || "none";

        var properties: any = entity_node.properties;

        if (properties === undefined) {
          continue;
        }

        var pkeys: string[] = Object.keys(properties);

        for (var pindex: number = 0; pindex < pkeys.length; pindex++) {
          var fieldname: any = pkeys[pindex];
          var prop: any = properties[fieldname];

          if (prop === null || prop === undefined) {
          } else {
            var ftype: any = prop.type;
            var sns: any = prop.sensitive || false;
            var req: any = prop.required || false;
            var dflt: any = prop.default || null;
            var vld: any = prop.validation || "";

            if (ftype === undefined) {
              ftype = "string";
            }

            ftype = this.GetFieldType(ftype);

            entity.AddField(fieldname, ftype, fieldname, {
              generator: defaultGeneratorCallBack(
                schema_node_name,
                fieldname,
                ftype
              ),
              required: req,
              sensitiveData: sns,
              defaultValue: dflt,
              validation: vld,
            });
          }
        }
      } else if (schema_type === "array") {
        throw "arrays not handled yet";
      }
    }
  }

  // copy fields from base entity to child entity
  InheritFields(baseEntityName: string, childEntityName: string): void {
    var baseEntity: CrudioEntityType =
      this.GetEntityDefinition(baseEntityName)!;
    var targetEntity: CrudioEntityType =
      this.GetEntityDefinition(childEntityName)!;

    baseEntity.fields.map((f: CrudioField) => {
      if (f.fieldName.toLocaleLowerCase() != "abstract") {
        if (targetEntity.GetField(f.fieldName)) {
          throw new Error(
            `InheritFields - child:'${targetEntity.name}' base:'${baseEntity.name}' : can not have fields in child which are already specifified in base. field:'${f.fieldName}'`
          );
        }

        targetEntity.fields.push(f);
      }
    });
  }

  CreateEntityType(name: string): CrudioEntityType {
    var exists: CrudioEntityType | null = this.GetEntityDefinition(name, false);

    if (exists !== null) {
      throw new Error(`CreateEntityType: '${name}' already exists in model`);
    }

    var entity: CrudioEntityType | null;
    entity = this.GetEntityDefinition(name, false);

    if (entity === null) {
      entity = new CrudioEntityType(name);
      this.entities.push(entity);
      return entity;
    }

    throw new Error(`Entity '${name} already exists'`);
  }

  GetEntityDefinition(
    entityName: string,
    failIfNotFound: boolean = true
  ): CrudioEntityType | null {
    var matches: CrudioEntityType[] = this.entities.filter(
      (e: CrudioEntityType) => e.name === entityName
    );

    if (failIfNotFound && matches.length === 0) {
      throw new Error(`Entity '${entityName}' not found`);
    }

    if (matches.length === 0) {
      return null;
    }

    return matches[0];
  }

  GetTable(name: string): CrudioRepositoryTable {
    var matches: CrudioRepositoryTable[] = this.tables.filter(
      (e: CrudioRepositoryTable) => e.name === name
    );

    if (matches.length === 0) {
      throw new Error(`Table '${name}' not found`);
    }

    return matches[0];
  }

  CreateRelationships(): void {
    this.relationships.map((r: any) => {
      if (r.type === "one") {
        this.JoinOneToMany(r);
      } else {
        throw new Error(`${r.type} is not a valid relationship type`);
      }
    });
  }

  JoinOneToMany(r: any): void {
    var sourceTable: CrudioRepositoryTable = this.GetTable(r.from)!;
    var targetTable: CrudioRepositoryTable = this.GetTable(r.to)!;

    if (sourceTable === null) {
      throw new Error(`Can not find source '${r.from}'`);
    }

    if (targetTable === null) {
      throw new Error(`Can not find target '${r.to}'`);
    }

    // initialise all target entities with an empty array to receive referencing entities
    targetTable.rows.map((row: CrudioEntityInstance) => {
      if (row.values[r.from] === undefined) {
        row.values[r.from] = [];
      }
    });

    var index: number = 0;
    // randomly distribute the source records over the target table
    sourceTable.rows.map((sourceRow: CrudioEntityInstance) => {
      // every target must get at least one source record connected to it
      // as ths avoids having empty arrays
      // use index to assign the first n relationships and after that use
      // random values to distribute the records
      var targetRow: CrudioEntityInstance =
        targetTable.rows[
          index > targetTable.rows.length - 1
            ? this.GetRandom(0, targetTable.rows.length - 1)
            : index++
        ];

      // the source points to a single target record
      sourceRow.values[targetTable.entity] = targetRow;

      // the target has a list of records which it points back to
      targetRow.values[r.from].push(sourceRow);
    });
  }

  FillTable(table: CrudioRepositoryTable): void {
    var count: number = table.count;

    if (count === undefined || count < 1) {
      console.log(`Table ${table.name} - no count specified, default to 10`);
      count = 10;
    }

    var entity: CrudioEntityType | null = this.GetEntityDefinition(
      table.entity,
      false
    );

    if (entity === null) {
      throw new Error(
        `Invalid entity name '${table.entity}' for table '${table.name}'`
      );
    }

    var records: CrudioEntityInstance[] = [];

    for (var c: number = 0; c < count; c++) {
      records.push(this.CreateEntityInstance(entity));
    }

    table.rows = records;
  }

  CreateEntityInstance(entity: CrudioEntityType): CrudioEntityInstance {
    var record: CrudioEntityInstance = entity.CreateInstance({});

    entity.fields.map((field) => {
      var generator: string | undefined = field.fieldOptions.generator;

      if (generator && generator != "unknown") {
        var value: any = this.ReplaceTokens(generator, record);
        record.values[field.fieldName] = value;
      }
    });

    return record;
  }

  ReplaceTokens(definition: string, target: any): string {
    var tokens: string[] | null = definition.match(/\[.*?\]+/g);

    if (tokens === null) {
      return definition;
    }

    var value: any;

    tokens.map((token) => {
      var tk: string = token.replace(/\[|\]/g, "");
      var name: string = tk;

      // find parameter characters:
      // ! : get field from context
      // - : remove all spaces and convert to lower case
      var params: string[] = name.match(/^\?|!|-|\*/g) || [];
      name = name.slice(params.length);

      if (params.includes("*")) {
        // get field value by fetching an array
        value = "ARRAY FETCH/BUILD NOT DONE YET -" + target.values[name];
      } else if (params.includes("?")) {
        // get field value by looking up an object
        value = "LOOKUP NOT DONE YET -" + target.values[name];
      } else if (params.includes("!")) {
        // get field value from current context
        value = target.values[name];
      } else {
        value = this.GenerateValue(name);

        // recurse - there are still more tokens in the string
        if (
          typeof value === "string" &&
          value.includes("[") &&
          value.includes("]")
        ) {
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

  GenerateValue(generatorName: string): any {
    var value: any = "";

    if (!Object.keys(this.generators).includes(generatorName)) {
      throw new Error(`Generator name is invalid '${generatorName}'`);
    }

    switch (generatorName.toLowerCase()) {
      case "uuid":
        return randomUUID();

      case "date":
        return DateTime.utc().toFormat("dd-mm-yyyy");

      case "time":
        return DateTime.TIME_24_WITH_SECONDS;

      case "timestamp":
        return DateTime.now();
    }

    var content: string = this.generators[generatorName];

    if (content.includes(";")) {
      var words: string[] = content.replace(/(^;)|(;$)/g, "").split(";");
      var rndWord: number = Math.random();
      var index: number = Math.floor(words.length * rndWord);
      value = words[index];
    } else if (content.includes(">")) {
      var vals: string[] = content.split(">");
      value = this.GetRandom(parseInt(vals[0], 10), parseInt(vals[1], 10));
    } else {
      value = content;
    }

    return value;
  }

  GetRandom(min: number, max: number): number {
    var rndValue: number = Math.random();
    return Math.floor((max - min) * rndValue) + min;
  }

  AddTable(name: string, entity: string, count: number) {
    var t: CrudioRepositoryTable = new CrudioRepositoryTable();
    t.name = name;
    t.entity = entity;
    t.count = count;

    this.tables.push(t);
  }

  SetTableRecordCount(name: string, count: number) {
    const tables = this.tables.filter((t) => t.name === name);

    if (tables.length > 0) {
      const table = tables[0];
      table.count = count;
    }
  }

  GetClassName(input: string): string {
    var converter: any = function (matches: string[]) {
      return matches[1].toUpperCase();
    };

    var result: any = input.replace(/(\-\w)/g, converter);
    result = result.charAt(0).toUpperCase() + result.slice(1);

    return result;
  }

  GetFieldType(fieldType: any): string {
    if (typeof fieldType !== "string") {
      var typedec: string = fieldType[0];
      fieldType.slice(1).map((t: string) => {
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
}

export default CrudioFakeDb;
