/**
 * Multiply two polynomials using Fast Fourier Transform.
 *
 * Note: a polynomial P(x) = p0 + p1*x + p2*x^2 +...+ p(n-1)*x^(n-1)
 * can be represented as an array of its coefficients [p0, p1, ..., p(n-1)]
 * Indexing this array from p0 to p(n-1) is a good idea so that the k-th array
 * element is the coefficient of the k-th power of x for every polynomial.
 * As a result, a polynomial of degree (n-1) is represented by an array of size n.
 * That explains how n is calculated in MUL().
 *
 * Drax
 */

#include <stdio.h>
#include <stdlib.h>
#include <stdbool.h>
#include <string.h>
#include <math.h>
#include <complex.h>

/* THE circle constant */
#define TAU 6.283185307179586476925286766559

typedef double complex data; // polynomial coefs or values
typedef struct               // because C is pronounced "sucks"
{
  size_t length;
  data*  array;
} Array;

/**
 * Returns the bit length of n.
 * For example, 11 = (1011)b uses 4 bits.
 */
size_t bit_length(size_t n)
{
  size_t count = 0;
  for (; n != 0; ++count, n >>= 1);
  return count;
}

/**
 * Allocates an Array of length "size". Remember to free it!
 */
Array make_array(size_t size)
{
  data* a = (data*) malloc(size * sizeof(data));
  return (Array) {.length = size, .array = a};
}

/**
 * Frees the array.
 */
void free_array(Array a)
{
  free(a.array);
}

/**
 * Copies the data from one array to another.
 * Dest must have been initialized with a size of at least src.length
 * If dest is bigger than src, it is padded with zeroes.
 */
void copy_array(Array src, Array dest)
{
  for (int i = 0; i < dest.length; i++)
    dest.array[i] = i < src.length ? src.array[i] : 0;
}

/**
 * Converts a complex to an int (for display).
 */
int to_int(data d)
{
  return (int)(round(creal(d)));
}

/**
 * Prints a representation of the array using integers.
 */
void display_array(Array a)
{
  if (a.length == 0) printf("[]\n");
  else
  {
    printf("[");
    for (size_t i = 0; i < a.length - 1; i++)
      printf("%d, ", to_int(a.array[i]));
    printf("%d]\n", to_int(a.array[a.length-1]));
  }
}

/**
 * Fast Fourier Transform
 *
 * Given an array containing the coefficients of a polynomial P of degree n-1,
 * computes the n values P(X_k) evaluated at the roots of unity ;
 * X_k = w_n^k, for 0<=k<n with w_n being the n-th root of unity.
 * If inverse is true, FFT is computed using w_(-k) instead (useful for IFFT()).
 *
 * Important: to make the implementation A LOT simpler, P.length MUST be a
 * power of 2. You've been warned!
 *
 * Input:   P, an Array that must be initialized and filled
 * Output:  Y, must be initialized with the same size as P
 * inverse: use true for IFFT(), false otherwise
 */
void _FFT(Array P, Array Y, bool inverse)
{
  // Recursion stop condition
  if (P.length == 1)
  {
    copy_array(P, Y);
    return;
  }

  const size_t n = P.length;
  const int sign = inverse ? -1 : 1;
  const double complex w = cexp(sign*TAU/n*I); // n-th root of unity
  double complex wk = 1;
  Array Pe = make_array(n/2);                  // even coefs
  Array Po = make_array(n/2);                  // odd coefs
  Array Ye = make_array(n/2);                  // even values
  Array Yo = make_array(n/2);                  // odd values

  // Split even and odd coefficients
  for (size_t i = 0; i < n/2; i++)
  {
    Pe.array[i] = P.array[2*i];
    Po.array[i] = P.array[2*i + 1];
  }
  // Recursion on half the arrays, giving that sweet O(nlog(n)) complexity
  _FFT(Pe, Ye, inverse);
  _FFT(Po, Yo, inverse);

  // Compute
  for (size_t i = 0; i < n/2; i++)
  {
    Y.array[   i   ] = Ye.array[i] + wk*Yo.array[i];
    Y.array[i + n/2] = Ye.array[i] - wk*Yo.array[i];
    wk *= w;
  }

  free_array(Pe);
  free_array(Po);
  free_array(Ye);
  free_array(Yo);
}

/**
 * Fast Fourier Transform.
 * Given a polynomial, computes the values. See _FFT() for details.
 */
void FFT(Array P, Array V)
{
  _FFT(P, V, false);
}

/**
 * Inverse Fast Fourier Transform.
 * Given an array of values V, computes the corresponding polynomial P.
 */
void IFFT(Array V, Array P)
{
  _FFT(V, P, true);
  for (int i = 0; i < P.length; i++)
    P.array[i] /= P.length;
}

/**
 * Multiply the two polynomials A and B and returns the result. O(n*log(n))
 *
 * Algo: if done the natural way (distributivity), each coefficient of A must be
 * multiplied by each coefficient of B, which is O(n^2).
 * A polynomial of degree (n-1) is perfectly represented by a set of n distinct
 * points of coordinates (Xi, P(Xi)). If we can, somehow, get a list of points for
 * both A and B, using the same Xi, then we can easily get a set of points for
 * C = A*B because, for every Xi, C(Xi) = A(Xi)*B(Xi)
 * If we can now revert back from point (value) representation to coefficients,
 * we're done. And that's exactly what FFT does! FFT is very efficient at
 * evaluating a polynomial on n points, provided those points are choosen smartly.
 * Moreover, FFT can be reversed to give back coefficients by simply flipping a
 * sign and dividing the result by n.
 *
 * This quick FFT implementation only works on arrays whose length is a power of
 * 2. When multiplying two polynomials of degrees M and N, the result is a
 * polynomial of degree M+N. So the first step is to pad A and B so that their
 * length is a power of 2 big enough to generate all the points needed to define
 * their product C.
 *
 * Important: remember to free the result! I hate this array business in C ...
 */
Array MUL(Array A, Array B)
{
  const size_t n = 1 << bit_length(A.length + B.length - 2);
  Array a = make_array(n); // padded A
  Array b = make_array(n); // padded B
  Array C = make_array(n); // C = A*B, that's the result
  Array X = make_array(n); // value representation of A
  Array Y = make_array(n); // value representation of B
  Array Z = make_array(n); // Z = X*Y in value representation

  // We need arrays of length a power of 2
  copy_array(A, a);
  copy_array(B, b);
  // Use FFT to convert from coefficients to values
  FFT(a, X);
  FFT(b, Y);

  // Product by values: Z = X*Y
  for (size_t i = 0; i < n; i++)
    Z.array[i] = X.array[i] * Y.array[i];

  // Use IFFT to convert from values to coefficients
  IFFT(Z, C);

  free_array(a);
  free_array(b);
  free_array(X);
  free_array(Y);
  free_array(Z);
  return C;
}

///////////  MAIN  //////////////////////////////////////////////////////// MAIN
int main(int argc, char** argv)
{
  const size_t n = 4;
  data a[] = {1, -1, 2, 1};
  data b[] = {-3, 2, -4, 2};
  Array A  = {.length = n, .array = a};
  Array B  = {.length = n, .array = b};

  Array FFa = make_array(n);
  Array IFa = make_array(n);
  FFT(A, FFa);
  IFFT(FFa, IFa);
  Array C = MUL(A, B);

  printf("A   = ");
  display_array(A);

  printf("B   = ");
  display_array(B);

  printf("A*B = ");
  display_array(C);

  printf("\nFFT(A)        = ");
  display_array(FFa);

  printf("IFFT(FFT(A))  = ");
  display_array(IFa);

  printf("compared to A = ");
  display_array(A);

  free_array(FFa);
  free_array(IFa);
  free_array(C);
}
