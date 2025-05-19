# Fast Fourier Transform
import cmath

##
# Input: if inverse==False, an array of coefficients of a polynomial [p0, p1, ..., p(n-1)] where p0 is for x^0.
# Input: if inverse==True, an array of points (y-value) defining a polynomial.
#
# Returns a set of n points on that polynomial (for inverse==False)
# or an "almost" set of coefficients of that polynomial (inverse==True)
# For IFFT (inverse FFT), the coefficients must be divided by the array length.
# Note: for an easy implementation, n is required to be a power of 2
def FFT(P, inverse = False):
    n = len(P)
    if n == 1: # recursion break
        return P
    sign = -1 if inverse else 1
    w = cmath.exp(sign*2j*cmath.pi/n)
    Pe, Po = P[::2], P[1::2] # Even and odd exponent coefficients
    ye, yo = FFT(Pe, inverse), FFT(Po, inverse) # recursion
    y = [0] * n
    wk = 1
    for j in range(n//2):
        y[   j    ] = ye[j] + wk * yo[j]
        y[j + n//2] = ye[j] - wk * yo[j]
        wk *= w
    return y

##
# Inverse FFT. Simply use FFT(inverse=True) then divide everyone by len.
def IFFT(P):
    return [round(z.real/len(P)) for z in FFT(P, True)]

##
# Fast polynomial multiplication (using FFT).
# First, ensure both arrays have a suitable power of 2 length that can generate enough points.
# Apply FFT on both A and B, multiply their y-value points, then transform back to a polynomial with IFFT.
def MUL(A, B):
    n = 1<<(len(A)+len(B)-2).bit_length()
    a = A + [0] * (n - len(A)) # padding
    b = B + [0] * (n - len(B)) # padding
    X, Y = FFT(a), FFT(b)
    Z = [X[i]*Y[i] for i in range(n)]
    C = IFFT(Z)
    while len(C) > 0 and C[-1] == 0: # remove trailing zeroes
        del C[-1]
    return C

##
# Quick note about n = 1<<(len(A)+len(B)-2).bit_length()
# We need N points to properly define a degree N-1 polynomial.
# Since polynomial coefs are zero-indexed (like arrays), for an array of length N,
# the last coef represents x^(N-1), so the degree is len(P)-1. When multiplying two polynomials,
# the degree of the result is the sum of the degree of each polynomials (multiplying powers is adding exponents)
# So if C=A*B, degree(A)=len(A)-1, degree(B)=len(B)-1, degree(C)=len(C)-1=degree(A)+degree(B)
# Hence len(C)=(len(A)-1) + (len(B)-1) + 1
# Now we need to find the closest power of 2 that is >= to len(C).
# The binary representation of len(C) uses m bits. So the next power of 2 is a one followed by m zeroes,
# that is 1<<len(C). The problem is, what if len(C) is already a power of 2? Then we'll get the next one,
# which is unnecessary. In short, we round up to the first power of 2 that is > than len(C), but we want >= instead.
# Because we're working on integers where a >= m is the same as a > m-1, we just have to shift by (m-1)
# So we want 1<<(len(C)-1) which is 1<<(len(A)+len(B)-2+1-1) and we get the correct formula.
##

A = [1, -1, 2, 1]
B = [-3, 2, -4, 2]
C = MUL(A, B)
##C = [-3, 5, -12, 7, -8, 0, 2]

#A = [i for i in range(60)]
#B = [59 - i for i in range(60)]
print("A = ", A)
print("B = ", B)
print("C = ", C)
print("Size: ", len(C))
