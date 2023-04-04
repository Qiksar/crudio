import CrudioEntityDefinition from "../definition/CrudioEntityDefinition";
import ICrudioStream from "./ICrudioStream";
import ICrudioTrigger from "./ICrudioTrigger";
import ICrudioAssignment from "./ICrudioAssignment";

/**
 * Defines the data model to be generated
 * @date 7/18/2022 - 1:47:30 PM
 *
 * @export
 * @interface ICrudioSchemaDefinition
 * @typedef {ICrudioSchemaDefinition}
 */

export default interface ICrudioSchemaDefinition {
  /**
   * List of hard code assignments
   * @date 8/2/2022 - 12:11:48 PM
   *
   * @type {string[]}
   */
  assign: ICrudioAssignment[];

  /**
   * List of other files to include
   * @date 7/18/2022 - 1:47:30 PM
   *
   * @type {?string[]}
   */
  include?: string[];

  /**
   * List of entities defined in the schema
   * @date 7/18/2022 - 1:47:30 PM
   *
   * @type {?CrudioEntityDefinition[]}
   */
  entities?: CrudioEntityDefinition[];

  /**
   * List of data generator groups, each group contains multiple generators
   * @date 7/18/2022 - 1:47:30 PM
   *
   * @type {?Record<string, unknown>}
   */
  generators?: [];

  /**
   * Reusable field definitions
   * @date 7/18/2022 - 1:47:30 PM
   *
   * @type {?{}}
   */
  // eslint-disable-next-line @typescript-eslint/ban-types
  snippets?: {};

  /**
   * Actions to execute when entities are created
   * @date 7/18/2022 - 1:47:30 PM
   *
   * @type {string[]}
   */
  triggers?: ICrudioTrigger[];

  /**
   * Actions to execute when entities are created
   * @date 7/18/2022 - 1:47:30 PM
   *
   * @type {string[]}
   */
  streams?: ICrudioStream[];
}
