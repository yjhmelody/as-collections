// This is folked from Assemblyscript std lib: https://github.com/AssemblyScript/assemblyscript/blob/main/std/assembly/map.ts.

// @ts-ignore: decorator
@lazy @inline const E_KEYNOTFOUND = "Key does not exist";

export function HASH<T>(key: T): u32 {
    // @ts-ignore
    if (isDefined(key.__hash)) {
        // @ts-ignore
        return key.__hash(0);
    } else if (isString<T>()) {
        return hashStr(changetype<string>(key));
    } else if (isReference<T>()) {
        if (sizeof<T>() == 4) return hash32(changetype<u32>(key));
        if (sizeof<T>() == 8) return hash64(changetype<u64>(key));
    } else if (isFloat<T>()) {
        if (sizeof<T>() == 4) return hash32(reinterpret<u32>(f32(key)));
        if (sizeof<T>() == 8) return hash64(reinterpret<u64>(f64(key)));
    } else {
        if (sizeof<T>() <= 4) return hash32(u32(key), sizeof<T>());
        if (sizeof<T>() == 8) return hash64(u64(key));
    }
    return unreachable();
}

export interface Hash {
    __hash(state: u32): u32;

    __eq(other: Hash): bool;
}

// @ts-ignore: decorator
@inline
function EQUAL<T>(a: T, b: T): bool {
    // maybe operator overload
    return a == b;
}

// XXHash 32-bit as a starting point, see: https://cyan4973.github.io/xxHash

// primes
// @ts-ignore: decorator
@inline const XXH32_P1: u32 = 2654435761;
// @ts-ignore: decorator
@inline const XXH32_P2: u32 = 2246822519;
// @ts-ignore: decorator
@inline const XXH32_P3: u32 = 3266489917;
// @ts-ignore: decorator
@inline const XXH32_P4: u32 = 668265263;
// @ts-ignore: decorator
@inline const XXH32_P5: u32 = 374761393;
// @ts-ignore: decorator
@inline const XXH32_SEED: u32 = 0;

// @ts-ignore: decorator
@inline
export function hash32(key: u32, len: u32 = 4): u32 {
    let h: u32 = XXH32_SEED + XXH32_P5 + len;
    h += key * XXH32_P3;
    h = rotl(h, 17) * XXH32_P4;
    h ^= h >> 15;
    h *= XXH32_P2;
    h ^= h >> 13;
    h *= XXH32_P3;
    h ^= h >> 16;
    return h;
}

// @ts-ignore: decorator
@inline
export function hash64(key: u64): u32 {
    let h: u32 = XXH32_SEED + XXH32_P5 + 8;
    h += <u32>key * XXH32_P3;
    h = rotl(h, 17) * XXH32_P4;
    h += <u32>(key >> 32) * XXH32_P3;
    h = rotl(h, 17) * XXH32_P4;
    h ^= h >> 15;
    h *= XXH32_P2;
    h ^= h >> 13;
    h *= XXH32_P3;
    h ^= h >> 16;
    return h;
}

// @ts-ignore: decorator
@inline
function mix(h: u32, key: u32): u32 {
    return rotl(h + key * XXH32_P2, 13) * XXH32_P1;
}

// @ts-ignore: decorator
@inline
function hashStr(key: string): u32 {
    if (key === null) return XXH32_SEED;

    let h: u32 = key.length << 1;
    let len: usize = h;
    let pos = changetype<usize>(key);

    if (len >= 16) {
        let s1 = XXH32_SEED + XXH32_P1 + XXH32_P2;
        let s2 = XXH32_SEED + XXH32_P2;
        let s3 = XXH32_SEED;
        let s4 = XXH32_SEED - XXH32_P1;

        let end = len + pos - 16;
        while (pos <= end) {
            s1 = mix(s1, load<u32>(pos));
            s2 = mix(s2, load<u32>(pos, 4));
            s3 = mix(s3, load<u32>(pos, 8));
            s4 = mix(s4, load<u32>(pos, 12));
            pos += 16;
        }
        h += rotl(s1, 1) + rotl(s2, 7) + rotl(s3, 12) + rotl(s4, 18);
    } else {
        h += XXH32_SEED + XXH32_P5;
    }

    let end = changetype<usize>(key) + len - 4;
    while (pos <= end) {
        h += load<u32>(pos) * XXH32_P3;
        h = rotl(h, 17) * XXH32_P4;
        pos += 4;
    }

    end = changetype<usize>(key) + len;
    while (pos < end) {
        h += <u32>load<u8>(pos) * XXH32_P5;
        h = rotl(h, 11) * XXH32_P1;
        pos++;
    }

    h ^= h >> 15;
    h *= XXH32_P2;
    h ^= h >> 13;
    h *= XXH32_P3;
    h ^= h >> 16;
    return h;
}

// @ts-ignore: decorator
@inline const INITIAL_CAPACITY = 4;

// @ts-ignore: decorator
@inline const FILL_FACTOR_N = 8;

// @ts-ignore: decorator
@inline const FILL_FACTOR_D = 3;

// @ts-ignore: decorator
@inline const FREE_FACTOR_N = 3;

// @ts-ignore: decorator
@inline const FREE_FACTOR_D = 4;

/** Structure of a map entry. */
@unmanaged class MapEntry<K, V> {
    key: K;
    value: V;
    taggedNext: usize; // LSB=1 indicates EMPTY
}

/** Empty bit. */
// @ts-ignore: decorator
@inline const EMPTY: usize = 1 << 0;

/** Size of a bucket. */
// @ts-ignore: decorator
@inline const BUCKET_SIZE = sizeof<usize>();

/** Computes the alignment of an entry. */
// @ts-ignore: decorator
@inline
function ENTRY_ALIGN<K, V>(): usize {
    // can align to 4 instead of 8 if 32-bit and K/V is <= 32-bits
    const maxkv = sizeof<K>() > sizeof<V>() ? sizeof<K>() : sizeof<V>();
    const align = (maxkv > sizeof<usize>() ? maxkv : sizeof<usize>()) - 1;
    return align;
}

/** Computes the aligned size of an entry. */
// @ts-ignore: decorator
@inline
function ENTRY_SIZE<K, V>(): usize {
    const align = ENTRY_ALIGN<K, V>();
    const size = (offsetof<MapEntry<K, V>>() + align) & ~align;
    return size;
}

export class HashMap<K, V> {

    // buckets referencing their respective first entry, usize[bucketsMask + 1]
    private buckets: ArrayBuffer = new ArrayBuffer(INITIAL_CAPACITY * <i32>BUCKET_SIZE);
    private bucketsMask: u32 = INITIAL_CAPACITY - 1;

    // entries in insertion order, MapEntry<K,V>[entriesCapacity]
    private entries: ArrayBuffer = new ArrayBuffer(INITIAL_CAPACITY * <i32>ENTRY_SIZE<K, V>());
    private entriesCapacity: i32 = INITIAL_CAPACITY;
    private entriesOffset: i32 = 0;
    private entriesCount: i32 = 0;

    constructor() {
        /* nop */
    }

    get size(): i32 {
        return this.entriesCount;
    }

    clear(): void {
        this.buckets = new ArrayBuffer(INITIAL_CAPACITY * <i32>BUCKET_SIZE);
        this.bucketsMask = INITIAL_CAPACITY - 1;
        this.entries = new ArrayBuffer(INITIAL_CAPACITY * <i32>ENTRY_SIZE<K, V>());
        this.entriesCapacity = INITIAL_CAPACITY;
        this.entriesOffset = 0;
        this.entriesCount = 0;
    }

    private find(key: K, hashCode: u32): MapEntry<K, V> | null {
        let entry = load<MapEntry<K, V>>( // unmanaged!
            changetype<usize>(this.buckets) + <usize>(hashCode & this.bucketsMask) * BUCKET_SIZE
        );
        while (entry) {
            let taggedNext = entry.taggedNext;
            if (!(taggedNext & EMPTY) && EQUAL(entry.key, key)) return entry;
            entry = changetype<MapEntry<K, V>>(taggedNext & ~EMPTY);
        }
        return null;
    }

    has(key: K): bool {
        return this.find(key, HASH<K>(key)) !== null;
    }

    get(key: K): V {
        let entry = this.find(key, HASH<K>(key));
        if (!entry) throw new Error(E_KEYNOTFOUND); // cannot represent `undefined`
        return entry.value;
    }

    /**
     * It's optimization verson of `get`, but only for nullable type.
     */
    getValue(key: K): V | null {
        const entry = this.find(key, HASH<K>(key));
        return entry ? entry.value : null;
    }

    set(key: K, value: V): this {
        let hashCode = HASH<K>(key);
        let entry = this.find(key, hashCode); // unmanaged!
        if (entry) {
            entry.value = value;
            if (isManaged<V>()) {
                __link(changetype<usize>(this), changetype<usize>(value), true);
            }
        } else {
            // check if rehashing is necessary
            if (this.entriesOffset == this.entriesCapacity) {
                this.rehash(
                    this.entriesCount < this.entriesCapacity * FREE_FACTOR_N / FREE_FACTOR_D
                        ? this.bucketsMask           // just rehash if 1/4+ entries are empty
                        : (this.bucketsMask << 1) | 1 // grow capacity to next 2^N
                );
            }
            // append new entry
            let entries = this.entries;
            entry = changetype<MapEntry<K, V>>(changetype<usize>(entries) + <usize>(this.entriesOffset++) * ENTRY_SIZE<K, V>());
            // link with the map
            entry.key = key;
            if (isManaged<K>()) {
                __link(changetype<usize>(this), changetype<usize>(key), true);
            }
            entry.value = value;
            if (isManaged<V>()) {
                __link(changetype<usize>(this), changetype<usize>(value), true);
            }
            ++this.entriesCount;
            // link with previous entry in bucket
            let bucketPtrBase = changetype<usize>(this.buckets) + <usize>(hashCode & this.bucketsMask) * BUCKET_SIZE;
            entry.taggedNext = load<usize>(bucketPtrBase);
            store<usize>(bucketPtrBase, changetype<usize>(entry));
        }
        return this;
    }

    delete(key: K): bool {
        let entry = this.find(key, HASH<K>(key));
        if (!entry) return false;
        entry.taggedNext |= EMPTY;
        --this.entriesCount;
        // check if rehashing is appropriate
        let halfBucketsMask = this.bucketsMask >> 1;
        if (
            halfBucketsMask + 1 >= max<u32>(INITIAL_CAPACITY, this.entriesCount) &&
            this.entriesCount < this.entriesCapacity * FREE_FACTOR_N / FREE_FACTOR_D
        ) this.rehash(halfBucketsMask);
        return true;
    }

    private rehash(newBucketsMask: u32): void {
        let newBucketsCapacity = <i32>(newBucketsMask + 1);
        let newBuckets = new ArrayBuffer(newBucketsCapacity * <i32>BUCKET_SIZE);
        let newEntriesCapacity = newBucketsCapacity * FILL_FACTOR_N / FILL_FACTOR_D;
        let newEntries = new ArrayBuffer(newEntriesCapacity * <i32>ENTRY_SIZE<K, V>());

        // copy old entries to new entries
        let oldPtr = changetype<usize>(this.entries);
        let oldEnd = oldPtr + <usize>this.entriesOffset * ENTRY_SIZE<K, V>();
        let newPtr = changetype<usize>(newEntries);
        while (oldPtr != oldEnd) {
            let oldEntry = changetype<MapEntry<K, V>>(oldPtr);
            if (!(oldEntry.taggedNext & EMPTY)) {
                let newEntry = changetype<MapEntry<K, V>>(newPtr);
                let oldEntryKey = oldEntry.key;
                newEntry.key = oldEntryKey;
                newEntry.value = oldEntry.value;
                let newBucketIndex = HASH<K>(oldEntryKey) & newBucketsMask;
                let newBucketPtrBase = changetype<usize>(newBuckets) + <usize>newBucketIndex * BUCKET_SIZE;
                newEntry.taggedNext = load<usize>(newBucketPtrBase);
                store<usize>(newBucketPtrBase, newPtr);
                newPtr += ENTRY_SIZE<K, V>();
            }
            oldPtr += ENTRY_SIZE<K, V>();
        }

        this.buckets = newBuckets;
        this.bucketsMask = newBucketsMask;
        this.entries = newEntries;
        this.entriesCapacity = newEntriesCapacity;
        this.entriesOffset = this.entriesCount;
    }

    keys(): K[] {
        // FIXME: this is preliminary, needs iterators/closures
        let start = changetype<usize>(this.entries);
        let size = this.entriesOffset;
        let keys = new Array<K>(size);
        let length = 0;
        for (let i = 0; i < size; ++i) {
            let entry = changetype<MapEntry<K, V>>(start + <usize>i * ENTRY_SIZE<K, V>());
            if (!(entry.taggedNext & EMPTY)) {
                keys[length++] = entry.key;
            }
        }
        keys.length = length;
        return keys;
    }

    values(): V[] {
        // FIXME: this is preliminary, needs iterators/closures
        let start = changetype<usize>(this.entries);
        let size = this.entriesOffset;
        let values = new Array<V>(size);
        let length = 0;
        for (let i = 0; i < size; ++i) {
            let entry = changetype<MapEntry<K, V>>(start + <usize>i * ENTRY_SIZE<K, V>());
            if (!(entry.taggedNext & EMPTY)) {
                values[length++] = entry.value;
            }
        }
        values.length = length;
        return values;
    }

    toString(): string {
        return "[object HashMap]";
    }

    // RT integration

    @unsafe private __visit(cookie: u32): void {
        __visit(changetype<usize>(this.buckets), cookie);
        let entries = changetype<usize>(this.entries);
        if (isManaged<K>() || isManaged<V>()) {
            let cur = entries;
            let end = cur + <usize>this.entriesOffset * ENTRY_SIZE<K, V>();
            while (cur < end) {
                let entry = changetype<MapEntry<K, V>>(cur);
                if (!(entry.taggedNext & EMPTY)) {
                    if (isManaged<K>()) {
                        let val = changetype<usize>(entry.key);
                        if (isNullable<K>()) {
                            if (val) __visit(val, cookie);
                        } else __visit(val, cookie);
                    }
                    if (isManaged<V>()) {
                        let val = changetype<usize>(entry.value);
                        if (isNullable<V>()) {
                            if (val) __visit(val, cookie);
                        } else __visit(val, cookie);
                    }
                }
                cur += ENTRY_SIZE<K, V>();
            }
        }
        __visit(entries, cookie);
    }
}
