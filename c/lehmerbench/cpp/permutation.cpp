#include "permutation.h"
#include "togglearray.h"
#include <numeric>
#include <algorithm>
#include <random>
#include <stdexcept>

using namespace perm;
using namespace drax;

// Such a simple function, and yet so many disappointments.
bool
perm::isValidPermutation(const arint& perm) {
	const size_t N = perm.size();
	std::vector<bool> tmp(N);
	try {
		for (sizint i = 0; i < N; i++)
			tmp.at(i) = true;
	}
	catch (std::out_of_range const&) { return false; }
	for (sizint i = 0; i < N; i++)
		if (!tmp[i]) return false;
	return true;
}

bool
perm::isValidLehmer(const arint& lehmer) {
	const size_t N = lehmer.size();
	for (size_t n = N - 1, i = 0; i < N; i++, n--)
		if (lehmer[i] > n)
			return false;
	return true;
}

arint
perm::getPermutation(sizint size) {
	arint perm(size);
	std::iota(std::begin(perm), std::end(perm), 0);
	return perm;
}

/**
 * There is no consistency between C, C++, Java, C#, Windows, Linux on generating seeded random numbers.
 * So here's my portable function.
 * x(n+1) = 7^5 * x(n) % (2 ^ 31 - 1)
 */
static uint32_t
nextInt() {
	static uint32_t currand = 123456;
	currand = (16807 * currand) % 2147483647;
	return currand;
}

void
perm::shuffleArray(arint& ar) {
	sizint r, n = ar.size();
	while (n --> 1) {
		r = nextInt() % (n + 1);
		std::swap(ar[n], ar[r]);
	}
}

void
perm::nextPermutation(arint& perm) {
	const sizint N = perm.size() - 1;
	sizint i = N;
	while (i-- && perm[i] > perm[i + 1]);
	if (i < 0)
		for (sizint k = perm.size(); k--; perm[k] = k);
	else {
		sizint j = N;
		while (perm[i] > perm[j]) j--;
		std::swap(perm[i], perm[j]);
		sizint r = N, s = i + 1;
		while (r > s) {
			std::swap(perm[r], perm[s]);
			r--; s++;
		}
	}
}

arint
perm::lehmer(const arint& perm) {
	const sizint N = perm.size();
	arint lehmer(N);
	ToggleArray ta(N);
	for (sizint i = 0; i < N - 1; i++) {
		sizint n = ta.numDLE(perm[i]);
		ta.setUp(n);
		lehmer[i] = n;
	}
	return lehmer;
}

arint
perm::unlehmer(const arint& lehmer) {
	const sizint N = lehmer.size();
	arint perm(N);
	ToggleArray ta(N);
	for (sizint i = 0; i < N; i++)
		perm[i] = ta.setUp(lehmer[i]);
	return perm;
}

cycles
perm::getCycles(const arint& perm) {
	cycles res;
	arint p(perm);
	const sizint N = p.size();
	for (sizint i = 0; i < N; i++) {
		if (p[i] >= N) continue;
		sizint j = i;
		arint cur;
		do {
			cur.push_back(j);
			p[j] += N;
		} while ((j = p[j] - N) != i);
		res.push_back(cur);
	}
	return res;
}

void
perm::applyCycles(const cycles& cycles, arint &ar) {
	for (const auto& c : cycles) {
		sizint n = c.size();
		sizint tmp = ar[c[0]];
		for (sizint i = 1; i < n; i++)
			ar[c[i - 1]] = ar[c[i]];
		ar[c[n - 1]] = tmp;
	}
}

bool
perm::isEven(const arint& lehmer) {
	sizint acc = 0;
	for (const auto& x : lehmer)
		acc += x;
	return (acc & 1) == 0;
}

bool
perm::isEven(const cycles& cycles) {
	sizint acc = 0;
	for (const auto& x : cycles)
		acc += x.size() - 1 & 1;
	return (acc & 1) == 0;
}

#ifdef BIGINT
// mpz_class is slower than mpz_t :( (maybe the addmul() function helps)
bigint
perm::factoradic(const arint& lehmer) {
	const sizint N = lehmer.size();
	mpz_t n, f, t;
	mpz_init_set_ui(n, 0);
	mpz_init_set_ui(f, 1);
	mpz_init(t);
	for (sizint i = 1; i <= N; i++) {
		mpz_addmul_ui(n, f, lehmer[N - i]);  // n += fact * lehmer[N - i];
		mpz_mul_ui(t, f, i);                 // fact *= i;
		mpz_set(f, t);
	}
	return bigint(n);
}

// Again, mpz_t is faster, especially when it can get both q and r at the same time
arint
perm::unfactoradic(bigint fac) {
	sizint divisor = 1;
	vector<sizint> stack;
	mpz_t f, q, r;
	mpz_init_set(f, fac.get_mpz_t());
	mpz_init(q);
	mpz_init(r);
	do {
		mpz_fdiv_qr_ui(q, r, f, divisor); // q = f / divisor
		stack.push_back(mpz_get_ui(r));   // r = f % divisor
		mpz_set(f, q);                    // f = q
		divisor++;                        // push(r)
	} while (mpz_cmp_ui(f, 0));

	arint res(divisor - 1);
	sizint n = 0, ss = stack.size();
	while (ss --> 0)
		res[n++] = stack[ss];
	return res;
}

arint
perm::unfactoradic(bigint fac, sizint n) {
	arint res(n);
	sizint divisor = 1;
	mpz_t f, q, r;
	mpz_init_set(f, fac.get_mpz_t());
	mpz_init(q);
	mpz_init(r);
	while (n--) {
		mpz_fdiv_qr_ui(q, r, f, divisor);
		res[n] = mpz_get_ui(r);
		mpz_set(f, q);
		divisor++;
	}
	return res;
}
#endif
