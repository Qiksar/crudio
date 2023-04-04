import ICrudioFieldOptions from "./ICrudioFieldOptions";

/**
 * Field schema definition
 * @date 7/18/2022 - 1:47:30 PM
 *
 * @export
 * @interface ICrudioField
 * @typedef {ICrudioField}
 */

export default interface ICrudioField {
  /**
   * Name of field
   * @date 7/18/2022 - 1:47:30 PM
   *
   * @type {string}
   */
  fieldName: string;

  /**
   * Data type
   * @date 7/18/2022 - 1:47:30 PM
   *
   * @type {string}
   */
  fieldType: string;

  /**
   * Default value
   * @date 7/18/2022 - 1:47:30 PM
   *
   * @type {?*}
   */
  defaultValue?: any;

  /**
   * Options for the field
   * @date 7/18/2022 - 1:47:30 PM
   *
   * @type {ICrudioFieldOptions}
   */
  fieldOptions?: ICrudioFieldOptions;
}
