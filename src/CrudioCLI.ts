// https://github.com/tj/commander.js/#quick-start

import { Command } from "commander";

export default class CrudioCLI {
	private command_line = new Command();
	private config: any;

	constructor(args: string[]) {
		this.command_line
			.name("crudio")
			.description("create databases pre-loaded with large volumes of sensible test data.")
			.version("1.0.0")
			.option("-e, --hasuraEndpoint <endpoint>", "GraphQL endpoint", "http://localhost:6789")
			.option("-a, --hasuraAdminSecret <secret>", "Secret to access administrative privileges", "crudio")
            .option("-k, --idField <idfield>", "Default name for primary key column", "id")
			.option("-w, --wipe", "Drop all tables in the schema if they already exist", true)
			.option("-s, --schema <schema>", "Place tables in the nominated schema", "crudio")
			.option("-r, --repo <repo_file>", "Repository definition file (JSON)")
			.option("-i, --include <include_file>", "Merge an additional repository definition");

		this.config = this.command_line.parse(args).opts();
	}

	public get Config(): any {
		return this.config;
	}
}
