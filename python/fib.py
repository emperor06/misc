from math import sqrt,log
from decimal import *

# Naive O(2^n) recursive implementation
def fib1(n):
	return fib1(n-1) + fib1(n-2) if n > 1 else n

# Iterative version in O(n)
def fib2(n):
	if n <= 1: return n
	a, b = 0, 1
	n -= 1
	while n:
		a, b = b, a + b
		n -= 1
	return b

# Matrix version
# M = (1 1) = (F2 F1)
#     (1 0)   (F1 F0)
# Note that M^n = (Fn+1 Fn  )
#                 (Fn   Fn-1)
# So computing M^(n-1) gives Fn (first element of the matrix)
def fib3(n):
	if n <= 1: return n
	M = (1, 1, 1, 0) #m00, m01, m10, m11
	X = M
	n -= 2 # skip the first 2 trivial cases
	while n:
		X = matmul(X, M)
		n -= 1
	return X[0]

# Same as fib3 but optimized matrix power.
# Here we use exponentiation by squaring, which is a fancy way of
# grouping the products to avoid useless computation. This grouping is
# done with the binary representation of the exponent.
def fib4(n):
	if n <= 1: return n
	return matpow((1, 1, 1, 0), n-1)[0]

# return a*b, product of 2 matrices
def matmul(a, b):
	return (
		a[0] * b[0] + a[1] * b[2],
		a[0] * b[1] + a[1] * b[3],
		a[2] * b[0] + a[3] * b[2],
		a[2] * b[1] + a[3] * b[3]
	)

# return M^n, matrice exponentiation
def matpow(M, n):
	X = (1, 0, 0, 1) # identity
	while n:
		if n & 1 == 1:
			X = matmul(X, M)
		M = matmul(M, M)
		n >>= 1
	return X

# Similar to fib4 but this time, we compute X^n in the polynomial
# ring Z[X] / (X^2 - X - 1) using exponentiation by squaring.
def mul2(a, b):
	return a[0]*b[1]+a[1]*b[0]+a[0]*b[0], a[0]*b[0]+a[1]*b[1]

def fib5(n):
	x, r = (1, 0), (0, 1)
	while n:
		if n & 1:
			r = mul2(r, x)
		x = mul2(x, x)
		n >>= 1
	return r[0]

# A bit of magic, unfortunately quite slow on Python.
def fib6(n):
	return pow(2 << n, n + 1, (4 << 2*n) - (2 << n) - 1) % (2 << n)

# Same as fib6 but with conventional operations (inefficient because of large intermediate results)
def fib7(n):
	# The next 2 lines fix a bug (offset)
	if n <= 1: return n
	n -= 1
	return (4 << n*(3+n)) // ((4 << 2*n) - (2 << n) - 1) & ((2 << n) - 1)

# Getting to another level, here is the fast doubling algorithm.
# Starting from the matrix exponentiation version, we reach these formulas:
# If we know F(k) and F(k+1), we get:
# If n is even, F(n) = F(2k)   = F(k) * [2*F(k+1) - F(k)]
# If n is odd,  F(n) = F(2k+1) = F(k+1)^2 + F(k)^2
def fib8(n):
	return _fib8(n-1)[1] if n > 0 else n

def _fib8(n):
	if n == 0: return (0, 1)
	a, b = _fib8(n >> 1)
	c = a * ((b << 1) - a)
	d = a * a + b * b
	return (c, d) if n & 1 == 0 else (d, c+d)

# Same as fib8 but using Karatsuba multiplication
_CUTOFF = 2048 # must be >= 64 otherwise we get an infinite loop

# Note: slower than normal multiplication on Python because it already uses this internally
def karatsuba(x, y):
	if x.bit_length() <= _CUTOFF or y.bit_length() <= _CUTOFF:  # Base case
		return x * y
	else:
		n = max(x.bit_length(), y.bit_length())
		half = (n + 32) // 64 * 32
		mask = (1 << half) - 1
		xlow = x & mask
		ylow = y & mask
		xhigh = x >> half
		yhigh = y >> half
		
		a = karatsuba(xhigh, yhigh)
		b = karatsuba(xlow + xhigh, ylow + yhigh)
		c = karatsuba(xlow, ylow)
		d = b - a - c
		return (((a << half) + d) << half) + c

def fib9(n):
	return _fib9(n-1)[1] if n > 0 else n

def _fib9(n):
	if n == 0: return (0, 1)
	a, b = _fib8(n >> 1)
	c = karatsuba(a, ((b << 1) - a))
	d = karatsuba(a, a) + karatsuba(b, b)
	return (c, d) if n & 1 == 0 else (d, c+d)


# As a matter of fact, Fn can be computed directly in its closed form
getcontext().Emax = 1000000000
phi = Decimal((1 + sqrt(5)) / 2)
s5 = Decimal(sqrt(5))

def fib10(n):
	return int((pow(phi, n) - pow(-phi, -n)) / s5)

# Returns the position of the most significant bit of n in O(1)
# well, it's in O of whatever-O-log-is, but it's computed only once anyway…
# Technically, this returns the biggest integer k such that k is a power of 2 and (n & k) != 0
# Returns 0 when n==0 (there is no significant bit in n)
def msbpos(n):
	if n == 0: return 0
	k = int(log(n, 2))
	return 1 << k

def msbpos2(n):
	n |= n >> 1
	n |= n >> 2
	n |= n >> 4
	n |= n >> 8
	n |= n >> 16
	n |= n >> 32 # for 64 bit integers
	return (n + 1) >> 1

# Iterative fast doubling for Fibonacci by Drax
# invariant: we are on node f(k) and a=f(k), b=f(k+1)
def fib11(n):	
	a, b = 0, 1                       # Base case
	p = msbpos(n)                     # p is just a 1 at the same location as the msb of n
	while p > 1:                      # check all bits of n left to right, except for the last bit
		if (n & p) != 0:              # the bit is a 1 so we take the right path; we need to shift (a, b)
			a, b = b, a+b             # a=f(k) from the previous loop but we want the right path, so a should be f(k+1) and b=f(k+2)
		a, b = a*(2*b - a), a*a + b*b # apply the formula to compute f(2k) and f(2k+1)
		p >>= 1                       # get ready to check the next bit
	return a if n % 2 == 0 else b     # a and b already contain the answer; a if n was even, b otherwise

# Cleaner version of fib11 with a loop on all bits.
# Also, the algorithm is easier to explain:
# if the bit is 0 (even), we take left branch and compute (Fk, Fk+1)
# otherwise, we go right and compute (Fk+1, Fk+2)
# Alternative, when bit is odd, compute directly a, b = a*a + b*b, 2*a*b + b*b
# a, b = a*(2*b - a), a*a + b*b
# if (n & p) != 0:
# 	a, b = b, a+b	
def fib12(n):
	a, b = 0, 1
	p = msbpos2(n)
	while p:
		a2, b2 = a*a, b*b
		ab = (a*b) << 1
		if (n & p) == 0:
			a = ab - a2
			b = a2 + b2
		else:
			a = a2 + b2
			b = ab + b2
		p >>= 1
	return a

################### Test on small values to ensure the algorithms are correct

def teset(fct):
	res = [0] * 16
	for i in range(16):
		res[i] = fct(i)
	print("%s:\t%s" % (fct.__name__, res))


def main():

	teset(fib1) # Can go up to n=40 with struggles. That's the worst algorithm
	teset(fib2) # Very good for small values, low memory footprint, simple, linear
	teset(fib3) # Naive matrix exponentiation, linear but much slower than fib2
	teset(fib4) # Good matrix exponentiation, log(n) algorithm
	teset(fib5) # Optimized fib4
	teset(fib6) # Hard on python, struggles a lot
	teset(fib7) # Extremely hard on resources and inefficient
	teset(fib8) # The champion
	teset(fib9) # fib8 + karatsuba multiplication, useless on Python
	teset(fib10)# direct computation
	teset(fib11)# iterative fast doubling
	teset(fib12)# cleaner fib11

	print()


	################### Benchmark on big value
	# Current champion is fib8 (Python already optimizes multiplication on big integers so fib9 isn't worth it)
	# fib10 is O(1), so basically it's no competition. But it requires computing phi to a huge number of decimals so it's impractical
	# New champion! fib11

	N = 10000000
	print("Computing fib(%d)" % N)
	fib12(N)
	print("done")

'''
About the maths here.

M = |F2 F1| = |1 1|
    |F1 F0|   |1 0|

A quick induction proves that
M^n = |F(n+1)  F(n) |
      |F(n)   F(n-1)|

For fast doubling, consider this system of equations:
F(n+1) = F(n) + F(n-1)
F(n)   = F(n)

It can be written as:
|F(n+1)| = |1 1| * | F(n) |
| F(n) |   |1 0|   |F(n-1)|

         = |1 1|^2 * |F(n-1)|
           |1 0|     |F(n-2)|
         ...
         = |1 1|^n * |F1|
           |1 0|     |F0|

Now let's just plug 2k into the formula (replace n with 2k)
|F(2k+1)| = |1 1|^2k * |F1|
| F(2k) |   |1 0|      |F0|

          = |1 1|^k * |1 1|^k * |F1|
            |1 0|     |1 0|     |F0|

          = |F(k+1)  F(k) | * |F(k+1)  F(k) | * |F1|
            | F(k)  F(k-1)|   | F(k)  F(k-1)| * |F0|

          = |    F(k+1)² + F(k)²      |
            |F(k)*F(k+1) + F(k)*F(k-1)|

Now notice that F(k-1) = F(k+1) - F(k), we get the 2 following equations:
F(2k+1) = F(k+1)^2 + F(k)^2
 F(2k)  = 2*F(k+1)F(k) - F(k)^2
 
'''

if __name__=="__main__":
    main()
