import CrudioEntityType from "./CrudioEntityType";
import CrudioField from "./CrudioField";
export default class CrudioInclude {
    entity: CrudioEntityType;
    fields: CrudioField[];
    entityName: string;
    constructor(entity: CrudioEntityType, entityName: string, fields: CrudioField[]);
}
