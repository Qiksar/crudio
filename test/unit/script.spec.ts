const global_variable = 999;

describe("Test dynamic code", () => {
    test("Test Function", () => {

        const x = 1, y = 2;
        const r: any = { name: "Bob" }

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

        expect(() => (0,eval)(global_test)).toThrow();
    });
});