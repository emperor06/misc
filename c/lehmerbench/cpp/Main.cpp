#include <iostream>
#include <sstream>
#include <numeric>
#include <algorithm>
#include <iterator>
#include "permutation.h"
#include "togglearray.h"

#include <time.h>   //benchmark
#include <chrono>   //benchmark
#include <iostream> //benchmark
using namespace std::chrono;

using namespace drax;
using namespace perm;
using namespace std;

static void display_vector(const arint& v)
{
	std::copy(v.begin(), v.end(), std::ostream_iterator<int>(std::cout, " "));
	cout << endl;
}

static string vectorToString(const arint& v) {
	stringstream ss;
	ss << '[' << v[0];
	for (sizint i = 1; i < v.size(); i++)
		ss << ' ' << v[i];
	ss << ']';
	return ss.str();
}

static string cyclesToString(const cycles& cycles) {
	stringstream ss;
	for (const auto& c : cycles) {
		ss << '(' << c[0];
		for (sizint i = 1; i < c.size(); i++)
			ss << ' ' << c[i];
		ss << ')';
	}
	return ss.str();
}

static void test1() {
	constexpr sizint N = 10;
	arint perm = getPermutation(N);
	shuffleArray(perm);
	cout << "Perm:        " << vectorToString(perm) << endl;
	arint lehm = lehmer(perm);
	cout << "Lehmer:      " << vectorToString(lehm) << endl;
#ifdef BIGINT
	bigint fac = factoradic(lehm);
	cout << "Factoradic:  " << fac.get_str() << endl;
	arint unfac = unfactoradic(fac, N);
	cout << "Unfactorad:  " << vectorToString(unfac) << endl;
#endif
	arint unle = unlehmer(lehm);
	cout << "Unlehmer:    " << vectorToString(unle) << endl;
	cycles cyc = getCycles(perm);
	cout << "Cycles:      " << cyclesToString(cyc) << endl;
	arint uncyc = getPermutation(N);
	applyCycles(cyc, uncyc);
	cout << "Uncycle:     " << vectorToString(uncyc) << endl;
	cout << "Lehmer says: " << (isEven(lehm) ? "even" : "odd") << endl;
	cout << "Cycles says: " << (isEven(cyc)  ? "even" : "odd") << endl;
}

static void test2() {
	constexpr sizint N = 10000000;

	cout << "Creating an array of " << N << " elements." << endl;
	auto start = high_resolution_clock::now();
	arint perm = getPermutation(N);
	shuffleArray(perm);
	auto stop = high_resolution_clock::now();
	auto duration = duration_cast<milliseconds>(stop - start);
	cout << "Creating and shuffle: " << duration.count() << " ms" << endl;

	start = high_resolution_clock::now();
	arint lehm = lehmer(perm);
	stop = high_resolution_clock::now();
	duration = duration_cast<milliseconds>(stop - start);
	cout << "Lehmer duration: " << duration.count() << " ms" << endl;
}

int main(int argc, char** argv)
{
	//test1();
	test2();

	return 0;
}
