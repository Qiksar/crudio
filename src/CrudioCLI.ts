// https://github.com/tj/commander.js/#quick-start

import { Command } from "commander";
import { ICrudioConfig } from "./CrudioTypes";

/**
 * Indicates current NPM package value
 * @date 14/08/2022 - 13:19:52
 *
 * @type {"0.10.8"}
 */
const package_version = "0.24.0";

/**
 * Command Line (CLI) Entry Point
 * @date 7/25/2022 - 10:35:40 AM
 *
 * @export
 * @class CrudioCLI
 * @typedef {CrudioCLI}
 */
export default class CrudioCLI {
	/**
	 * Command line parser
	 * @date 7/25/2022 - 10:35:40 AM
	 *
	 * @private
	 * @type {*}
	 */
	private command_line = new Command();
	/**
	 * System configuration
	 * @date 7/25/2022 - 10:35:40 AM
	 *
	 * @private
	 * @type {*}
	 */
	private config: ICrudioConfig;

	/**
	 * Creates an instance of CrudioCLI.
	 * @date 7/25/2022 - 10:35:40 AM
	 *
	 * @constructor
	 * @param {string[]} args
	 */
	constructor(args: string[]) {
		this.command_line
			.name("crudio")
			.description("create databases pre-loaded with large volumes of sensible test data.")
			.version(package_version)
			.option("-v, --verbose", "Verbose output")
			.option("-p, --project <project_folder_name>", "Create a new project folder")
			.option("-e, --hasuraEndpoint <endpoint>", "GraphQL endpoint", "http://localhost:6789")
			.option("-a, --hasuraAdminSecret <secret>", "Secret to access administrative privileges", "crudio")
            .option("-k, --idField <idfield>", "Default name for primary key column", "id")
			.option("-w, --wipe", "Drop all tables in the schema if they already exist", true)
			.option("-s, --schema <schema>", "Place tables in the nominated database schema", "crudio")
			.option("-m, --datamodel <model_file>", "Data model definition file (JSON)")
			.option("-d, --diagram <output_file>", "Output a Mermaid diagram of the data model")
			.option("-c, --dbconnection <uri>", "Database connection string for Mongoose", "mongodb://localhost")
			.option("-t, --target <dbtype>", "m=MongoDB, p=postgres", "p")

		this.config = this.command_line.parse(args).opts() as ICrudioConfig;
		this.config.version = package_version;
	}

	/**
	 * Access to system configuration
	 * @date 7/25/2022 - 10:35:40 AM
	 *
	 * @public
	 * @readonly
	 * @type {*}
	 */
	public get Config(): any {
		return this.config;
	}
}
