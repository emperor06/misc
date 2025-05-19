# Some more permutation stuff (permutation cycles)
# by Drax


# Permutes the array ar given a list of cycle permutations
# That's the reverse operation of findcycles()
def cycleperm(ar, cycles):
	a = [0]*len(ar)                 # result array
	for c in cycles:                # loop on all cycles
		tmp = ar[c[0]]              # keep the first element for the last swap
		for i in range(1, len(c)):  # loop within the cycle
			a[c[i-1]] = ar[c[i]]    # that's what a cycle is, basically
		a[c[-1]] = tmp              # restore the first element
	return a

# Returns the position of the first non zero bit in b (from the right)
def firstnz(b):
	c = 0
	while (b & 1) == 0:
		c += 1
		b >>= 1
	return c

# Creates a list of all cycles in the given permutation a.
# Always starts with index 0.
# That's the reverse operation of cycleperm()
# Note: this version uses a bitfield for processed indices
def findcycles(a):
	cycles = []                   # the result: a list of cycles (tuples)
	b = (1 << len(a)) - 1         # bitfield of indices in decreasing order (all set to 1 at start)
	while b:                      # loop on cycles (if b is zero, then all elements have been processed)
		n = firstnz(b)            # take the first element that is not yet part of any cycle
		cur = [n]                 # threat the first case now or it will complicate the next loop breaking condition
		idx = a[n]                # add n and set the next index
		b ^= 1 << n               # oh, and don't forget to cross out n (this is where Python should have do-while loops)
		while idx != n:           # loop within the cycle until we are back to were we started
			cur.append(idx)       # add the element
			b ^= 1 << idx         # cross it out
			idx = a[idx]          # and pick up the next one
		cycles.append(tuple(cur)) # the cycle is complete, store it in the result list
	return cycles

# The following functions do the same using an array of indices (which stresses memory for nothing)

# Helper: returns the first index for which a[index] is not null
# returns None if no such index exist
def nextNZIdx(a):
	for i in range(len(a)):
		if a[i] != None:
			a[i] = None
			return i
	return None

# Creates a list of all cycles in the given permutation a.
# Always starts with index 0.
# That's the reverse operation of cycleperm()
# Note: this version uses a temporary array for processed indices
def findcycles2(a):
	b = [i for i in range(len(a))] # sacrificial array where used elements are crossed out
	cycles = []
	n = nextNZIdx(b)
	while n != None:       # loop on cycles
		cur = [n]
		idx = n
		while a[idx] != n: # loop within a given cycle
			cur.append(a[idx])
			b[idx] = None
			idx = a[idx]
		b[idx] = None
		cycles.append(tuple(cur))
		n = nextNZIdx(b)
	return cycles


a = [0, 1, 2, 3, 4, 5]
print(f'array  = {a}')

#p = [2, 4, 1, 0, 5, 3]
p = [0, 2, 4, 1, 3, 5]
print(f'perm   = {p}')

c = findcycles(p)
print(f'cycles = {c}')

P = cycleperm(a, c)
print(f'perm   = {P}')
