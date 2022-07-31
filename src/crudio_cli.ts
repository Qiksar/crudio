#!/usr/bin/env node

// Crudio CLI
//
//  Usage: crudio repo_path.json [target_schema]
//
//        repo_path.json : the path to the repository definition, which is a JSON file.
//        target_schema  : Optional schema name - default value is 'crudio'
//

import * as fs from "fs";
import { parse } from "flatted";
import axios, { AxiosResponse } from "axios";

import CrudioCLI from "./CrudioCLI";
import CrudioDataWrapper from "./CrudioDataWrapper";
import CrudioRepository from "./CrudioRepository";

const manifest_file = "https://raw.githubusercontent.com/Qiksar/crudio/main/tools/init/manifest.json";
const docker_compose = "https://raw.githubusercontent.com/Qiksar/crudio/main/tools/init/docker-compose.yml";

const Fetch = async (url: string, output_path: string): Promise<void> => {
	var result: AxiosResponse;

	try {
		result = await axios.get(url);
	} catch (e) {
		console.log(`Failed to fetch ${url} Status: ${result.status} - ${result.statusText}`);
	}

	var text = typeof result.data === "object" ? parse(result.data) : result.data;

	const parts = url.replace("https://", "").split("/");
	const filename = parts[parts.length - 1];
	const outFile: string = output_path + "/" + filename;

	fs.writeFileSync(outFile, text);
};

const Init = async (config: any): Promise<void> => {
	console.log("Initialise new Crudio project in: " + config.project);
	console.log("");

	if (fs.existsSync(config.project)) {
		console.error("Folder already exists, can not continue");
		return;
	}

	fs.mkdirSync(config.project);

	if (config.verbose) {
		console.log();
		console.log("Created folder: " + config.project);
	}

	Fetch(docker_compose, config.project);

	const manifest_path = config.project + "/repo";

	if (config.verbose) {
		console.log();
		console.log("Created folder: " + manifest_path);
		console.log("Fetch manifest");
	}

	fs.mkdirSync(manifest_path);

	var result: AxiosResponse = await axios.get(manifest_file);
	var manifest = result.data as string[];

	for (var i = 0; i < manifest.length; i++) {
		const file = manifest[i];

		if (config.verbose) {
			console.log("Fetch: " + file);
		}

		await Fetch(file, manifest_path);
	}

	console.log();
	console.log("Project setup complete. Remember to edit the docker-compose file and set correct ports to avoid conflicts between projects.");
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

	if (config.project) {
		await Init(config);
		return;
	}

	if (config.repo === undefined) {
		console.error("Error: repository not specified. Use the -r or --repo option to specify a repository definition file (e.g. repo.json). Use -h to view options.");
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
