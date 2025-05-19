#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include "togglearray.h"

void tg_init(ToggleArray* ta, sizint n) {
	sizint m = ((n - 1) >> 5) + 1;
	sizint* bs = malloc(n * sizeof(sizint));
	sizint* to = malloc(m * sizeof(sizint));
	if (!(bs && to)) {
		printf("Error allocating memory\n");
		exit(1);
	}
	memset(bs, 0, n * sizeof(sizint));
	memset(to, 0, m * sizeof(sizint));
	ta->size    = n;
	ta->upCount = 0;
	ta->bsearch = bs;
	ta->toggles = to;
}

void tg_free(ToggleArray* ta) {
	free(ta->bsearch);
	free(ta->toggles);
	ta->bsearch = NULL;
	ta->toggles = NULL;
}

sizint tg_downCount(ToggleArray* ta) {
	return ta->size - ta->upCount;
}

sizint tg_setUp(ToggleArray* ta, sizint k) {
	if (k >= tg_downCount(ta)) return 0;
	ta->upCount++;
	sizint a = 0, b = ta->size - 1;
	while (1) {
		sizint
			t = (b + a) / 2,
			slt = t - a + 1 - ta->bsearch[t];
		if ((slt == k + 1) && !to_get(*ta, t)) {
			ta->bsearch[t]++;
			to_set(*ta, t);
			return t;
		}
		if (slt > k) {
			ta->bsearch[t]++;
			b = t;
		}
		else {
			a = t + 1;
			k -= slt;
		}
	}
}

sizint tg_numULE(ToggleArray* ta, sizint i) {
	if (i >= ta->size) return 0;
	sizint a = 0, b = ta->size - 1, ns = 0;
	while (a != b) {
		sizint t = (b + a) / 2;
		if (i <= t)
			b = t;
		else {
			ns += ta->bsearch[t];
			a = t + 1;
		}
	}
	return ns;
}

sizint tg_numDLE(ToggleArray* ta, sizint i) { return i - tg_numULE(ta, i); }


static void to_set(ToggleArray ta, sizint bitIndex) {
	ta.toggles[bitIndex >> 5] |= (1 << bitIndex);
}

static void to_clear(ToggleArray ta, sizint bitIndex) {
	ta.toggles[bitIndex >> 5] &= ~(1 << bitIndex);
}

static int to_get(ToggleArray ta, sizint bitIndex) {
	return (ta.toggles[bitIndex >> 5] & (1 << bitIndex)) != 0;
}
