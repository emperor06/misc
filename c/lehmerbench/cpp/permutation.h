#pragma once
#include <vector>
#ifdef BIGINT
#ifdef OS_Windows
#include <mpirxx.h>
#else
#include <gmpxx.h>
#endif
#endif

namespace perm {
	using sizint = unsigned int;                     // permutation element: a positive int
	using arint  = std::vector<sizint>;              // array of int
	using cycles = std::vector<std::vector<sizint>>; // an array of cycles, for example (0 2)(1 3 5)(4)

	bool   isValidPermutation (const arint& perm);
	bool   isValidLehmer      (const arint& lehmer);
	arint  getPermutation     (sizint size);
	void   shuffleArray       (arint& ar);
	void   nextPermutation    (arint& perm);
	arint  lehmer             (const arint& perm);
	arint  unlehmer           (const arint& lehmer);
	cycles getCycles          (const arint& perm);
	void   applyCycles        (const cycles& cycles, arint& ar);
	bool   isEven             (const arint& lehmer);
	bool   isEven             (const cycles& cycles);
#ifdef BIGINT
	using bigint = mpz_class;
	bigint factoradic         (const arint& lehmer);
	arint  unfactoradic       (bigint fac);
	arint  unfactoradic       (bigint fac, sizint n);
#endif
}
