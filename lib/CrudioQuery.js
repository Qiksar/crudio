import CrudioFilter from './CrudioFilter';
import CrudioInclude from './CrudioInclude';
export default class CrudioQuery {
    name;
    model;
    entity;
    include = [];
    append = [];
    filters = [];
    sortField;
    graphSortField;
    sortDirection;
    itemsPerPage;
    currentPage;
    limit;
    offset;
    constructor(model, entity, name) {
        if (entity.fields.length < 1) {
            throw new Error(`Entity '${entity.name}' must have at least one field`);
        }
        this.model = model;
        this.entity = entity;
        this.name = name || entity.tableName;
        this.currentPage = 0;
        this.ProcessGraphFields();
    }
    ProcessGraphFields() {
        this.entity.fields.map((f) => {
            if (f.fieldOptions && f.fieldOptions.entityName) {
                var target = this.model.GetEntityDefinition(f.fieldOptions.entityName, true);
                if (f.fieldOptions.fieldList !== undefined) {
                    var included = f.fieldOptions.fieldList.split(',');
                    this.Include(target, f.fieldOptions.entityName, included);
                }
            }
        });
    }
    Include(entity, entityName, fields) {
        if (entity.fields.length < 1) {
            console.log(entity);
            throw new Error(`Entity '${entity.name}' has no fields`);
        }
        var includedFields = entity.fields.filter((f) => fields.includes(f.fieldName));
        if (includedFields.length < 1) {
            throw new Error(`Entity '${entity.name}' did not provide any matching fields for ${fields}`);
        }
        var include = new CrudioInclude(entity, entityName, includedFields);
        this.include.push(include);
        return this;
    }
    Where(fieldName, filterType, filterValue) {
        this.entity.GetField(fieldName, true);
        this.filters.push(new CrudioFilter(fieldName, filterType, filterValue));
        return this;
    }
    ClearFilters() {
        this.filters = [];
        return this;
    }
    OrderBy(fieldName, sortDirection) {
        this.sortDirection = sortDirection || 'asc';
        this.sortField = this.GetGraphField(fieldName);
        if (this.sortField) {
            this.graphSortField = fieldName;
            return this;
        }
        this.graphSortField = '';
        this.sortField = this.entity.GetField(fieldName, true);
        return this;
    }
    GetGraphField(fieldName) {
        var field = null;
        this.entity.fields
            .filter((f) => f.fieldOptions && f.fieldOptions.fieldList)
            .map((f) => {
            if (f.fieldOptions.fieldList !== undefined &&
                f.fieldOptions.fieldList.includes(fieldName)) {
                field = f;
            }
        });
        return field;
    }
    Append(query) {
        this.append.push(query);
        return this;
    }
}
//# sourceMappingURL=CrudioQuery.js.map