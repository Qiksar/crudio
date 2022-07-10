import {readFileSync} from 'fs';

import csv from 'jquery-csv';

export default class CrudioCsvImport {
	content: string;
	index: number;
	headers: string[];
    data: any[];

	constructor(file: string) {
		this.Load(file);
	}

	Load(file: string) {
        var data: string = readFileSync(file, 'utf8');
        this.data = csv.toObjects(data);
	}
}
