/**
 * Fibonacci using iterative fast double algorithm.
 *
 * This algorithm is very famous in its recursive form but I couldn't find any
 * iterative version, so here it is.
 * Req: gmplib
 * Compile with: g++ -O3 -lgmp -o fib fib.cpp
 *
 * By Drax
 */

#include <iostream>
#include <cstdint>
#include <gmpxx.h>

typedef mpz_class bigint;

bigint fib(uint32_t n) {
	bigint a = 0, b = 1, ab, a2, b2;
	for (uint32_t p = 1 << 8*sizeof p - 1; p; p >>= 1) {
		ab = a*b << 1;
		a2 = a*a;
		b2 = b*b;
		if (n & p) {
			b = ab + b2;
			a = a2 + b2;
		} else {
			a = ab - a2;
			b = a2 + b2;
		}
	}
	return a;
}

void numstat(bigint z) {
	std::cout << mpz_sizeinbase(z.__get_mp(), 2) << " bits or " << mpz_sizeinbase(z.__get_mp(), 10) << " digits" << std::endl;
}

void numstat(mpz_t z) {
	std::cout << mpz_sizeinbase(z, 2) << " bits or " << mpz_sizeinbase(z, 10) << " digits" << std::endl;
}

void perf() {
	bigint z = fib(2147483647); // Java's Integer.max_value() == 2^31 - 1
	std::cout << "fib(2147483647) has ";
	numstat(z);
}


int main() {
	perf();
	//std::cout << fib(30).get_str() << std::endl;
	return 0;
}


// for loop, p = msbpos(n). In fact, leading zeroes don't matter so just init p to 1<<31
//uint32_t msbpos(uint32_t n) {
//	n |= n >> 1;
//	n |= n >> 2;
//	n |= n >> 4;
//	n |= n >> 8;
//	n |= n >> 16;
//	return (n + 1) >> 1;
//}
