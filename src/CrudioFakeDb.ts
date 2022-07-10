import { stringify, parse } from "flatted";
import * as fs from "fs";
import { randomUUID } from "crypto";
import { DateTime } from "luxon";
import YAML from "yaml";

import { ICrudioFieldOptions, ICrudioRepository } from "./CrudioTypes";
import CrudioEntityType from "./CrudioEntityType";
import CrudioEntityInstance from "./CrudioEntityInstance";
import CrudioField from "./CrudioField";
import CrudioRepositoryInclude from "./CrudioRepositoryInclude";
import CrudioRepositoryRelationship from "./CrudioRepositoryRelationship";
import CrudioRepositoryTable from "./CrudioRepositoryTable";
import StandardGenerators from "./CrudioStandardGenerators";

export default class CrudioFakeDb implements ICrudioRepository {
  //#region Properties

  public include: string[] = [];
  public generators: Record<string, unknown> = {};
  public tables: CrudioRepositoryTable[] = [];
  public schema: Record<string, unknown> = {};
  public entities: CrudioEntityType[] = [];
  public relationships: CrudioRepositoryRelationship[] = [];

  private entityId: number = 1;
  public getEntityId(): number {
    return this.entityId++;
  }

  //#endregion

  constructor(repo: ICrudioRepository) {
    CrudioFakeDb.SetPrototypes(repo);

    this.generators = repo.generators;
    this.schema = repo.schema;
    this.include = repo.include;

    this.ProcessSchema(this.schema);
    this.ProcessIncludes(this.include);
    this.CreateTables(this.entities);
    this.CreateRelationships(repo);

    Object.keys(repo.record_counts).map((k) => {
      this.SetTableRecordCount(k, repo.record_counts[k]);
    });

    this.FillDataTables();
  }

  //#region Initialise repository, entities and relationships

  private static SetPrototypes(fkdb: ICrudioRepository) {
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

  private ProcessSchema(schemaNode: any): void {
    this.entities = [];

    if (schemaNode === undefined) {
      return;
    }

    var eKeys: string[] = Object.keys(schemaNode);

    for (var index: number = 0; index < eKeys.length; index++) {
      var entityname: string = eKeys[index];
      var schema: any = schemaNode[entityname];
      this.CreateEntity(schema, entityname);
    }

    // process inheritance from base type
    Object.keys(this.schema).map((entityName: any) => {
      var schema_node: any = this.schema[entityName];

      if (schema_node.inherits) {
        this.InheritBaseFields(schema_node.inherits, entityName);
      }
    });
  }

  private CreateEntity(schema: any, entityname: string) {
    var entity: CrudioEntityType = this.CreateEntityType(entityname);

    var fKeys: string[] = Object.keys(schema).filter(
      (f) => !["inherits"].includes(f)
    );

    if (schema.abstract) entity.abstract = true;

    for (var findex: number = 0; findex < fKeys.length; findex++) {
      var fieldname: string = fKeys[findex];
      var fieldSchema: any = schema[fieldname];

      const fieldOptions: ICrudioFieldOptions ={
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
  }

  private ProcessIncludes(includes: string[]): void {
    includes.map((filename: any) => {
      // TODO import another repo or fragment
    });
  }

  private CreateTables(entities: CrudioEntityType[]) {
    entities.map((e: CrudioEntityType) => {
      if (!e.abstract) {
        var t: CrudioRepositoryTable = new CrudioRepositoryTable();
        t.name = this.GetClassName(e.tableName);
        t.entity = this.GetClassName(e.name);
        t.count = 50;

        this.tables.push(t);
      }
    });
  }

  private CreateRelationships(repo: any): void {
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

  // copy fields from base entity to child entity
  private InheritBaseFields(
    baseEntityName: string,
    childEntityName: string
  ): void {
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

  private ConnectRelationships(): void {
    this.relationships.map((r: any) => {
      if (r.type === "one") {
        this.JoinOneToMany(r);
      } else {
        throw new Error(`${r.type} is not a valid relationship type`);
      }
    });
  }

  private JoinOneToMany(r: any): void {
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
            ? this.GetRandomNumber(0, targetTable.rows.length - 1)
            : index++
        ];

      // the source points to a single target record
      sourceRow.values[targetTable.entity] = targetRow;

      // the target has a list of records which it points back to
      targetRow.values[r.from].push(sourceRow);
    });
  }

  // Get the datatable of values for an entity type
  public GetTable(name: string): CrudioRepositoryTable {
    var matches: CrudioRepositoryTable[] = this.tables.filter(
      (e: CrudioRepositoryTable) => e.name === name
    );

    if (matches.length === 0) {
      throw new Error(`Table '${name}' not found`);
    }

    return matches[0];
  }

  //#endregion

  //#region Serialisation

  public static FromJson(filename: string): CrudioFakeDb {
    var input = fs.readFileSync(filename, "utf8");
    const repo = JSON.parse(input);
    CrudioFakeDb.SetPrototypes(repo);

    return new CrudioFakeDb(repo);
  }

  public static FromString(input: string): CrudioFakeDb {
    input = input.trim();

    // wrap JSON in array
    if (input[0] != "[") input = "[" + input + "]";

    const repo: CrudioFakeDb = parse(input);
    CrudioFakeDb.SetPrototypes(repo);

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

    tables.map((t: CrudioRepositoryTable) => {
      this.FillTable(t);
    });

    // process relationships and connect entities
    this.ConnectRelationships();
  }

  private DropData(): void {
    this.tables.map((t: CrudioRepositoryTable) => {
      delete t.rows;
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

  GetAllRows(tableName: string): CrudioEntityInstance[] {
    var t: CrudioRepositoryTable | null = this.GetTable(tableName);
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
        const v = new Date(Date.now()).toISOString().replace('Z','');
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
