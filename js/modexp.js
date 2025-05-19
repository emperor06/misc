console.log("Modular exponentiation");

// Returns a^b mod n
function modexp(a, b, n) {
    let acc = 1;
    a = a % n;

    while (b) {
        if (b & 1) {
            acc = (acc * a) % n;
        }
        b >>= 1;
        a = (a * a) % n;
    }
    return acc;
}

let res = modexp(427, 1073, 1023);
console.log(res);
