export const toHexString = (n: number, l: number = 8) => n.toString(16).padStart(l, '0');
export const toBinString = (n: number, l: number = 32) => n.toString(2).padStart(l, '0');

// poor men's casting to uing in javascript
const twosTemp = new Uint32Array(1);
export const twos = (v: number) => {
    twosTemp[0] = v;
    return twosTemp[0];
}

export const twos2 = (v: number) => {
    if (v < 0) {
        return (~(-v) + 1) & 0xffffffff;
    } else {
        return v
    }
}


export const untwos = (v: number) => {
    if (v >= 0x80000000) {
        return ~~v;
    } else {
        return v
    }
}