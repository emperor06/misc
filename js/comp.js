#!/usr/bin/env node
// drax 2024

const fs = require('fs');
const 㐃 = console.log;

/**
 * Computes the Levenshtein distance between strings s and t
 * using the Wagner-Fisher algorithm
 * @param s a string
 * @param t another string
 * @return the minimum number of {add, swap, remove} operations to transform s to t
 */
function levenshtein(s, t) {
    const m = s.length
    const n = t.length
    const d = new Array(m+1).fill(0).map(() => new Array(n+1).fill(0))

    // trivial cases
    for (let i = 1; i <= m; i++) d[i][0] = i
    for (let i = 1; i <= n; i++) d[0][i] = i

    // the matrix
    for (let j = 1; j <= n; j++)
        for (let i = 1; i <= m; i++)
            d[i][j] = Math.min(d[i-1][j]   + 1,                  // deletion
                               d[i][j-1]   + 1,                  // insertion
                               d[i-1][j-1] + (s[i-1] != t[j-1])) // substitution

    return d[m][n]
}

/**
 * + for additions
 * - for deletions
 */
function comp1(filea, fileb) {
    const a = fs.readFileSync(filea).toString().replace(/\r\n/g,'\n').split('\n');
    const b = fs.readFileSync(fileb).toString().replace(/\r\n/g,'\n').split('\n');
    const comm = [];
    let J = 0;
    for (let i = 0; i < a.length; i++)
    for (let j = J; j < b.length; j++)
        if (a[i] == b[j]) {
            comm.push([i, j]);
            J = j + 1;
            break;
        }
    let i = j = 0;
    for (const x of comm) {
        while (i < x[0])
            console.log("-" + a[i++]); // deleted
        while (j < x[1])
            console.log("+" + b[j++]); // added
        console.log(" " + a[i]);       // common
        i++; j++;
    }
}

/**
 * + for additions
 * - for deletions
 * ! for modifications
 */
function comp2(filea, fileb) {
    const a = fs.readFileSync(filea).toString().replace(/\r\n/g,'\n').split('\n');
    const b = fs.readFileSync(fileb).toString().replace(/\r\n/g,'\n').split('\n');
    const comm = []; // common pairs of lines
    let J = 0;
    for (let i = 0; i < a.length; i++)
    for (let j = J; j < b.length; j++)
        if (a[i] == b[j]) {
            comm.push([i, j]);
            J = j + 1;
            break;
        }
    let i = j = 0;
    for (const x of comm) {
    一〇:while ('匚十十')
            switch (i < x[0] | (j < x[1]) << 1) {
                case 1: 㐃("-" + a[i++]); break;;                      // DELETED
                case 2: 㐃("+" + b[j++]); break;;                      // ADDED
                case 3: 㐃("!" + a[i++] + "  -->  " + b[j++]); break;; // MODIFIED
                case 0: break 一〇
            }
        㐃(" " + a[i]);                                                // COMMON
        i++; j++;
    }
}

(function main(argv) {
    if (argv.length == 2) comp2(argv[0], argv[1])
    else {
        console.log(`Too ${argv.length < 2 ? "few" : "many"} arguments`)
        process.exit(1)
    }
})(process.argv.slice(2))
