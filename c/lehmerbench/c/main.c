#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <time.h>
#include "togglearray.h"

typedef uint32_t sizint; // don't change, some hardcoded values depend on it

static void err(const char* msg) {
	printf("%s\n", msg);
	exit(1);
}

/**
 * There is no consistency between C, C++, Java, C#, Windows, Linux on generating seeded random numbers.
 * So here's my portable function.
 * x(n+1) = 7^5 * x(n) % (2 ^ 31 - 1)
 */
uint32_t nextInt() {
	static uint32_t currand = 123456;
	currand = (16807 * currand) % 2147483647;
	return currand;
}

static void shuffle(sizint* ar, sizint n) {
	sizint temp, r;
	while (n --> 1) {
		r = nextInt() % (n + 1);
		temp  = ar[n];
		ar[n] = ar[r];
		ar[r] = temp;
	}
}

static void lehmer(sizint* perm, sizint* lehm, sizint N) {
	ToggleArray ta;
	tg_init(&ta, N);
	for (sizint i = 0; i < N - 1; i++) {
		sizint n = tg_numDLE(&ta, perm[i]);
		tg_setUp(&ta, n);
		lehm[i] = n;
	}
	lehm[N - 1] = 0;
	tg_free(&ta);
}

static void unlehmer(sizint* lehm, sizint* perm, sizint N) {
	ToggleArray ta;
	tg_init(&ta, N);
	for (sizint i = 0; i < N; i++)
		perm[i] = tg_setUp(&ta, lehm[i]);
	tg_free(&ta);
}

int main(int argc, char** argv) {
	clock_t start;
	int elapsed;
	const sizint N = 10000000;

	printf("Creating an array of %d elements.\n", N);
	start = clock();
	sizint* perm = malloc(N * sizeof(sizint));
	if (!perm) err("Error: memory allocation");
	sizint n = N;
	while (n--) perm[n] = n;
	shuffle(perm, N);
	elapsed = (clock() - start) * 1000 / CLOCKS_PER_SEC;
	printf("Creating and shuffle: %d ms\n", elapsed);

	printf("Running Lehmer ...\n");
	start = clock();
	sizint* lehm = malloc(N * sizeof(sizint));
	if (!lehm) err("Error: memory allocation");
	lehmer(perm, lehm, N);
	elapsed = (clock() - start) * 1000 / CLOCKS_PER_SEC;
	printf("Lehmer duration: %d ms\n", elapsed);
	printf("Done\n");

	// Just a sanity check to ensure lehmer and unlehmer are not completely wrong
	//sizint* unle = malloc(N * sizeof(sizint));
	//if (!lehm) err("Error: memory allocation");
	//unlehmer(lehm, unle, N);
	//n = N;
	//while (n--)
	//	if (perm[n] != unle[n])
	//		printf("BUG\n");

	free(perm);
	free(lehm);
	//free(unle);
	return 0;
}
