#!/usr/bin/env node

import * as fs from "fs";
import axios, { AxiosResponse } from "axios";

import CrudioCLI from "./CrudioCLI";
import CrudioDataWrapper from "./CrudioDataWrapper";
import CrudioDataModel from "./CrudioDataModel";

const manifest_file = "https://raw.githubusercontent.com/Qiksar/crudio/main/tools/init/manifest.json";

const Fetch = async (url: string, output_path: string): Promise<void> => {
	var result: AxiosResponse;

	try {
		result = await axios.get(url);
	} catch (e) {
		console.log(`Failed to fetch ${url} Status: ${result.status} - ${result.statusText}`);
	}

	var text = typeof result.data === "object" ? JSON.stringify(result.data) : result.data;

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

	if (config.verbose) {
		console.log();
		console.log("Created folder: " + config.project);
		console.log("Fetch manifest");
	}

	fs.mkdirSync(config.project + "/repo");

	var result: AxiosResponse = await axios.get(manifest_file);
	var manifest = result.data as string[];

	for (var i = 0; i < manifest.length; i++) {
		const file: any = manifest[i];

		if (config.verbose) {
			console.log("Fetch: " + file.source);
		}

		await Fetch(file.source, file.location == "." ? config.project : config.project + "/" + file.location);
	}

	console.log();
	console.log("Project setup complete. Remember to edit the docker-compose file and set correct ports to avoid conflicts between projects.");
};

setTimeout(async () => {
	const cli = new CrudioCLI(process.argv);
	const config = cli.Config;

	if (config.verbose) {
		console.log("Verbose option enabled");
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
		console.error("Error: data model not specified. Use the -r or --repo option to specify a definition file (e.g. repo.json). Use -h to view options.");
		return;
	}

	console.log(`Loading Crudio data model definition from: "${config.repo}"`);
	console.log();

	const repo = CrudioDataModel.FromJson(config.repo);
	console.log("Data model definition loaded");

	const db = new CrudioDataWrapper(config, repo);
	console.log("Data model populated");

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
