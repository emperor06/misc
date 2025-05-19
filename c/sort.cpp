#include <iostream>
#include <vector>
#include <algorithm>
#include <random>
#include <chrono>

using namespace std;

// Helper functions
template <typename T>
void display(vector<T> &v) {
	for (T i : v)
		cout << i << " ";
	cout << endl;
}

// Quicksort: optimized partitionning with half the number of swaps
template <typename T>
size_t partition(vector<T> &v, size_t lo, size_t hi) {
	size_t pivot = v[(hi+lo)/2];
	while (1) {
		while (v[lo] < pivot) {lo++;}
		while (v[hi] > pivot) {hi--;}
		if (lo >= hi) return hi;
		swap(v[lo++], v[hi--]);
	}
}

template <typename T>
void qsort(vector<T> &v, size_t lo, size_t hi) {
	if (lo < hi) {
		size_t p = partition(v, lo, hi);
		qsort(v, lo, p);
		qsort(v, p+1, hi);
	}
}

template <typename T>
void qsort(vector<T> &v) {
	if (v.size() > 1)
		qsort(v, 0, v.size()-1);
}

// Naive sort
template <typename T>
void naivesort(vector<T> &v) {
	const size_t n = v.size();
	for (size_t i = 0; i < n; i++)
		for (size_t j = i+1; j < n; j++)
			if (v[i] > v[j])
				chatteswap(v[i], v[j]);
}

// Insertion sort
template <typename T>
void isort(vector<T> &v) {
	const size_t n = v.size();
	for (int i = 1, j = 1; i < n; i++, j = i) {
		while (j --> 0 && v[j] > v[i]);
		rotate(v.begin()+j+1, v.begin()+i, v.begin()+i+1);
	}
}

template <typename T>
void isort2(vector<T> &v) {
	for (auto i = v.begin(); i != v.end(); ++i) {
		auto j = i - 1;
		while (j+1 != v.begin() && *j > *i) j--;
		rotate(j+1, i, i+1);
	}
}

// Merge sort top-down
template <typename T>
void merge(vector<T> &A, int beg, int mid, int end, vector<T> &B) {
	int i = beg, j = mid;
	for (int k = beg; k < end; k++)
		if (i < mid && (j >= end || A[i] <= A[j]))
			B[k] = A[i++];
		else
			B[k] = A[j++];
}

template <typename T>
void splitTD(vector<T> &B, int beg, int end, vector<T> &A) {
	if (end - beg > 1) {
		const int mid = (beg + end) / 2;
		splitTD(A, beg, mid, B);
		splitTD(A, mid, end, B);
		merge(B, beg, mid, end, A);
	}
}

template <typename T>
void mergesortTD(vector<T> &A) {
	vector<T> B(A);
	splitTD(B, 0, A.size(), A);
}

// Merge sort bottom-up
template <typename T>
void mergesortBU(vector<T> &A) {
	const int n = A.size();
	vector<T> B(n);
	for (int width = 1; width < n; width = 2 * width) {
		for (int i = 0; i < n; i = i + 2 * width)
			merge(A, i, min(i+width, n), min(i+2*width, n), B);
		swap(A, B);
	}
}

// Test code
int main() {
	std::random_device dev;
	std::mt19937 rng(dev());
	std::uniform_int_distribution<std::mt19937::result_type> randint(0, 1000000);
	std::chrono::steady_clock::time_point begin, end;
	#define tunit std::chrono::nanoseconds
	#define tdisp " ns"

	/*
	vector<int> v {12, 2, 14, 6, 8, 13, 4, 11, 3, 1, 9, 0, 15, 7, 10, 5};
	isort(v);
	display(v);
	*/

	enum Method {
		RANDOM,
		FORWARD,
		BACKWARD
	};

	size_t N = 1000;
	vector<int> v1(N);
	Method m = RANDOM;

	switch (m) {
	case RANDOM:
		cout << "Generating random array of size " << N << "... " << flush;
		begin = std::chrono::steady_clock::now();
		for (int i = 0; i < N; i++) v1.at(i) = randint(rng);
		end = std::chrono::steady_clock::now();
		cout << std::chrono::duration_cast<tunit>(end - begin).count() << tdisp << endl;
		break;
	case FORWARD:
		cout << "Generating sorted array of size " << N << "... " << flush;
		begin = std::chrono::steady_clock::now();
		for (int i = 0; i < N; i++) v1.at(i) = i;
		end = std::chrono::steady_clock::now();
		cout << std::chrono::duration_cast<tunit>(end - begin).count() << tdisp << endl;
		break;
	case BACKWARD:
		cout << "Generating backwards array of size " << N << "... " << flush;
		begin = std::chrono::steady_clock::now();
		for (int i = 0; i < N; i++) v1.at(i) = N - i - 1;
		end = std::chrono::steady_clock::now();
		cout << std::chrono::duration_cast<tunit>(end - begin).count() << tdisp << endl;
		break;
	}

	cout << "Making 5 copies of that array... " << flush;
	begin = std::chrono::steady_clock::now();
	vector<int> v2(v1);
	vector<int> v3(v1);
	vector<int> v4(v1);
	vector<int> v5(v1);
	vector<int> v6(v1);
	end = std::chrono::steady_clock::now();
	cout << std::chrono::duration_cast<tunit>(end - begin).count() << tdisp << endl;

	begin = std::chrono::steady_clock::now();
	qsort(v1);
	end = std::chrono::steady_clock::now();
	cout << "Quicksort             ; Sorted? " << is_sorted(v1.begin(), v1.end()) << " ; ";
	cout << "Time: " << std::chrono::duration_cast<tunit>(end - begin).count() << tdisp << endl;

	begin = std::chrono::steady_clock::now();
	mergesortTD(v2);
	end = std::chrono::steady_clock::now();
	cout << "Mergesort (top-down)  ; Sorted? " << is_sorted(v2.begin(), v2.end()) << " ; ";
	cout << "Time: " << std::chrono::duration_cast<tunit>(end - begin).count() << tdisp << endl;

	begin = std::chrono::steady_clock::now();
	mergesortBU(v3);
	end = std::chrono::steady_clock::now();
	cout << "Mergesort (bottom-up) ; Sorted? " << is_sorted(v3.begin(), v3.end()) << " ; ";
	cout << "Time: " << std::chrono::duration_cast<tunit>(end - begin).count() << tdisp << endl;

	begin = std::chrono::steady_clock::now();
	sort(v4.begin(), v4.end());
	end = std::chrono::steady_clock::now();
	cout << "STL sort              ; Sorted? " << is_sorted(v4.begin(), v4.end()) << " ; ";
	cout << "Time: " << std::chrono::duration_cast<tunit>(end - begin).count() << tdisp << endl;

	begin = std::chrono::steady_clock::now();
	isort(v5);
	end = std::chrono::steady_clock::now();
	cout << "Insertion sort        ; Sorted? " << is_sorted(v5.begin(), v5.end()) << " ; ";
	cout << "Time: " << std::chrono::duration_cast<tunit>(end - begin).count() << tdisp << endl;

	begin = std::chrono::steady_clock::now();
	isort2(v6);
	end = std::chrono::steady_clock::now();
	cout << "Insertion sort iterat ; Sorted? " << is_sorted(v6.begin(), v6.end()) << " ; ";
	cout << "Time: " << std::chrono::duration_cast<tunit>(end - begin).count() << tdisp << endl;

	return 0;
}
