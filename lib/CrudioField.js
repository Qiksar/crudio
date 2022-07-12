"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class CrudioField {
    fieldName;
    caption;
    fieldType;
    defaultValue;
    fieldOptions;
    constructor(fieldName, fieldType, caption, options) {
        if (!fieldType)
            throw new Error("fieldType must specify a valud entity field type");
        if (!options) {
            options = { canSort: true, isKey: false };
        }
        this.fieldName = fieldName;
        this.fieldType = fieldType;
        this.caption = caption;
        this.fieldOptions = options;
    }
    GetCaption() {
        // if (this.caption) {
        // 	return this.caption;
        // }
        var input = this.caption || this.fieldName || "";
        input = input.charAt(0).toUpperCase() + input.slice(1);
        var parts = input.split(/(?=[A-Z])/);
        if (parts) {
            input = "";
            parts.map((t) => (input += t.length > 0 ? t + " " : ""));
            var result = input
                .toLowerCase()
                .replace(/\-/g, " ")
                .replace(/\_/g, " ");
            var val = "";
            result
                .split(" ")
                .map((t) => (val += t.charAt(0).toUpperCase() + t.slice(1) + " "));
            this.caption = val.trim();
        }
        else {
            this.caption = input;
        }
        return this.caption;
    }
    // https://www.postgresql.org/docs/current/datatype.html
    get GetDatabaseFieldType() {
        switch (this.fieldType.toLowerCase()) {
            case "string":
                return "text";
            default:
                return this.fieldType;
        }
    }
}
exports.default = CrudioField;
//# sourceMappingURL=CrudioField.js.map