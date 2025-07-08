export const getIndex = (x, y, width) => (y * width + x) * 4;

export const neighborOffsets = [
    [-1, -1], [0, -1], [1, -1],
    [1, 0], [1, 1], [0, 1],
    [-1, 1], [-1, 0],
];
