import ICrudioField from "./ICrudioField";
import ISchemaRelationship from "./ISchemaRelationship";

/**
 * Entity schema
 * @date 7/18/2022 - 1:47:30 PM
 *
 * @export
 * @interface ICrudioEntityDefinition
 * @typedef {ICrudioEntityDefinition}
 */

export default interface ICrudioEntityDefinition {
  /**
   * Name of the schema
   * @date 7/18/2022 - 1:47:30 PM
   *
   * @type {string}
   */
  name: string;

  /**
   * Name of the data table
   * @date 7/18/2022 - 1:47:30 PM
   *
   * @type {string}
   */
  tableName: string;

  /**
   * List of field definitions
   * @date 7/18/2022 - 1:47:30 PM
   *
   * @type {ICrudioField[]}
   */
  fields: ICrudioField[];

  /**
   * List of relationships to other entities
   * @date 7/18/2022 - 1:47:30 PM
   *
   * @type {ISchemaRelationship[]}
   */
  relationships?: ISchemaRelationship[];

  /**
   * Number of entities required
   * @date 7/21/2022 - 1:47:19 PM
   *
   * @type {number}
   */
  count?: number;

  /**
   * Configure the point at which triggers execute
   * creating : execute triggers for the entity when it is being created
   * streaming : execute triggers for the entity when streams are being generated
   * @date 07/12/2022 - 06:32:56
   *
   * @public
   * @type {("off" | "creating" | "streaming")}
   */
  triggers?: "off" | "creating" | "streaming";

  /**
   * Base entity to inherit fields from
   * @date 7/18/2022 - 1:47:30 PM
   *
   * @type {string}
   */
  inherits?: string;

  /**
   * If abstract, a table will not be created for the entity
   * @date 7/18/2022 - 1:47:30 PM
   *
   * @type {boolean}
   */
  abstract?: boolean;

  /**
   * Field definition snippets to import
   * @date 7/18/2022 - 1:47:30 PM
   *
   * @type {string[]}
   */
  snippets?: string[];
}
