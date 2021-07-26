import { HASH, Hash, HashMap } from "../hashmap";

class Person implements Hash {
    name: string;
    age: u8;

    __hash(state: u32): u32 {
        state += HASH(this.name);
        return state;
    }

    @operator.binary("==")
    __eq(other: Person): bool {
        return this.name == other.name;
    }
}

export class Result<O, E> {
    private constructor(
        protected readonly _ok: O | null,
        protected readonly _err: E | null
    ) {}
}

// Since most of map APIs are forked from std. So we do not need unit test.
describe("HashMap", () => {
    itThrows("get empty", (): void => {
        let m: HashMap<i32, Person> = new HashMap();
        m.get(1);
    });

    it("getValue empty", (): void => {
        let m: HashMap<i32, Person> = new HashMap();
        let val = m.getValue(1);
        assert(val === null);
    });

    it("getValue", (): void => {
        let m: HashMap<i32, Person> = new HashMap();
        // @ts-ignore
        m.set(1, { name: "foo", age: 1 });
        let val = m.getValue(1);
        // @ts-ignore
        expect(val as Person).toStrictEqual({ name: "foo", age: 1 });
    });

    it("custom hash", (): void => {
        let m: HashMap<Person, bool> = new HashMap();
        // @ts-ignore
        m.set({ name: "foo", age: 1 }, true);
        // @ts-ignore
        m.set({ name: "foo", age: 2 }, true);
        expect(m.size).toBe(1);
        // @ts-ignore
        m.set({ name: "bar", age: 2 }, true);
        expect(m.size).toBe(2);
    });
});
