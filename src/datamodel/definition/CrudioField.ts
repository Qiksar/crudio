import ICrudioField from "../types/ICrudioField";
import ICrudioFieldOptions from "../types/ICrudioFieldOptions";
import ICrudioFacet from "../types/ICrudioFacet";

/**
 * Concrete instance of a field definition
 * @date 7/18/2022 - 3:35:36 PM
 *
 * @export
 * @class CrudioField
 * @typedef {CrudioField}
 * @implements {ICrudioField}
 */
export default class CrudioField implements ICrudioField, ICrudioFacet {
	/**
	 * Name of field
	 * @date 7/18/2022 - 3:35:36 PM
	 *
	 * @public
	 * @type {string}
	 */
	public fieldName: string;

	/**
	 * Type of field
	 * @date 7/18/2022 - 3:35:36 PM
	 *
	 * @public
	 * @type {string}
	 */
	public fieldType: string;

	/**
	 * Default value
	 * @date 7/18/2022 - 3:35:36 PM
	 *
	 * @public
	 * @type {?*}
	 */
	public defaultValue?: any;

	/**
	 * Options applied to field
	 * @date 7/18/2022 - 3:35:36 PM
	 *
	 * @public
	 * @type {ICrudioFieldOptions}
	 */
	public fieldOptions: ICrudioFieldOptions;

	/**
	 * Creates an instance of CrudioField.
	 * @date 7/18/2022 - 3:35:36 PM
	 *
	 * @constructor
	 * @param {string} fieldName
	 * @param {string} fieldType
	 * @param {?string} [caption]
	 * @param {?ICrudioFieldOptions} [options]
	 */
	constructor(fieldName: string, fieldType: string, options?: ICrudioFieldOptions) {
		if (!fieldType) throw new Error(`Field:${fieldName} - fieldType has not been specified.`);

		if (!options) {
			options = { canSort: true, isKey: false };
		}

		this.fieldName = fieldName;
		this.fieldType = fieldType;
		this.fieldOptions = options;
	}

	get Name(): string {
		return this.fieldName;
	}
}
