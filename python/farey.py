import sys
from io import StringIO

def farey_sequence(n: int) -> None:
    (a, b, c, d) = (0, 1, 1, n)
    str = StringIO()
    str.write(f'{a}/{b}')
    while (c <= n):
        k = (n + b) // d
        (a, b, c, d) = (c, d, k * c - a, k * d - b)
        str.write(f', {a}/{b}')
    print(str.getvalue())

arg = 5
if len(sys.argv) > 1:
    arg = int(sys.argv[1])
farey_sequence(arg)
