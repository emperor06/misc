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

template<typename T>
void unshuffle(vector<T> const &v, vector<T> &res, const size_t start, const size_t length)
{
    for (size_t i = start, j = start; i < start + length; i += 2, j++)
        res[j] = v[i];
    for (size_t i = start, j = start + length/2; i < start + length; i += 2, j++)
        res[j] = v[i + 1];
}

void _FFT(
    Polynomial &P,
    Polynomial &buffer,
    Polynomial &res,
    const size_t start,
    const size_t length,
    const bool inverse)
{
    if (length == 1)
    {
      res[start] = P[start];
      return;
    }

    const int sign = inverse ? -1 : 1;
    const Complex w = exp((sign*TAU/length)*1i);
    Complex wk = 1;
    unshuffle(P, buffer, start, length);
    for (size_t i = start; i < start + length; i++)
        P[i] = buffer[i];

    // Recursion on half the arrays, giving that sweet O(nlog(n)) complexity
    _FFT(P, buffer, res, start, length/2, inverse);
    _FFT(P, buffer, res, start + length/2, length/2, inverse);

    // Compute
    for (size_t even = start, odd = start + length/2; even < start + length/2; even++, odd++)
    {
        Complex e = res[even] + wk*res[odd];
        Complex o = res[even] - wk*res[odd];
        res[even] = e;
        res[odd]  = o;
        wk *= w;
    }
}

size_t bit_length(size_t n)
{
  size_t count = 0;
  for (; n != 0; ++count, n >>= 1);
  return count;
}

template<typename T>
string to_string(const vector<T> &v)
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

vector<int> to_int(const Polynomial &v)
{
	vector<int> vi;
	for (auto elem : v)
		vi.push_back(real(elem));
	return vi;
}

Polynomial FFT(Polynomial &P) {
    Polynomial res(P.size());
    Polynomial buffer(P.size());
    _FFT(P, buffer, res, 0, P.size(), false);
    return res;
}

Polynomial IFFT(Polynomial &P)
{
    Polynomial res(P.size());
    Polynomial buffer(P.size());
    _FFT(P, buffer, res, 0, P.size(), true);
    for (auto & i : res)
        i /= P.size();
    return res;
}

Polynomial MUL(const Polynomial &A, const Polynomial &B)
{
    const size_t n = 1 << bit_length(A.size() + B.size() - 2);
    Polynomial a(A), b(B), X, Y;

    // We need arrays of length a power of 2
    a.resize(n);
    b.resize(n);
    // Use FFT to convert from coefficients to values
    X = FFT(a);
    Y = FFT(b);

    // Product by values: Z = X*Y
    for (size_t i = 0; i < n; i++)
        X[i] *= Y[i];

    // Use IFFT to convert from values to coefficients
    Y = IFFT(X);
    while (Y.size() != 0 && real(Y.back()) == 0)
        Y.pop_back();
    return Y;
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

    Polynomial a(A);
    FFa = FFT(a);
    Polynomial ffa(FFa);
    IFa = IFFT(ffa);
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
