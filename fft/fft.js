// Fast Fourier Transform

class Complex {
    re; im;

    constructor(real, imaginary) {
        this.re = real;
        this.im = imaginary;
    }

    toString() {
        return "(" + this.re + ", " + this.im + ")";
    }

    clone() {
        return new Complex(this.re, this.im);
    }

    add(c) {
        this.re += c.re;
        this.im += c.im;
        return this;
    }

    sub(c) {
        this.re -= c.re;
        this.im -= c.im;
        return this;
    }

    mul(c) {
        let r = this.re * c.re - this.im * c.im;
        let i = this.re * c.im + this.im * c.re;
        this.re = r;
        this.im = i;
        return this;
    }

    static add(a, b) {
        return a.clone().add(b);
    }

    static sub(a, b) {
        return a.clone().sub(b);
    }

    static mul(a, b) {
        return a.clone().mul(b);
    }

    static expi(theta) {
        return new Complex(Math.cos(theta), Math.sin(theta));
    }
}


function FFT(P, inverse) {
    const n = P.length
    if (n == 1) {
        return typeof P[0] === "object" ? P : [new Complex(P[0], 0)]
    }
    const sign = inverse ? -1 : 1
    const w = Complex.expi(sign*2*Math.PI/n)
    let Pe = new Array(n>>1);
    let Po = new Array(n>>1);
    for (let i = 0; i < n/2; i++) {
        Pe[i] = P[2*i];
        Po[i] = P[2*i+1];
    }
    const ye = FFT(Pe, inverse)
    const yo = FFT(Po, inverse)
    let y = new Array(n)
    let wk = new Complex(1, 0)
    for (let j = 0; j < (n>>1); j++) {
        y[j] = Complex.add(ye[j], Complex.mul(wk, yo[j]))
        y[j + (n>>1)] = Complex.sub(ye[j], Complex.mul(wk, yo[j]))
        wk.mul(w)
    }
    return y
}

function IFFT(P) {
    return FFT(P, true).map(x => x.re / P.length);
}

function bitCount(n) {
    let count = 0;
    while (n != 0){
        count++;
        n >>= 1;
    }
    return count;
}

function MUL(A, B) {
    let n = 1<<bitCount(A.length + B.length - 2)
    let a  = A.concat(new Array(n - A.length).fill(0))
    let b  = B.concat(new Array(n - B.length).fill(0))
    let X = FFT(a)
    let Y = FFT(b)
    let Z = new Array(n)
    for (let i = 0; i < n; i++)
        Z[i] = Complex.mul(X[i], Y[i])
    let C = IFFT(Z)
    while (n --> 0 && C[n] == 0)
        C.splice(-1, 1)
    return C.map(x => Math.round(x))
}

/*
let A = [1, -1, 2, 1]
let B = [-3, 2, -4, 2]
let C = [-3, 5, -12, 7, -8, 0, 2]
console.log(C)
console.log(MUL(A, B))
*/

let N = 140000
let A = new Array(N)
let B = new Array(N)
for (let i = 0; i < N; i++) {
    A[i] = i + 1
    B[i] = 1400 - i
}

//import datetime
//start = datetime.datetime.now()
for (let i = 0; i < 1; i++)
    MUL(A, B)
//elapsed = datetime.datetime.now() - start;
//print(elapsed)

/*
#C = MUL(A, B)
#print(C)
#print("Size: ", len(C))
*/
