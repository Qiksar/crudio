import ISingularNamedRelationship from "./ISingularNamedRelationship";

/**
 * Defines relationships between entities
 * @date 7/18/2022 - 1:47:30 PM
 *
 * @export
 * @interface ISchemaRelationship
 * @typedef {ISchemaRelationship}
 */

export default interface ISchemaRelationship {
  /**
   * Indicates that the foreign key must have a value
   * @date 7/31/2022 - 8:41:55 AM
   *
   * @type {boolean}
   */
  required: boolean;

  /**
   * The name of the referencing table
   * @date 7/18/2022 - 1:47:30 PM
   *
   * @type {string}
   */
  from: string;

  /**
   * Refeferencing columns
   * @date 7/18/2022 - 1:47:30 PM
   *
   * @type {string}
   */
  from_column: string;

  /**
   * The name of the references table
   * @date 7/18/2022 - 1:47:30 PM
   *
   * @type {string}
   */
  to: string;

  /**
   * Referenced column
   * @date 7/18/2022 - 1:47:30 PM
   *
   * @type {string}
   */
  to_column: string;

  /**
   * Relationship name
   * @date 7/18/2022 - 1:47:30 PM
   *
   * @type {string}
   */
  name: string;

  /**
   * "one" for one to many
   * "many" for many to many
   * one to many will be implemented as a forgeign key between a child table and parent
   * many to many will be implemented through a join table with a foreign key to the related entities
   * @date 7/18/2022 - 1:47:30 PM
   *
   * @type {string}
   */
  type: "one" | "many";

  /**
   * Number of sample data rows to insert in a many to many table
   * @date 7/18/2022 - 1:47:30 PM
   *
   * @type {number}
   */
  count?: number;

  /**
   * describe a default relationship formed between two objects, such as all users in an organisation
   * being assigned a default role of Staff
   * @date 7/18/2022 - 1:47:30 PM
   *
   * @type {string}
   */
  default?: string;

  /**
   * describe a relationship to be formed between two objects where a specific entity instance is to be used
   * for example, an organisation has one user in the role of CEO. An entity is selected from the organisation.users,
   * and then assigned the role, by looking up the role with name = CEO
   * @date 7/18/2022 - 1:47:30 PM
   *
   * @type {ISingularNamedRelationship}
   */
  singular?: ISingularNamedRelationship;

  /**
   * specify additional fields for many to many join table
   * @date 7/18/2022 - 1:47:30 PM
   *
   * @type {Record<string, unknown>[]}
   */
  fields?: Record<string, unknown>[];
}
