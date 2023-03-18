import CrudioEntityDefinition from "./CrudioEntityDefinition";
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
	 * Name of the entity definition used for this table
	 * @date 7/18/2022 - 2:29:00 PM
	 *
	 * @public
	 * @type {string}
	 */
	private entityDefinition: CrudioEntityDefinition;
	/**
	 * Name of the entity definition used for this table
	 * @date 7/26/2022 - 12:43:42 PM
	 *
	 * @public
	 * @type {string}
	 */
	public get EntityDefinition(): CrudioEntityDefinition {
		return this.entityDefinition;
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
	 * @date 7/27/2022 - 10:49:09 AM
	 *
	 * @constructor
	 * @param {string} tableName
	 * @param {string} entityDefinitionName
	 */
	constructor(tableName: string, entityDefinition: CrudioEntityDefinition) {
		this.tableName = tableName;
		this.entityDefinition = entityDefinition;
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
