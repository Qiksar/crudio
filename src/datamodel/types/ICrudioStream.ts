import ICrudioForLoop from "./ICrudioForLoop";

/**
 * Configure data streaming generation
 * @date 07/12/2022 - 07:23:08
 *
 * @export
 * @interface ICrudioStream
 * @typedef {ICrudioStream}
 */

export default interface ICrudioStream {
	/**
	 * Name of the streaming process
	 * @date 07/12/2022 - 07:23:08
	 *
	 * @type {string}
	 */
	name: string;

	/**
	 * The top level entity in the stream under which a child entity and its data stream are created
	 * @date 07/12/2022 - 07:23:08
	 *
	 * @type {string}
	 */
	parentEntity: string;

	/**
	 * Key field of the parent entity to filter/limit instances under which child entities are created
	 * @date 07/12/2022 - 07:23:08
	 *
	 * @type {string}
	 */
	key: string;

	/**
	 * Key value of the parent entity used in filtering
	 * @date 07/12/2022 - 07:23:08
	 *
	 * @type {string}
	 */
	value: string;

	/**
	 * Name of the child entity type to place under each parent entity
	 * @date 07/12/2022 - 07:23:08
	 *
	 * @type {string}
	 */
	createEntity: string;

	/**
	 * Nested loop definition
	 * @date 07/12/2022 - 07:23:08
	 *
	 * @type {ICrudioForLoop}
	 */
	loop: ICrudioForLoop;
}
