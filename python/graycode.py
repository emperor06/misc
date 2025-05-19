def gengray(n):
    if n == 1:
        return ['0', '1']
    left = gengray(n-1)
    right = left[::-1]
    for idx, val in enumerate(left):
        left[idx] = '0' + val
    for idx, val in enumerate(right):
        right[idx] = '1' + val
    return left + right

def BinaryToGray(num):
    return num ^ (num >> 1)

def GrayToBinary(num):
    mask = num;
    while (mask):
        mask >>= 1
        num ^= mask
    return num

N = 4
#gray = gengray(N)
gray = []
for i in range(0, 2**N):
    gray.append(BinaryToGray(i))

L = gray[:len(gray)//2]
R = gray[len(gray)//2:]
for idx, val in enumerate(L):
    #print(L[idx], "\t", R[idx])
    print(f'{L[idx]:>0{N}b}\t{R[idx]:>0{N}b}')
