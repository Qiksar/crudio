// https://github.com/tj/commander.js/#quick-start

import { Command } from "commander";

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
	private config: any;

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
			.version("1.0.0")
			.option("-v, --verbose", "Verbose output")
			.option("-e, --hasuraEndpoint <endpoint>", "GraphQL endpoint", "http://localhost:6789")
			.option("-a, --hasuraAdminSecret <secret>", "Secret to access administrative privileges", "crudio")
            .option("-k, --idField <idfield>", "Default name for primary key column", "id")
			.option("-w, --wipe", "Drop all tables in the schema if they already exist", true)
			.option("-s, --schema <schema>", "Place tables in the nominated schema", "crudio")
			.option("-r, --repo <repo_file>", "Repository definition file (JSON)")
			.option("-i, --include <include_file>", "Merge an additional repository definition")

		this.config = this.command_line.parse(args).opts();
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