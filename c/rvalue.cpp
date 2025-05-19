#include <iostream>
#include <sstream>
#include <string>
#include <bitset>
#include <iomanip>

using namespace std;

struct Vec {
    int X, Y, Z;

    Vec() : X(), Y(), Z() {
        cout << "Construct Vec()" << endl;
    }

    Vec(int x, int y, int z) : X(x), Y(y), Z(z) {
        cout << "Construct Vec(x, y, z)" << endl;
    }

    Vec(const Vec& Other) : X(Other.X), Y(Other.Y), Z(Other.Z) {
        cout << "Copy construct" << endl;
    }

    Vec(Vec && Other) : X(Other.X), Y(Other.Y), Z(Other.Z) {
        cout << "Move construct" << endl;
        Other.X = Other.Y = Other.Z = 0;
    }

    Vec& operator=(const Vec& V) {
        cout << "Copy assign" << endl;
        X = V.X;
        Y = V.Y;
        Z = V.Z;
        return (*this);
    }

    Vec& operator=(Vec && V) {
        cout << "Move assign" << endl;
        X = V.X;
        Y = V.Y;
        Z = V.Z;
        V.X = V.Y = V.Z = 0;
        return (*this);
    }

    Vec& operator+=(const Vec& V) {
        X += V.X;
        Y += V.Y;
        Z += V.Z;
        return (*this);
    }

    Vec operator+(const Vec& V) const {
        Vec res(*this);
        res += V;
        return res;
    }

    friend ostream& operator<<(ostream& out, const Vec& V)
	{
		out << "[" << V.X << ", " << V.Y << ", " << V.Z << "]";
		return out;
	}
};

struct Node {
    Vec Coords;
    float Score;

    Node(const Vec& coords, float score) : Coords(coords), Score(score) {}
};

int main() {
    Vec v1(1, 2, 3);
    Vec v2;
    v2 += v1;
    v1 = v1 + v2;
    Node n(v1, 1.414f);
    cout << endl;
    Vec v3(v1 + v1 + v2);
    cout << endl;
    cout << v3 << endl;
    cout << n.Coords << endl;

    float e = 2.71828182845904523536028747135266249775724709369995f;
    int i = * (int *) & e;
    bitset<32> x(i);
    int j = 1076754516;
    float f = * (float *) & j;
    cout << i << " ; " << x << " ; " << std::fixed << std::setprecision(30) << f << endl;
    return 0;
}
