/**
 * General utility methods
 * @date 7/18/2022 - 3:57:13 PM
 *
 * @export
 * @class CrudioUtils
 * @typedef {CrudioUtils}
 */
export default class CrudioUtils {
  /**
   * Create a plural form of a noun string
   * @date 7/18/2022 - 3:57:13 PM
   *
   * @public
   * @static
   * @param {string} word
   * @returns {string}
   */
  public static Plural(word: string): string {
    var output = "";

    if (word.substring(word.length - 2).toLowerCase() === "us")
      output = word.substring(0, word.length - 2) + "ii";
    else if (word[word.length - 2].toLowerCase() === "ty")
      output = word.substring(0, word.length - 2) + "ies";
    else output = word + "s";

    return output;
  }
  
	/**
	 * Create a title case version of an input string
	 * @date 7/18/2022 - 3:39:38 PM
	 *
	 * @param {string} input
	 * @returns {string}
	 */
	public static TitleCase(input: string): string {
		var converter: any = function (matches: string[]) {
			return matches[1].toUpperCase();
		};

		var result: any = input.replace(/(\-\w)/g, converter);
		result = result.charAt(0).toUpperCase() + result.slice(1);

		return result;
	}

}
