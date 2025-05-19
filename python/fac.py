import timeit
teset_range = 200

'''
Factorial by prime factorization

6! = 2 * 3 * 4 * 5 * 6
   = 2 * 3 * (2*2) * 5 * (2*3)
   = 2^4 * 3^2 * 5
This uses less multiplications, which have been replaced with powers.
And powers can be computed faster with the "power by squaring" algorithm.
It leads to a slight improvement in computing factorials for very big numbers.

The following code creates an Erotic Sieve to keep track of prime numbers.
Loop on all integers smaller than n, just like the regular factorial, but
discard any composite numbers. For prime numbers p, we need to check how many
copies of p there are in n!, which is done by doing n//p, then n//p^2, then
n//p^3, and so on. That's the "while t" loop.
For example, n=13, then when t is 2, we need to find how many 2s are inside 13!
First, let's compute 13//2 = 6. This tells use there are exactly 6 numbers
smaller than 13 that are multiples of 2. Then do the same with 2^2.
13//4 = 3, so there are 3 multiple of 4 (which are 4, 8, and 12).
Then 2^3 = 8. 13//8 = 1, so only one number less than 13 is a multiple of 8.
In summary, amongs n <= 13, 6 are multiples of 2, 3 of which are multiples of 4,
with only one of them being also a multiple of 8. 6+3+1=10. This means there are
10 "2s" in 13!
Of course, those 2s are contained in even numbers: 2, 4, 6, 8, 10, 12.
4 actually contains two of them (2*2), same for 12 (2*2*3), and 8 contains 3
(2*2*2) whith the rest only having a single 2 in them (2*1, 2*3, 2*5).
'''

def facprime(number):
    prime = [True]*(number + 1)
    result = 1
    for i in range (2, number+1):
        if prime[i]:
            j = 2*i
            while j <= number:
                prime[j] = False
                j += i
            sum = 0
            t = i
            while t <= number:
                sum += number//t
                t *= i
            result *= i**sum
    return result


def ntz(n):
	count = 0
	while (n & 1) == 0:
		n >>= 1
		count +=1
	return count

def ctz(x):
	bits = 0
	if x:
		while (x & 0xFFFF) == 0:
			bits += 16
			x >>= 16
		if (x & 0xFF) == 0:
			bits += 8
			x >>=  8
		if (x & 0xF) == 0:
			bits += 4
			x >>=  4
		if (x & 0x3) == 0:
			bits += 2
			x >>=  2
		bits += (x & 1) ^ 1
	return bits

def naive(N):
	res = 1
	for n in range(2, N+1):
		res *= n
	return res

# note: this whole business is MUCH slower than the naive approach
# ctz is horribly slow
# ntz is better
# inlining ntz is much better
def fac(N):
	res = 1
	offset = 0
	for n in range(2, N+1):
		while (n & 1) == 0:
			n >>= 1
			offset += 1
		res *= n
		#tmp = ntz(n)
		#offset += tmp
		#res *= n >> tmp
	return res << offset

def teset_naive():
	naive(teset_range)

def teset_fac():
	fac(teset_range)

#print(timeit.timeit(teset_naive))
print(timeit.timeit(teset_fac))
#print(timeit.timeit(teset_naive))
#print(timeit.timeit(teset_fac))

for i in range(4, 1000, 4):
	print(ntz(i), end=" ")
	#print("{:06b}".format(i))
print()
