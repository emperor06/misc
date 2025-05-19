/**
 * SHA-1 by Drax 
 * Naive implementation based solely on Wikipedia's description.
 * For a much faster implementation, see VisualStudio/Sha1 (adapted from GNU's coreutils)
 */

#include <stdio.h>
#include <stdlib.h>
#include <stdint.h>
#include <errno.h>
#include <string.h>

#define SHA1_WORDS    5
#define SHA1_BYTES   20
#define SHA1_BITS   160
#define CHUNK_BITS  512
#define CHUNK_BYTES  64
#define CHUNK_WORDS  16

typedef uint8_t  byte;
typedef uint32_t word;

static const word setup[SHA1_WORDS] = {           // Sha1 starts with these values
	0x67452301,
	0xEFCDAB89,
	0x98BADCFE,
	0x10325476,
	0xC3D2E1F0
};
static word hash[SHA1_WORDS];                     // The actual hash, result of calling sha1
static uint64_t datalen;                          // The number of bytes in the original message (must be uint64)
union Chunk {                                     // We need to read bytes, then interpret them as ints
	byte b[CHUNK_BYTES];                          // Because of this endianness stuff and how fread works, we need bytes
	word w[CHUNK_WORDS];                          // Because sha1 ultimately work on unsigned int
};

/* Simple rotate left function for 32 bit words */
word rotl(word x, unsigned n) {
	return (x << n) | (x >> (8 * sizeof x - n));
}

/* Converts big endian to little endian, or the other way around. */
word endian(word x) {
	return rotl(x & 0x00FF00FF, 24) | (rotl(x, 8) & 0x00FF00FF);
}

/* Converts big endian to little endian, or the other way around. 64 bit version. */
uint64_t endian64(uint64_t x) {
	byte b[sizeof x];
	for (size_t n = sizeof x; n--; x >>= 8)
		b[n] = x & 0xff;
	memcpy(&x, b, sizeof x);
	return x;
}

/* Initialize the engine by resetting the hash initial value and the byte counter */
void sha1_init() {
	memcpy(hash, setup, SHA1_BYTES);
	datalen = 0;
}

/* Computes a round of sha1 on a chunk of 512 bits. */
void sha1_chunk(const word chunk[CHUNK_WORDS]) {
	word f, k, t;
	word h[SHA1_WORDS];                   // this chunk's hash
	word data[80];                        // expanded chunk (scheduling)
	for (int i = 0; i < CHUNK_WORDS; i++) // Convert the endianness
		data[i] = endian(chunk[i]);

	// Message schedule
	for (int i = CHUNK_WORDS; i < 80; i++)
		data[i] = rotl(data[i-3] ^ data[i-8] ^ data[i-14] ^ data[i-16], 1);

	// Init this chunk's hash with the current hash
	memcpy(h, hash, SHA1_BYTES);

	// Main loop
	for (int i = 0; i < 80; i++) {
		if (i < 20) {
			f = (h[1] & h[2]) | (~h[1] & h[3]);
			k = 0x5A827999;
		}
		else if (i < 40) {
			f = h[1] ^ h[2] ^ h[3];
			k = 0x6ED9EBA1;
		}
		else if (i < 60) {
			f = (h[1] & h[2]) | (h[1] & h[3]) | (h[2] & h[3]);
			k = 0x8F1BBCDC;
		}
		else {
			f = h[1] ^ h[2] ^ h[3];
			k = 0xCA62C1D6;
		}

		t = rotl(h[0], 5) + f + h[4] + k + data[i];
		h[4] = h[3];
		h[3] = h[2];
		h[2] = rotl(h[1], 30);
		h[1] = h[0];
		h[0] = t;
	}

	// Add/combine this chunk's hash to the result
	for (int i = 0; i < SHA1_WORDS; i++)
		hash[i] += h[i];
}

/* Process a file into chunks of 512 bits, padding the last chunk for sha1. */
void sha1(FILE *file) {
	union Chunk c = { .w = { 0 } };
	size_t n = 0;

	// Make sure to reset the engine first
	sha1_init();

	// Read the whole file, processing 512 bits at a time
	while (1) {
		n = fread(c.b, 1, CHUNK_BYTES, file);
		datalen += n;                             // this has to be done anyway, in case file is a stream (stdin)
		if (n != CHUNK_BYTES) break;              // incomplete read, don't send the chunk (it needs to be padded)
		sha1_chunk(c.w);                          // send the chunk for processing
	}

	if (!feof(file)) {                            // I/O error
		fprintf(stderr, "I/O error reading file\n%s", strerror(errno));
		exit(EXIT_FAILURE);
	}
	fclose(file);

	// Padding
	c.b[n++] = 0x80;                              // n is conveniently pointing at the element after the last bit of data. Add the 1 bit for sha1
	for (size_t i = n; i < CHUNK_BYTES; i++)      // and zero out the rest
		c.b[i] = 0;

	if (n > CHUNK_BYTES - 8) {                    // No room for datalen. We have to send this chunk now.
		sha1_chunk(c.w);
		memset(c.b, 0, CHUNK_BYTES);
	}

	// Add data length in bits
	uint64_t len = endian64(datalen*8);           // Sha1 requires big endian. And datalen must be in bits (not bytes)
	memcpy(&c.b[CHUNK_BYTES - 8], &len, 8);       // Rather than having a uint64_t* inside the union, let's continue with memcpy tricks.
	sha1_chunk(c.w);                              // finally, send the last chunk
}

void print_hash() {
	for (int i = 0; i < SHA1_WORDS; i++)
		printf("%08x", hash[i]);
	printf("\n");
}

void bench() {
	sha1_init();
	word chunk[16];
	for (int i = 0; i < 16; i++)
		chunk[i] = i;
	for (int n = 0; n < 32768000; n++)
		sha1_chunk(chunk);
	print_hash();
}

int main(int argc, char** argv) {
//	bench();

	FILE *input = stdin;
	if (argc > 1 && strcmp(argv[1], "-")) {
		input = fopen(argv[1], "rb");
		if (NULL == input) {
			fprintf(stderr, "Cannot open '%s': %s\n", argv[1], strerror(errno));
			exit(EXIT_FAILURE);
		}
	}

	sha1(input);
	print_hash();
	exit(EXIT_SUCCESS);
}
