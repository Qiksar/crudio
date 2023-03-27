import CrudioTable from "../generation/CrudioTable";
import SqlInstructionList from "../../wrappers/SqlInstructionList";

/**
 * Base interface for data management
 * @date 13/10/2022 - 07:24:33
 *
 * @export
 * @interface ICrudioDataWrapper
 * @typedef {ICrudioDataWrapper}
 */

export default interface ICrudioDataWrapper {
	/**
	 * Create the target internal database model and manifest the schema in the target database
	 * @date 13/10/2022 - 07:24:33
	 */
	CreateDatabaseSchema(): Promise<void>;

	/**
	 * Populate the database
	 * @date 13/10/2022 - 07:24:33
	 */
	PopulateDatabaseTables(): Promise<void>;

	/**
	 * Description placeholder
	 * @date 07/12/2022 - 07:23:08
	 *
	 * @param {CrudioTable} table
	 * @param {(SqlInstructionList | null)} instructions
	 * @returns {*}
	 */
	InsertTableData(table: CrudioTable, instructions: SqlInstructionList | null);

	/**
	 * Close database connection and release resources
	 * @date 13/10/2022 - 07:29:39
	 */
	Close(): Promise<void>;
}
