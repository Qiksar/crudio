import CrudioEntityInstance from "./CrudioEntityInstance";
import CrudioEntityType from "./CrudioEntityType";

export enum CrudioSort {
  Ascending = "asc",
  Descending = "desc",
}

export enum CrudioWhere {
  Like = "_like",
  iLike = "_ilike",
  NotLike = "_nlike",
  iNotLike = "_nilike",
  Similar = "_similar",
  NotSimilar = "_nsimilar",
  IsNull = "_is_null",
  Equal = "_eq",
  NotEqual = "_neq",
  GreaterThan = "_gt",
  LessThan = "_lt",
  GreaterThanOrEqual = "_gte",
  LessThanOrEqual = "_lte",
  In = "_in",
  NotIn = "_nin",
}

export interface ICrudioConfig {
  hasuraAdminSecret: string;
  hasuraEndpoint: string;
  hasuraQueryEndpoint: string;
  targetSchema?: string;
  idFieldName: string;
  readonlyFields: string[];
  schema: string;
}

export interface ICrudioSchemaDefinition {
  include?: string[];
  entities?: CrudioEntityType[];
  generators?: Record<string, unknown>;
  snippets?: Record<string, unknown>;
}

export interface ICrudioFieldOptions {
  isKey: boolean,

  readonly?: boolean;
  defaultValue?: any;

  canSort?: boolean;
  canFilter?: boolean;
  defaultSort?: boolean;

  entityName?: string;
  fieldList?: string;

  sensitiveData?: boolean;
  required?: boolean;
  validation?: string;

  choices?: string;
  multi_choice?: boolean;

  range_low?: any;
  range_high?: any;

  placeholder?: string;
  help?: string;

  generator?: string;
  isUnique?: string;
}

export interface ICrudioField {
  fieldName: string;
  caption?: string;
  fieldType: string;
  defaultValue?: any;
  fieldOptions: ICrudioFieldOptions;
  GetCaption(): string;
}

export interface ICrudioEntityDefinition {
  name: string;
  tableAlias: string;
  tableName: string;
  fields: ICrudioField[];
  relationships: ISchemaRelationship[];
  source: string;
  editor: string;
  icon: string;
  caption: string;
  count: number;
  inherits: string;
  abstract: boolean;
  snippets: string[];
}

export interface ISchemaTable {
  tablename: string;
}

export interface ISchemaRelationship {
  from: string;
  from_column: string;
  to: string;
  to_column: string;

  name: string;
  type: string;

  count: number;
}

export interface ISchemaColumn {
  tablename: string;
  columnname: string;
  position: number;
  defaultvalue: string;
  isnullable: string;
  datatype: string;
  maximumlength: number;
  iskey: string;
  isgenerated: string;
}

export interface ICrudioDbSchema {
  tables: ISchemaTable[];
  relationships: ISchemaRelationship[];
  columns: ISchemaColumn[];
  readonlyFields?: string[];
}
