import {
  ICrudioQuery,
  ICrudioFilter,
  ICrudioInclude,
  ICrudioEntityType,
  ICrudioField
} from './CrudioTypes'
import CrudioEntityType from './CrudioEntityType'
import CrudioFilter from './CrudioFilter'
import CrudioInclude from './CrudioInclude'
import CrudioDataWrapper from './CrudioDataWrapper'
import CrudioField from './CrudioField'

export default class CrudioQuery implements ICrudioQuery {
  name: string
  model: CrudioDataWrapper
  entity: CrudioEntityType

  include: CrudioInclude[] = []
  append: ICrudioQuery[] = []

  filters: CrudioFilter[] = []
  sortField!: ICrudioField | null
  graphSortField!: string
  sortDirection!: string

  itemsPerPage?: number
  currentPage?: number
  limit?: number
  offset?: number

  constructor(model: CrudioDataWrapper, entity: CrudioEntityType, name?: string) {
    if (entity.fields.length < 1) {
      throw new Error(
        `Entity '${entity.name}' must have at least one field`
      )
    }

    this.model = model
    this.entity = entity
    this.name = name || entity.tableName
    this.currentPage = 0

    this.ProcessGraphFields()
  }

  ProcessGraphFields(): void {
    this.entity.fields.map((f) => {
      if (f.fieldOptions && f.fieldOptions.entityName) {
        var target: CrudioEntityType | null = this.model.GetEntityDefinition(
          f.fieldOptions.entityName,
          true
        )

        if (f.fieldOptions.fieldList !== undefined) {
          var included: string[] = f.fieldOptions.fieldList.split(',')
          this.Include(target!, f.fieldOptions.entityName, included)
        }
      }
    })
  }

  Include(
    entity: CrudioEntityType,
    entityName: string,
    fields: string[]
  ): CrudioQuery {
    if (entity.fields.length < 1) {
      console.log(entity)
      throw new Error(`Entity '${entity.name}' has no fields`)
    }

    var includedFields: CrudioField[] = entity.fields.filter((f) =>
      fields.includes(f.fieldName)
    )

    if (includedFields.length < 1) {
      throw new Error(
        `Entity '${entity.name}' did not provide any matching fields for ${fields}`
      )
    }

    var include: CrudioInclude = new CrudioInclude(
      entity,
      entityName,
      includedFields
    )
    this.include.push(include)

    return this
  }

  Where(
    fieldName: string,
    filterType: string,
    filterValue: string
  ): CrudioQuery {
    this.entity.GetField(fieldName, true)
    this.filters.push(new CrudioFilter(fieldName, filterType, filterValue))

    return this
  }

  ClearFilters(): CrudioQuery {
    this.filters = []

    return this
  }

  OrderBy(fieldName: string, sortDirection?: string): CrudioQuery {
    this.sortDirection = sortDirection || 'asc'

    this.sortField = this.GetGraphField(fieldName)

    if (this.sortField) {
      this.graphSortField = fieldName
      return this
    }

    this.graphSortField = ''
    this.sortField = this.entity.GetField(fieldName, true)

    return this
  }

  GetGraphField(fieldName: string): CrudioField | null {
    var field: CrudioField | null = null

    this.entity.fields
      .filter((f) => f.fieldOptions && f.fieldOptions.fieldList)
      .map((f) => {
        if (
          f.fieldOptions.fieldList !== undefined &&
          f.fieldOptions.fieldList.includes(fieldName)
        ) {
          field = f
        }
      })

    return field
  }

  Append(query: CrudioQuery): CrudioQuery {
    this.append.push(query)

    return this
  }
}
