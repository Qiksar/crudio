import CrudioEntityDefinition from "./CrudioEntityDefinition";
import { ICrudioConfig } from "../types/ICrudioConfig";

/**
 * A data object populated with generated field values, equivalent to a row in a database
 * @date 7/18/2022 - 2:12:37 PM
 *
 * @export
 * @class CrudioEntityInstance
 * @typedef {CrudioEntityInstance}
 */
export default class CrudioEntityInstance {
	/**
	 * The entity type definition (schema)
	 * @date 7/18/2022 - 2:12:37 PM
	 *
	 * @public
	 * @type {CrudioEntityDefinition}
	 */
	private entityType: CrudioEntityDefinition;
	public get EntityDefinition(): CrudioEntityDefinition {
		return this.entityType;
	}

	/**
	 * Field values
	 * @date 7/18/2022 - 2:12:37 PM
	 *
	 * @public
	 * @type {*}
	 */
	private dataValues: any = {};
	public set DataValues(values: any) {
		this.dataValues = values;
	}
	public get DataValues(): any {
		return this.dataValues;
	}

	/**
	 * Creates an instance of CrudioEntityInstance.
	 * @date 7/18/2022 - 2:12:37 PM
	 *
	 * @constructor
	 * @param {CrudioEntityDefinition} entityType
	 */
	constructor(private config: ICrudioConfig, entityType: CrudioEntityDefinition) {
		this.entityType = entityType;
		this.dataValues = {};
	}

	/**
	 * Ensure the entity has an ID assigned
	 * @date 7/18/2022 - 2:12:37 PM
	 *
	 * @param {CrudioEntityInstance} entity
	 * @returns {boolean}
	 */
	CheckId(entity: CrudioEntityInstance): boolean {
		if (!entity.DataValues || !entity.DataValues[this.config.idField]) {
			throw new Error(`
    CheckId: entity must have values and values.${this.config.idField} must be non-zero
    Entity: ${JSON.stringify(entity.DataValues)}
    `);
		}

		return true;
	}
}
