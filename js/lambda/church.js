
const print = console.log

I  = a => a                           // I  Identify    λa.a (or Idiot, in bird language)
K  = a => b => a                      // K  Kestrel     λab.a (also called first or const in Haskell)
Ki = a => b => b                      // Ki Kite        λab.b (Ki = KI = CK) (≡ Ki = a => b => K(I)(a)(b)) (also called second or const id in Haskell)
M  = f => f(f)                        // M  Mockingbird λf.ff
C  = f => a => b => f(b)(a)           // C  Cardinal    λfab.fba (reverse or flip in Haskell) (CK = Ki, the cardinal of the kestrel is just the kite)
B  = f => g => a => f(g(a))           // B  Bluebird    λfga.f(ga) (composition) ( . )
                                      // Th Thrush      λaf.fa = CI (hold an argument) (flip id)
                                      // V  Vireo       λabf.fab = BCTh = BC(CI) (hold a pair of args) (flip . flip id)
                                      // B  Blackbird   λfgab.f(gab) = BBB (1°←2° composition) ( (.) . (.) )
                                      // S  Starling    λabc.ac(bc) (with S and K we can construct everything, just like with BCKI)

T = a => b => a                       // True  λab.a   (it's the Kestrel)
F = a => b => b                       // False λab.b   (it's the Kite)
not = p => p(F)(T)                    // Not   λp.pFT  (The bool p selects its own opposite) (since CK=Ki and C(Ki)=K, not is C : not = p => C(p)(T)(F) )
and = p => q => p(q)(p)               // And   λpq.pqp (if p then it depends on q, so return q. If not p, then return false, or p since p is false)
or  = p => q => p(p)(q)               // Or    λpq.ppq (since (λpq.ppq)xy = xxy, we get λpq.ppq = M*, the Mockingbird once removed)
eq  = p => q => p(q)(not(q))          // Equal λpq.p(qTF)(qFT) = λpq.pq(not q)

print( I(1) )
print( I(2) )
print( M(I) )
print( M )
print( C(K)(I)(M) ) // Calls the cardinal on the kestrel with I and M as parameters, which (after reversing the arguments), gives M

print("Truth table of not")
NOT = p => C(p)(T)(F)
print( NOT(T) )
print( NOT(F) )

print ( eq(F)(F) )
print ( eq(F)(T) )
print ( eq(T)(F) )
print ( eq(T)(T) )


function f1(a) {
    var c = 8
    return (function f2(b) {
        return a + b + c
    })
}

print(f1(2)(3))
