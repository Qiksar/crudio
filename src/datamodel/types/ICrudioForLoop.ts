import ICrudioRange from "./ICrudioRange";

/**
 * Loop which can create generator values, create entities and contain other nested loops
 * @date 07/12/2022 - 07:23:08
 *
 * @export
 * @interface ICrudioForLoop
 * @typedef {ICrudioForLoop}
 */

export default interface ICrudioForLoop {
  /**
   * Nest loop configuration
   * @date 07/12/2022 - 07:23:08
   *
   * @type {ICrudioForLoop}
   */
  loop: ICrudioForLoop;

  /**
   * List of values to be assigned to generators
   * @date 07/12/2022 - 07:23:08
   *
   * @type {((string | number | Date)[])}
   */
  list: (string | number | Date)[];

  /**
   * Output type
   * @date 07/12/2022 - 07:23:08
   *
   * @type {(any | undefined)}
   */
  output: any | undefined;

  /**
   * Range for values to be used in the loop
   * @date 07/12/2022 - 07:23:08
   *
   * @type {ICrudioRange}
   */
  range: ICrudioRange;
}
