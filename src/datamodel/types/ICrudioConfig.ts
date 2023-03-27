/**
 * System configuration
 * @date 7/18/2022 - 1:47:30 PM
 *
 * @export
 * @interface ICrudioConfig
 * @typedef {ICrudioConfig}
 */

export default interface ICrudioConfig {
	/**
	 * Base configuration
	 * @date 13/10/2022 - 07:24:33
	 *
	 * @type {("m" | "p")}
	 */
	target: "m" | "p";

	/**
	 * Secret for admin privileges in Hasura
	 * @date 7/18/2022 - 1:47:30 PM
	 *
	 * @type {string}
	 */
	hasuraAdminSecret?: string;

	/**
	 * URL of Hasura
	 * @date 7/18/2022 - 1:47:30 PM
	 *
	 * @type {string}
	 */
	hasuraEndpoint?: string;

	/**
	 * Default database schema to connect with Hasura
	 * @date 7/18/2022 - 1:47:30 PM
	 *
	 * @type {?string}
	 */
	schema: string;

	/**
	 * Default name to use for ID fields
	 * @date 7/18/2022 - 1:47:30 PM
	 *
	 * @type {string}
	 */
	idField: string;

	/**
	 * List of read-only fields
	 * @date 7/18/2022 - 1:47:30 PM
	 *
	 * @type {string[]}
	 */
	readonlyFields: string[];

	/**
	 * Delete all tables in the schema and prepare for completely new data
	 * @date 7/18/2022 - 1:47:30 PM
	 *
	 * @type {boolean}
	 */
	wipe: boolean;

	/**
	 * Name of JSON file describing the data model
	 * @date 7/21/2022 - 1:47:19 PM
	 *
	 * @type {string}
	 */
	datamodel: string;

	/**
	 * Hold a URI type connection string
	 * @date 10/10/2022 - 21:11:54
	 *
	 * @type {?string}
	 */
	dbconnection?: string;

	/**
	 * Output verbose logging
	 * @date 13/10/2022 - 07:24:33
	 *
	 * @type {boolean}
	 */
	verbose: boolean;

	/**
	 * Package version
	 * @date 13/10/2022 - 07:24:33
	 *
	 * @type {string}
	 */
	version: string;

	/**
	 * Project output folder
	 * @date 13/10/2022 - 07:24:33
	 *
	 * @type {?string}
	 */
	project?: string;

	/**
	 * Diagram name, which defines filename for diagram file
	 * @date 13/10/2022 - 07:24:33
	 *
	 * @type {?string}
	 */
	diagram?: string;
}
