/**
 * Describes an instruction to connect child entities
 * @date 7/18/2022 - 1:47:30 PM
 *
 * @export
 * @interface ICrudioConfig
 * @typedef {ISingularNamedRelationship}
 */

export default interface ISingularNamedRelationship {
	/**
	 * @date 7/25/2022 - 10:45:41 AM
	 *
	 * @type {string}
	 */
	enumerate: string;

	/**
	 * The field to use as the lookup to acquire a related entity
	 * @date 7/25/2022 - 10:45:41 AM
	 *
	 * @type {string}
	 */
	field: string;

	/**
	 * The values which are used to identify the actual related entities
	 * For example, "HEAD OF IT;HEAD OF HR;HEAD OF SALES", identifying a list where only one user is to be assigned to the role
	 * @date 7/25/2022 - 10:45:41 AM
	 *
	 * @type {string}
	 */
	values: string;
}
