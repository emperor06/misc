CXXFLAGS = -O2

permutations: Main.cpp permutation.cpp togglearray.cpp
	$(CXX) $(CXXFLAGS) $(LDLIBS) $^ -o $@

bigint: Main.cpp permutation.cpp togglearray.cpp
	$(CXX) $(CXXFLAGS) $(LDLIBS) -lgmp -lgmpxx -DBIGINT $^ -o $@

clean:
	rm -f permutations
