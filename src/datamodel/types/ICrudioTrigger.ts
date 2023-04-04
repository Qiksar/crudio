/**
 * Instructions to execute each time a specific entity type is created
 * @date 8/2/2022 - 12:11:48 PM
 *
 * @export
 * @interface ICrudioTrigger
 * @typedef {ICrudioTrigger}
 */

export default interface ICrudioTrigger {
  /**
   * Name of the entity definition
   * @date 8/2/2022 - 12:11:48 PM
   *
   * @type {string}
   */
  entity: string;

  /**
   * Instructions to execute
   * @date 8/2/2022 - 12:11:48 PM
   *
   * @type {string[]}
   */
  scripts: string[];
}
