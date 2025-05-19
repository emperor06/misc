import java.math.BigInteger;
import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Deque;
import java.util.List;
import java.util.SplittableRandom;
import java.util.random.RandomGenerator;

/**
 * Lehmer code and factoradic algorithms.
 *
 * @author Draxar 2017
 */
public class Permutations {

	private static final RandomGenerator rand = new SplittableRandom(1);

	/**
	 * Computes the Lehmer code of the given array using ToggleArray.
	 * <p> Complexity: O(n log n)
	 *
	 * @param perm The permutation array.
	 * @return The Lehmer code array.
	 */
	public static int[] lehmer(int[] perm) {
		int len = perm.length;
		int[] lehmer = new int[len];
		ToggleArray ta = new ToggleArray(len);
		for (int i = 0; i < len - 1; i++) {
			int n = ta.numDLE(perm[i]);
			ta.setUp(n);
			lehmer[i] = n;
		}
		return lehmer;
	}

	/**
	 * Rebuild the permutation array from its Lehmer code using ToggleArray
	 * <p>Complexity: O(n log n)
	 *
	 * @param lehmer
	 * @return
	 */
	public static int[] unlehmer(int[] lehmer) {
		int len = lehmer.length;
		int[] perm = new int[len];
		ToggleArray ta = new ToggleArray(len);
		for (int i = 0; i < len; i++)
			perm[i] = ta.setUp(lehmer[i]);
		return perm;
	}

	/**
	 * Computes the integer corresponding to the Lehmer array in the factorial
	 * number base (mixed base). Each value from the array is the coefficient of
	 * the factorial of its rank-1.
	 * <p>Example, [2, 3, 1, 0] is 2*(3!) + 3*(2!) + 1*(1!) + 0*(0!) = 19
	 * <p>Note: in this example, the coefficient of 2! is 3, which should never happen
	 * as 3*2!=3! This just means the input array (2,3,1,0) is invalid. It's not a
	 * Lehmer code.
	 * <p>Note that due to the underlying presence of factorial around permutations,
	 * this number can quickly become big. Very big. Actually, as big as
	 * <code>r.length!</code>.
	 *
	 * @param lehmer The Lehmer code array
	 * @return The corresponding factoradic number.
	 */
	public static BigInteger factoradic(int[] lehmer) {
		BigInteger n = BigInteger.ZERO;
		BigInteger fact = BigInteger.ONE;
		for (int i = 1; i <= lehmer.length; i++) {
			n = n.add(fact.multiply(BigInteger.valueOf(lehmer[lehmer.length - i])));
			fact = fact.multiply(BigInteger.valueOf(i));
		}
		return n;
	}

	/**
	 * Converts a big factoradic number into its Lehmer code.
	 * <p>Note: for the same reason that leading zeros don't count in the integer world,
	 * permutations of different length can have the same factoradic.
	 * <p>For example, {0, 1}->0 and {0, 1, 2}->0 (any ordered list map to 0)<br />
	 * When reversing the algorithm, this method returns the smallest
	 * sub-array where the permutations occur. If you know the size of the
	 * permutation array, use {@link #inverseFactoradic(BigInteger, int)} instead.
	 *
	 * @param factoradic The factoradic number to convert.
	 * @return The Lehmer code representing this factoradic number.
	 */
	public static int[] inverseFactoradic(BigInteger factoradic) {
		BigInteger divisor = BigInteger.ONE;
		Deque<Integer> stack = new ArrayDeque<>();
		int n = 0;
		do {
			stack.push(factoradic.remainder(divisor).intValue());
			factoradic = factoradic.divide(divisor);
			divisor = divisor.add(BigInteger.ONE);
			n++;
		} while (!factoradic.equals(BigInteger.ZERO));
		int[] res = new int[n];
		n = 0;
		while (!stack.isEmpty())
			res[n++] = stack.pop();
		return res;
	}

	/**
	 * Converts a big factoradic into its lehmer code of size <code>size</code>
	 *
	 * @param factoradic The factoradic representation of a permutation
	 * @param size The number of elements in the original permutation
	 * @return The Lehmer code of this factoradic number
	 * @see #inverseFactoradic(BigInteger)
	 */
	public static int[] inverseFactoradic(BigInteger factoradic, int size) {
		int[] res = new int[size];
		BigInteger divisor = BigInteger.ONE;
		while (size-- != 0) {
			res[size] = factoradic.remainder(divisor).intValue();
			factoradic = factoradic.divide(divisor);
			divisor = divisor.add(BigInteger.ONE);
		}
		return res;
	}

	/**
	 * Given a permutation array of size n (containing numbers from 0 to n-1 only once),
	 * modifies the input so it is now the next permutation in lexicographical order.
	 *
	 * @param perm the permutation array (must have [0; n-1])
	 */
	public static void nextPermutation(int[] perm) {
		int n1 = perm.length - 1;
		int i = n1, tmp;
		while (i-- != 0 && perm[i] > perm[i + 1]);
		if (i < 0) {
			for (int k = perm.length; k-- != 0; perm[k] = k);
		} else {
			int j = n1;
			while (perm[i] > perm[j]) j--;
			tmp = perm[i];
			perm[i] = perm[j];
			perm[j] = tmp;

			int r = n1, s = i + 1;
			while (r > s) {
				tmp = perm[r];
				perm[r] = perm[s];
				perm[s] = tmp;
				r--; s++;
			}
		}
	}

	/**
	 * Given a permutation array, computes the Lehmer code array. The permutation
	 * array must contain all digits in [0 ; array.length-1].
	 * <p>
	 * Ex: perm = {3, 5, 1, 0, 4, 2} Lehmer = {3, 4, 1, 0, 1, 0}
	 * <p>
	 * This is done by the diagonal/subtraction method (see
	 * <a href="https://en.wikipedia.org/wiki/Lehmer_code">Lehmer Code</a>)
	 *
	 * <p>
	 * Example:<br>
	 * we focus on 3 and look for every number on its right that are bigger than 3.
	 * We then subtract 1 to those numbers. So 5 becomes 4, and 4 becomes 3. Then we
	 * proceed to the next rank.
	 * <p>
	 * (3), 5, 1, 0, 4, 2<br>
	 * 3, (4), 1, 0, 3, 2<br>
	 * 3, 4, (1), 0, 2, 1<br>
	 * 3, 4, 1, (0), 1, 0<br>
	 * 3, 4, 1, 0, (1), 0<br>
	 * 3, 4, 1, 0, 1, (0) // -> last line = Lehmer code
	 *
	 * @param perm The permutation array.
	 * @return The Lehmer code array.
	 */
	public static int[] lehmer1(int[] perm) {
		int l = perm.length;
		int[] b = new int[l];
		System.arraycopy(perm, 0, b, 0, l);
		for (int i = 0; i < l; i++)
			for (int j = i + 1; j < l; j++)
				if (b[j] > b[i])
					b[j]--;
		return b;
	}

	/**
	 * Alternative method to compute the Lehmer code.
	 * <p>
	 * Count how many numbers to the right are smaller than the pivot. This method
	 * is still O(n²) but it only increments a counter rather than modifying most
	 * array elements, which makes it a bit faster.
	 *
	 * <p>
	 * Also, not that it matters much, this algorithm can start at index 1 instead
	 * of 0. The first cell is always the same as the permutation (by definition)
	 * and processing it is not required to compute the other cells, whereas Lehmer1
	 * has to start the loop at zero or the first batch of decrements is not
	 * applied.
	 *
	 * @param perm The permutation array.
	 * @return The Lehmer code array.
	 */
	public static int[] lehmer2(int[] perm) {
		int l = perm.length;
		int[] b = new int[l];
		if (l == 0)
			return b; // stupid case
		b[0] = perm[0]; // by definition :p
		for (int k = 1; k < l - 1; k++) {
			int i = 0;
			for (int j = k + 1; j < l; ++j)
				if (perm[j] < perm[k])
					i++;
			b[k] = i;
		}
		b[l - 1] = 0; // by definition :p
		return b;
	}

	/**
	 * This is the opposite of lehmer(). Given a Lehmer code array, returns the
	 * original permutation array.
	 *
	 * @param lehmer The Lehmer code array.
	 * @return The corresponding permutation array.
	 */
	public static int[] permFromLehmer(int[] lehmer) {
		int l = lehmer.length;
		int[] perm = new int[l];
		boolean[] ord = new boolean[l];
		for (int i = 0; i < l; i++)
			perm[i] = findNth(ord, lehmer[i]);
		return perm;
	}

	/**
	 * Destructively finds the nth element in b, not counting elements that are true.
	 * Imagine an array of values where some cells are crossed out.
	 * This method is like "return b[n];" after all crossed out cells have been
	 * removed. Note, this was written when b was an int[] (now it's a boolean[])
	 * Another note: this is the perfect place to use a BitSet. Unfortunately,
	 * the performance of BitSet is a lot worse than a boolean[]. Thanks Oracle!
	 *
	 * Be careful, this method ruins b! When the element is found, it gets crossed
	 * out in the original array b.
	 *
	 * @param b The array to find the nth not-crossed element.
	 * @param n The index to find.
	 * @return The nth not-crossed element of b
	 */
	private static int findNth(boolean[] b, int n) {
		for (int i = 0; i < b.length; i++) {
			if (b[i]) continue;
			if (n == 0) {
				b[i] = true;
				return i;
			}
			n--;
		}
		return -1; // should never happen
	}

	/**
	 * An alternate of unlehmer() and permFromLehmer()
	 * O(n²), simpler, smarter, but for some reason, slower than permFromLehmer()
	 * @param lehmer the lehmer code of a permutation.
	 * @return the permutation.
	 */
	public static int[] invlehmer(int[] lehmer) {
		final int len = lehmer.length;
		int[] perm = new int[len];
		int[] cpy = new int[len];
		System.arraycopy(lehmer, 0, cpy, 0, len);
		for (int i = 0; i < len; i++) {
			final int ci = cpy[i];
			int val = ci;
			for (int j = 0; j < i; j++)
				if (cpy[j] <= ci) val++;
				else cpy[j]--;
			perm[i] = val;
		}
		return perm;
	}

	/**
	 * This one does not use a temporary storage. Instead, visited nodes are added N.
	 * This saves memory space, big array creation, and memory copy.
	 * The downside is that the input must now be mutable.
	 * Note: it's the fastest method so far.
	 * @param p a permutation
	 * @return a list of all cycles found in p
	 */
	public static List<int[]> findCycles(int[] p) {
		List<int[]> cycles = new ArrayList<>();         // Stores the result
	    final int N = p.length;
	    int[] buf = new int[N];                         // A big buffer because ArrayList implies boxing of ints
	    for (int i = 0; i < N; i++) {                   // Pick up a cycle starting point
	        if (p[i] >= N) continue;                    // If the element is already part of a cycle, pick up another one
	        int j = i;                                  // A running index
	        int index = 0;                              // An index to keep track of the buffer progress
	        do {                                        // Main cycle algorithm
	            buf[index++] = j;                       // Add the current index
	            p[j] += N;                              // Mark the element so it doesn't get processed twice
	        } while ((j = p[j] - N) != i);              // Stop the cycle when we're back to square 1
	        int[] cur = new int[index];                 // Create the actual cycle, now that we know its size
	        System.arraycopy(buf, 0, cur, 0, index);    // And get the data from the buffer
	        cycles.add(cur);                            // Add the new cycle to the result
	    }
	    for (int i = 0; i < N; i++) p[i] -= N;          // In order to avoid allocating memory, the original array has been altered; Restore it now
	    return cycles;
	}

	/**
	 * Applies the cycles to given permutation ar.
	 * @param ar a permutation (array of all elements between 0 and N-1)
	 * @param cycles a list of cycles
	 * @return a new permutation of the cycles applied to ar
	 */
	public static int[] cyclePerm(int[] ar, List<int[]> cycles) {
		int[] a = new int[ar.length];
		for (var c : cycles) {
			int n = c.length;
			int tmp = ar[c[0]];
			for (int i = 1; i < n; i++)
				a[c[i - 1]] = ar[c[i]];
			a[c[n - 1]] = tmp;
		}
		return a;
	}

	/**
	 * Gives the parity of the permutation using its cycle decomposition.
	 * A cycle of length 2 is a transposition. Counting those transpositions is
	 * what parity is all about. Any permutation of a finite set can be decomposed
	 * into a composition of basic transpositions. For example, let's consider
	 * p = {2 3 1 4} which gives the following cycles: (2 3 1)(4)
	 * That length 3 cycle can be decomposed into (2 3)(3 1).
	 * Singletons, like (4), don't change anything (identity) while transpositions,
	 * like (2 3) and (3 1), change the parity. So a cycle changes the parity when
	 * its length is even.
	 */
	public static boolean isEven(List<int[]> cycles) {
	    int acc = 0;
	    for (var x : cycles)
	        acc += x.length - 1 & 1;
	    return (acc & 1) == 0;
	}

	/**
	 * TODO Prove that's true (test5 seems to agree)
	 * Since a Lehmer code is all about counting inversions, it can be used
	 * to quickly give the parity of a permutation.
	 * Note: computing cycles is faster than computing lehmer so if the parity
	 * alone is needed, use the other function.
	 * @param Important! A Lehmer code
	 * @return true if the permutation represented by this Lehmer code is even
	 */
	public static boolean isEven(int[] lehmer) {
		int acc = 0;
		for (var x : lehmer)
			acc += x;
		return (acc & 1) == 0;
	}

	// ---------------------------------------------------------------------

	/**
	 * Simply prints out an array.
	 *
	 * @param b The array to display.
	 */
	public static void displayArray(int[] b) {
		System.out.println(Arrays.toString(b));
	}

	public static void displayCycles(List<int[]> cycles) {
		System.out.println(cyclesToString(cycles));
	}

	public static String cyclesToString(List<int[]> cycles) {
		StringBuilder sb = new StringBuilder();
		for (var c : cycles) {
			sb.append('(');
			for (var i : c) { sb.append(i).append(' '); }
			sb.deleteCharAt(sb.length()-1).append(')');
		}
		return sb.toString();
	}

	/**
	 * Fisher-Yates shuffle algorithm.
	 * <p>Shuffles the given array in-place, in O(n).
	 *
	 * @param array the array to shuffle (will be modified)
	 */
	public static void shuffle(int[] array) {
		int n = array.length;
		while (n --> 1) {
			int r = rand.nextInt(n + 1);
			int tmp = array[n];
			array[n] = array[r];
			array[r] = tmp;
		}
	}

	/**
	 * Creates a permutation array of size <code>size</code>.
	 * <p>The array contains all number between 0 and size-1, no dup.
	 *
	 * The following fancy methods are slow (first 2) or extremely slow (last 2)
	 * int[] perm = new int[N]; Arrays.setAll(perm, x -> x+1);
	 * int[] perm = IntStream.rangeClosed(0, N-1).forEach(i -> perm[i] = i);
	 * int[] perm = IntStream.iterate(0, i -> i + 1).limit(N).toArray();
	 * int[] perm = IntStream.iterate(0, i -> i < N, i -> i + 1).toArray();
	 *
	 * @param size the length of the array (or number of elements)
	 * @return a random permutation of [0, 1, ..., size-1]
	 */
	public static int[] getPermutation(int size) {
		int[] perm = new int[size];
		while (size --> 0) perm[size] = size;
		return perm;
	}

	public static void main(String[] args) {
		test2(); // benchmark lehmer
	}

	public static void test2() {
		final int N = 10_000_000;
		long start, elapsed;

		System.out.println("Creating an array of " + N + " elements.");
		start = System.currentTimeMillis();
		int[] perm = getPermutation(N);
		shuffle(perm);
		elapsed = System.currentTimeMillis() - start;
		System.out.println("Creation and shuffle: " + elapsed + " ms");

		start = System.currentTimeMillis();
		lehmer(perm);
		elapsed = System.currentTimeMillis() - start;
		System.out.println("Lehmer duration: " + elapsed + " ms");

		System.out.println("Done");
	}

	public static int[] toIntArray(String[] s) throws NumberFormatException {
		int[] r = new int[s.length];
		for (int i = 0; i < s.length; i++)
			r[i] = Integer.parseInt(s[i]);
		return r;
	}

}
