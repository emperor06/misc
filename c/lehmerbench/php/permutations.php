<?php
ini_set('memory_limit', '-1');

class ToggleArray {

    private $toggles;
    private $bsearch;
    private $upCount;
    private $N;

    function __construct($n) {
        $this->N = $n;
        $this->upCount = 0;
        $this->toggles = array_fill(0, $n, false);
        $this->bsearch = array_fill(0, $n, 0);
    }

    function init($a, $b) {
        if (($b - $a) != 0) {
            $t = ($b + $a) >> 1;
            $this->init($a, $t);
            $this->init($t + 1, $b);
        }
        $this->bsearch[$b] = $b - $a + 1;
    }

    function allUp() {
        $this->upCount = $this->N;
        for ($n = $this->N; $n --> 0;) $this->toggles[$n] = true;
        $this->init(0, $this->N - 1);
        $this->bsearch[$this->N - 1] = 1;
    }

    function allDown() {
        $this->upCount = 0;
        for ($n = $this->N; $n --> 0;) $this->toggles[$n] = false;
        for ($n = $this->N; $n --> 0;) $this->bsearch[$n] = 0;
    }

    function downCount() {
        return $this->N - $this->upCount;
    }

    function getUpIndex($k) {
        if ($k >= $this->upCount) return 0;
        $a = 0; $b = $this->N - 1;
        while (true) {
            $t = ($b + $a) >> 1;
            if ($this->bsearch[$t] == $k + 1 && $this->toggles[$t])
                return $t;
            if ($this->bsearch[$t] > $k)
                $b = $t;
            else {
                $a = $t + 1;
                $k -= $this->bsearch[$t];
            }
        }
    }

    function setDown($k) {
        if ($k >= $this->upCount) return 0;
        $this->upCount--;
        $a = 0; $b = $this->N - 1;
        while (true) {
            $t = ($b + $a) >> 1;
            if ($this->bsearch[$t] == $k + 1 && $this->toggles[$t]) {
                $this->bsearch[$t]--;
                $this->toggles[$t] = false;
                return $t;
            }
            if ($this->bsearch[$t] > $k) {
                $this->bsearch[$t]--;
                $b = $t;
            }
            else {
                $a = $t + 1;
                $k -= $this->bsearch[$t];
            }
        }
    }

    function setUp($k) {
        if ($k >= $this->downCount()) return 0;
        $this->upCount++;
        $a = 0; $b = $this->N - 1;
        while (true) {
            $t = ($b + $a) >> 1;
            $slt = $t - $a + 1 - $this->bsearch[$t];
            if (($slt == $k + 1) && !$this->toggles[$t]) {
                $this->bsearch[$t]++;
                $this->toggles[$t] = true;
                return $t;
            }
            if ($slt > $k) {
                $this->bsearch[$t]++;
                $b = $t;
            }
            else {
                $a = $t + 1;
                $k -= $slt;
            }
        }
    }

    function numULE($i) {
        if ($i >= $this->N) return 0;
        $a = 0; $b = $this->N - 1; $ns = $i;
        while ($a != $b) {
            $t = ($b + $a) >> 1;
            if ($i <= $t)
                $b = $t;
            else {
                $ns -= $this->bsearch[$t];
                $a = $t + 1;
            }
        }
        return $i - $ns;
    }

    function numULI($i) { return $this->numULE($i) + $this->toggles[$i];       }
    function numURE($i) { return $this->upCount - $this->numULI($i);           }
    function numURI($i) { return $this->upCount - $this->numULE($i);           }
    function numDLE($i) { return $i - $this->numULE($i);                       }
    function numDLI($i) { return $i - $this->numULE($i) + !$this->toggles[$i]; }
    function numDRE($i) { return $this->downCount() - $this->numDLI($i);       }
    function numDRI($i) { return $this->downCount() - $i + $this->numULE($i);  }

}

function lehmer($perm) {
    $N = sizeof($perm);
    $lehmer = new SplFixedArray($N);
	$ta = new ToggleArray($N);
	for ($k = 0; $k < $N; $k++) {
		$i = $ta->numDLE($perm[$k]);
		$ta->setUp($i);
		$lehmer[$k] = $i;
	}
    return $lehmer;
}

$N = 10000000;
printf("Creating an array of %d elements.\n", $N);
$start = microtime(true);
$perm = range(0, $N - 1);
shuffle($perm);
$elapsed = (microtime(true) - $start) * 1000;
printf("Creating and shuffle: %d ms\n", $elapsed);

$start = microtime(true);
$lehm = lehmer($perm);
$elapsed = (microtime(true) - $start) * 1000;
printf("Lehmer duration: %d ms\n", $elapsed);

echo "Done\n";
