import { ICrudioQuery, ICrudioField } from './CrudioTypes';
import CrudioEntityType from './CrudioEntityType';
import CrudioFilter from './CrudioFilter';
import CrudioInclude from './CrudioInclude';
import CrudioDataWrapper from './CrudioDataWrapper';
import CrudioField from './CrudioField';
export default class CrudioQuery {
    name: string;
    model: CrudioDataWrapper;
    entity: CrudioEntityType;
    include: CrudioInclude[];
    append: ICrudioQuery[];
    filters: CrudioFilter[];
    sortField: ICrudioField | null;
    graphSortField: string;
    sortDirection: string;
    itemsPerPage?: number;
    currentPage?: number;
    limit?: number;
    offset?: number;
    constructor(model: CrudioDataWrapper, entity: CrudioEntityType, name?: string);
    ProcessGraphFields(): void;
    Include(entity: CrudioEntityType, entityName: string, fields: string[]): CrudioQuery;
    Where(fieldName: string, filterType: string, filterValue: string): CrudioQuery;
    ClearFilters(): CrudioQuery;
    OrderBy(fieldName: string, sortDirection?: string): CrudioQuery;
    GetGraphField(fieldName: string): CrudioField | null;
    Append(query: CrudioQuery): CrudioQuery;
}
