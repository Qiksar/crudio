import CrudioDataWrapper from "./CrudioDataWrapper";
import CrudioRepository from "./CrudioRepository";
export default async function main() {
    const config = {
        hasuraEndpoint: "http://localhost:6789",
        hasuraQueryEndpoint: "http://localhost:6789/v2/query",
        hasuraAdminSecret: "crudio",
        idFieldName: "id",
        readonlyFields: [],
        schema: "crudio"
    };
    const repo = CrudioRepository.FromJson("test/unit/input/repo.json");
    const db = new CrudioDataWrapper(config, repo);
    await db.DropTables();
    await db.CreateTables();
}
//# sourceMappingURL=index.js.map