/**
 * Trying to solve this endianness misery in C/C++
 * Apparently, C can declare structs with endianness awareness greatness
 * but C++ can't, because it can't. A patch has been submitted then removed.
 *
 * 2 things: the struct needs to be packed for me, because that's how fonts are
 * stored. And they need to be big-endian.
 *
 * Packing can be done with __attribute__ ((packed)) which is GCC-only.
 * Windows uses #pragma pack, which GCC now supports as well.
 * For a given struct, use #pragma pack(push, 1) before, then #pragma pack(pop)
 * after, so only this struct is packed.
 *
 * For the endianness, there's a global GCC parameter, which won't work on MSVC.
 * Or yet another __attribute__ thing.
 * Or a global #pragma scalar_storage_order big-endian which, hopefully, works
 * in MSVC too (it doesn't.)
 *
 * This code generates a warning about fread being given an "incompatible" type.
 * After checking https://github.com/gcc-mirror/gcc/blob/master/gcc/c/c-typeck.cc
 * line #7914, it appears that giving a endian-aware struct to a function triggers
 * a warning because that function may not be able to handle such structs.
 * This exception does not apply to "bultin functions" like memcpy…
 *
 * So this warning can be ignored with fread: just read the bytes,
 * write them into the struct's pointer, and let the struct endianness do its
 * magic.
 *
 * by Drax
 */

#include <stdio.h>
#include <stdlib.h>
#include <stdint.h>

#pragma scalar_storage_order big-endian
#pragma pack(push, 1)
struct
//__attribute__ ((packed, scalar_storage_order("big-endian")))
Rec {
    uint32_t word;
    uint16_t half;
    uint32_t off;
};
#pragma pack(pop)

void main() {

    struct Rec r1 = {1, 2, 0xaabbccdd};
    printf("Actual struct values: %d, %d, %d\n", r1.word, r1.half, r1.off);
    printf("Struct in memory: ");
    int n = sizeof(struct Rec);
    char* p = (char*) &r1;
    for (int i = 0; i < n; i++) {
        printf("%.2x ", *p++ & 0xff);
    }
    printf("\n");

    const char* filename = "font.bin";
    FILE* output = fopen(filename, "wb");
    fwrite(&r1, sizeof r1, 1, output);
    fclose(output);

    struct Rec r2;
    FILE* input = fopen(filename, "rb");
    fread(&r2, sizeof r2, 1, input);
    printf("%d, %d, %d\n", r2.word, r2.half, r2.off);
    fclose(input);
}
