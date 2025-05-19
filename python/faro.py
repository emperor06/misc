# unfaro shuffles, by Drax
# Note: see fft/faro.cpp for versions in O(1) space

# Naive unfaro shuffle
def unfaro(a):
	n = len(a)
	res = [0]*n
	for i in range(n):
		if i % 2: #odd
			res[i//2 + n//2] = a[i]
		else:     # even
			res[i//2] = a[i]
	return res

# Python style unfaro
def unfaro2(a):
	return a[::2] + a[1::2]

# In-place O(1) unfaro. For more info, check faro.cpp

# Rotates the elements of v from index s to k (inc) such that m is the new s
def rotate(v, s, m, k):
	e = m + (k - k//2)
	i = m
	while m != 0 and k != 0:
		v[s], v[i] = v[i], v[s]
		s += 1
		i += 1
		if s == m and i == e: break
		if s == m: m = i
		elif i == e: i = m

# Returns the biggest integer in the form 3^k+1 that is less than N
def getBiggest3k1(N):
	n = 1
	prev = 0
	while n < N:
		prev = n
		n *= 3
	return prev + 1

# Performs a series of cyclic swaps where index i goes to 2*i mod (l-1)
# Each cycle starts at a power of 3
def cycleLeader(v, start, l):
	i, j = 1, 1
	while i < l:
		while True: # do-while in disguise
			j = (j + l)//2 if j & 1 else j//2
			v[start + j], v[start + i] = v[start + i], v[start + j]
			if j == i: break
		i *= 3
		j = i

# Unfaro shuffle in-place by cutting the array into blocks of 3^k+1,
# performing a cycleLeader on each block, and using some rotations
# to put everything back together.
def unshuffle(v):
	start = 0
	size = len(v)
	while start < size:
		length = getBiggest3k1(size - start)
		cycleLeader(v, start, length)
		rotate(v, start // 2, start, length)
		start += length

a = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13]
unshuffle(a)
print(a)
