namespace PermutationsCS
{
    /// <summary>
    /// An interface defining the basic operations one expects from a BitField.
    /// 3 Implementations are given:
    /// 1. Using C#'s bool[]
    /// 2. Using C#'s BitArray
    /// 3. A custom implementation similar to BitArray but lighter (no checks)
    /// </summary>
    public interface BitField
    {
        /// <summary>
        /// The number of bits in this BitField.
        /// </summary>
        /// <returns>The size of the BitField</returns>
        int Size();

        /// <summary>
        /// Sets all the bits to 1.
        /// </summary>
        void Set();

        /// <summary>
        /// Clears all the bits (sets them to 0).
        /// </summary>
        void Clear();

        /// <summary>
        /// Sets the nth bit.
        /// </summary>
        /// <param name="n">Bit number, starting at 0</param>
        void Set(int n);

        /// <summary>
        /// Clears the nth bit.
        /// </summary>
        /// <param name="n">Bit number, starting at 0</param>
        void Clear(int n);

        /// <summary>
        /// For convenience, sets the nth bit to the given value.
        /// </summary>
        /// <param name="n">Bit number, starting at 0</param>
        /// <param name="b">Value of the bit</param>
        void Set(int n, bool b);

        /// <summary>
        /// Gets the value of the nth bit.
        /// </summary>
        /// <param name="n">Bit number, starting at 0</param>
        /// <returns>The value of that bit</returns>
        bool Get(int n);
    }
}

