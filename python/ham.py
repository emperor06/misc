import math
import numpy as np
import random
import operator as op
from functools import reduce

def tomat(ar):
	l = len(ar)
	tmp = int(math.log(l, 2))
	n = (tmp + 1) // 2 if tmp & 1 else tmp // 2
	n = 2 ** n
	for i in range(l):
		eol = "\n" if i % n == n - 1 else " "
		print(ar[i], end=eol)

def compute(bits):
	return reduce(op.xor, [i for i, bit in enumerate(bits) if bit])

#def getParity(n):
#	count = 0
#	while n:
#		n &= n - 1
#		count += 1
#	return count & 1

def fix0(bits):
	parity = 0
	bits[0] = 0
	for i in range(len(bits)):
		if bits[i]:
			parity = (~parity) & 1
	bits[0] = parity

def fix(bits):
	f = compute(bits)
	b = 1
	while f:
		if f & 1 == 1:
			bits[b] = not bits[b]
		b = b * 2
		f = f >> 1
	fix0(bits)

N = 12

print("Getting %d random bits" % N)
bits = np.random.randint(0, 2, N)
tomat(bits)

print()
print("Xoring all indices that have a 1: %d" % compute(bits))

print()
print("Fixing parity keys")
fix(bits)
tomat(bits)

print()
print("Verifying that xor is now zero: %d" % compute(bits))

print()
r = random.randint(0, N - 1)
print("Simulating an error at bit #%d" % r)
bits[r] = not bits[r]
tomat(bits)

print()
print("Finding the index of the error: %d" % compute(bits))
