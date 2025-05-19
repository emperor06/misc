#include <iostream>
#include <cmath>
#include <time.h>

using namespace std;

int gcd(int a, int b) {
  return b == 0 ? a : gcd(b, a % b);
}

int main() {
  const int INTERVAL = 1000000;
  srand(time(NULL));
  int reduce, iters = 0, coprimes = 0, N_2, N_1 = 1 + rand();
  try {
    while (1) {
      iters++;
      N_2 = 1 + rand();
      if (gcd(N_1, N_2) == 1) {
        coprimes++;
      }
      N_1 = 1 + rand();
      if (iters % INTERVAL == 0) {
        cout << "Pi = " << sqrt(6.0 / ((double) coprimes / iters)) << endl;
        reduce = gcd(coprimes, iters);
        if (reduce > coprimes) {
          coprimes /= reduce;
          iters /= reduce;
        }
      }
    }
  } catch (exception e) {
    // welp, thats enough
  }
  return 0;
}
