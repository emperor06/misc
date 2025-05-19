#pragma once
#include "stdint.h"

typedef uint32_t sizint; // don't change, some hardcoded values depend on it

typedef struct _ToggleArray {
	sizint  size;
	sizint  upCount;
	sizint* bsearch;
	sizint* toggles;
} ToggleArray;

void   tg_init      (ToggleArray* ta, sizint n);
void   tg_free      (ToggleArray* ta);
sizint tg_downCount (ToggleArray* ta);
sizint tg_setUp     (ToggleArray* ta, sizint k);
sizint tg_numDLE    (ToggleArray* ta, sizint i);
sizint tg_numULE    (ToggleArray* ta, sizint i);

static void to_set  (ToggleArray ta, sizint bitIndex);
static void to_clear(ToggleArray ta, sizint bitIndex);
static int  to_get  (ToggleArray ta, sizint bitIndex);
