import { Validator, ValidatorResult } from "jsonschema";
import * as fs from "fs";

export class CrudioJson {
	private static validator = new Validator();
	private static schema = {};

	public static AddSchema(schemaPath: string, schemaId: string): void {
		const schema = CrudioJson.GetJsonObject(schemaPath);
		CrudioJson.validator.addSchema(schema, schemaId);
		CrudioJson.schema[schemaId] = schema;
	}

	public static Validate(jsonObject: Record<string, unknown>, schemaId: string): ValidatorResult {
		return CrudioJson.validator.validate(jsonObject, CrudioJson.schema[schemaId]);
	}

	public static GetJsonObject(jsonPath): Record<string, unknown> {
		const buffer = fs.readFileSync(jsonPath, "utf8");
		return JSON.parse(buffer);
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
