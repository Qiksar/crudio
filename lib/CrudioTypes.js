"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CrudioWhere = exports.CrudioSort = void 0;
var CrudioSort;
(function (CrudioSort) {
    CrudioSort["Ascending"] = "asc";
    CrudioSort["Descending"] = "desc";
})(CrudioSort = exports.CrudioSort || (exports.CrudioSort = {}));
var CrudioWhere;
(function (CrudioWhere) {
    CrudioWhere["Like"] = "_like";
    CrudioWhere["iLike"] = "_ilike";
    CrudioWhere["NotLike"] = "_nlike";
    CrudioWhere["iNotLike"] = "_nilike";
    CrudioWhere["Similar"] = "_similar";
    CrudioWhere["NotSimilar"] = "_nsimilar";
    CrudioWhere["IsNull"] = "_is_null";
    CrudioWhere["Equal"] = "_eq";
    CrudioWhere["NotEqual"] = "_neq";
    CrudioWhere["GreaterThan"] = "_gt";
    CrudioWhere["LessThan"] = "_lt";
    CrudioWhere["GreaterThanOrEqual"] = "_gte";
    CrudioWhere["LessThanOrEqual"] = "_lte";
    CrudioWhere["In"] = "_in";
    CrudioWhere["NotIn"] = "_nin";
})(CrudioWhere = exports.CrudioWhere || (exports.CrudioWhere = {}));
//# sourceMappingURL=CrudioTypes.js.map