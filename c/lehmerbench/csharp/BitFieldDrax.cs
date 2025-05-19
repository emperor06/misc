namespace PermutationsCS
{

    /// <summary>
    /// A simple boolean array backed with ints
    /// for memory size and performance.
    /// Note: it's basically a lighter version of BitSet with no checks, no growing, and ints instead of longs
    /// Note: you would normally use q = n/32 and r = n%32 but:
    ///   - C# is faster when using bitshift instead of arithmetic (yeah, neither the compiler nor the JIT do any optimisation)
    ///   - 1 << bitIndex works just as well as 1 << (bitIndex % 32) or 1 << (bitIndex & 31). The left shift already handles this (not documented?)
    /// </summary>
    public class BitFieldDrax : BitField
    {
        private readonly int size;
        private readonly int[] words;

        public BitFieldDrax(int size)
        {
            this.size = size;
            words = new int[((size - 1) >> 5) + 1];
        }

        public int Size()
        {
            return size;
        }

        public void Set(int bitIndex)
        {
            words[bitIndex >> 5] |= (1 << bitIndex);
        }

        public void Set()
        {
            Array.Fill(words, -1);
        }

        public void Clear(int bitIndex)
        {
            words[bitIndex >> 5] &= ~(1 << bitIndex);
        }

        public void Clear()
        {
            Array.Fill(words, 0);
        }

        public bool Get(int bitIndex)
        {
            return (words[bitIndex >> 5] & (1 << bitIndex)) != 0;
        }

        public void Set(int bitIndex, bool b)
        {
            if (b) Set(bitIndex);
            else Clear(bitIndex);
        }

        public override string ToString()
        {
            var sb = new System.Text.StringBuilder();
            sb.Append("[");
            for (int i = 0; i < Size() - 1; i++) {
                sb.Append(Get(i));
                sb.Append(", ");
            }
            sb.Append(Get(Size() - 1));
            sb.Append("]");
            return sb.ToString();
        }
    }
}