# Extended Euclidean Algorithm
# Note: gcdExtended2 (iterative) is the fastest here


# ref impl from Wikipédé
def extended_gcd(a, b):
    (r0, r1) = (a, b)
    (s0, s1) = (1, 0)
    (t0, t1) = (0, 1)

    while r1 != 0:
        q = r0 // r1
        (r0, r1) = (r1, r0 - q * r1)
        (s0, s1) = (s1, s0 - q * s1)
        (t0, t1) = (t1, t0 - q * t1)

    print("a = %d, b = %d" % (a, b))
    print("gcd(%d, %d) = %d" % (a, b, r0))
    print("Bézout coefficients (s, t) = (%d, %d)" % (s0, t0))
    print("Bézout identity: (%d)(%d) + (%d)(%d) = %d" % (a, s0, b, t0, r0))
    print("|a/gcd| = |%d/%d| = |%d|, |b/gcd| = |%d/%d| = |%d|" % (a, r0, t1, b, r0, s1))
    inv = None
    if r0 == 1:
        inv = s0 if s0 >= 0 else s0 + b
        print("Modular inverse: (%d)(%d) = 1 mod %d" % (a, inv, b))
    else:
        print("%d is not inversible modulo %d" % (a, b))

# Same as Euclid but the coefficient of a alone is computed
def modinv(a, n):
    (t, newt) = (0, 1)
    (r, newr) = (n, a)

    while newr != 0:
        q = r // newr
        (t, newt) = (newt, t - q * newt)
        (r, newr) = (newr, r - q * newr)

    if r > 1:
        return None # a is not invertible
    if t < 0:
        t = t + n

    return t



# Recursive algorithm
# Given a and b, returns gcd, x, and y such that
# a*x + b*y = gcd
def gcdExtended1(a, b):
    # Stops recursion
    if a == 0 :
        return b, 0, 1

    gcd, x1, y1 = gcdExtended1(b%a, a)
    x = y1 - (b//a) * x1
    y = x1

    return gcd, x, y


# Iterative algorithm
def gcdExtended2(a, b):
    (r0, r1) = (a, b)
    (s0, s1) = (1, 0)
    (t0, t1) = (0, 1)

    while r1 != 0:
        q = r0 // r1
        (r0, r1) = (r1, r0 - q * r1)
        (s0, s1) = (s1, s0 - q * s1)
        (t0, t1) = (t1, t0 - q * t1)

    # Note: t1 = a/gcd and s1 = b/gcd (with sign error, so take abs first)
    return r0, s0, t0


# Returns the modular inverse of 'a' modulo 'n', 'None' if 'a' is not inversible
# Technically, returns b such that a*b = 1 mod n
def modinv1(a, n):
    gcd, x, y = gcdExtended1(a, n)
    if gcd != 1:
        return None
    return x if x >= 0 else x + n

# Same as modinv1 but uses the iterative version
def modinv2(a, n):
    gcd, x, y = gcdExtended2(a, n)
    if gcd != 1:
        return None
    return x if x >= 0 else x + n


a, b = 1481, 4020
g, x, y = gcdExtended1(a, b)
print("%d(%d) + %d(%d) = gcd(%d, %d) = %d" % (a, x, b, y, a, b, g))
print("modinv1(%d, %d) = %s" % (a, b, modinv1(a, b)))

g, x, y = gcdExtended2(a, b)
print("%d(%d) + %d(%d) = gcd(%d, %d) = %d" % (a, x, b, y, a, b, g))
print("modinv1(%d, %d) = %s" % (a, b, modinv2(a, b)))


extended_gcd(a, b)
mi = modinv(a, b)
if mi is not None:
    print("Inverse of %d mod %d is %d" % (a, b, mi))
else:
    print("%d has no inverse modulo %d" % (a, b))
