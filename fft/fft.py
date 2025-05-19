# Fast Fourier Transform
import cmath

##
# Given the coefficients of a polynomial [p0, p1, ..., p(n-1)]
# Returns a set of n points on that polynomial
# Note: for an easy implementation, n is required to be a power of 2
def FFT(P, inverse = False):
    n = len(P)
    if n == 1: # recursion break
        return P
    sign = -1 if inverse else 1
    w = cmath.exp(sign*2j*cmath.pi/n)
    Pe, Po = P[::2], P[1::2] # Even and odd exponent coefficients
    ye, yo = FFT(Pe, inverse), FFT(Po, inverse)# recursion
    y = [0] * n
    wk = 1
    for j in range(n//2):
        y[j] = ye[j] + wk * yo[j]
        y[j + n//2] = ye[j] - wk * yo[j]
        wk *= w
    return y

def IFFT(P):
    return [round(z.real/len(P)) for z in FFT(P, True)]

def MUL(A, B):
    n = 1<<(len(A)+len(B)-2).bit_length()
    a = A + [0] * (n - len(A))
    b = B + [0] * (n - len(B))
    X, Y = FFT(a), FFT(b)
    Z = [X[i]*Y[i] for i in range(n)]
    C = IFFT(Z)
    while len(C) > 0 and C[-1] == 0:
        del C[-1]
    return C


#A = [1, -1, 2, 1]
#B = [-3, 2, -4, 2]
##C = [-3, 5, -12, 7, -8, 0, 2]

A = [i+1 for i in range(140000)]
B = [1400 - i for i in range(140000)]

import datetime
start = datetime.datetime.now()
for i in range(1):
    MUL(A, B)
elapsed = datetime.datetime.now() - start;
print(elapsed)

#C = MUL(A, B)
#print(C)
#print("Size: ", len(C))
