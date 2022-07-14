import { ICrudioFieldOptions } from "./CrudioTypes";

import CrudioField from "./CrudioField";
import CrudioEntityInstance from "./CrudioEntityInstance";
import CrudioEntityRelationship from "./CrudioEntityRelationship";
import CrudioUtils from "./CrudioUtils";

export default class CrudioEntityType {
  public name: string;
  public abstract: boolean;
  public tableAlias: string = "";
  public tableName: string;
  public fields: CrudioField[] = [];
  public relationships: CrudioEntityRelationship[] = [];
  public editor: string = "none";
  public icon: string = "none";
  public caption: string = "none";

  source: string = "";

  constructor(name: string, table: string | null = null) {
    if (!table) table = CrudioUtils.Plural(name);

    this.name = name;
    this.tableName = table;
  }

  SetAlias(alias: string): CrudioEntityType {
    //console.log(`SetAlias ${this.entityTypeName} -> ${alias}`);
    // hak ignore aliasing or now
    this.tableAlias = this.name;

    return this;
  }

  GetFieldNames(): string[] {
    var names: string[] = [];
    this.fields.map((f) => names.push(f.fieldName));
    return names;
  }

  GetField(fieldName: string, failIfNotFound?: boolean): CrudioField {
    var fields: CrudioField[] = this.fields.filter(
      (f) => f.fieldName === fieldName
    );

    if (fields.length > 1) {
      throw new Error(
        "'" +
          fieldName +
          "' matches multiple fields on entity '" +
          this.name +
          "'"
      );
    }

    if (failIfNotFound && fields.length !== 1) {
      throw new Error(
        "'" +
          fieldName +
          "' is not a valid data field on entity '" +
          this.name +
          "'"
      );
    }

    return fields[0];
  }

  GetKey(): CrudioField | null {
    var fields: CrudioField[] = this.fields.filter((f) => f.fieldOptions.isKey);
    return fields.length > 0 ? fields[0] : null;
  }
  
  GetUniqueKey(): CrudioField | null {
    var fields: CrudioField[] = this.fields.filter((f) => f.fieldOptions.isUnique);
    return fields.length > 0 ? fields[0] : null;
  }

  AddKey(fieldName: string, fieldType?: string): CrudioEntityType {
    if (this.GetKey() !== null) {
      throw new Error(
        "a key field is already defined on entity '" + this.name + "'"
      );
    }

    if (this.GetField(fieldName)) {
      throw new Error(
        "'" + fieldName + "' is already defined on entity '" + this.name + "'"
      );
    }

    var keyField: CrudioField = new CrudioField(
      fieldName,
      fieldType || "number",
      fieldName
    );
    keyField.fieldOptions.isKey = true;
    keyField.fieldOptions.readonly = true;

    this.fields.push(keyField);

    return this;
  }

  AddString(
    fieldName: string,
    caption?: string,
    options?: ICrudioFieldOptions
  ): CrudioEntityType {
    this.AddField(fieldName, "string", caption, options);

    return this;
  }

  AddNumber(
    fieldName: string,
    caption?: string,
    options?: ICrudioFieldOptions
  ): CrudioEntityType {
    this.AddField(fieldName, "number", caption, options);

    return this;
  }

  AddBoolean(
    fieldName: string,
    caption?: string,
    options?: ICrudioFieldOptions
  ): CrudioEntityType {
    this.AddField(fieldName, "boolean", caption, options);

    return this;
  }

  AddDate(
    fieldName: string,
    caption?: string,
    options?: ICrudioFieldOptions
  ): CrudioEntityType {
    this.AddField(fieldName, "date", caption, options);

    return this;
  }

  AddField(
    fieldName: string,
    fieldType: string,
    caption?: string,
    options?: ICrudioFieldOptions
  ): CrudioEntityType {
    var field = this.GetField(fieldName);

    if (!field) {
      // If the field does not exist, create it
      field = new CrudioField(fieldName, fieldType, caption, options);
      this.fields.push(field);
    } else {
      // Else allow a type which inherits fields from a base, to override the values of the inherited field
      if (caption) field.caption = caption;
      if (options) field.fieldOptions = options;
    }

    return this;
  }

  AddGraphField(
    entityName: string,
    fieldList: string,
    fieldOptions?: ICrudioFieldOptions
  ): CrudioEntityType {
    if (!fieldOptions) {
      fieldOptions = {
        isKey: false,
      };
    }

    var options: ICrudioFieldOptions = {
      ...fieldOptions,
      isKey: fieldOptions.isKey,
      readonly: true,
      entityName: entityName,
      fieldList: fieldList,
    };

    this.fields.push(
      new CrudioField(
        "Field" + this.fields.length,
        "string",
        "Graph Field",
        options
      )
    );

    return this;
  }

  AddRelation(rel: CrudioEntityRelationship): CrudioEntityType {
    this.relationships.push(rel);

    return this;
  }

  CreateInstance(values: {}): CrudioEntityInstance {
    return new CrudioEntityInstance(this, values);
  }
}
