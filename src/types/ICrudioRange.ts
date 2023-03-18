/**
 * Range definition used in streaming data
 * @date 07/12/2022 - 07:23:08
 *
 * @export
 * @interface ICrudioRange
 * @typedef {ICrudioRange}
 */

export interface ICrudioRange {
	/**
	 * Name of the definition
	 * @date 07/12/2022 - 07:23:08
	 *
	 * @type {string}
	 */
	name: string;

	/**
	 * List of values used
	 * @date 07/12/2022 - 07:23:08
	 *
	 * @type {unknown[]}
	 */
	list: unknown[];

	/**
	 * Minimum value allowed, if list is not configured
	 * @date 07/12/2022 - 07:23:08
	 *
	 * @type {(number | Date)}
	 */
	min: number | Date;

	/**
	 * Maximum value allowed, if list is not configured
	 * @date 07/12/2022 - 07:23:08
	 *
	 * @type {(number | Date)}
	 */
	max: number | Date;

	/**
	 * Value to be added on each loop iteration
	 * @date 07/12/2022 - 07:23:08
	 *
	 * @type {number}
	 */
	increment: number;
}
