#!/usr/bin/env node
/**
 * Note: do not try with big numbers! 1 million is ok, 5 millions is wayyyy too much.
 * The recursive calls are killing it.
 *
 * How does it work?
 * First, transform n in base 1, basically 111... as many 1s as n (7 = 1111111)
 * The first regex part /^1?$/ matches either an empty string or 1, so this really
 * says 0 and 1 are not prime.
 * The second part is tricky. 11+? matches 1 followed by 1 or more 1s, but not greedily!
 * That means it will first try to match 11 and if the regex fails, it will try with 111,
 * and if that fails too, it will try with 1111, and so on.
 * Let's take n = 7 -> 1111111. The regex first tries the group 11, then tries to match
 * \1+$, which means 11 repeated 1 or more times, then end of string (important).
 * Since the group caught 11, only 5 1s remain, but the \1+ can only catch
 * 11, 1111, 111111, 11111111, that is, only the even numbers.
 * So starting with 11 failed, the regex now tries catching 111.
 * The recursive call will catch on 111 or 111111, so it can never catch our
 * remaining five ones. Let's try with a group of 1111. As you can see, this will
 * recusrively eliminate the multiples of 2, then 3, then 4, etc.
 * If the regex could never catch anything, then n is prime.
 *
 * The « x » obsure version: bf = x => !/^x?$|^(xx+?)\1+$/.test("x".repeat(x))
 */

const isprime = x => !/^1?$|^(11+?)\1+$/.test("1".repeat(x))
console.log(Array.from({length:100},(_,i)=>i).filter(isprime))

//const log = x=>console.log(x)
//Array.from({length:100},(_,i)=>i).filter(isprime).forEach(log)

//const log2 = (x,y)=>console.log(y,x)
//Array.from({length:100},(_,i)=>i).map(isprime).forEach(log2)
