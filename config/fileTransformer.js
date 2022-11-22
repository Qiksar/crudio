// source: https://jestjs.io/docs/code-transformation#examples

const path = require("path");

module.exports = {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/explicit-function-return-type
  process(src, filename, config, options) {
    return "module.exports = " + JSON.stringify(path.basename(filename)) + ";";
  }
};
