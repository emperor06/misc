#include "stdio.h"
#include "stdlib.h"

#define lambda(return_type, function_body) \
({ \
      return_type  __fn__ function_body \
      __fn__; \
})

// Represents a function
typedef void* fn;
typedef fn(*)(fn) fnp;

// Maps a function to a nice name
typedef struct named {
	fn    addr;
	char* name;
} named;

// Holds the mappings to get the actual function names
named ** names;
int fnCount = 0;

void initNames(int n) {
	names = malloc(n*sizeof(named));
	while (n --> 0) names[0] = 0;
}

void addFunc(fn f, char* n) {
	names[fnCount] = malloc(sizeof(named));
	names[fnCount]->addr = f;
	names[fnCount]->name = n;
	fnCount++;
}

char* getName(fn f) {
	int n = 0;
	while (names[n] != 0) {
		if (names[n]->addr == f)
			return names[n]->name;
		n++;
	}
	return "Unknown";
}

//fn (*K) (fn) = lambda (fn, (fn a) { return lambda (fn, (fn b) { return a; }); });
int main() {
	initNames(50);
	fn (*X) (fn) = lambda (fn, (fn a) { return lambda (fn, (fn b) { return a; }); });
	fn (*Xi) (fn) = lambda (fn, (fn a) { return lambda (fn, (fn b) { return b; }); });
	/*fn (*X) (fn)     = ({
		fn __fn__ (fn a) { return a; }
		(fn(*)(fn)) __fn__;
	});*/
    fn (*I) (fn)     = lambda (fn, (fn a) { return a; });
    fn (*K) (fn, fn) = lambda (fn, (fn a, fn b) { return a; });
    fn (*Ki)(fn, fn) = lambda (fn, (fn a, fn b) { return b; });
    fn (*M) (fn)     = lambda (fn, (fn f) { return ((fn(*)(fn))f)(f); });
    //fn (*M) (fn, fn) = lambda (fn, (fn a, fn b) { return ((fn(*)(fn))a)(b); });
    //fn (*C) (fn, fn) = lambda (fn, (fn a, fn b) { return ((fn(*)(fn))b)(a); });
    //fn (*C) (fn)     = lambda (fn, (fn a) { return lambda (fn, (fn b) { return ((fn(*)(fn))b)(a); }); });
    fn (*C) (fn) = lambda (fn, (fn f) { return lambda (fn, (fn a) { return lambda (fn, (fn b) { return ((fn(*)(fn)) ((fn(*)(fn))f)(b))(a); }); }); });

	addFunc(I, "Ident");
	addFunc(K, "Kestrel");
	addFunc(Ki,"Kite");
	addFunc(M, "Mockingbird");
	addFunc(C, "Cardinal");
	addFunc(X, "X");
	addFunc(Xi, "Xi");
	
    printf("I        = %s\n", getName(I));
    printf("K        = %s\n", getName(K));
	printf("K(I, K)  = %s\n", getName(K(I, K)));
	printf("Ki(I, K) = %s\n", getName(Ki(I, K)));
	printf("M(I)     = %s\n", getName(M(I)));
	printf("M(Ki)    = %s\n", getName(M(Ki)));
	//printf("X(I)(K)  = %s\n", getName(((fn(*)(fn))X(K))(K)));
	printf("C(I)(K)(Ki) = %s\n", getName( ((fn(*)(fn)) ((fn(*)(fn)) C(I))(K) )(Ki)         ));
	//printf("C(K)(I)  = %s\n", getName(((fn(*)(fn))C(K))(I)));
	
	printf("X(I)(K)  = %s\n", getName(((fn(*)(fn))X(I))(K)));
	printf("Xi(I)(K) = %s\n", getName(((fn(*)(fn))Xi(I))(K)));
}
