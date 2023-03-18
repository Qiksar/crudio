import { Duration } from "luxon";

/**
 * General utility methods
 * @date 7/18/2022 - 3:57:13 PM
 *
 * @export
 * @class CrudioUtils
 * @typedef {CrudioUtils}
 */
export default class CrudioUtils {
	static DateDuration(diff: any): Duration {
		var d: any = {};

		const dr = (source, dest, fname) => {
			if (source[fname]) {
				d[fname] = source[fname];
				return;
			}

			var low = source[`${fname}_lo`] ?? source[fname];
			var high = source[`${fname}_hi`] ?? source[fname];

			if (low > high) {
				const t = low;
				low = high;
				high = t;
			}

			const n = CrudioUtils.GetRandomNumber(low ?? 0, high ?? 0);

			if (n != 0)
				dest[fname] = n;
		};

		dr(diff, d, "days");
		dr(diff, d, "weeks");
		dr(diff, d, "months");
		dr(diff, d, "years");
		dr(diff, d, "hours");
		dr(diff, d, "minutes");
		dr(diff, d, "seconds");

		return d;
	}

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

		if (word.substring(word.length - 2).toLowerCase() === "us") output = word.substring(0, word.length - 2) + "ii";
		else if (word[word.length - 2].toLowerCase() === "ty") output = word.substring(0, word.length - 2) + "ies";
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
			return matches[1].trim().toUpperCase();
		};

		var result: any = input.replace(/(\-\w)/g, converter);
		result = result.charAt(0).toUpperCase() + result.slice(1);

		return result;
	}

	/**
	 * Randomly select a word from a separated list
	 * @date 7/28/2022 - 1:30:00 PM
	 *
	 * @private
	 * @param {string} content
	 * @returns {*}
	 */
	public static GetRandomStringFromList(content: string, seperator = ";") {
		const words: string[] = content.replace(/(^;)|(;$)/g, "").split(seperator);
		const rndWord: number = Math.random();
		const index: number = Math.floor(words.length * rndWord);
		const value = words[index];

		return value;
	}

	/**
	 * Get a random number >= min and <= max
	 * @date 7/18/2022 - 3:39:38 PM
	 *
	 * @public
	 * @static
	 * @param {number} min
	 * @param {number} max
	 * @returns {number}
	 */
	public static GetRandomNumber(min: number, max: number): number {
		var rndValue: number = Math.random();
		return Math.floor((max - min) * rndValue) + min;
	}


	/**
	 * Ensure column text has Id appended if not present
	 * This connects foreign keys between referenced tables
	 * 
	 * @date 7/18/2022 - 3:39:38 PM
	 *
	 * @public
	 * @static
	 * @param {string} name
	 * @returns {string}
	 */
	public static ToColumnId(name: string): string {
		return name.toLowerCase().endsWith("id") ? name : name + "Id";
	}
}
