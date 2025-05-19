#!/usr/bin/env node

// © drax 2024
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

(function main(argv) {
    let x = "abcdef"
    let y = "acxef"
    if (argv.length >= 2) {
        x = argv[0]
        y = argv[1]
    }
    console.log( levenshtein(x, y) )
})(process.argv.slice(2))
