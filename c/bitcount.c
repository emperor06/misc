#include <stdio.h>
#include <stdlib.h>

/**
 * Return the number of 1s in the binary representation of x.
 * Or, to put it differently, counts the number of set bits.
 */
static inline ulong bit_count(ulong x)
{
  x -= (x>>1) & 0x5555555555555555UL;
  x = ((x>>2) & 0x3333333333333333UL) + (x & 0x3333333333333333UL);
  x = ((x>>4) + x) & 0x0f0f0f0f0f0f0f0fUL;
  x *= 0x0101010101010101UL;
  return x>>56;
}

int main(int argc, char** argv)
{
  if (argc <= 1)
  {
    printf("Too few arguments, give me a number!\n");
    return 1;
  }
  ulong N = strtoull(argv[1], NULL, 10);
  printf("%llu has %d bits set\n", N, bit_count(N));
  return 0;
}
