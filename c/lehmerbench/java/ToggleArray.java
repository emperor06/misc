/**
 * Copyright (C) 2020 drax
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */
import java.util.Arrays;

/**
 * ToggleArray:
 * An implementation of the LRArray found at p166 http://www.jjj.de/fxt/#fxtbook
 *
 * Here, down means false or 0 (and up means true or 1)
 *
 * This tracks the state (up or down) of toggle switches in an array.
 * The following operations are done in O(log n):
 * - switch a toggle up (or down)
 * - get the absolute index of the k-th up (or down) toggle
 * - for any given k-th up (or down) toggle, count how many toggles to its left
 *   (or right), including itself (or not), has the same state (up or down)
 *
 * This structure uses a BitField to hold the actual state of all switches.
 * This is basically an interface to an array of boolean.
 * Known (provided) implementations are:
 * BitFieldBoolean: uses Java's boolean[]
 * BitFieldSet: uses Java's BitSet
 * BitFieldDrax: custom implementation of a BitSet with no checks, easy to port to another language.
 * Performance: BitFieldDrax is the fastest, followed by BitFieldSet, then BitFieldBoolean.
 *
 * About the ToggleArray structure:
 * bsearch is a binary tree that is browsed using binary search.
 * Each node correspond to one index and holds the number of up switches to its left (including itself).
 * Here, "left" means in its subtree, not in the toggles array.
 *
 * Let's take an example with n=7 switches.
 * The first interval is [0, L] where L=n-1, with a middle point at L/2=3.
 * The interval (or subtree) to its left is [0, L/2[ and the one to its right is [L/2, L]. And so on.
 * The tree representation of the indices is:
 *
 *       3
 *      / \
 *    /     \
 *   1       5
 *  / \     / \
 * 0   2   4   6
 *
 * For the root node (3), bsearch[3] = # of up switches in [0, 3]
 * For 1, it's #up switches in [0, 1]
 * For 2, it's [2, 2]
 * For 0, it's [0, 0]
 * For 5, it's [4, 5]
 * So, in the case of node 3, we count all the up switches in its left subtree,
 *   1
 *  / \
 * 0   2
 * plus 3 itself.
 *
 * Now let's say toggles is [0, 0, 1, 1, 1, 1, 0]
 * Replacing the nodes index with + (up) or - (down), we get the following tree:
 *       +
 *      / \
 *    /     \
 *   -       +
 *  / \     / \
 * -   +   +   -
 *
 * The root is up (+) and its left subtree contains another + (at index 2) so the total number of + is 2.
 * This means bsearch[3] = 2.
 * The node at index 1 (the root of the first left subtree) is a - and there's only one node to its left (index 0)
 * which is also a -, so there is nothing up to the left of index 1 -> bsearch[1] = 0.
 * Last example with node 5, it is a + and there's another + to its left for a total of 2 -> bsearch[5] = 2.
 * Now it's easy to fill bsearch and we get [0, 0, 1, 2, 1, 2, 0]
 *
 * Important: ToggleArray has a special way of indexing/counting the up/down toggles.
 * Let's say the toggles are [0=down, 1=up, 2=down, 3=up]
 * getUpIndex(1) returns the index of the up toggle number 1. Counting always start at 0 so "up toggle #1"
 * means the second toggle that is up. Here, it's at index 3 (index 1 is where "up toggle #0" is).
 * That's what getUpIndex() returns.
 * Similarly, getDownIndex(0) is 0, getDownIndex(1) is 2, and getDownIndex(2) is undefined as there are
 * no "third down toggle". Only, getDownIndex() is not implemented here.
 * So here, we call 1=up the absolute index 1 (that's the index in the toggle array) or relative up-index 0
 * (because that's the first up toggle from the left).
 *
 * Another note because that structure may be a bit confusing at first:
 * numULI(5) returns the number of up switches to the left of 5 (included)
 * One may think that's what bsearch[5] is, but it's not.
 * bsearch[5] is the number of up switches to the left of 5 "in the subtree which root is 5".
 * So, to get the correct answer, numULI(5) should take bsearch[5] + bsearch[3]
 * bsearch[5] covers the indices in [4, 5] range, and bsearch[3] covers [0, 3] so the union is [0, 5] and the intersection is [].
 * These numXXX() functions are achieved using binary search. In fact, only numULE() is implemented, the other functions
 * just deduce the result from it.
 *
 * @author Jörg Arndt
 * @author Draxar
 */
public class ToggleArray {
	/**
	 * For any interval [a, b] the element bsearch[t] where t = (a + b)/2
	 * contains the number of Up toggles in [a, t].
	 */
	private final int[] bsearch;     // Up indices Left (inclusive) in bsearch interval
	private final BitField toggles;  // A representation of the toggles
	private int upCount;             // number of Up toggles


	/**
	 * Constructs a ToggleArray of size n where all toggles are down (false).
	 * There are 3 structures we can use as a BitField:
	 * - BitFieldBoolean, a regular boolean[], which gives 3830 ms for a given computation (size 10M)
	 * - BitFieldSet, Java's bitfield, which gives 3870 ms for the same computation
	 * - BitFieldDrax, my own bitfield, which gives 3550 ms and wins them all :/
	 * <p>Complexity: O(n)
	 * @param n the size (number of toggles)
	 */
	public ToggleArray(int n) {
		bsearch = new int[n];
		toggles = new BitFieldDrax(n);
		allDown();
	}

	/**
	 * Total number of Up toggles.
	 * @return up count
	 */
	public int upCount() {
		return upCount;
	}

	/**
	 * Total number of Down toggles
	 * @return down count
	 */
	public int downCount() {
		return bsearch.length - upCount;
	}

	/**
	 * Recursively init bsearch for an "all up" array.
	 * @param a start of the bsearch interval (inclusive)
	 * @param b end of the bsearch interval (inclusive)
	 */
	private void init(int a, int b) {
		if ((b - a) != 0) {
			int t = (b + a)/2;
			init(a, t);
			init(t + 1, b);
		}
		bsearch[b] = b - a + 1;
	}

	/**
	 * Raises all toggles.
	 */
	public final void allUp() {
		upCount = bsearch.length;
		toggles.set();
		init(0, bsearch.length - 1);
		bsearch[bsearch.length - 1] = 1;
	}

	/**
	 * Lowers all toggles.
	 */
	public final void allDown() {
		upCount = 0;
		toggles.clear();
		Arrays.fill(bsearch, 0);
	}

	/**
	 * The index of the k-th Up toggle (bypassing Down toggles)
	 * @param k 0 <= k <= upCount()
	 * @return the actual index of the k-th Up toggle, zero if not found
	 */
	public int getUpIndex(int k) {
		if (k >= upCount()) return 0;
		int a = 0;
		int b = bsearch.length - 1;
		while (true) {
			int t = (b + a) / 2;
			if (bsearch[t] == k + 1 && toggles.get(t)) {
				return t;
			}
			if (bsearch[t] > k) {
				b = t;
			} else {
				a = t + 1;
				k -= bsearch[t];
			}
		}
	}

	/**
	 * Sets down the k-th Up toggle and return its index.
	 * @param k the relative Up index of the toggle to lower.
	 * @return the index of the lowered toggle.
	 */
	public int setDown(int k) {
		if (k >= upCount()) return 0;
		upCount--;
		int a = 0;
		int b = bsearch.length - 1;
		while (true) {
			int t = (b + a) / 2;
			if (bsearch[t] == k + 1 && toggles.get(t)) {
				bsearch[t]--;
				toggles.clear(t);
				return t;
			}
			if (bsearch[t] > k) {
				bsearch[t]--;
				b = t;
			} else {
				a = t + 1;
				k -= bsearch[t];
			}
		}
	}

	/**
	 * Sets up the k-th Down toggle and return its index.
	 * @param k the relative Down index of the toggle to raise.
	 * @return the index of the raised toggle.
	 */
	public int setUp(int k) {
		if (k >= downCount()) return 0;
		upCount++;
		int a = 0;
		int b = bsearch.length - 1;
		while (true) {
			int t = (b + a) / 2;
			int slt = t - a + 1 - bsearch[t];
			if ((slt == k + 1) && (!toggles.get(t))) {
				bsearch[t]++;
				toggles.set(t);
				return t;
			}
			if (slt > k) {
				bsearch[t]++;
				b = t;
			} else {
				a = t + 1;
				k -= slt;
			}
		}
	}

	/**
	 * Counts how many toggles are Up to the left of absolute index i (exclusive)
	 * <p>ULE: Up, Left, Exclusive<br />
	 * Every other numXXX() function depend on this one.
	 * <p>Complexity: O(log n)
	 * @param i the absolute index.
	 * @return the number of up toggles, zero if out-of-range.
	 */
	public int numULE(int i) {
		if (i >= bsearch.length) return 0;
		int a = 0;
		int b = bsearch.length-1;
		int res = 0;
		while (a != b) {
			int t = (b + a)/2;
			if (i <= t) {
				b = t;
			} else {
				res += bsearch[t];
				a = t + 1;
			}
		}
		return res;
	}

	/**
	 * Counts how many toggles are Up to the left of absolute index i (inclusive)
	 * <p>ULI: Up, Left, Inclusive
	 * @param i the absolute index.
	 * @return the number of up toggles, zero if out-of-range.
	 */
	public int numULI(int i) {
		return numULE(i) + (toggles.get(i) ? 1 : 0);
	}

	/**
	 * Counts how many toggles are Up to the right of absolute index i (exclusive)
	 * <p>URE: Up, Right, Exclusive
	 * @param i the absolute index.
	 * @return the number of up toggles, zero if out-of-range.
	 */
	public int numURE(int i) {
		return upCount() - numULI(i);
	}

	/**
	 * Counts how many toggles are Up to the right of absolute index i (inclusive)
	 * <p>URE: Up, Right, Inclusive
	 * @param i the absolute index.
	 * @return the number of up toggles, zero if out-of-range.
	 */
	public int numURI(int i) {
		return upCount() - numULE(i);
	}

	/**
	 * Counts how many toggles are Down to the left of absolute index i (exclusive)
	 * <p>URE: Down, Left, Exclusive
	 * @param i the absolute index.
	 * @return the number of down toggles, zero if out-of-range.
	 */
	public int numDLE(int i) {
		return i - numULE(i);
	}

	/**
	 * Counts how many toggles are Down to the left of absolute index i (inclusive)
	 * <p>URE: Down, Left, Inclusive
	 * @param i the absolute index.
	 * @return the number of down toggles, zero if out-of-range.
	 */
	public int numDLI(int i) {
		return i - numULE(i) + (!toggles.get(i) ? 1 : 0);
	}

	/**
	 * Counts how many toggles are Down to the right of absolute index i (exclusive)
	 * <p>URE: Down, Right, Exclusive
	 * @param i the absolute index.
	 * @return the number of down toggles, zero if out-of-range.
	 */
	public int numDRE(int i){
		return downCount() - numDLI(i);
	}

	/**
	 * Counts how many toggles are Down to the right of absolute index i (inclusive)
	 * <p>URE: Down, Right, Inclusive
	 * @param i the absolute index.
	 * @return the number of down toggles, zero if out-of-range.
	 */
	public int numDRI(int i) {
		return downCount() - i + numULE(i);
	}
}
