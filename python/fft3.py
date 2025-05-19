from numpy.fft import rfft, irfft
from numpy import multiply

def MUL(P1, P2):  #fft based real-valued polynomial multiplication
    L  = len(P1) + len(P2) #- 1
    F1 = rfft(P1, L)
    F2 = rfft(P2, L)
    return irfft(multiply(F1, F2))

#A = [1, -1, 2, 1]
#B = [-3, 2, -4, 2]

#A = [i for i in range(60)]
#B = [59 - i for i in range(60)]
#C = [round(a) for a in MUL(A, B)]
#print(C)
#print("Size: ", len(C))

A = [i+1 for i in range(1400)]
B = [1400 - i for i in range(1400)]

import datetime
start = datetime.datetime.now()
for i in range(10000):
    MUL(A, B)
elapsed = datetime.datetime.now() - start;
print(elapsed)
