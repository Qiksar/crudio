/**
 * Options that are applied to entity fields
 * @date 7/18/2022 - 1:47:30 PM
 *
 * @export
 * @interface ICrudioFieldOptions
 * @typedef {ICrudioFieldOptions}
 */

export default interface ICrudioFieldOptions {
	/**
	 * Indicates field is the primary key
	 * @date 7/18/2022 - 1:47:30 PM
	 *
	 * @type {boolean}
	 */
	isKey?: boolean;

	/**
	 * Indicates the field is readonly
	 * @date 7/18/2022 - 1:47:30 PM
	 *
	 * @type {?boolean}
	 */
	readonly?: boolean;

	/**
	 * Specifies the default value for the field
	 * @date 7/18/2022 - 1:47:30 PM
	 *
	 * @type {?*}
	 */
	defaultValue?: any;

	/**
	 * Indicates the field is sortable
	 * @date 7/18/2022 - 1:47:30 PM
	 *
	 * @type {?boolean}
	 */
	canSort?: boolean;

	/**
	 * Indicates the field can be filtered
	 * @date 7/18/2022 - 1:47:30 PM
	 *
	 * @type {?boolean}
	 */
	canFilter?: boolean;

	/**
	 * Indicates the field is the default sort key
	 * @date 7/18/2022 - 1:47:30 PM
	 *
	 * @type {?boolean}
	 */
	defaultSort?: boolean;

	/**
	 * The name of the entity definition
	 * @date 7/18/2022 - 1:47:30 PM
	 *
	 * @type {?string}
	 */
	entityName?: string;

	/**
	 * Indicates the field contains sensitive data
	 * @date 7/18/2022 - 1:47:30 PM
	 *
	 * @type {?boolean}
	 */
	sensitiveData?: boolean;

	/**
	 * Indicates the field must have a value
	 * @date 7/18/2022 - 1:47:30 PM
	 *
	 * @type {?boolean}
	 */
	isRequired?: boolean;

	/**
	 * Validation requirements
	 * @date 7/18/2022 - 1:47:30 PM
	 *
	 * @type {?string}
	 */
	validation?: string;

	/**
	 * Indicates the list of choices available for a field
	 * @date 7/18/2022 - 1:47:30 PM
	 *
	 * @type {?string}
	 */
	choices?: string;

	/**
	 * Indicates that multiple choices can be selected
	 * @date 7/18/2022 - 1:47:30 PM
	 *
	 * @type {?boolean}
	 */
	multi_choice?: boolean;

	/**
	 * Lowest allowed value
	 * @date 7/18/2022 - 1:47:30 PM
	 *
	 * @type {?*}
	 */
	range_low?: any;

	/**
	 * Highest allowed value
	 * @date 7/18/2022 - 1:47:30 PM
	 *
	 * @type {?*}
	 */
	range_high?: any;

	/**
	 * Placeholder text for the UI field
	 * @date 7/18/2022 - 1:47:30 PM
	 *
	 * @type {?string}
	 */
	placeholder?: string;

	/**
	 * Help text
	 * @date 7/18/2022 - 1:47:30 PM
	 *
	 * @type {?string}
	 */
	help?: string;

	/**
	 * Data generator to use
	 * @date 7/18/2022 - 1:47:30 PM
	 *
	 * @type {?string}
	 */
	generator?: string;

	/**
	 * Field value has to be unique
	 * @date 7/18/2022 - 1:47:30 PM
	 *
	 * @type {?string}
	 */
	isUnique?: string;
}
