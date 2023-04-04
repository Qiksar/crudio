/**
 * Cache of SQL instructions which is built and executed to create tables, relationships and sample data
 * @date 7/18/2022 - 1:46:23 PM
 *
 * @class SqlInstructionList
 * @typedef {SqlInstructionList}
 */

export default class SqlInstructionList {
  /**
   * List of fields on the current table
   * @date 7/18/2022 - 1:46:23 PM
   *
   * @type {{}}
   */
  public table_field_list: string[] = [];

  /**
   * SQL definitions for the columns on the current table
   * @date 7/18/2022 - 1:46:23 PM
   *
   * @type {string}
   */
  public table_column_definitions = "";

  /**
   * Concatenated version of field names
   * @date 7/18/2022 - 1:46:23 PM
   *
   * @type {string}
   */
  public table_column_names = "";

  /**
   * SQL to create foreign key relationships for all tables
   * @date 7/18/2022 - 1:46:23 PM
   *
   * @type {string}
   */
  public create_foreign_keys = "";

  /**
   * SQL to insert data table values
   * @date 7/18/2022 - 1:46:23 PM
   *
   * @type {string}
   */
  public insert_table_rows = "";
}
