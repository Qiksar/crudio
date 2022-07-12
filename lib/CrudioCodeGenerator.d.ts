import CrudioRepository from './CrudioRepository';
export default class CrudioCodeGenerator {
    db: CrudioRepository;
    fs: any;
    constructor(fakedb: CrudioRepository, filesys: any);
    GenerateCode(path: string): void;
}
