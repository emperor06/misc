/**
 * Javascript is a strict language. It does not understand lazy evaluation.
 * Because of this, the use of a Y-combinator is problematic and leads to infinite loop.
 * Instead, we can use a Z'strict' fixed-point combinator.
 */

const Y = g => (x => g(x(x)))(x => g(x(x)))                 // Y = λg.(λx.g(x x))(λx.g(x x))
const Z = g => (x => g(v => x(x)(v)))(x => g(v => x(x)(v))) // Z = λg.(λx.g(λv.xxv))(λx.g(λv.xxv))
const F = f => n => n == 0 ? 1 : n * f(n - 1)               // F = the factorial function

console.log( Z(F)(6) )

// Or directly
console.log( (g => (x => g(v => x(x)(v)))(x => g(v => x(x)(v))))(f => n => n==0 ? 1 : n*f(n-1))(6) )


/**
 * Some fun with Church's numbers in Javascript.
 * Here, isZERO will lead to an infinite loop because Javascript is strict.
 * There are 2 workaround: either redefine TRUE and FALSE (didn't work) or wrap isZERO with an IF
 */
FALSE  = a => b => b
TRUE   = a => b => a
ZERO   = f => z => z
ONE    = f => z => f(z)
SIX    = f => z => f(f(f(f(f(f(z))))))
isZERO = n => n(x => FALSE)(TRUE)
SUCC   = n => f => z => f(n(f)(z))
MULT   = n => m => f => z => n(m(f))(z)
PAIR   = a => b => z => z(a)(b)
FIRST  = p => p(a => b => a)
SECOND = p => p(a => b => b)
ZZ     = PAIR(ZERO)(ZERO)
SS     = p => PAIR(SECOND(p))(SUCC(SECOND(p)))
PRED   = n => FIRST(n(SS)(ZZ))
IF     = c => a => b => c(a)(b)()
//Z      = g => (x => g(v => x(x)(v)))(x => g(v => x(x)(v)))
FGen   = f => n =>
  IF(isZERO(n))
    (()=>ONE)
    (()=>MULT(n)(f(PRED(n))))

console.log( Z(FGen)(SIX)(x=>x+1)(0) )

// We can also define all integers with SUCC and MULT
TWO   = SUCC(ONE)
THREE = SUCC(TWO)
SEX   = MULT(TWO)(THREE)
console.log( Z(FGen)(SEX)(x=>x+1)(0) )

console.log( THREE(x=>x+1)(0) )

IF (FALSE)(()=>console.log("hello"))(()=>console.log("world"))
