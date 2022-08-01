import { Validator, ValidatorResult } from "jsonschema";
import * as fs from "fs";

/**
 * Wrap JSON capabilities
 * @date 8/1/2022 - 2:13:09 PM
 *
 * @export
 * @class CrudioJson
 * @typedef {CrudioJson}
 */
export class CrudioJson {
	/**
     * Underlying JSON validation package
     * @date 8/1/2022 - 2:13:09 PM
     *
     * @private
     * @static
     * @type {*}
     */
    private static validator = new Validator();
	/**
     * Collection of JSON schema
     * @date 8/1/2022 - 2:13:09 PM
     *
     * @private
     * @static
     * @type {{}}
     */
    private static schema = {};

	/**
     * Add schema to the collection
     * @date 8/1/2022 - 2:13:09 PM
     *
     * @public
     * @static
     * @param {string} schemaPath
     * @param {string} schemaId
     */
    public static AddSchema(schemaPath: string, schemaId: string): void {
		const schema = CrudioJson.LoadJson(schemaPath);
		CrudioJson.validator.addSchema(schema, schemaId);
		CrudioJson.schema[schemaId] = schema;
	}

	/**
     * Validate a JSON object against a specified schema
     * @date 8/1/2022 - 2:13:09 PM
     *
     * @public
     * @static
     * @param {Record<string, unknown>} jsonObject
     * @param {string} schemaId
     * @returns {ValidatorResult}
     */
    public static Validate(jsonObject: Record<string, unknown>, schemaId: string): ValidatorResult {
		return CrudioJson.validator.validate(jsonObject, CrudioJson.schema[schemaId]);
	}

	/**
	 * Load a JSON object from a file
	 * @date 7/18/2022 - 3:39:38 PM
	 *
	 * @public
	 * @static
	 * @param {string} filename
	 * @returns {*}
	 */
	public static LoadJson(filename: string, filestack: string[] = []): any {
		if (filestack.indexOf(filename) >= 0) {
			throw new Error(`Error: Circular inclusion of files, reading ${filename}. Existing files ${filestack} `);
		}

		filestack.push(filename);

		var input = fs.readFileSync(filename, "utf8");
		const json_object = JSON.parse(input);

		return json_object;
	}
}
