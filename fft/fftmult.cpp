/* THE circle constant */
#define TAU 6.283185307179586476925286766559

#include <vector>
#include <string>
#include <algorithm>
#include <sstream>
#include <iterator>
#include <iostream>
#include <complex>
#include <chrono>

using std::cout;
using std::endl;
using std::vector;
using std::complex;
using std::string;
using namespace std::chrono;
using namespace std::complex_literals;

typedef complex<double> Complex;
typedef vector<Complex> Polynomial;

size_t bit_length(size_t n)
{
  size_t count = 0;
  for (; n != 0; ++count, n >>= 1);
  return count;
}

template<typename T>
string to_string(vector<T> v)
{
  std::ostringstream oss;
  oss << "[";
  if (!v.empty())
  {
    std::copy(v.begin(), v.end()-1, std::ostream_iterator<T>(oss, ", "));
    oss << v.back();
  }
  oss << "]";
  return oss.str();
}

vector<int> to_int(Polynomial v)
{
	vector<int> vi;
	for (auto elem : v)
		vi.push_back(real(elem));
	return vi;
}

Polynomial _FFT(Polynomial P, bool inverse)
{
  // Recursion stop condition
  if (P.size() == 1) return P;

  const size_t n = P.size();
  const int sign = inverse ? -1 : 1;
  const Complex w = exp((sign*TAU/n)*1i);
  Complex wk = 1;
  Polynomial Pe(n/2), Po(n/2);
  Polynomial Y(n), Ye, Yo;

  // Split even and odd coefficients
  for (size_t i = 0; i < n/2; i++)
  {
    Pe[i] = P[2*i];
    Po[i] = P[2*i + 1];
  }
  // Recursion on half the arrays, giving that sweet O(nlog(n)) complexity
  Ye = _FFT(Pe, inverse);
  Yo = _FFT(Po, inverse);

  // Compute
  for (size_t i = 0; i < n/2; i++)
  {
    Y[   i   ] = Ye[i] + wk*Yo[i];
    Y[i + n/2] = Ye[i] - wk*Yo[i];
    wk *= w;
  }
  return Y;
}

Polynomial FFT(Polynomial P) { return _FFT(P, false); }

Polynomial IFFT(Polynomial V)
{
  Polynomial P = _FFT(V, true);
  for (auto & i : P)
    i /= P.size();
  return P;
}

Polynomial MUL(Polynomial A, Polynomial B)
{
  const size_t n = 1 << bit_length(A.size() + B.size() - 2);
  Polynomial a(A), b(B), C, X, Y, Z(n);

  // We need arrays of length a power of 2
  a.resize(n);
  b.resize(n);
  // Use FFT to convert from coefficients to values
  X = FFT(a);
  Y = FFT(b);

  // Product by values: Z = X*Y
  for (size_t i = 0; i < Z.size(); i++)
    Z[i] = X[i] * Y[i];

  // Use IFFT to convert from values to coefficients
  C = IFFT(Z);
  while (C.size() != 0 && real(C.back()) == 0)
    C.pop_back();
  return C;
}

void benchmark(size_t n)
{
    Polynomial A(n), B(n);
    for (size_t i = 0; i < n; i++)
    {
        A[i] = i;
        B[i] = n - i;
    }
    auto start = high_resolution_clock::now();
    Polynomial C = MUL(A, B);
    auto stop = high_resolution_clock::now();
    auto duration = duration_cast<milliseconds>(stop - start);
    cout << "Anti opti: " << C[n/2] << endl;
    cout << "Duration: " << duration.count() << " ms." << endl;
}

int main(int argc, char** argv)
{
  const size_t n = 4;
  Polynomial
    A{1, -1, 2, 1},
    B{-3, 2, -4, 2},
    FFa, IFa, C;

  FFa = FFT(A);
  IFa = IFFT(FFa);
  C   = MUL(A, B);

  cout << "A   = " << to_string(to_int(A)) << endl;
  cout << "B   = " << to_string(to_int(B)) << endl;
  cout << "A*B = " << to_string(to_int(C)) << endl;
  cout << endl;
  cout << "FFT(A)        = " << to_string(FFa) << endl;
  cout << "IFFT(FFT(A))  = " << to_string(to_int(IFa)) << endl;
  cout << "compared to A = " << to_string(to_int(A)) << endl;
  cout << endl;

  if (argc > 1)
  {
      benchmark(atoi(argv[1]));
  }
}
