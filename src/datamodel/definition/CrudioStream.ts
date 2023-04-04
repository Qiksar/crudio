import ICrudioStream from "../types/ICrudioStream";
import ICrudioFacet from "../types/ICrudioFacet";
import CrudioForLoop from "./CrudioForLoop";

/**
 * Streams produce a sequential flow of data, where attribute values are calculated per entity instance.
 * Ideal for simulating sensors.
 * @date 26/03/2023 - 12:33:27
 *
 * @export
 * @class CrudioStream
 * @typedef {CrudioStream}
 * @implements {ICrudioFacet}
 */
export class CrudioStream implements ICrudioFacet {
  /**
   * Name of the stream
   * @date 26/03/2023 - 12:33:27
   *
   * @type {string}
   */
  name: string;

  /**
   * Parent entity to be populated
   * @date 26/03/2023 - 12:33:27
   *
   * @type {string}
   */
  parentEntity: string;

  /**
   * Attribute name generated
   * @date 26/03/2023 - 12:33:27
   *
   * @type {string}
   */
  key: string;

  /**
   * Value generated
   * @date 26/03/2023 - 12:33:27
   *
   * @type {*}
   */
  value: any;

  /**
   * Description placeholder
   * @date 26/03/2023 - 12:33:27
   *
   * @type {string}
   */
  createEntity: string;

  /**
   * Loop definition.
   * Loops can be nested to set values for multiple attributes, e.g. a date can be iterated, and then
   * for each hour a nested loop sets the time, and a further nested loop can set a sensor data value based on date and time
   * @date 26/03/2023 - 12:33:27
   *
   * @type {CrudioForLoop}
   */
  loop: CrudioForLoop;

  /**
   * Creates an instance of CrudioStream.
   * @date 26/03/2023 - 12:33:27
   *
   * @constructor
   * @param {Record<string, unknown>} context
   * @param {ICrudioStream} definition
   */
  constructor(private context: Record<string, unknown>, definition: ICrudioStream) {
    this.name = definition.name;
    this.parentEntity = definition.parentEntity;
    this.createEntity = definition.createEntity;

    if (this.parentEntity === undefined) {
      throw `CrudioStream: stream '${this.name} - missing 'parentEntity' attribute`;
    }

    if (this.createEntity === undefined) {
      throw `CrudioStream: stream '${this.name} - missing 'createEntity' attribute`;
    }

    if (this.createEntity === undefined) {
      throw `CrudioStream: stream '${this.name} - missing 'createEntity' attribute`;
    }

    this.key = definition.key;
    this.value = definition.value;

    if (this.key === undefined && this.value !== undefined) {
      throw `CrudioStream: stream '${this.name} - 'value' is specified, but 'key' has not been specified. To filter the parent entity, both attributes must be specified`;
    }

    if (this.value === undefined && this.key !== undefined) {
      throw `CrudioStream: stream '${this.name} - 'key' is specified, but 'value' has not been specified. To filter the parent entity, both attributes must be specified`;
    }

    if (definition.loop) {
      this.loop = new CrudioForLoop(definition.loop);
    } else {
      throw `CrudioStream: stream '${this.name} - missing 'loop' specification`;
    }
  }

  /**
   * Object name
   * @date 26/03/2023 - 12:29:29
   *
   * @readonly
   * @type {string}
   */
  get Name(): string {
    return this.name;
  }

  /**
   * Execute the data generation process
   * @date 26/03/2023 - 12:33:27
   *
   * @param {(output_entity: any) => void} cb
   */
  Execute(cb: (output_entity: any) => void): void {
    this.loop.Execute(this.context, output_entity => {
      cb(output_entity);
    });
  }
}
