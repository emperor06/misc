
/**
 * An interface defining the basic operations one expects from a BitField.
 * 3 Implementations are given:
 * 1. Using Java's boolean[]
 * 2. Using Java's BitSet
 * 3. A custom implementation similar to BitSet but lighter (no checks)
 * 
 * @author drax
 *
 */
public interface BitField {
	
	/**
	 * The number of bits in this BitField.
	 * @return the size of the BitField
	 */
	public int size();
	
	/**
	 * Sets all the bits to 1.
	 */
	public void set();
	
	/**
	 * Clears all the bits (sets them to 0).
	 */
	public void clear();
	
	/**
	 * Sets the nth bit.
	 * @param n bit number, starting at 0
	 */
	public void set(int n);
	
	/**
	 * Clears the nth bit.
	 * @param n bit number, starting at 0
	 */
	public void clear(int n);
	
	/**
	 * For convenience, sets the nth bit to the given value.
	 * @param n bit number, starting at 0
	 * @param b value of the bit
	 */
	public void set(int n, boolean b);
	
	/**
	 * Gets the value of the nth bit.
	 * @param n bit number, starting at 0
	 * @return the value of that bit.
	 */
	public boolean get(int n);
	
}
