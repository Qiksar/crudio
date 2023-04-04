/* eslint-disable @typescript-eslint/no-unused-vars */

describe("Test dynamic code", () => {
  test("Executes dynamic code with local scope, but no global access", () => {
    const r: any = { name: "Bob" };

    const x = 1;
    const y = 2;

    const f = eval(`
        var b=1;
        r.lastname = "Smith"
        x + y;
        `);

    expect(f).toEqual(3);
    expect(r.lastname).toEqual("Smith");
    expect(() => eval("b")).toThrow();

    const global_test = `
        global_variable + 1;
        `;

    expect(() => (0, eval)(global_test)).toThrow();
  });
});
