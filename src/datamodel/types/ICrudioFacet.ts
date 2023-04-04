/**
 * Forms the base of any object comprised by a model, forcing all types to have a standard set of basic fields
 * @date 26/03/2023 - 12:29:29
 *
 * @export
 * @interface ICrudioFacet
 * @typedef {ICrudioFacet}
 */
export default interface ICrudioFacet {
  /**
   * Object name
   * @date 26/03/2023 - 12:29:29
   *
   * @readonly
   * @type {string}
   */
  get Name(): string;
}
