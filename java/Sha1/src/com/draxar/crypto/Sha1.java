package com.draxar.crypto;

import java.io.BufferedInputStream;
import java.io.FileInputStream;
import java.io.IOException;
import java.nio.ByteBuffer;
import java.nio.IntBuffer;
import java.util.Arrays;

/**
 * Sha1 Java implementation.
 * @author drax
 */
public class Sha1 {

// Round function helpers -------------------------------------------------------
	private static final int K1 = 0x5a827999;
	private static final int K2 = 0x6ed9eba1;
	private static final int K3 = 0x8f1bbcdc;
	private static final int K4 = 0xca62c1d6;
	private static int rotl(int x, int n) { return (x << n) | (x >>> (32 - n)); }
	private static int F1(int b,int c, int d) { return d ^ (b & (c ^ d)); }
	private static int F2(int b,int c, int d) { return b ^ c ^ d; }
	private static int F3(int b,int c, int d) { return (b & c) | (d & (b | c)); }
	private static int F4(int b,int c, int d) { return b ^ c ^ d; }
	private static int M(int[] x, int i) {
		int t = x[i & 15] ^ x[(i-14) & 15] ^ x[(i-8) & 15] ^ x[(i-3) & 15];
		return x[i & 15] = rotl(t, 1);
	}
//-------------------------------------------------------------------------------

	private int	A = 0x67452301;
	private int	B = 0xefcdab89;
	private int	C = 0x98badcfe;
	private int	D = 0x10325476;
	private int	E = 0xc3d2e1f0;
	private int buflen = 0;
	private long datalen = 0;
	private byte[] buf = new byte[64];

	private static String intToHex(int i) {
		return Long.toHexString(0xffffffff00000000L | i).substring(8);
	}

	public static String fromFile(String filename) throws IOException {
		Sha1 sha = new Sha1();
		try (var bis = new BufferedInputStream(new FileInputStream(filename))) {
			byte[] buf = new byte[0x100];
			int bytes;
			while ((bytes = bis.read(buf)) != -1)
				sha.update(buf, bytes);
		}
		sha.finish();
		return sha.toString();
	}

	/**
	 * After Sha1 is constructed, call this method to feed it with the data to be hashed.
	 * Use len to specify how many useful bytes to take.
	 * @param data The bytes to hash.
	 * @param len The number of bytes to hash [data[0], data[len])
	 */
	public void update(byte[] data, int len) {
		int start = 0;
		datalen += len;
		// First, fill up the current buffer
		if (buflen != 0) {
			int qty = Math.min(len, 64 - buflen);
			System.arraycopy(data, start, buf, buflen, qty);
			len -= qty;
			buflen += qty;
			start += qty;
			if (buflen == 64)
				process();
		}
		// Then, batch process blocks of 512 bits
		if (len != 0) {
			int d = len / 64;
			int r = len % 64;
			while (d --> 0) {
				System.arraycopy(data, start, buf, 0, 64);
				process();
				start += 64;
			}
			System.arraycopy(data, start, buf, 0, r);
	        buflen = r;
		}
	}

	/**
	 * Call this once all the data has been sent. This method adds the sha1 padding.
	 */
	public void finish() {
		buf[buflen++] = -128;                               // Add the '1' bit
		if (buflen > 56) {                                  // no room for datalen, we'll need a new packet
			Arrays.fill(buf, buflen, 64, (byte)0);          // zero out all we can
			process();                                      // and process this 'one-before-the-last' packet
		}
		Arrays.fill(buf, buflen, 56, (byte)0);              // zero out everything after the '1' bit, except for the last 8 bytes
		byte[] dlen = ByteBuffer.allocate(8).putLong(datalen * 8).array(); // prepare datalen in bits
		System.arraycopy(dlen, 0, buf, 56, 8);              // add datalen in bits to finish the padding
		process();
	}

	/**
	 * Converts the sha1 state to a readable hex string: the 160 bit sha1 digest.
	 */
	@Override
	public String toString() {
		StringBuilder sb = new StringBuilder();
		sb.append(intToHex(A));
		sb.append(intToHex(B));
		sb.append(intToHex(C));
		sb.append(intToHex(D));
		sb.append(intToHex(E));
		return sb.toString();
	}

	/**
	 * Process a full 512 bit block of data using sha1 rounds.
	 * This updates the state.
	 */
	private void process() {
		buflen = 0;
		// Convert the byte buffer buf to an big endian int array
		IntBuffer intBuf = ByteBuffer.wrap(buf).asIntBuffer();
		int[] x = new int[intBuf.remaining()];
		intBuf.get(x);
		int a = A, b = B, c = C, d = D, e = E;

		e += rotl(a, 5) + F1(b, c, d) + K1 + x[ 0];    b = rotl(b, 30);
		d += rotl(e, 5) + F1(a, b, c) + K1 + x[ 1];    a = rotl(a, 30);
		c += rotl(d, 5) + F1(e, a, b) + K1 + x[ 2];    e = rotl(e, 30);
		b += rotl(c, 5) + F1(d, e, a) + K1 + x[ 3];    d = rotl(d, 30);
		a += rotl(b, 5) + F1(c, d, e) + K1 + x[ 4];    c = rotl(c, 30);
		e += rotl(a, 5) + F1(b, c, d) + K1 + x[ 5];    b = rotl(b, 30);
		d += rotl(e, 5) + F1(a, b, c) + K1 + x[ 6];    a = rotl(a, 30);
		c += rotl(d, 5) + F1(e, a, b) + K1 + x[ 7];    e = rotl(e, 30);
		b += rotl(c, 5) + F1(d, e, a) + K1 + x[ 8];    d = rotl(d, 30);
		a += rotl(b, 5) + F1(c, d, e) + K1 + x[ 9];    c = rotl(c, 30);
		e += rotl(a, 5) + F1(b, c, d) + K1 + x[10];    b = rotl(b, 30);
		d += rotl(e, 5) + F1(a, b, c) + K1 + x[11];    a = rotl(a, 30);
		c += rotl(d, 5) + F1(e, a, b) + K1 + x[12];    e = rotl(e, 30);
		b += rotl(c, 5) + F1(d, e, a) + K1 + x[13];    d = rotl(d, 30);
		a += rotl(b, 5) + F1(c, d, e) + K1 + x[14];    c = rotl(c, 30);
		e += rotl(a, 5) + F1(b, c, d) + K1 + x[15];    b = rotl(b, 30);
		d += rotl(e, 5) + F1(a, b, c) + K1 + M(x, 16); a = rotl(a, 30);
		c += rotl(d, 5) + F1(e, a, b) + K1 + M(x, 17); e = rotl(e, 30);
		b += rotl(c, 5) + F1(d, e, a) + K1 + M(x, 18); d = rotl(d, 30);
		a += rotl(b, 5) + F1(c, d, e) + K1 + M(x, 19); c = rotl(c, 30);
		e += rotl(a, 5) + F2(b, c, d) + K2 + M(x, 20); b = rotl(b, 30);
		d += rotl(e, 5) + F2(a, b, c) + K2 + M(x, 21); a = rotl(a, 30);
		c += rotl(d, 5) + F2(e, a, b) + K2 + M(x, 22); e = rotl(e, 30);
		b += rotl(c, 5) + F2(d, e, a) + K2 + M(x, 23); d = rotl(d, 30);
		a += rotl(b, 5) + F2(c, d, e) + K2 + M(x, 24); c = rotl(c, 30);
		e += rotl(a, 5) + F2(b, c, d) + K2 + M(x, 25); b = rotl(b, 30);
		d += rotl(e, 5) + F2(a, b, c) + K2 + M(x, 26); a = rotl(a, 30);
		c += rotl(d, 5) + F2(e, a, b) + K2 + M(x, 27); e = rotl(e, 30);
		b += rotl(c, 5) + F2(d, e, a) + K2 + M(x, 28); d = rotl(d, 30);
		a += rotl(b, 5) + F2(c, d, e) + K2 + M(x, 29); c = rotl(c, 30);
		e += rotl(a, 5) + F2(b, c, d) + K2 + M(x, 30); b = rotl(b, 30);
		d += rotl(e, 5) + F2(a, b, c) + K2 + M(x, 31); a = rotl(a, 30);
		c += rotl(d, 5) + F2(e, a, b) + K2 + M(x, 32); e = rotl(e, 30);
		b += rotl(c, 5) + F2(d, e, a) + K2 + M(x, 33); d = rotl(d, 30);
		a += rotl(b, 5) + F2(c, d, e) + K2 + M(x, 34); c = rotl(c, 30);
		e += rotl(a, 5) + F2(b, c, d) + K2 + M(x, 35); b = rotl(b, 30);
		d += rotl(e, 5) + F2(a, b, c) + K2 + M(x, 36); a = rotl(a, 30);
		c += rotl(d, 5) + F2(e, a, b) + K2 + M(x, 37); e = rotl(e, 30);
		b += rotl(c, 5) + F2(d, e, a) + K2 + M(x, 38); d = rotl(d, 30);
		a += rotl(b, 5) + F2(c, d, e) + K2 + M(x, 39); c = rotl(c, 30);
		e += rotl(a, 5) + F3(b, c, d) + K3 + M(x, 40); b = rotl(b, 30);
		d += rotl(e, 5) + F3(a, b, c) + K3 + M(x, 41); a = rotl(a, 30);
		c += rotl(d, 5) + F3(e, a, b) + K3 + M(x, 42); e = rotl(e, 30);
		b += rotl(c, 5) + F3(d, e, a) + K3 + M(x, 43); d = rotl(d, 30);
		a += rotl(b, 5) + F3(c, d, e) + K3 + M(x, 44); c = rotl(c, 30);
		e += rotl(a, 5) + F3(b, c, d) + K3 + M(x, 45); b = rotl(b, 30);
		d += rotl(e, 5) + F3(a, b, c) + K3 + M(x, 46); a = rotl(a, 30);
		c += rotl(d, 5) + F3(e, a, b) + K3 + M(x, 47); e = rotl(e, 30);
		b += rotl(c, 5) + F3(d, e, a) + K3 + M(x, 48); d = rotl(d, 30);
		a += rotl(b, 5) + F3(c, d, e) + K3 + M(x, 49); c = rotl(c, 30);
		e += rotl(a, 5) + F3(b, c, d) + K3 + M(x, 50); b = rotl(b, 30);
		d += rotl(e, 5) + F3(a, b, c) + K3 + M(x, 51); a = rotl(a, 30);
		c += rotl(d, 5) + F3(e, a, b) + K3 + M(x, 52); e = rotl(e, 30);
		b += rotl(c, 5) + F3(d, e, a) + K3 + M(x, 53); d = rotl(d, 30);
		a += rotl(b, 5) + F3(c, d, e) + K3 + M(x, 54); c = rotl(c, 30);
		e += rotl(a, 5) + F3(b, c, d) + K3 + M(x, 55); b = rotl(b, 30);
		d += rotl(e, 5) + F3(a, b, c) + K3 + M(x, 56); a = rotl(a, 30);
		c += rotl(d, 5) + F3(e, a, b) + K3 + M(x, 57); e = rotl(e, 30);
		b += rotl(c, 5) + F3(d, e, a) + K3 + M(x, 58); d = rotl(d, 30);
		a += rotl(b, 5) + F3(c, d, e) + K3 + M(x, 59); c = rotl(c, 30);
		e += rotl(a, 5) + F4(b, c, d) + K4 + M(x, 60); b = rotl(b, 30);
		d += rotl(e, 5) + F4(a, b, c) + K4 + M(x, 61); a = rotl(a, 30);
		c += rotl(d, 5) + F4(e, a, b) + K4 + M(x, 62); e = rotl(e, 30);
		b += rotl(c, 5) + F4(d, e, a) + K4 + M(x, 63); d = rotl(d, 30);
		a += rotl(b, 5) + F4(c, d, e) + K4 + M(x, 64); c = rotl(c, 30);
		e += rotl(a, 5) + F4(b, c, d) + K4 + M(x, 65); b = rotl(b, 30);
		d += rotl(e, 5) + F4(a, b, c) + K4 + M(x, 66); a = rotl(a, 30);
		c += rotl(d, 5) + F4(e, a, b) + K4 + M(x, 67); e = rotl(e, 30);
		b += rotl(c, 5) + F4(d, e, a) + K4 + M(x, 68); d = rotl(d, 30);
		a += rotl(b, 5) + F4(c, d, e) + K4 + M(x, 69); c = rotl(c, 30);
		e += rotl(a, 5) + F4(b, c, d) + K4 + M(x, 70); b = rotl(b, 30);
		d += rotl(e, 5) + F4(a, b, c) + K4 + M(x, 71); a = rotl(a, 30);
		c += rotl(d, 5) + F4(e, a, b) + K4 + M(x, 72); e = rotl(e, 30);
		b += rotl(c, 5) + F4(d, e, a) + K4 + M(x, 73); d = rotl(d, 30);
		a += rotl(b, 5) + F4(c, d, e) + K4 + M(x, 74); c = rotl(c, 30);
		e += rotl(a, 5) + F4(b, c, d) + K4 + M(x, 75); b = rotl(b, 30);
		d += rotl(e, 5) + F4(a, b, c) + K4 + M(x, 76); a = rotl(a, 30);
		c += rotl(d, 5) + F4(e, a, b) + K4 + M(x, 77); e = rotl(e, 30);
		b += rotl(c, 5) + F4(d, e, a) + K4 + M(x, 78); d = rotl(d, 30);
		a += rotl(b, 5) + F4(c, d, e) + K4 + M(x, 79); c = rotl(c, 30);

		A += a; B += b; C += c; D += d; E += e;
	}

	public static void main(String[] args) {
		if (args.length != 0) {
			try {
				String hash = Sha1.fromFile(args[0]);
				System.out.println(hash);
			} catch (IOException ioe) {
				System.err.println(ioe);
			}
		} else {
			System.out.println("Usage: java Sha1 <file>");
		}
	}
}