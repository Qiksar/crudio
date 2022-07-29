#!/usr/bin/env node

// Crudio CLI
//
//  Usage: crudio repo_path.json [target_schema]
//
//        repo_path.json : the path to the repository definition, which is a JSON file.
//        target_schema  : Optional schema name - default value is 'crudio'
//

import * as fs from "fs";
import axios, { AxiosResponse } from "axios";
import { stringify, parse } from "flatted";

import CrudioCLI from "./CrudioCLI";
import CrudioDataWrapper from "./CrudioDataWrapper";
import CrudioRepository from "./CrudioRepository";

const manifest_file = "https://raw.githubusercontent.com/Qiksar/crudio/main/tools/init/manifest.json";
const docker_compose = "https://raw.githubusercontent.com/Qiksar/crudio/main/tools/init/docker-compose.yml";

const Fetch = async (url: string, output_path: string): Promise<void> => {
	var result: AxiosResponse = await axios.get(url);
	var text = typeof result.data === "object" ? stringify(result.data) : result.data;

	const parts = url.replace("https://", "").split("/");
	const filename = parts[parts.length - 1];
	const outFile: string = output_path + "/" + filename;

	fs.writeFileSync(outFile, text);
};

const Init = async (config: any): Promise<void> => {
	console.log("Initialise new Crudio project in: " + config.init);
	console.log("");

	if (fs.existsSync(config.init)) {
		console.error("Folder already exists, can not continue");
		return;
	}

	fs.mkdirSync(config.init);

	if (config.verbose) {
		console.log();
		console.log("Created folder: " + config.init);

	}

	Fetch(docker_compose, config.init);

	const manifest_path = config.init + "/repo";

	if (config.verbose) {
		console.log();
		console.log("Created folder: " + manifest_path);
		console.log("Fetch manifest");
	}

	fs.mkdirSync(manifest_path);

	var result: AxiosResponse = await axios.get(manifest_file);
	var manifest = result.data as string [];

	for (var i = 0; i < manifest.length; i++) {
		const file = manifest[i];
		await Fetch(file, manifest_path);
	}
};

setTimeout(async () => {
	const cli = new CrudioCLI(process.argv);
	const config = cli.Config;

	if (config.verbose) {
		console.log("verbose option enabled");
		console.log();
		console.log("Configuration:");
		console.log(config);
		console.log();
	}

	if (config.init) {
		await Init(config);
		return;
	}

	console.log(`Loading Crudio repository definition from: "${config.repo}"`);
	console.log();

	const repo = CrudioRepository.FromJson(config.repo);
	console.log("Data repository definition loaded");

	const db = new CrudioDataWrapper(config, repo);
	console.log("Data repository populated");

	if (config.diagram) {
		console.log(`Output diagram to ${config.diagram}`);

		const diagram = repo.ToMermaid();

		fs.writeFileSync(config.diagram, diagram);
	}

	console.log(`Creating empty database schema ${config.schema}...`);
	await db.CreateDatabaseSchema();

	await db.PopulateDatabaseTables();
	console.log("Populating tables with data...");
	console.log();
	console.log("Database has been loaded.");
	console.log("Use Hasura console to setup tracking.");
}, 100);
