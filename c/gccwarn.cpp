// Compile with: g++ -O2 -Wall -o gccwarn gccwarn.cpp

#include <iostream>
#include <vector>

using namespace std;

int main(int argc, char** argv) {
	int N = 5;
	// Remove the following 2 lines and there's no warning
	if (argc > 1)
		N = stoi(argv[1]);

	int ar[N];
	for (int i = 0; i < N; i++) ar[i] = i*i;
	for (int i = 0; i < N-1; i++)
		cout << ar[i] << ", ";
	cout << ar[N-1] << endl;
	
// add the following lines to trigger a warning on the previous line
	vector<int> v;
	for (int i = 0; i < N; i++) v.push_back(i*i);
	for (auto it = v.begin(); it != v.end() - 1; it++)
		cout << *it << ", ";
	cout << v[N-1] << endl;
///////

	return 0;
}
