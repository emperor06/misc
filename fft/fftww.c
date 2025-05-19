#include <stdio.h>
#include <fftw3.h>

#define N 4

int main(int argc, char** argv)
{
    double A[N] = {1, -1, 2, 1};
    double *in;
    fftw_complex *out;
    fftw_plan p;
    in = (double*) fftw_malloc(sizeof(double) * N);
    out = (fftw_complex*) fftw_malloc(sizeof(fftw_complex) * N);
    for (int i = 0; i < N; i++) in[i] = A[i];
    for (int i = 0; i < N; i++) printf("%f ", out[i]); printf("\n");
    p = fftw_plan_dft_r2c_1d(N, in, out, FFTW_FORWARD);
//    fftw_execute(p); /* repeat as needed */
    for (int i = 0; i < N; i++) printf("%f ", out[i]); printf("\n");
//    fftw_destroy_plan(p);
    fftw_free(in); fftw_free(out);

    return 0;
}
