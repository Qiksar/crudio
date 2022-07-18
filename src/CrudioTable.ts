import CrudioEntityInstance from './CrudioEntityInstance'

/**
 * Data object which contains all of the data entities (database rows) generated for an entity type
 * @date 7/18/2022 - 2:29:00 PM
 *
 * @export
 * @class CrudioTable
 * @typedef {CrudioTable}
 */
export default class CrudioTable {
  /**
   * Name of the table
   * @date 7/18/2022 - 2:29:00 PM
   *
   * @public
   * @type {string}
   */
  public name: string = ''
  /**
   * Name of the related entity
   * @date 7/18/2022 - 2:29:00 PM
   *
   * @public
   * @type {string}
   */
  public entity: string = ''
  /**
   * Maximum number of rows
   * @date 7/18/2022 - 2:29:00 PM
   *
   * @public
   * @type {number}
   */
  public max_row_count: number = 0
  /**
   * Data rows, which are actually Entity Instances populated with generated data
   * @date 7/18/2022 - 2:29:00 PM
   *
   * @public
   * @type {CrudioEntityInstance[]}
   */
  public rows: CrudioEntityInstance[] = []

  /**
   * Creates an instance of CrudioTable.
   * @date 7/18/2022 - 2:29:00 PM
   *
   * @constructor
   */
  constructor() {
    this.rows = []
  }

  /**
   * Remove all existing rows of data
   * @date 7/18/2022 - 2:29:00 PM
   */
  clear() { 
    this.rows = [];
  }
  
  /**
   * Append a data entity to the table
   * @date 7/18/2022 - 2:29:00 PM
   *
   * @param {CrudioEntityInstance} instance
   */
  append(instance: CrudioEntityInstance) { 
    this.rows.push(instance);
  }
}
