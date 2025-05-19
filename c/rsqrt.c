/**
 * Fast inverse square root from Quake III.
 * Note: the pointer trick (type puns) is not standard
 * and should be done using memcpy (unions are dangerous here too)
 */

#include <stdint.h> //uint32_t
#include <stdio.h>  //printf()
#include <stdlib.h> //atof()

/**
 * Fast inverse square root.
 * returns a good approx of 1/sqrt(number)
 */
float Q_rsqrt( float number )
{
  uint32_t i;
  float x2, y;

  x2 = number * 0.5f;
  y  = number;
  i  = * ( uint32_t * ) &y;
  i  = 0x5f3759df - (i >> 1);
  y  = * ( float * ) &i;
  y  = y * ( 1.5f - (x2 * y * y) ); // repeat for better accuracy
  y  = y * ( 1.5f - (x2 * y * y) ); // remove for faster computation

  return y;
}

int main(int argc, char** argv)
{
  if (argc <= 1)
  {
    printf("Quick (Quake) inverse square root.\n");
    printf("Returns 1/sqrt(n)\n\n");
    printf("Usage: %s <float>\n", argv[0]);
    return -1;
  }

  float f = atof(argv[1]);
  float r = Q_rsqrt(f);
  printf("1/sqrt(%f) = %f\n", f, r);
  return 0;
}
