import CrudioEntityType from './CrudioEntityType'

/**
 * A data object populated with generated field values, equivalent to a row in a database
 * @date 7/18/2022 - 2:12:37 PM
 *
 * @export
 * @class CrudioEntityInstance
 * @typedef {CrudioEntityInstance}
 */
export default class CrudioEntityInstance  {
  /**
   * The entity type definition (schema)
   * @date 7/18/2022 - 2:12:37 PM
   *
   * @public
   * @type {CrudioEntityType}
   */
  public entityType: CrudioEntityType
  /**
   * Field values
   * @date 7/18/2022 - 2:12:37 PM
   *
   * @public
   * @type {*}
   */
  public values: any = {}

  /**
   * Creates an instance of CrudioEntityInstance.
   * @date 7/18/2022 - 2:12:37 PM
   *
   * @constructor
   * @param {CrudioEntityType} entityType
   * @param {{}} [source={}]
   * @param {boolean} [strict=false]
   */
  constructor(
    entityType: CrudioEntityType,
    source: {} = {},
    strict: boolean = false
  ) {
    this.entityType = entityType
    this.values = source

    if (strict) {
      Object.keys(this.values).map((k) => {
        if (!entityType.GetField(k)) {
          throw new Error(
            "CrudioEntityInstance.constructor '" +
              k +
              "' is not a valid field on entity '" +
              this.entityType.name +
              "'"
          )
        }
      })
    }
  }

  /**
   * Ensure the entity has an ID assigned
   * @date 7/18/2022 - 2:12:37 PM
   *
   * @param {CrudioEntityInstance} entity
   * @returns {boolean}
   */
  CheckId(entity: CrudioEntityInstance): boolean {
    if (!entity.values || !entity.values.Id) {
      throw new Error(`
    CheckId: entity must have values and values.Id must be non-zero
    Entity: ${JSON.stringify(entity.values)}
    `)
    }

    return true
  }
}
