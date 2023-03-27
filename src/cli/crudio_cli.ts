#!/usr/bin/env node

import * as fs from "fs";
import axios, { AxiosResponse } from "axios";

import CrudioCLI from "./CrudioCLI";
import CrudioHasuraWrapper from "../wrappers/CrudioHasuraWrapper";
import CrudioDataModel from "../datamodel/definition/CrudioDataModel";
import CrudioHasura from "../wrappers/CrudioHasura";
import ICrudioConfig from "../datamodel/types/ICrudioConfig";
import CrudioMongooseWrapper from "../wrappers/CrudioMongooseWrapper";

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
	if (outFile.toLowerCase().endsWith("sh")) {
		await fs.chmod(outFile, 0o777, e => {
			if (e) throw e;
		});
	}
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

	fs.mkdirSync(config.project + "/datamodel");

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

	console.log("CRUDIO");
	console.log("------");
	console.log();

	const config: ICrudioConfig = cli.Config;

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

	if (config.datamodel === undefined) {
		console.error("Error: data model not specified. Use the -m or --datamodel option to specify a definition file (e.g. datamodel.json). Use -h to view options.");
		return;
	}

	console.log(`Loading Crudio data model definition from: "${config.datamodel}"`);
	console.log();

	const datamodel = CrudioDataModel.FromJson(config, true);
	console.log("Data model definition loaded");

	console.log("Data model populated");

	if (config.diagram) {
		console.log(`Output diagram to ${config.diagram}`);

		const diagram = datamodel.ToMermaid();

		fs.writeFileSync(config.diagram, diagram);
	}

	if (config.target === "m") {
		await PopulateMongoose(config, datamodel);
	} else if (config.target === "p") {
		await PopulatePostgres(config, datamodel);
	} else {
		throw "--target options must be 'p' for PostgreSQL or 'm' for MongoDB";
	}

	console.log();
	console.log("Crudio complete!");
}, 100);

async function PopulatePostgres(config, datamodel) {
	console.log("Populating PostgreSQL tables with data...");

	const db = new CrudioHasuraWrapper(config, datamodel);

	if (config.wipe) {
		console.log(`Creating database schema ${config.schema}...`);
		await db.CreateDatabaseSchema();
	}

	console.log();
	console.log("Populating tables with data...");
	console.log();

	await db.PopulateDatabaseTables();

	console.log();
	console.log("Database tables loaded with structured data.");

	// Create streaming data
	await datamodel.ExecuteStreams(db);
	console.log("Database tables loaded with streaming data.");

	await db.Close();

	console.log();
	console.log("Database has been loaded.");
	console.log();
	console.log("Setup Hasura tracking...");
	const tracker = new CrudioHasura(config, datamodel);
	await tracker.Track();
}

async function PopulateMongoose(config, datamodel) {
	console.log("Populating MongoDB using Mongoose...");

	const db = new CrudioMongooseWrapper(config, datamodel);

	console.log("Populating tables with data...");
	console.log();

	if (config.wipe) {
		console.log(`Creating database schema ${config.schema}...`);
		await db.CreateDatabaseSchema();
	}

	await db.PopulateDatabaseTables();

	console.log();
	console.log("Database tables loaded with structured data.");

	// Create streaming data
	await datamodel.ExecuteStreams(db);
	console.log("Database tables loaded with streaming data.");

	await db.Close();

	console.log();
	console.log("Database has been loaded.");
}
