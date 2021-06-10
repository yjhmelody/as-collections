export enum Ordering {
    Less,
    Equal,
    Greater,
}

// TODO: move to a common lib

// TODO: should use abstract class ?
export interface Ord {
    cmp(other: this): Ordering;
}

export interface Hash32 {
    hash(): u32;
}

export class PriorityQueue<T> {
    protected _queue: StaticArray<T>;
    protected _length: i32 = 0;

    constructor(capacity: i32 = 0) {
        this._queue = new StaticArray<T>(capacity);
    }

    @inline
    get size(): i32 {
        return this._length;
    }

    @inline
    get length(): i32 {
        return this._length;
    }
}
