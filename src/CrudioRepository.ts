import { stringify, parse } from "flatted";
import * as fs from "fs";
import { randomUUID } from "crypto";
import { DateTime } from "luxon";

import {
  ICrudioFieldOptions,
  ICrudioSchemaDefinition,
  ISchemaRelationship,
} from "./CrudioTypes";
import CrudioEntityType from "./CrudioEntityType";
import CrudioEntityInstance from "./CrudioEntityInstance";
import CrudioField from "./CrudioField";
import CrudioEntityRelationship from "./CrudioEntityRelationship";
import CrudioTable from "./CrudioTable";

export default class CrudioRepository {
  //#region Properties

  public generators: Record<string, unknown> = {};
  public tables: CrudioTable[] = [];
  public entities: CrudioEntityType[] = [];
  public relationships: CrudioEntityRelationship[] = [];

  private entityId: number = 1;
  public getEntityId(): number {
    return this.entityId++;
  }

  //#endregion

  constructor(repo: ICrudioSchemaDefinition) {
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

  private static SetPrototypes(schema: CrudioRepository) {
    if (!schema.entities) schema.entities = [];
    if (!schema.generators) schema.generators = {};
    if (!schema.relationships) schema.relationships = [];

    Object.setPrototypeOf(schema, CrudioRepository.prototype);

    schema.entities.map((e: any) => {
      Object.setPrototypeOf(e, CrudioEntityType.prototype);

      e.fields.map((f: any) => {
        Object.setPrototypeOf(f, CrudioField.prototype);
      });
    });

    schema.tables.map((t: any) => {
      Object.setPrototypeOf(t, CrudioTable.prototype);
      t.rows.map((r: any) =>
        Object.setPrototypeOf(r, CrudioEntityInstance.prototype)
      );
    });
  }

  private ProcessIncludes(repo: ICrudioSchemaDefinition): void {
    if (repo.include) {
      repo.include.map((filename: any) => {
        this.Merge(filename, repo);
      });
    }
  }

  // Merge an external repository into the current one
  // This works recursively so the repository being merged can also include (merge) other repositories
  private Merge(filename: string, repo: ICrudioSchemaDefinition) {
    const input: ICrudioSchemaDefinition = CrudioRepository.LoadJson(filename);

    if (input.include) this.ProcessIncludes(input);

    if (input.generators) {
      Object.values(input.generators).map((group: any) => {
        repo.generators = { ...repo.generators, ...group };
      });
    }

    if (input.entities) repo.entities = { ...repo.entities, ...input.entities };

    if (input.record_counts)
      repo.record_counts = { ...repo.record_counts, ...input.record_counts };

    if (input.relationships)
      repo.relationships = { ...repo.relationships, ...input.relationships };
  }

  private LoadEntities(repo: ICrudioSchemaDefinition): void {
    this.entities = [];

    var eKeys: string[] = Object.keys(repo.entities);

    // create the basic entity structures
    for (var index: number = 0; index < eKeys.length; index++) {
      var entityname: string = eKeys[index];
      var schema: any = repo.entities[entityname];
      this.CreateEntity(schema, entityname);
    }

    this.LoadRelationships(repo);
  }

  private CreateEntity(schema: any, entityname: string) {
    var entity: CrudioEntityType = this.CreateEntityType(entityname);

    var fKeys: string[] = Object.keys(schema).filter(
      (f) => !["inherits", "abstract", "relationships"].includes(f)
    );

    if (schema.abstract) entity.abstract = true;

    // copy inherited fields from the base entity
    if (schema.inherits) this.InheritBaseFields(schema.inherits, entity);

    for (var findex: number = 0; findex < fKeys.length; findex++) {
      var fieldname: string = fKeys[findex];
      var fieldSchema: any = schema[fieldname];

      const fieldOptions: ICrudioFieldOptions = {
        generator: fieldSchema.generator,
        isKey: fieldSchema.key,
        sensitiveData:
          fieldSchema.sensitiveData === undefined
            ? false
            : fieldSchema.sensitiveData,
        defaultValue:
          fieldSchema.default === undefined ? null : fieldSchema.default,
      };

      entity.AddField(fieldname, fieldSchema.type, fieldname, fieldOptions);
    }

    if (schema.relationships) {
      schema.relationships.map((r: ISchemaRelationship) => {
        const new_rel = new CrudioEntityRelationship({
          from: entity.name,
          ...r,
        });

        entity.relationships.push(new_rel);

        // cache relationships globally
        this.relationships.push(new_rel);
      });
    }
  }

  private InheritBaseFields(
    baseEntityName: string,
    targetEntity: CrudioEntityType
  ): void {
    var baseEntity: CrudioEntityType =
      this.GetEntityDefinition(baseEntityName)!;

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

  private LoadRelationships(repo: ICrudioSchemaDefinition): void {
    this.relationships = [];

    repo.relationships.map((r) => {
      var rel: CrudioEntityRelationship = new CrudioEntityRelationship(r);

      this.relationships.push(rel);
    });
  }

  // Find an entity type which has already been defined in the repo
  public GetEntityDefinition(
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

  // Create an entity type based on its definition in the repo
  private CreateEntityType(name: string): CrudioEntityType {
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

  private CreateDataTables(entities: CrudioEntityType[]) {
    entities.map((e: CrudioEntityType) => {
      if (!e.abstract) {
        var t: CrudioTable = new CrudioTable();
        t.name = this.GetClassName(e.tableName);
        t.entity = this.GetClassName(e.name);
        t.count = 50;

        this.tables.push(t);
      }
    });
  }

  private ConnectRelationships(): void {
    this.entities.map((e) => {
      e.relationships.map((r) => {
        if (r.RelationshipType === "one") this.JoinOneToMany(r);
      });
    });

    this.relationships.map((r: any) => {
      if (r.RelationshipType === "one") {
        this.JoinOneToMany(r);
      } else {
        throw new Error(
          `${r.RelationshipType} is not a valid relationship type`
        );
      }
    });
  }

  private JoinOneToMany(r: CrudioEntityRelationship): void {
    var sourceTable: CrudioTable = this.GetTableForEntity(r.From)!;
    var targetTable: CrudioTable = this.GetTableForEntity(r.To)!;

    if (sourceTable === null) {
      throw new Error(`Can not find source '${r.From}'`);
    }

    if (targetTable === null) {
      throw new Error(`Can not find target '${r.To}'`);
    }

    // initialise all target entities with an empty array to receive referencing entities
    targetTable.rows.map((row: CrudioEntityInstance) => {
      if (row.values[r.From] === undefined) {
        row.values[sourceTable.name] = [];
      }
    });

    var index: number = 0;
    // randomly distribute the source records over the target table
    sourceTable.rows.map((sourceRow: CrudioEntityInstance) => {
      // every target must get at least one source record connected to it
      // as this avoids having empty arrays
      // use index to assign the first n relationships and after that use
      // random values to distribute the records
      var targetRow: CrudioEntityInstance =
        targetTable.rows[
          index > targetTable.rows.length - 1
            ? this.GetRandomNumber(0, targetTable.rows.length - 1)
            : index++
        ];

      // the source points to a single target record
      sourceRow.values[targetTable.entity] = targetRow;

      // the target has a list of records which it points back to
      targetRow.values[sourceTable.name].push(sourceRow);
    });
  }

  // Get the datatable of values for an entity type
  public GetTable(name: string): CrudioTable {
    var matches: CrudioTable[] = this.tables.filter(
      (t: CrudioTable) => t.name === name
    );

    if (matches.length === 0) {
      throw new Error(`Table '${name}' not found`);
    }

    return matches[0];
  }

  // Get the datatable of values for an entity type
  public GetTableForEntity(name: string): CrudioTable {
    var matches: CrudioTable[] = this.tables.filter(
      (t: CrudioTable) => t.entity === name
    );

    if (matches.length === 0) {
      throw new Error(`Table for entity '${name}' not found`);
    }

    return matches[0];
  }
  //#endregion

  //#region Serialisation

  public static FromJson(filename: string): CrudioRepository {
    const json_object = this.LoadJson(filename);
    return new CrudioRepository(json_object);
  }

  public static LoadJson(filename: string): any {
    var input = fs.readFileSync(filename, "utf8");
    const json_object = JSON.parse(input);

    return json_object;
  }

  public static FromString(input: string): CrudioRepository {
    input = input.trim();

    // wrap JSON in array
    if (input[0] != "[") input = "[" + input + "]";

    const repo: CrudioRepository = parse(input);
    CrudioRepository.SetPrototypes(repo);

    return repo;
  }

  public ToString(): string {
    var serialised: string = stringify(this);

    if (serialised.length === 0) {
      throw new Error(
        "Serialization error - empty string returned from stringify"
      );
    }

    return serialised;
  }

  public Save(filename: string): void {
    fs.writeFileSync(filename, this.ToString());
  }

  //#endregion

  //#region Data Handling

  private SetTableRecordCount(name: string, count: number) {
    const tables = this.tables.filter((t) => t.name === name);

    if (tables.length > 0) {
      const table = tables[0];
      table.count = count;
    }
  }

  private FillDataTables(): void {
    this.DropData();

    // create data for each table
    const tables = this.tables.filter((t: any) => !t.abstract);

    tables.map((t: CrudioTable) => {
      this.FillTable(t);
    });

    // process relationships and connect entities
    this.ConnectRelationships();
  }

  private DropData(): void {
    this.tables.map((t: CrudioTable) => {
      delete t.rows;
    });
  }

  FillTable(table: CrudioTable): void {
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

  GetAllRows(tableName: string): CrudioEntityInstance[] {
    var t: CrudioTable | null = this.GetTable(tableName);
    if (t !== null) {
      return t.rows;
    } else {
      throw new Error(`${tableName} : table not found`);
    }
  }

  GetRowByID(
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

  //#endregion

  //#region Entity data population

  private CreateEntityInstance(entity: CrudioEntityType): CrudioEntityInstance {
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

  private ReplaceTokens(definition: string, target: any): string {
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
        value = this.GetGeneratedValue(name);

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

  private GetGeneratedValue(generatorName: string): any {
    if (!generatorName)
      throw new Error(
        "generatorName must specify a standard or customer generator"
      );

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
        //const v = new Date(Date.now()).toISOString().replace('T',' ').replace('Z','');
        const v = new Date(Date.now()).toISOString().replace("Z", "");
        return v;
    }

    var content: string = this.generators[generatorName] as string;

    if (content.includes(";")) {
      var words: string[] = content.replace(/(^;)|(;$)/g, "").split(";");
      var rndWord: number = Math.random();
      var index: number = Math.floor(words.length * rndWord);
      value = words[index];
    } else if (content.includes(">")) {
      var vals: string[] = content.split(">");
      value = this.GetRandomNumber(
        parseInt(vals[0], 10),
        parseInt(vals[1], 10)
      );
    } else {
      value = content;
    }

    return value;
  }

  private GetRandomNumber(min: number, max: number): number {
    var rndValue: number = Math.random();
    return Math.floor((max - min) * rndValue) + min;
  }

  //#endregion
}
