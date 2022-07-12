"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class CrudioEntityInstance {
    entityType;
    values = {};
    constructor(entityType, source = {}, strict = false) {
        this.entityType = entityType;
        this.values = source;
        if (strict) {
            Object.keys(this.values).map((k) => {
                if (!entityType.GetField(k)) {
                    throw new Error("CrudioEntityInstance.constructor '" +
                        k +
                        "' is not a valid field on entity '" +
                        this.entityType.name +
                        "'");
                }
            });
        }
    }
    CheckId(entity) {
        if (!entity.values || !entity.values.Id) {
            throw new Error(`
    CheckId: entity must have values and values.Id must be non-zero
    Entity: ${JSON.stringify(entity.values)}
    `);
        }
        return true;
    }
}
exports.default = CrudioEntityInstance;
//# sourceMappingURL=CrudioEntityInstance.js.map