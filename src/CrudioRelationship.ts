import { ICrudioEntityType, ICrudioEntityRelationship } from "./CrudioTypes";

export default class CrudioRelationship implements ICrudioEntityRelationship {
    public source: ICrudioEntityType;
    public sourceColumn: string;
    public target: ICrudioEntityType;
    public targetColumn: string;
    public relationshipName: string;

    constructor(source: ICrudioEntityType,
        sourceColumn: string,
        target: ICrudioEntityType,
        targetColumn: string,
        name: string
    ) {
        this.source = source;
        this.sourceColumn = sourceColumn;
        this.target = target;
        this.targetColumn = targetColumn;
        this.relationshipName = name;
    }
}
