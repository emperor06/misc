namespace PermutationsCS
{
    public class ToggleArray
    {
        private int[] bsearch;
        private BitField toggles;
        private int upCount;

        public ToggleArray(int n)
        {
            bsearch = new int[n];
            toggles = new BitFieldDrax(n);
            AllDown();
        }

        public int DownCount()
        {
            return bsearch.Length - upCount;
        }

        private void Init(int a, int b)
        {
            if ((b - a) != 0) {
                int t = (b + a)/2;
                Init(a, t);
                Init(t + 1, b);
            }
            bsearch[b] = b - a + 1;
        }

        public void AllUp()
        {
            upCount = bsearch.Length;
            toggles.Set();
            Init(0, bsearch.Length - 1);
            bsearch[bsearch.Length - 1] = 1;
        }
        public void AllDown()
        {
            upCount = 0;
            toggles.Clear();
            Array.Fill(bsearch, 0);
        }

        public int GetUpIndex(int k)
        {
            if (k >= upCount) return 0;
            int a = 0;
            int b = bsearch.Length - 1;
            while (true) {
                int t = (b + a) / 2;
                if (bsearch[t] == k + 1 && toggles.Get(t)) {
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

        public int SetDown(int k)
        {
            if (k >= upCount) return 0;
            upCount--;
            int a = 0;
            int b = bsearch.Length - 1;
            while (true) {
                int t = (b + a) / 2;
                if (bsearch[t] == k + 1 && toggles.Get(t)) {
                    bsearch[t]--;
                    toggles.Clear(t);
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

        public int SetUp(int k)
        {
            if (k >= DownCount()) return 0;
            upCount++;
            int a = 0;
            int b = bsearch.Length - 1;
            while (true) {
                int t = (b + a) / 2;
                int slt = t - a + 1 - bsearch[t];
                if ((slt == k + 1) && (!toggles.Get(t))) {
                    bsearch[t]++;
                    toggles.Set(t);
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

        public int NumULE(int i)
        {
            if (i >= bsearch.Length) return 0;
            int a = 0;
            int b = bsearch.Length-1;
            int ns = 0;
            while (a != b) {
                int t = (b + a)/2;
                if (i <= t) {
                    b = t;
                } else {
                    ns += bsearch[t];
                    a = t + 1;
                }
            }
            return ns;
        }


        public int NumULI(int i)
        {
            return NumULE(i) + (toggles.Get(i) ? 1 : 0);
        }


        public int NumURE(int i)
        {
            return upCount - NumULI(i);
        }


        public int NumURI(int i)
        {
            return upCount - NumULE(i);
        }

        public int NumDLE(int i)
        {
            return i - NumULE(i);
        }

        public int NumDLI(int i)
        {
            return i - NumULE(i) + (!toggles.Get(i) ? 1 : 0);
        }


        public int NumDRE(int i)
        {
            return DownCount() - NumDLI(i);
        }

        public int numDRI(int i)
        {
            return DownCount() - i + NumULE(i);
        }
    }
}
