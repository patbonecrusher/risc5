export const toHexString = (n: number, l: number = 8) => n.toString(16).padStart(l, '0');
export const toBinString = (n: number, l: number = 32) => n.toString(2).padStart(l, '0');

// To go full uint from int
export const twos = (v: number) => v >>> 0;

// to go to int from uint
export const untwos = (v: number) => v >> 0;

export const boolToInt = (x: boolean) => Number(x);

export const signExtend32 = (bits: number, value: number) => (value << (32 - bits)) >> (32 - bits);
