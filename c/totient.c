#include <stdio.h>

#define xswap(a,b) __asm__ (\
"xchg %0, %1\n"\
: : "r"(a), "r"(b));

inline unsigned int is_even(unsigned int n)
{
	return (n & 1) == 0;
}

unsigned int gcd(unsigned int a, unsigned int b)
{
	unsigned int shift, tmp, c;
	shift = 0;
	while (a != b)
	{
		const unsigned int
			evena = is_even(a),
			evenb = is_even(b);
		if (evena && evenb)
		{
			a >>= 1;
			b >>= 1;
			shift++;
			continue;
		}
		if (evena)
		{
			a >>= 1;
			continue;
		}
		if (evenb)
		{
			b >>= 1;
			continue;
		}
		// both a and b are odd
		if (a < b) // swap
		{
			tmp = a;
			a = b;
			b = tmp;
		}
		a = (a - b) >> 1;
	}
	// a == b
	return a << shift;
}

unsigned int gcd2(unsigned int u, unsigned int v)
{
	int shift;
	if (u == 0) return v;
	if (v == 0) return u;
	shift = __builtin_ctz(u | v);
	u >>= __builtin_ctz(u);
	do {
		v >>= __builtin_ctz(v);
		if (u > v) xswap(u, v);
		v = v - u;
	} while (v != 0);
	return u << shift;
}

unsigned int gcd3(unsigned int a, unsigned int b)
{
	return b ? gcd3(b, a % b) : a;
}

int totient(int N)
{
	int tot = 0;
	int n = N + 1;
	while (n --> 1)
		if (gcd2(N, n) == 1) tot++;
	return tot;
}

int main(char argc, char** argv)
{
	int c = 654987654;
	printf("totient(%d) = %d", c, totient(c));
	return 0;
}
