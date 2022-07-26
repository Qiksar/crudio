import CrudioEntityInstance from "./CrudioEntityInstance";

/**
 * Data object which contains all of the data entities (database rows) generated for an entity type
 * @date 7/18/2022 - 2:29:00 PM
 *
 * @export
 * @class CrudioTable
 * @typedef {CrudioTable}
 */
export default class CrudioTable {
	//#region Properties

	/**
	 * Name of the table
	 * @date 7/18/2022 - 2:29:00 PM
	 *
	 * @public
	 * @type {string}
	 */
	private tableName: string = "";
	/**
   * Name of the table
   * @date 7/26/2022 - 12:43:42 PM
   *
   * @public
   * @type {string}
   */
  public get TableName(): string {
		return this.tableName;
	}
	/**
   * Name of the table
   * @date 7/26/2022 - 12:43:42 PM
   *
   * @public
   * @type {string}
   */
  public set TableName(name: string) {
		this.tableName = name;
	}

	/**
	 * Name of the entity definition used for this table
	 * @date 7/18/2022 - 2:29:00 PM
	 *
	 * @public
	 * @type {string}
	 */
	private entityDefinition: string = "";
	/**
   * Name of the entity definition used for this table
   * @date 7/26/2022 - 12:43:42 PM
   *
   * @public
   * @type {string}
   */
  public get EntityDefinition(): string {
		return this.entityDefinition;
	}
	/**
   * Name of the entity definition used for this table
   * @date 7/26/2022 - 12:43:42 PM
   *
   * @public
   * @type {string}
   */
  public set EntityDefinition(name: string) {
		this.entityDefinition = name;
	}
	/**
	 * Maximum number of rows
	 * @date 7/18/2022 - 2:29:00 PM
	 *
	 * @public
	 * @type {number}
	 */
	public maxRowCount: number = 0;
	/**
   * Maximum number of rows
   * @date 7/26/2022 - 12:43:42 PM
   *
   * @public
   * @type {number}
   */
  public get MaxRowCount(): number {
		return this.maxRowCount;
	}
	/**
   * Maximum number of rows
   * @date 7/26/2022 - 12:43:42 PM
   *
   * @public
   * @type {number}
   */
  public set MaxRowCount(max: number) {
		this.maxRowCount = max;
	}

	/**
	 * Data rows, which are actually Entity Instances populated with generated data
	 * @date 7/18/2022 - 2:29:00 PM
	 *
	 * @public
	 * @type {CrudioEntityInstance[]}
	 */
	private dataRows: CrudioEntityInstance[] = [];
	/**
   * Array of entity instances populated with data
   * @date 7/26/2022 - 12:43:42 PM
   *
   * @public
   * @type {CrudioEntityInstance[]}
   */
  public get DataRows(): CrudioEntityInstance[] {
		return this.dataRows;
	}
	/**
   * Array of entity instances populated
   * @date 7/26/2022 - 12:43:42 PM
   *
   * @public
   * @type {{}}
   */
  public set DataRows(rows: CrudioEntityInstance[]) {
		this.dataRows = rows;
	}

	//#endregion

	/**
	 * Creates an instance of CrudioTable.
	 * @date 7/18/2022 - 2:29:00 PM
	 *
	 * @constructor
	 */
	constructor() {
		this.DataRows = [];
	}

	/**
	 * Remove all existing rows of data
	 * @date 7/18/2022 - 2:29:00 PM
	 */
	clear() {
		this.DataRows = [];
	}

	/**
	 * Append a data entity to the table
	 * @date 7/18/2022 - 2:29:00 PM
	 *
	 * @param {CrudioEntityInstance} instance
	 */
	append(instance: CrudioEntityInstance) {
		this.DataRows.push(instance);
	}
}
