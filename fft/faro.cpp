#include <iostream>
#include <vector>
#include <array>
#include <string>
#include <algorithm>
#include <sstream>
#include <iterator>
#include <cmath>

#include <chrono>

using namespace std;
using chrono::high_resolution_clock;
using chrono::duration_cast;
using chrono::milliseconds;

using MEMX = void (*)(vector<int> const &, vector<int> &);

/**
 * Inplace faro and anti-faro shuffle.
 * While it doesn't require any additional memory or allocation, it runs in O(n²)
 * theta(n²/8 - n/4)
 * https://stackoverflow.com/questions/30396616/perfect-shuffle-and-unshuffle-with-no-auxiliary-array
 * https://stackoverflow.com/questions/22424985/why-does-array-size-have-to-be-3k1-for-cycle-leader-iteration-algorithm-to-wor
 * Also, see this as it seems to be very good:
 * https://www.geeksforgeeks.org/an-in-place-algorithm-for-string-transformation/
 *
 * Two very good (and equivalent) implementations are given next: PartitionIndexParity and Unshuffle,
 * Unshuffle is marginally faster but bugs when v.size() is odd.
 *
 * All unfaro_mem(x) functions bug when v.size() is odd. Some may be easy to fix,
 * but some are definitely a pain (it would add a lot of ugly code).
 * Their speed bench is based on 20 runs, keeping the best, for entry size of 100M.
 * A 1ms difference between two functions is NOT significant. For example, #7 and #8 score
 * consistently 76ms and 75ms respectively, except for that one time where #7 scored 75ms.
 * #4 is usually at 94ms but sometimes reaches 93ms while #6 is more often than not at 93ms.
 * Consider all these values +/- 1ms.
 * These speed tests were originally done accounting for the array allocation. Now
 * only the unfaro method is considered. New updates in gcc seem to have been beneficial
 * for the results: they all got slightly buffed up since this program was first written and tested.
 * Values computed on meissa (Acer Aspire 5, core i3-1115G4 @4100MHz)
 */


template<typename T>
string myToString(vector<T> v)
{
  if (v.size() > 32) return std::to_string(v[17]); // for debugging
  std::ostringstream oss;
  oss << "[";
  if (!v.empty())
  {
    std::copy(v.begin(), v.end()-1, std::ostream_iterator<T>(oss, ", "));
    oss << v.back();
  }
  oss << "]";
  return oss.str();
}


/**
 * Faro shuffle in O(n²)
 */
template<typename T>
void faro(vector<T>& data)
{
    size_t lo = 1;
    size_t hi = (data.size() + 1) / 2;

    while (lo < hi) {
        T m = data[hi];

        for (size_t i = hi; i --> lo; )
          data[i + 1] = data[i];

        data[lo] = m;
        lo += 2;
        hi++;
    }
}

/**
 * Anti Faro in O(n²)
 */
template<typename T>
void unfaro(vector<T>& data)
{
    int N = 0;
    size_t n = data.size();
    size_t lo = n + n % 2 - 1;
    size_t hi = lo;

    while (hi--, lo-- && lo--) {
        T m = data[lo];

        for (size_t i = lo; i < hi; i++)
          data[i] = data[i + 1];

        data[hi] = m;
    }
}


/**
 * Returns the biggest integer of the form 3^k+1 that is less than N
 * Note: using a loop seems to hinder Partition more than Unshuffle.
 * Possible impl: k=0; while (pow(3, k) + 1 <= N) {k++;}; return pow(3, k-1) + 1;
 * Possible impl: return (size_t)pow(3, ceil(log(N) / log(3)) - 1) + 1;
 */
size_t getBiggest3k1(size_t N)
{
    size_t n = 1;
    while (n < N) n *= 3;
    return n / 3 + 1;
}


// From https://stackoverflow.com/questions/12338654/move-all-odd-positioned-element-to-left-half-and-even-positioned-to-right-half-i
// Linear Faro
template<typename T>
void PartitionIndexParity(vector<T> &v)
{
    const size_t n = v.size();
    for (size_t shift = 0, k; shift != n; shift += k)
    {
        // get block length
        k = getBiggest3k1(n - shift); //(size_t)pow(3, ceil(log(n - shift) / log(3)) - 1) + 1;

        // cycleLeader
        for (size_t i = 1, j = 1; i < k; i *= 3, j = i)
            do { swap(v[(j = j / 2 + (j % 2) * (k / 2)) + shift], v[i + shift]); }
            while (j != i);

        // Rotation
        rotate(v.begin() + shift / 2, v.begin() + shift, v.begin() + shift + (k - k / 2));
        /*
        // Manual rotation, code for languages without rotate(). Note: in c++, rotate() is faster
        for (size_t b = shift / 2, m = shift, e = shift + (k - k / 2), i = m; shift != 0 && k != 0; )
        {
            swap(v[b++], v[i++]);
            if (b == m && i == e) break;
            if (b == m) m = i;
            else if (i == e) i = m;
        }
        */
    }
}

//------------------------------------------------------------------------------
// From https://www.geeksforgeeks.org/an-in-place-algorithm-for-string-transformation/


/**
 * Cycle leader algorithm (even left, odd right, or anti-faro)
 */
template<typename T>
void cycleLeader(vector<T> &v, const size_t start, const size_t len)
{
    for (size_t i = 1, j = 1; i < len; i *= 3, j = i)
        do {
            j = (j & 1) ? (j + len) / 2 : j / 2;
            swap(v[start + j], v[start + i]);
        } while (j != i);
}

/**
 * Twice as slow as cycleLeader() for unknown reason. Uses i*2 for swaps instead of i/2 so it does it the other way around.
 * Update: roughly the same performance now. Issue seemed to be the modulus.
 */
template<typename T>
void cycleLeader2(vector<T>& v, const size_t start, const size_t len)
{
    const size_t L = len - 1;
    for (size_t i = 1; i < L; i *= 3)
    {
        size_t dst{ i }, src{ 2 * i };
        if (src >= L) src -= L;
        /*
        while (src != i)
        {
            swap(v[start + dst], v[start + src]);
            dst = src;
            src = 2 * dst % L;
        }
        */
        T tmp = v[start + i];
        while (src != i)
        {
            v[start + dst] = v[start + src];
            dst = src;
            src *= 2;
            if (src >= L) src -= L; // much faster than src = 2 * dst % L;
        }
        v[start + dst] = tmp;
    }
}

/**
 * Performs an anti-faro using cycle leader algorithm. BUG: does not work when len is odd!
 * Step 1:   Find the largest prefix subarray of the form 3^k + 1
 * Step 2:   Apply cycle leader algorithm for the largest subarray
 * Step 3:   Rotate part of the vector to integrate the new block
 * Alternatively, use 3 reverse to do the rotation
 * Note on rotation: the end index (last parameter) should be begin() + start + length/2
 * length is always even (it's a 3^k+1) except when k=0, in which case length is odd and length/2 yields 0.
 * In case length is one, length/2 should be made 1 too.
 * An option is to use v.begin() + start + L where L = length == 1 ? 1 : length/2
 * A trick is to use length - length/2
 * Basically, we want to rotate from the previous odd section's beginning to the end of the current even section,
 * making sure the beginning of the current even section (start) goes all the way to the left.
 * <-- old_even --> X=START/2 <-- old_odd --> START <-- even --> Y=START+LEN/2 <-- odd -->
 * rotate(X, START, Y)
 * Step 3.1: Reverse the second half of first subarray
 * Step 3.2: Reverse the first half of second subarray.
 * Step 3.3: Rev 2nd half of 1st sub and 1st half of 2nd sub together
 * reverse(v.begin() + start/2, v.begin() + start);
 * reverse(v.begin() + start,   v.begin() + start + length/2);
 * reverse(v.begin() + start/2, v.begin() + start + length/2 + (length % 2));// modulo fixes the bug when v.size() is odd
 */
template<typename T>
void unshuffle(vector<T> &v)
{
    for (size_t start = 0, size = v.size(), length; start < size; start += length)
    {
        length = getBiggest3k1(size - start);
        cycleLeader(v, start, length);
        rotate(v.begin() + start / 2, v.begin() + start, v.begin() + start + (length == 1 ? 1 : length/2));
    }
}

// 76ms for 100M
template<typename T>
void unfaro_mem1(vector<T> const &v, vector<T> &res)
{
    const size_t n = v.size();
    const size_t n2 = n/2;
    for (size_t i = 0; i < n; i++)
    {
        if (i & 1) res[i/2 + n2] = v[i];
        else       res[i/2] = v[i];
    }
}

// 81ms for 100M
template<typename T>
void unfaro_mem2(vector<T> const &v, vector<T> &res)
{
    const size_t n = v.size();
    const size_t n2 = n/2;
    size_t i = 0;
    for (auto it = v.begin(); it != v.end(); it++)
    {
        if (i & 1) res[i/2 + n2] = *it;
        else       res[i/2] = *it;
        i++;
    }
}

// 82ms for 100M
template<typename T>
void unfaro_mem3(vector<T> const &v, vector<T> &res)
{
    const size_t n = v.size();
    const size_t n2 = n/2;
    size_t i = 0;
    for (const auto &val : v)
    {
        if (i & 1) res[i/2 + n2] = val;
        else       res[i/2] = val;
        i++;
    }
}

// 93ms for 100M
template<typename T>
void unfaro_mem4(vector<T> const &v, vector<T> &res)
{
    const size_t n = v.size();
    const size_t n2 = n/2;
    for (size_t i = 0; i < n2; i++)
        res[i] = v[2*i];
    for (size_t i = 0; i < n2; i++)
        res[i + n2] = v[2*i + 1];
}

// 93ms for 100M
template<typename T>
void unfaro_mem5(vector<T> const &v, vector<T> &res)
{
    const size_t n = v.size();
    const size_t n2 = n/2;
    for (size_t i = 0; i < n2; i++)
        res[i] = v[2*i];
    for (size_t i = 0, j = n2; i < n2; i++, j++)
        res[j] = v[2*i + 1];
}

// 93ms for 100M
template<typename T>
void unfaro_mem6(vector<T> const &v, vector<T> &res)
{
    const size_t n = v.size();
    const size_t n2 = n/2;
    for (size_t i = 0, j = 0; i < n; i += 2, j++)
        res[j] = v[i];
    for (size_t i = 1, j = n2; i < n; i += 2, j++)
        res[j] = v[i];
}

// 76ms for 100M
template<typename T>
void unfaro_mem7(vector<T> const &v, vector<T> &res)
{
    const size_t n = v.size();
    const size_t n2 = n/2;
    for (size_t i = 0, e = 0, o = n2; i < n; i++)
    {
        if (i & 1)
            res[o++] = v[i];
        else
            res[e++] = v[i];
    }
}

// 75ms for 100M
template<typename T>
void unfaro_mem8(vector<T> const &v, vector<T> &res)
{
    size_t n = v.size();
    const size_t n2 = n/2;
    for (size_t i = 0; i < n; i += 2)
    {
        res[i/2]    = v[i];
        res[i/2+n2] = v[i+1];
    }
}

void bench(size_t N)
{
    vector<int> v(N);
    for (int i = 0; i < N; i++) v[i] = i;
    cout << "Original:  " << myToString(v) << endl;

    vector<int> a(v), b(v), c(v), d(v), e(v);
/* // O(n²) functions, way too slow for this benchmark
    start = high_resolution_clock::now();
    faro(a);
    stop = high_resolution_clock::now();
    duration = duration_cast<milliseconds>(stop - start);
    cout << "Faro:      " << myToString(a) << endl;
    cout << "Time: " << duration.count() << " ms" << endl;

    start = high_resolution_clock::now();
    unfaro(b);
    stop = high_resolution_clock::now();
    duration = duration_cast<milliseconds>(stop - start);
    cout << "Unfaro:    " << myToString(b) << endl;
    cout << "Time: " << duration.count() << " ms" << endl;
*/
    auto start = high_resolution_clock::now();
    PartitionIndexParity(c);
    auto stop = high_resolution_clock::now();
    auto duration = duration_cast<milliseconds>(stop - start);
    cout << "Partition: " << myToString(c) << endl;
    cout << "Time: " << duration.count() << " ms" << endl;

    start = high_resolution_clock::now();
    unshuffle(d);
    stop = high_resolution_clock::now();
    duration = duration_cast<milliseconds>(stop - start);
    cout << "Unshuffle: " << myToString(d) << endl;
    cout << "Time: " << duration.count() << " ms" << endl;
}

long teset_mem(MEMX unfaro_memx, size_t N)
{
    vector<int> v(N);
    for (int i = 0; i < N; i++) v[i] = i;

    vector<int> buf(v.size());
    auto start = high_resolution_clock::now();
    unfaro_memx(v, buf);
    auto stop = high_resolution_clock::now();
    auto duration = duration_cast<milliseconds>(stop - start);
    //cout << "Tmp array: " << myToString(buf) << endl;
    //cout << "Time: " << duration.count() << " ms" << endl;
    return duration.count();
}

void teset_unfaro(size_t N)
{
    vector<int> v(N);
    for (int i = 0; i < N; i++) v[i] = i;

    auto start = high_resolution_clock::now();
    unshuffle(v);
    auto stop = high_resolution_clock::now();
    auto duration = duration_cast<milliseconds>(stop - start);
    cout << "Unshuffle: " << myToString(v) << endl;
    cout << "Time: " << duration.count() << " ms" << endl;
}

void teset_slow(size_t N)
{
	vector<int> v(N);
    for (int i = 0; i < N; i++) v[i] = i;
	vector<int> v2(v);

    auto start = high_resolution_clock::now();
    faro(v);
    auto stop = high_resolution_clock::now();
    auto duration = duration_cast<milliseconds>(stop - start);
    cout << "Faro     : " << myToString(v) << endl;
    cout << "Time: " << duration.count() << " ms" << endl;

    start = high_resolution_clock::now();
    unfaro(v2);
    stop = high_resolution_clock::now();
    duration = duration_cast<milliseconds>(stop - start);
    cout << "Faro     : " << myToString(v2) << endl;
    cout << "Time: " << duration.count() << " ms" << endl;
}

int main(int argc, char** argv)
{
    size_t N = 16;
    if (argc > 1)
        N = atoi(argv[1]);

    array<MEMX, 8> allmem {
        unfaro_mem1,
        unfaro_mem2,
        unfaro_mem3,
        unfaro_mem4,
        unfaro_mem5,
        unfaro_mem6,
        unfaro_mem7,
        unfaro_mem8,
    };
    const int maxreps = 20;
    int counter = 1;
    for (auto &memtest : allmem)
    {
        long best { -1L };
        cout << "Test #" << counter++ << ": ";
        for (int rep = 0; rep < maxreps; rep++) {
            long current = teset_mem(memtest, N);
            if (best == -1L || current < best)
                best = current;
        }
        cout << best << "ms" << endl;
    }

    //bench(N);
    //teset_unfaro(N);
    //teset_slow(N);
    return 0;
}
