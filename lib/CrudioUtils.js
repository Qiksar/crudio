"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class CrudioUtils {
    static Plural(word) {
        var output = "";
        if (word.substring(word.length - 2).toLowerCase() === "us")
            output = word.substring(0, word.length - 2) + "ii";
        else if (word[word.length - 2].toLowerCase() === "ty")
            output = word.substring(0, word.length - 2) + "ies";
        else
            output = word + "s";
        return output;
    }
}
exports.default = CrudioUtils;
//# sourceMappingURL=CrudioUtils.js.map