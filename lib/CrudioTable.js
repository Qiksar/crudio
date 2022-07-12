"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class CrudioTable {
    name = '';
    entity = '';
    count = 0;
    rows = [];
    constructor() {
        this.rows = [];
    }
    clear() {
        this.rows = [];
    }
    append(instance) {
        this.rows.push(instance);
    }
}
exports.default = CrudioTable;
//# sourceMappingURL=CrudioTable.js.map