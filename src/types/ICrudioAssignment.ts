/**
 * Hard coded data assignment which is placed into the data model to support storytelling
 * @date 10/10/2022 - 21:11:54
 *
 * @export
 * @interface ICrudioAssignment
 * @typedef {ICrudioAssignment}
 */

export interface ICrudioAssignment {
	/**
	 * Target specification
	 * @date 10/10/2022 - 21:11:54
	 *
	 * @type {string}
	 */
	target: string;

	/**
	 * Fields to set
	 * @date 10/10/2022 - 21:11:54
	 *
	 * @type {Record<string, unknown>}
	 */
	fields: Record<string, unknown>;
}
