/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package teset;

import java.util.ArrayList;
import java.util.List;

/**
 *
 * @author drax
 */
public class Teset {

    public static void main(String[] args) {

        long start = System.currentTimeMillis();
        genpass1();
        long dur = System.currentTimeMillis() - start;
        System.out.println("Duration = " + dur + "ms");

        /*
        for (String s : res){
            System.out.println(s);
        }
        */
    }

    public static List<String> genpass1(){
        char[] a = "abcdefghijklmonpqrstuvwxyz0123456789".toCharArray();
        int b = a.length;
        int maxChars = 6;
        char[] res = new char[maxChars];
        List<String> buf = new ArrayList();

        int[] pos = new int[maxChars];
        for (int i = 0; i < maxChars; i++) pos[i] = -1;
        int I = maxChars - 1;
        int j;
        int start = I;
        long cpt = 0;

        while (true) {
            j = I - 1;
            for (int i = 0; i < b; i++) {
                res[I] = a[i];
                //buf.add(new String(res, start, maxChars - start));
                cpt++;
            }
            while (j >= 0 && pos[j] == b - 1) {
                pos[j] = 0;
                res[j--] = a[0];
            }
            if (j < 0) break;
            if (j < start) start = j;
            pos[j]++;
            res[j] = a[pos[j]];
        }
        System.out.println("Iter = " + cpt);
        return buf;
    }

    public static List<String> genpass2() {
        char[] a = "abcdefghijklmonpqrstuvwxyz0123456789".toCharArray();
        int b = a.length;
        int maxChars = 6;
        char[] res = new char[maxChars];
        List<String> buf = new ArrayList();
        char[] buf2 = new char[maxChars];

	int rank = 0;
	long M = (long)Math.pow(b, maxChars);
        int n;
	boolean found = false;
	for (int N = 0; N < M; ++N)
	{
		n = N;
		rank = maxChars;
		do
		{
			res[--rank] = a[n % b];
			n = n / b;
		} while (n != 0);
		//buf.add(new String(res, rank, maxChars - rank));
                for (int k = rank; k < maxChars; k++) buf2[k] = res[k];
	}
        return buf;
    }
}
