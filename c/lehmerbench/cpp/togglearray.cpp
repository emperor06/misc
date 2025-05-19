#include "togglearray.h"

using namespace drax;

ToggleArray::ToggleArray(sizint n) : N(n), _upCount(0), bsearch(n), toggles(n) {}

void ToggleArray::init(sizint a, sizint b) {
	if ((b - a) != 0) {
		sizint t = (b + a) / 2;
		init(a, t);
		init(t + 1, b);
	}
	bsearch[b] = b - a + 1;
}

void ToggleArray::allUp() {
	_upCount = N;
	std::fill(toggles.begin(), toggles.end(), true);
	init(0, N - 1);
	bsearch[N - 1] = 1;
}

void ToggleArray::allDown() {
	_upCount = 0;
	std::fill(toggles.begin(), toggles.end(), false);
	std::fill(bsearch.begin(), bsearch.end(), 0);
}

sizint ToggleArray::getUpIndex(sizint k) const {
	if (k >= _upCount) return 0;
	sizint a = 0, b = N - 1;
	while (true) {
		sizint t = (b + a) / 2;
		if (bsearch[t] == k + 1 && toggles[t])
			return t;
		if (bsearch[t] > k)
			b = t;
		else {
			a = t + 1;
			k -= bsearch[t];
		}
	}
}

sizint ToggleArray::setDown(sizint k) {
	if (k >= _upCount) return 0;
	_upCount--;
	sizint a = 0, b = N - 1;
	while (true) {
		sizint t = (b + a) / 2;
		if (bsearch[t] == k + 1 && toggles[t]) {
			bsearch[t]--;
			toggles[t] = false;
			return t;
		}
		if (bsearch[t] > k) {
			bsearch[t]--;
			b = t;
		}
		else {
			a = t + 1;
			k -= bsearch[t];
		}
	}
}

sizint ToggleArray::setUp(sizint k) {
	if (k >= downCount()) return 0;
	_upCount++;
	sizint a = 0, b = N - 1;
	while (true) {
		sizint t = (b + a) / 2,
		     slt = t - a + 1 - bsearch[t];
		if ((slt == k + 1) && !toggles[t]) {
			bsearch[t]++;
			toggles[t] = true;
			return t;
		}
		if (slt > k) {
			bsearch[t]++;
			b = t;
		}
		else {
			a = t + 1;
			k -= slt;
		}
	}
}

sizint ToggleArray::numULE(sizint i) const {
	if (i >= N) return 0;
	sizint a = 0, b = N - 1, ns = 0;
	while (a != b) {
		sizint t = (b + a) / 2;
		if (i <= t)
			b = t;
		else {
			ns += bsearch[t];
			a = t + 1;
		}
	}
	return ns;
}

sizint ToggleArray::numULI(sizint i) const { return numULE(i) + toggles[i];      }
sizint ToggleArray::numURE(sizint i) const { return _upCount - numULI(i);        }
sizint ToggleArray::numURI(sizint i) const { return _upCount - numULE(i);        }
sizint ToggleArray::numDLE(sizint i) const { return i - numULE(i);               }
sizint ToggleArray::numDLI(sizint i) const { return i - numULE(i) + !toggles[i]; }
sizint ToggleArray::numDRE(sizint i) const { return downCount() - numDLI(i);     }
sizint ToggleArray::numDRI(sizint i) const { return downCount() - i + numULE(i); }
