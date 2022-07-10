import CrudioFakeDb from './CrudioFakeDb';
import CrudioEntityType from './CrudioEntityType';
import CrudioField from './CrudioField';

export default class CrudioCodeGenerator {
	db: CrudioFakeDb;
	fs: any;

	constructor(fakedb: CrudioFakeDb, filesys: any) {
		this.db = fakedb;
		this.fs = filesys;
	}

	GenerateCode(path: string) {
		try {
			this.fs.unlinkSync(path);
			this.fs.writeFileSync(path, '');
		} catch (e) {}

		var write: any = (t: string) => this.fs.appendFileSync(path, t + '\r\n');

		write(`
import { DateTime } from 'luxon'

import CrudioEntityInstance from './Crudio/CrudioEntityInstance'
import CrudioFakeDb from './Crudio/CrudioFakeDb'
import { Relationships, Customise } from './CustomiseFakeDb'
`);

		write('//#region Entities');

		this.db.entities.map((e: CrudioEntityType) => {
			write(`\r\n/*`);
			write(`ENTITY ${e.name}`);
			write(`\r\nSource ${e.source}`);
			write(`*/`);

			write(`\r\nexport class ${this.db.GetClassName(e.name)} extends CrudioEntityInstance {`);

			if (e.fields.length === 0) {
				write(`// !!! no properties`);
			}

			e.fields.map((f: CrudioField) => {
				write(`\tget ${f.fieldName} (): ${f.fieldType} { return this.values.${f.fieldName}}`);
			});

			write(`}`);
		});

		write('//#endregion');

		write(`\r\nexport default class CrudioFakeDb extends CrudioFakeDb {`);

		write(`\r\n\tCustomSetup() { 
        this.relationships = Relationships;
		
        Customise(this)`);

		write('\t}');

		this.db.entities.map((e: CrudioEntityType) => {
			write(`
    get ${this.db.GetClassName(e.tableName)}(): ${this.db.GetClassName(e.name)}[] {
        return this.GetDataRows('${e.tableName}') as ${this.db.GetClassName(e.name)}[];
    }`);
		});

		write('}');
	}
}
