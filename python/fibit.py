import math # using math.log for simplicity

# Returns the position of the most significant bit of n in O(1)
# well, it's in O of whatever-O-log-is, but it's computed only once anyway…
# Technically, this returns the biggest integer k such that k is a power of 2 and (n & k) != 0
# Returns 0 when n==0 (there is no significant bit in n)
def msbpos(n):
	if n == 0: return 0
	k = int(math.log(n, 2))
	return 1 << k

# Iterative fast doubling for Fibonacci
# invariant: we are on node f(k) and a=f(k), b=f(k+1)
def fib(n):	
	a, b = 0, 1                       # Base case
	p = msbpos(n)                     # p is just a 1 at the same location as the msb of n
	while p > 1:                      # check all bits of n left to right, except for the last bit
		if (n & p) != 0:              # the bit is a 1 so we take the right path; we need to shift (a, b)
			a, b = b, a+b             # a=f(k) from the previous loop but we want the right path, so a should be f(k+1) and b=f(k+2)
		a, b = a*(2*b - a), a*a + b*b # apply the formula to compute f(2k) and f(2k+1)
		p >>= 1                       # get ready to check the next bit
	return a if n % 2 == 0 else b     # a and b already contain the answer; a if n was even, b otherwise

def msbpos2(n):
	n |= n >> 1
	n |= n >> 2
	n |= n >> 4
	n |= n >> 8
	n |= n >> 16
	n |= n >> 32 # for 64 bit integers
	return (n + 1) >> 1

def fib2(n):
	a, b = 0, 1
	p = msbpos2(n) # or simply p = 1 << 31
	while p:
		a, b = a*(2*b - a), a*a + b*b
		if (n & p) != 0:
			a, b = b, a+b
		p >>= 1
	return a


#fib(100000000)

if True:
	# Print out the first n Fibonacci numbers
	def list_fib(n):
		for i in range(n):
			print(fib(i))

	list_fib(16)


