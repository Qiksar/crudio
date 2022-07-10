import CrudioRepositoryTable from "./CrudioRepositoryTable";
import CrudioEntityInstance from "./CrudioEntityInstance";
import CrudioRepositoryInclude from "./CrudioRepositoryInclude";
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

export interface ICrudioRepository {
  include: string[];
  schema: Record<string,unknown>;
  generators: Record<string,unknown>;
  record_counts?: {};
  relationships: {}[];
  entities: CrudioEntityType[];
  tables: CrudioRepositoryTable[];
}

export interface ICrudioConfig {
  hasuraAdminSecret: string;
  hasuraEndpoint: string;
  hasuraQueryEndpoint: string;
  targetSchema?: string;
  idFieldName: string;
  readonlyFields: string[];
}

export interface ICrudioFieldOptions {
  isKey:boolean,

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
}

export interface ICrudioField {
  fieldName: string;
  caption?: string;
  fieldType: string;
  defaultValue?: any;
  fieldOptions: ICrudioFieldOptions;
  GetCaption(): string;
}

export interface ICrudioEntityRelationship {
  source: ICrudioEntityType;
  sourceColumn: string;
  target: ICrudioEntityType;
  targetColumn: string;
  relationshipName: string;
}

export interface ICrudioEntityType {
  name: string;
  tableAlias: string;
  tableName: string;
  fields: ICrudioField[];
  relationships: ICrudioEntityRelationship[];
  source: string;
  editor: string;
  icon: string;
  caption: string;

  GetFieldNames(): string[];
  GetKey(): ICrudioField | null;
  GetField(fieldname: string): ICrudioField;

  SetAlias(alias: string): ICrudioEntityType;
  AddField(
    fieldName: string,
    fieldType: string,
    caption?: string,
    options?: ICrudioFieldOptions
  ): ICrudioEntityType;

  AddGraphField(
    entityName: string,
    fieldList: string,
    fieldOptions?: ICrudioFieldOptions
  ): ICrudioEntityType;

  AddRelation(
    source: ICrudioEntityType,
    sourceColumn: string,
    target: ICrudioEntityType,
    targetColumn: string,
    relationshipName: string
  ): ICrudioEntityType;

  AddKey(fieldName: string, fieldType?: string): ICrudioEntityType;

  AddString(
    fieldName: string,
    caption?: string,
    options?: ICrudioFieldOptions
  ): ICrudioEntityType;

  AddNumber(
    fieldName: string,
    caption?: string,
    options?: ICrudioFieldOptions
  ): ICrudioEntityType;

  AddBoolean(
    fieldName: string,
    caption?: string,
    options?: ICrudioFieldOptions
  ): ICrudioEntityType;

  AddDate(
    fieldName: string,
    caption?: string,
    options?: ICrudioFieldOptions
  ): ICrudioEntityType;

  CreateInstance(values: {}, strict?: boolean): ICrudioEntityInstance;
}

export interface ICrudioEntityInstance {
  entityType: ICrudioEntityType;
  values: any;

  CheckId(entity: ICrudioEntityInstance): boolean;
}

export interface ICrudioFilter {
  fieldName: string;
  filterType: string;
  filterValue: string;
}

export interface ICrudioInclude {
  entity: ICrudioEntityType;
  entityName: string;
  fields: ICrudioField[];
}

export interface ICrudioQuery {
  name: string;
  entity: ICrudioEntityType;

  include: ICrudioInclude[];
  append: ICrudioQuery[];

  filters: ICrudioFilter[];
  sortField: ICrudioField | null;
  graphSortField: string;
  sortDirection: string;

  itemsPerPage?: number;
  currentPage?: number;
  limit?: number;
  offset?: number;

  Where(
    fieldName: string,
    filterType: CrudioWhere,
    filterValue: string
  ): ICrudioQuery;
  OrderBy(fieldName: string, sortDirection?: CrudioSort): ICrudioQuery;
}

export interface ICrudioReadResult {
  totalItems: number;
  graphData: CrudioEntityInstance[];
  query: string;
}

export interface ISchemaTable {
  tablename: string;
}

export interface ISchemaRelationship {
  source: string;
  sourcecolumn: string;
  target: string;
  targetcolumn: string;
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
