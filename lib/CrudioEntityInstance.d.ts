import CrudioEntityType from './CrudioEntityType';
export default class CrudioEntityInstance {
    entityType: CrudioEntityType;
    values: any;
    constructor(entityType: CrudioEntityType, source?: {}, strict?: boolean);
    CheckId(entity: CrudioEntityInstance): boolean;
}
