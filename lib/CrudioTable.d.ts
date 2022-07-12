import CrudioEntityInstance from './CrudioEntityInstance';
export default class CrudioTable {
    name: string;
    entity: string;
    count: number;
    rows: CrudioEntityInstance[];
    constructor();
    clear(): void;
    append(instance: CrudioEntityInstance): void;
}
