# Returns an array of ways to climb n steps (using only 1 or 2 steps at a time)
# Each way of climbing is an array listing the actual steps ({1, 2})
# Invariant: climb(n) is an array of arrays of the possible ways to climb
# Stop: when there is no step, there is only 1 way to climb: do nothing (empty array)
# Recursion: climb(n) = climb(n-1) + climb(n-2) (Fibonacci)
# Performance: extremely bad. Same as recursive Fibonacci which computes the same thing over and over again.
def climb(n):
	if n <= 0:
		return [[]]
	s = climb(n - 1)
	for i in range(len(s)):
		s[i].append(1)
	if n > 1:
		s2 = climb(n - 2)
		for i in range(len(s2)):
			s2[i].append(2)
		s += s2
	return s

c = climb(8)
print(len(c))
for i in range(len(c)):
	print(c[i])
