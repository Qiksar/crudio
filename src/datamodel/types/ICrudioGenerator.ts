/**
 * Definition of a data generator
 * @date 8/2/2022 - 12:11:48 PM
 *
 * @export
 * @interface ICrudioGenerator
 * @typedef {ICrudioGenerator}
 */

export default interface ICrudioGenerator {
	/**
	 * Name of the generator
	 * @date 8/2/2022 - 12:11:48 PM
	 *
	 * @type {string}
	 */
	name: string;

	/**
	 * Configuration of how to build a data value
	 * @date 8/2/2022 - 12:11:48 PM
	 *
	 * @type {string}
	 */
	values: string;
}
