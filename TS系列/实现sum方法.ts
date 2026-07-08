/**
 * @function sleep
 * @param time {number}
 * @returns {Promise<void>}
 */
function sleep(time: number):Promise<void> {
    return new Promise(resolve => {
        setTimeout(() => resolve(undefined), time);
    })
}

/**
 * @function asyncAdd
 * @param a {number}
 * @param b {number}
 * @returns {Promise<number>}
 */
async function asyncAdd(a: number, b: number):Promise<number> {
    await sleep(1000);
    return a + b;
}

/**
 * @function sum
 * @param arr {Array<number>}
 * @returns {Promise<number>}
 */
async function sum(arr: number[]): Promise<number> {
    var s: number = arr[0];
    for (var i = 1; i < arr.length; i++) {
        s = await asyncAdd(s, arr[i]);
    }

    return s;
}

console.time('a');
sum([1, 2, 3, 4, 5, 6]).then((v) => {
    console.log(v);
    console.timeEnd('a');
});