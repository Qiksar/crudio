export default class CrudioUtils {
  public static Plural(word: string): string {
    var output = "";

    if (word.substring(word.length - 2).toLowerCase() === "us")
      output = word.substring(0, word.length - 2) + "ii";
    else if (word[word.length - 2].toLowerCase() === "ty")
      output = word.substring(0, word.length - 2) + "ies";
    else output = word + "s";

    return output;
  }
}
