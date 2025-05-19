/**
 * Note: __builtin_ctz is the fastest on average.
 * The simple loop with bitshifts is second.
 * And the promising trailing_zeroes() is dead last.
 * On average, the number of trailing zeroes don't seem to be big enough
 * to justify all the hassle in trailing_zeroes().
 * __builtin_ctz performance gain is negligeable and not worth the pain
 * of having non portable code.
 * 
 * Note: The improvement added by pow2 is very good: do multiplications
 * with smaller numbers, then shift. I get around 18% increase speed on average.
 * 
 * Note: pow1 and pow2 values differ. That happens when an overflow occurs.
 * pow2 loops like a modulo while pow1 just return 0 at some point.
 */

#include <iostream>
#include <vector>
//#include <bits/stdc++.h>

using namespace std;

int main(int, char**);
long pow1(long, unsigned);
long pow2(long, unsigned);
long pow3(long, unsigned);
unsigned trailing_zeroes(int);
template<typename Function> void teset(int, Function);

int main(int argc, char** argv) {
	int N = 5;
	if (argc > 1) N = atoi(argv[1]);

	teset(N, pow1);
	teset(N, pow2);
	teset(N, pow3);

	return 0;
}

template<typename Function>
void teset(int n, Function f) {
	for (int i = 0; i < n-1; i++)
		cout << f(4, i) << ", ";
	cout << f(4, n-1) << endl;
}

/**
 * Computes a^b. When it overflows, you get zero.
 */
long pow1(long a, unsigned b) {
	if (b == 0) return 1;
	long res = 1;
	while (b > 1) {
		if (b & 1) res *= a;
		a *= a;
		b >>= 1;
	}
	return res * a;
}

/**
 * Computes a^b. When it overflows, it modulus.
 * This version treats the trailing zeroes separately.
 */
long pow2(long a, unsigned b) {
	if (b == 0) return 1;
	if (a == 0) return 0;
	long res = 1;
	unsigned shift = 0;
	while ((a & 1) == 0) {
		shift++;
		a >>= 1;
	}
	shift *= b;
	while (b > 1) {
		if (b & 1) res *= a;
		a *= a;
		b >>= 1;
	}
	return (res * a) << shift;
}

/**
 * For-loop version of pow2.
 */
long pow3(long a, unsigned b) {
	if (b == 0) return 1;
	if (a == 0) return 0;
	long res;
	unsigned shift;
	for (shift = 0; (a & 1) == 0; shift++, a >>= 1);
	shift *= b;
	for (res = 1; b > 1; a *= a, b >>= 1)
		if (b & 1) res *= a;
	return (res * a) << shift;
}

/* Undefined for n = 0 */
/* Actually a bit slower than a simple loop, on average */
unsigned trailing_zeroes(int n) {
    unsigned bits = 0, x = n;
    if (x) {
        if ((x & 0x0000FFFF) == 0) { bits += 16; x >>= 16; }
        if ((x & 0x000000FF) == 0) { bits +=  8; x >>=  8; }
        if ((x & 0x0000000F) == 0) { bits +=  4; x >>=  4; }
        if ((x & 0x00000003) == 0) { bits +=  2; x >>=  2; }
        bits += (x & 1) ^ 1;
    }
    return bits;
}
