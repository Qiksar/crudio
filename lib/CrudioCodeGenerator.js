"use strict";
// TODO fix code generation
Object.defineProperty(exports, "__esModule", { value: true });
class CrudioCodeGenerator {
    db;
    fs;
    constructor(fakedb, filesys) {
        this.db = fakedb;
        this.fs = filesys;
    }
    GenerateCode(path) {
        try {
            this.fs.unlinkSync(path);
            this.fs.writeFileSync(path, '');
        }
        catch (e) { }
        var write = (t) => this.fs.appendFileSync(path, t + '\r\n');
        write(`
import { DateTime } from 'luxon'

import CrudioEntityInstance from './Crudio/CrudioEntityInstance'
import CrudioFakeDb from './Crudio/CrudioFakeDb'
import { Relationships, Customise } from './CustomiseFakeDb'
`);
        write('//#region Entities');
        this.db.entities.map((e) => {
            write(`\r\n/*`);
            write(`ENTITY ${e.name}`);
            write(`\r\nSource ${e.source}`);
            write(`*/`);
            write(`\r\nexport class ${this.db.GetClassName(e.name)} extends CrudioEntityInstance {`);
            if (e.fields.length === 0) {
                write(`// !!! no properties`);
            }
            e.fields.map((f) => {
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
        this.db.entities.map((e) => {
            write(`
    get ${this.db.GetClassName(e.tableName)}(): ${this.db.GetClassName(e.name)}[] {
        return this.GetDataRows('${e.tableName}') as ${this.db.GetClassName(e.name)}[];
    }`);
        });
        write('}');
    }
}
exports.default = CrudioCodeGenerator;
//# sourceMappingURL=CrudioCodeGenerator.js.map