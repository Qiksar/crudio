
describe("Test dynamic code", () => {
    test("Test Function", () => {
        const x = 1, y = 2;
        const r: any = { name: "Bob" }

        const f = eval(`
        "use strict";
        var b=1;
        r.lastname = "Smith"
        x + y;
        `);

        expect(f).toEqual(3);
        expect(r.lastname).toEqual("Smith");
        expect(() => eval("b")).toThrow();

    });
});