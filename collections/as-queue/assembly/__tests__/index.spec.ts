import { Deque } from "../index";

describe("Queue", () => {
    it("offsetof", () => {
        expect(offsetof<Deque<bool>>()).toBe(12);
        expect(offsetof<Deque<i32>>()).toBe(12);
        expect(offsetof<Deque<u64>>()).toBe(12);
        expect(offsetof<Deque<string>>()).toBe(12);
    });

    it("peekBack", () => {
        const q = new Deque<i32>();
        for (let i = 0; i < 10; i++) {
            expect(q.length).toBe(i);
            q.pushBack(i);
            expect(q.peekBack()).toBe(i);
        }
        expect(q.length).toBe(10);
    });

    it("pekkFront", () => {
        const q = new Deque<i32>();
        for (let i = 0; i < 10; i++) {
            expect(q.length).toBe(i);
            q.pushFront(i);
            expect(q.peekFront()).toBe(i);
        }
        expect(q.length).toBe(10);
    });

    it("pushBack", () => {
        const q = new Deque<i32>();
        for (let i = 0; i < 10; i++) {
            expect(q.length).toBe(i);
            q.pushBack(i);
        }
        expect(q.length).toBe(10);
    });

    it("pushFront", () => {
        const q = new Deque<i32>();
        for (let i = 0; i < 10; i++) {
            expect(q.length).toBe(i);
            q.pushFront(i);
        }
        expect(q.length).toBe(10);
    });

    it("popBack", () => {
        const q = new Deque<i32>();
        for (let i = 0; i < 10; i++) {
            q.pushFront(i);
        }
        for (let i = 0; i < 10; i++) {
            const k = q.popBack();
            expect(k).toBe(i);
        }

        {
            const q = new Deque<i32>();
            for (let i = 0; i < 10; i++) {
                q.pushBack(i);
            }
            for (let i = 0; i < 10; i++) {
                const k = q.popBack();
                expect(k).toBe(9 - i);
            }
        }
    });

    it("popFront", () => {
        const q = new Deque<i32>();
        for (let i = 0; i < 10; i++) {
            q.pushBack(i);
        }
        for (let i = 0; i < 10; i++) {
            const k = q.popFront();
            expect(k).toBe(i);
        }

        {
            const q = new Deque<i32>();
            for (let i = 0; i < 10; i++) {
                q.pushFront(i);
            }
            for (let i = 0; i < 10; i++) {
                const k = q.popFront();
                expect(k).toBe(9 - i);
            }
        }
    });

    it("map", () => {
        const q = new Deque<i32>();
        for (let i = 0; i < 10; i++) {
            q.pushBack(i);
        }

        const q2 = q.map<bool>((elem) => elem % 2 == 0);
        for (let i = 0, len = q2.length; i < len; i++) {
            expect(q2.popFront()).toBe(i % 2 == 0);
        }
    });

    it("toArray", () => {
        const q = new Deque<i32>();
        for (let i = 0; i < 5; i++) {
            q.pushBack(i);
        }

        const arr = q.toArray();
        expect(arr).toStrictEqual([0, 1, 2, 3, 4]);
        expect(new Deque<string>().toArray()).toStrictEqual(
            new Array<string>()
        );
    });

    it("toStaticArray", () => {
        const q = new Deque<i32>();
        for (let i = 0; i < 5; i++) {
            q.pushBack(i);
        }

        const arr = q.toStaticArray();
        expect(arr).toStrictEqual(StaticArray.fromArray([0, 1, 2, 3, 4]));
        expect(new Deque<string>().toStaticArray()).toStrictEqual(
            new StaticArray<string>(0)
        );
    });

    it("clear", () => {
        const q = new Deque<i32>();
        for (let i = 0; i < 5; i++) {
            q.pushBack(i);
        }
        expect(q.length).toBe(5);
        q.clear();
        expect(q.length).toBe(0);
    });
});

class Person {
    constructor(public name: string) {}
}
