#!/usr/bin/sed -f
# Sed calculator, inspired by Simon Richter
# with added multiplications, fixed order of operations, more flexible syntax
# by Drax

#### Clean up
s/\s*//g
: signs
s/\([0-9]*\)\*\([+-][+-]*\)/\2\1*/g
s/++/+/g
s/--/+/g
s/+-/-/g
s/-+/-/g
t signs

#### Base 1
s/[0-9]/<&/g
s/0//g; s/1/|/g; s/2/||/g; s/3/|||/g; s/4/||||/g; s/5/|||||/g; s/6/||||||/g
s/7/|||||||/g; s/8/||||||||/g; s/9/|||||||||/g
: tens
s/|</<||||||||||/g
t tens
s/<//g

#### Multiplications
s/|*\*/x&/g
: mul
s/x\(|*\)\*|/\1x\1*/
t mul
s/x|*\*//g

#### Additions from left to right
: bracket
s/|*[+-]|*/<&>/
: sum
s/<-\(|*\)-\([^>]*\)/<-\1\2/
s/<-\(|*\)+\([^>]*\)/<\2-\1/
s/<\(|*\)+\(|*\)>/<\1\2>/
: minus
s/<\(|*\)|-|\(|*\)>/<\1-\2>/
t minus
s/->/>/
/<>/{s/<>//;b bracket}
s/>\([+-]|*\)/\1>/
t sum
s/[<>]//g

#### Base 10
: back
s/||||||||||/</g
s/<\([0-9]*\)$/<0\1/
s/|||||||||/9/; s/||||||||/8/; s/|||||||/7/; s/||||||/6/; s/|||||/5/; s/||||/4/
s/|||/3/; s/||/2/; s/|/1/
s/</|/g
t back
s/^$/0/
