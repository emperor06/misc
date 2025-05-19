using PermutationsCS;
using System;
using System.Numerics;
using System.Text;

public class Permutations
{
    public static int[] Lehmer(int[] perm)
    {
        int len = perm.Length;
        int[] lehmer = new int[len];
        ToggleArray ta = new ToggleArray(len);
        for (int i = 0; i < len - 1; i++) {
            int n = ta.NumDLE(perm[i]);
            ta.SetUp(n);
            lehmer[i] = n;
        }
        return lehmer;
    }

    public static int[] Unlehmer(int[] lehmer)
    {
        int len = lehmer.Length;
        int[] perm = new int[len];
        ToggleArray ta = new ToggleArray(len);
        for (int i = 0; i < len; i++)
            perm[i] = ta.SetUp(lehmer[i]);
        return perm;
    }

    public static BigInteger Factoradic(int[] lehmer)
    {
        BigInteger n = BigInteger.Zero;
        BigInteger fact = BigInteger.One;
        for (int i = 1; i <= lehmer.Length; i++) {
            n += fact * lehmer[lehmer.Length - i];
            fact *= i;
        }
        return n;
    }

    public static int[] InverseFactoradic(BigInteger factoradic)
    {
        BigInteger divisor = BigInteger.One;
        Stack<int> stack = new Stack<int>();
        int n = 0;
        do {
            stack.Push((int) (factoradic % divisor));
            factoradic /= divisor;
            divisor += BigInteger.One;
            n++;
        } while (factoradic != BigInteger.Zero);
        int[] res = new int[n];
        n = 0;
        while (stack.Count > 0)
            res[n++] = stack.Pop();
        return res;
    }

    public static int[] InverseFactoradic(BigInteger factoradic, int size)
    {
        int[] res = new int[size];
        BigInteger divisor = BigInteger.One;
        while (size-- != 0) {
            res[size] = (int) (factoradic % divisor);
            factoradic /= divisor;
            divisor += BigInteger.One;
        }
        return res;
    }

    public static void NextPermutation(int[] perm)
    {
        int n1 = perm.Length - 1;
        int i = n1;
        while (i-- != 0 && perm[i] > perm[i + 1]) ;
        if (i < 0) {
            for (int k = perm.Length; k-- != 0; perm[k] = k) ;
        } else {
            int j = n1;
            while (perm[i] > perm[j]) j--;
            (perm[i], perm[j]) = (perm[j], perm[i]);
            int r = n1, s = i + 1;
            while (r > s) {
                (perm[r], perm[s]) = (perm[s], perm[r]);
                r--; s++;
            }
        }
    }

    public static int[] Lehmer1(int[] perm)
    {
        int l = perm.Length;
        int[] b = new int[l];
        Array.Copy(perm, 0, b, 0, l);
        for (int i = 0; i < l; i++)
            for (int j = i + 1; j < l; j++)
                if (b[j] > b[i])
                    b[j]--;
        return b;
    }

    public static int[] Lehmer2(int[] perm)
    {
        int l = perm.Length;
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

    public static int[] PermFromLehmer(int[] lehmer)
    {
        int l = lehmer.Length;
        int[] perm = new int[l];
        bool[] ord = new bool[l];
        for (int i = 0; i < l; i++)
            perm[i] = FindNth(ord, lehmer[i]);
        return perm;
    }

    private static int FindNth(bool[] b, int n)
    {
        for (int i = 0; i < b.Length; i++) {
            if (b[i]) continue;
            if (n == 0) {
                b[i] = true;
                return i;
            }
            n--;
        }
        return -1; // should never happen
    }

    public static int[] Invlehmer(int[] lehmer)
    {
        int len = lehmer.Length;
        int[] perm = new int[len];
        int[] cpy = new int[len];
        Array.Copy(lehmer, 0, cpy, 0, len);
        for (int i = 0; i < len; i++) {
            int ci = cpy[i];
            int val = ci;
            for (int j = 0; j < i; j++)
                if (cpy[j] <= ci) val++;
                else cpy[j]--;
            perm[i] = val;
        }
        return perm;
    }
    public static List<int[]> FindCycles(int[] p)
    {
        List<int[]> cycles = new List<int[]>();
        int N = p.Length;
        int[] buf = new int[N];
        for (int i = 0; i < N; i++) {
            if (p[i] >= N) continue;
            int j = i;
            int index = 0;
            do {
                buf[index++] = j;
                p[j] += N;
            } while ((j = p[j] - N) != i);
            int[] cur = new int[index];
            Array.Copy(buf, 0, cur, 0, index);
            cycles.Add(cur);
        }
        for (int i = 0; i < N; i++) p[i] -= N;
        return cycles;
    }

    public static int[] CyclePerm(int[] ar, List<int[]> cycles)
    {
        int[] a = new int[ar.Length];
        foreach (var c in cycles) {
            int n = c.Length;
            int tmp = ar[c[0]];
            for (int i = 1; i < n; i++)
                a[c[i - 1]] = ar[c[i]];
            a[c[n - 1]] = tmp;
        }
        return a;
    }

    public static bool IsEven(List<int[]> cycles)
    {
        int acc = 0;
        foreach (var x in cycles)
            acc += x.Length - 1 & 1;
        return (acc & 1) == 0;
    }

    public static bool IsEven(int[] lehmer)
    {
        int acc = 0;
        foreach (var x in lehmer)
            acc += x;
        return (acc & 1) == 0;
    }

    // ---------------------------------------------------------------------

    public static void DisplayArray(int[] b)
    {
        Console.WriteLine(string.Join(", ", b));
    }

    public static void DisplayCycles(List<int[]> cycles)
    {
        Console.WriteLine(CyclesToString(cycles));
    }

    public static string CyclesToString(List<int[]> cycles)
    {
        StringBuilder sb = new StringBuilder();
        foreach (var c in cycles) {
            sb.Append('(');
            foreach (var i in c)
                sb.Append(i).Append(' ');
            sb.Remove(sb.Length - 1, 1).Append(')');
        }
        return sb.ToString();
    }

    private static uint currand = 123456;
    private static uint nextInt()
    {
        currand = (16807 * currand) % 2147483647;
        return currand;
    }

    public static void Shuffle(int[] array)
    {
        uint n = (uint) array.Length;
        while (n --> 1) {
            uint r = nextInt() % (n + 1);
            (array[r], array[n]) = (array[n], array[r]);
        }
    }

    public static int[] GetPermutation(int size)
    {
        int[] perm = new int[size];
        while (size --> 0) perm[size] = size;
        return perm;
    }

    public static void Main(string[] args)
    {
        if (args.Length != 0) {
            int[] p = Array.ConvertAll(args, int.Parse);
            Manual(p);
        } else {
            //Test1();   // basic to and from lehmer
            Test2(); // benchmark lehmer
            //Test3();   // basic cycles
            //Test4(); // benchmark cycles
            //Test5(); // success, check parity with lehmer
            //Test6();   // benchmark isEven (lehmer vs cycle)
        }
    }

    public static void Test1()
    {
        var perm   = GetPermutation(10);
        Shuffle(perm);
        var lehmer = Lehmer(perm);
        var f      = Factoradic(lehmer);
        var fi     = InverseFactoradic(f);
        var p      = Unlehmer(fi);
        //var q      = Invlehmer(fi);
        Console.WriteLine("Perm       [{0}]", string.Join(", ", perm));
        Console.WriteLine("Lehmer     [{0}]", string.Join(", ", lehmer));
        //Console.WriteLine("Lehmer1    [{0}]", string.Join(", ", Lehmer1(perm)));
        //Console.WriteLine("Lehmer2    [{0}]", string.Join(", ", Lehmer2(perm)));
        Console.WriteLine("Factorad   [{0}]", f);
        Console.WriteLine("Factinv    [{0}]", string.Join(", ", fi));
        Console.WriteLine("Unlehmer   [{0}]", string.Join(", ", p));
        //Console.WriteLine("Invlehmer  [{0}]", string.Join(", ", q));
    }

    public static void Test2()
    {
        const int N = 10_000_000;

        Console.WriteLine("Creating an array of " + N + " elements.");
        var watch = System.Diagnostics.Stopwatch.StartNew();
        int[] perm = GetPermutation(N);
        Shuffle(perm);
        watch.Stop();
        Console.WriteLine("Creating and shuffle: " + watch.ElapsedMilliseconds + " ms");

        watch = System.Diagnostics.Stopwatch.StartNew();
        Lehmer(perm);
        watch.Stop();
        Console.WriteLine("Lehmer duration: " + watch.ElapsedMilliseconds + " ms");

        Console.WriteLine("Done");
    }

    public static void Test3()
    {
        Console.WriteLine();
        Console.WriteLine("Cycle representation");
        int[] p = GetPermutation(12);
        Shuffle(p);
        Console.WriteLine("Perm      [{0}]", string.Join(", ", p));
        var cycles = FindCycles(p);
        Console.WriteLine("Cycles    {0}", CyclesToString(cycles));
        int[] q = CyclePerm(GetPermutation(12), cycles);
        Console.WriteLine("Perm      [{0}]", string.Join(", ", q));
    }

    public static void Test4()
    {
        const int N = 10_000_000;
        Console.WriteLine();
        Console.WriteLine("Generating an array of size " + N + " and shuffle");
        int[] p = GetPermutation(N);
        Shuffle(p);
        Console.WriteLine("Finding all cycles in the permutation");
        var watch = System.Diagnostics.Stopwatch.StartNew();
        var cycles = FindCycles(p);
        watch.Stop();
        Console.WriteLine("findCycles duration: " + watch.ElapsedMilliseconds + " ms");

        watch = System.Diagnostics.Stopwatch.StartNew();
        CyclePerm(p, cycles);
        watch.Stop();
        Console.WriteLine("cyclePerm duration: " + watch.ElapsedMilliseconds + " ms");
    }

    public static void Test5()
    {
        Console.WriteLine();
        Console.WriteLine("Bench test of IsEven()");
        for (int i = 1_000_000; i < 1_000_300; i++) {
            int[] p = GetPermutation(i);
            var lehmer = Lehmer(p);
            var cycles = FindCycles(p);
            if (IsEven(lehmer) != IsEven(cycles)) {
                Console.WriteLine("Problem with i = " + i);
            }
        }
        Console.WriteLine("test5 done");
    }

    public static void Test6()
    {
        int N = 10_000_000;
        int[] p = GetPermutation(N);
        Shuffle(p);

        bool parity;
        var watch = System.Diagnostics.Stopwatch.StartNew();
        parity = IsEven(Lehmer(p));
        watch.Stop();
        Console.WriteLine("isEven(lehmer) duration: " + watch.ElapsedMilliseconds + " ms (" + parity + ")");

        watch = System.Diagnostics.Stopwatch.StartNew();
        parity = IsEven(FindCycles(p));
        watch.Stop();
        Console.WriteLine("isEven(cycles) duration: " + watch.ElapsedMilliseconds + " ms (" + parity + ")");
    }

    public static int[] ToIntArray(string[] s)
    {
        int[] r = new int[s.Length];
        for (int i = 0; i < s.Length; i++)
            r[i] = Int32.Parse(s[i]);
        return r;
    }

    public static bool IsValid(int[] p)
    {
        int N = p.Length;
        if (N == 0) return true;
        try {
            bool[] x = new bool[N];
            for (int i = 0; i < N; i++)
                x[p[i]] = true;
            for (int i = 0; i < N; i++)
                if (!x[i]) return false;
        }
        catch (Exception) { return false; }
        return true;
    }

    public static void Manual(int[] perm)
    {
        // First, check this permutation is a valid one
        if (!IsValid(perm)) {
            Console.WriteLine("Invalid permutation: a permutation must contain all the number between 0 and N, once.");
            return;
        }
        var lehmer = Lehmer(perm);
        var fac = Factoradic(lehmer);
        int parity = 0;
        for (int i = 0; i < lehmer.Length; i++)
            parity += lehmer[i];
        Console.WriteLine("Perm        {0}", string.Join(", ", perm));
        Console.WriteLine("Lehmer      {0}", string.Join(", ", lehmer));
        Console.WriteLine("Factoradic  {0}", fac);
        Console.WriteLine("Parity      {0}", (parity % 2 == 0) ? "even" : "odd");
    }
}
