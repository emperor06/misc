
import java.util.Arrays;

/**
 * A simple boolean array backed with ints
 * for memory size and performance.
 * Note: it's basically a lighter version of BitSet with no checks, no growing, and ints instead of longs
 * Note: you would normally use q = n/32 and r = n%32 but:
 *   - Java is faster when using bitshift instead of arithmetic (yeah, neither the compiler nor the JIT do any optimisation)
 *   - 1 << bitIndex works just as well as 1 << (bitIndex % 32) or 1 << (bitIndex & 31). The left shift already handles this (not documented?)
 * @author drax
 */
public class BitFieldDrax implements BitField {
    private final int size;
	private final int[] words;

	public BitFieldDrax(int size) {
		this.size = size;
		words = new int[((size - 1) >> 5) + 1];
	}

	@Override
	public int size() {
		return size;
	}

	@Override
	public void set(int bitIndex) {
		words[bitIndex >> 5] |= (1 << bitIndex);
	}

	@Override
	public void set() {
		Arrays.fill(words, -1);
	}

	@Override
	public void clear(int bitIndex) {
		words[bitIndex >> 5] &= ~(1 << bitIndex);
	}

	@Override
	public void clear() {
		Arrays.fill(words, 0);
	}

	@Override
	public boolean get(int bitIndex) {
        return (words[bitIndex >> 5] & (1 << bitIndex)) != 0;
	}

	@Override
	public void set(int bitIndex, boolean b) {
		if (b) set(bitIndex);
		else clear(bitIndex);
	}


	@Override
		public String toString() {
			StringBuilder sb = new StringBuilder();
			sb.append("[");
			for (int i = 0; i < size() - 1; i++) {
				sb.append(get(i));
				sb.append(", ");
			}
			sb.append(get(size() - 1));
			sb.append("]");
			return sb.toString();
		}
}
