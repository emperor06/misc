// Fast Fourier Transform

public class Fft {
    public static final float TAU = (float) (2*Math.PI);
    static class Complex {
        public float re;
        public float im;

        public Complex(float real, float imaginary) {
            this.re = real;
            this.im = imaginary;
        }

        public String toString() {
            return "(" + this.re + ", " + this.im + ")";
        }

        public Complex myclone() {
            return new Complex(this.re, this.im);
        }

        public Complex add(Complex c) {
            this.re += c.re;
            this.im += c.im;
            return this;
        }

        public Complex sub(Complex c) {
            this.re -= c.re;
            this.im -= c.im;
            return this;
        }

        public Complex mul(Complex c) {
            float r = this.re * c.re - this.im * c.im;
            float i = this.re * c.im + this.im * c.re;
            this.re = r;
            this.im = i;
            return this;
        }

        public Complex mul(float f) {
            this.re *= f;
            this.im *= f;
            return this;
        }

        public static Complex add(Complex a, Complex b) {
            return a.myclone().add(b);
        }

        public static Complex sub(Complex a, Complex b) {
            return a.myclone().sub(b);
        }

        public static Complex mul(Complex a, Complex b) {
            return a.myclone().mul(b);
        }

        public static Complex expi(float theta) {
            return new Complex((float) Math.cos(theta), (float) Math.sin(theta));
        }
    }

    public static int c1 = 0;
    public static int c2 = 0;

    public static Complex[] FFT(Complex[] P, boolean inverse) {
        c1++;
        final int n = P.length;
        final int n2 = n/2;
        if (n == 1) {
            return P;
        }
        final float sign = inverse ? -1f : 1f;
        final Complex w = Complex.expi(sign*TAU/n);
        Complex[] Pe = new Complex[n2];
        Complex[] Po = new Complex[n2];
        for (int i = 0; i < n2; i++) {
            Pe[i] = P[2*i];
            Po[i] = P[2*i+1];
        }
        Complex[] ye = FFT(Pe, inverse);
        Complex[] yo = FFT(Po, inverse);
        Complex[] y = new Complex[n];
        Complex wk = new Complex(1f, 0f);
        for (int j = 0; j < n2; j++) {
            c2++;
            Complex yowk = Complex.mul(yo[j], wk);
            y[j] = Complex.add(ye[j], yowk);
            y[j + n2] = Complex.sub(ye[j], yowk);
            wk.mul(w);
        }
        return y;
    }

    public static Complex[] IFFT(Complex[] P) {
        Complex[] res = FFT(P, true);
        for (int i = 0; i < P.length; i++)
            res[i].mul((float)(1. / P.length));
        return res;
    }

    public static void printr(Object[] o) {
        System.out.println(java.util.Arrays.toString(o));
    }

    public static Complex[] MUL(Complex[] A, Complex[] B) {
        int n = 1<<(32 - Integer.numberOfLeadingZeros(A.length + B.length - 2));
        Complex[] a = new Complex[n];
        Complex[] b = new Complex[n];
        System.arraycopy(A, 0, a, 0, A.length);
        System.arraycopy(B, 0, b, 0, B.length);
        for (int i = A.length; i < n; i++)
            a[i] = new Complex(0, 0);
        for (int i = B.length; i < n; i++)
            b[i] = new Complex(0, 0);
        Complex[] X = FFT(a, false);
        Complex[] Y = FFT(b, false);
        Complex[] Z = new Complex[n];
        for (int i = 0; i < n; i++)
            Z[i] = Complex.mul(X[i], Y[i]);
        Complex[] C = IFFT(Z);
        return C;
    }

    public static void main(String[] args) {
        int N = 140000;
        Complex[] A = new Complex[N];
        Complex[] B = new Complex[N];
        for (int i = 0; i < N; i++) {
            A[i] = new Complex(i + 1, 0);
            B[i] = new Complex(1400 - i, 0);
        }

        //import datetime
        //start = datetime.datetime.now()
        for (int i = 0; i < 1; i++) {
            MUL(A, B);
        }
        System.out.println(c1);
        System.out.println(c2);
        //elapsed = datetime.datetime.now() - start;
        //print(elapsed)


        //Complex[] X = {new Complex(1, 0), new Complex(-1, 0), new Complex(2, 0), new Complex(1, 0)};
        //Complex[] Y = {new Complex(-3, 0), new Complex(2, 0), new Complex(-4, 0), new Complex(2, 0)};
        //let C = [-3, 5, -12, 7, -8, 0, 2]
        //System.out.println(java.util.Arrays.toString(MUL(X, Y)));
    }
}
