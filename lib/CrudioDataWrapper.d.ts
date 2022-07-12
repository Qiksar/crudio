import CrudioRepository from "./CrudioRepository";
import CrudioGQL from "./CrudioGQL";
import { ICrudioConfig } from "./CrudioTypes";
export default class CrudioDataWrapper {
    gql: CrudioGQL;
    config: ICrudioConfig;
    repo: CrudioRepository;
    constructor(config: ICrudioConfig, repo: CrudioRepository);
    CreateEmptySchema(): Promise<void>;
    CreateTables(): Promise<void>;
}
