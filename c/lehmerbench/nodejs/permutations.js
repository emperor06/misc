/// By Drax

class ToggleArray {
	constructor(n) {
		this.bsearch = new Uint32Array(n);
		this.toggles = new Int8Array(n);
		this.upCount = 0;
		this.allDown();
	}

	downCount() { return this.bsearch.length - this.upCount; }

	init(a, b) {
		if (b - a) {
			t = (b + a) >> 1;
			this.init(a, t);
			this.init(t + 1, b);
		}
		this.bsearch[b] = b - a + 1;
	}

	allUp() {
		const N = this.bsearch.length;
		this.upCount = N;
		this.toggles.fill(true);
		this.init(0, N - 1);
		this.bsearch[N - 1] = 1;
	}

	allDown() {
		this.upCount = 0;
		this.toggles.fill(false);
		this.bsearch.fill(0);
	}

	getUpIndex(k) {
		if (k >= this.upCount) return 0;
		let a = 0;
		let b = this.bsearch.length - 1;
		while (true) {
			let t = (b + a) >> 1;
			if (this.bsearch[t] == k + 1 && this.toggles[t])
				return t;
			if (this.bsearch[t] > k)
				b = t;
			else {
				a = t + 1;
				k -= this.bsearch[t];
			}
		}
	}

	setDown(k) {
		if (k >= this.upCount) return 0;
		this.upCount--;
		let a = 0;
		let b = this.bsearch.length - 1;
		while (true) {
			let t = (b + a) >> 1;
			if (this.bsearch[t] == k + 1 && this.toggles[t]) {
				this.bsearch[t]--;
				this.toggles.clear(t);
				return t;
			}
			if (this.bsearch[t] > k) {
				this.bsearch[t]--;
				b = t;
			} else {
				a = t + 1;
				k -= this.bsearch[t];
			}
		}
	}

	setUp(k) {
		if (k >= this.downCount()) return 0;
		this.upCount++;
		let a = 0;
		let b = this.bsearch.length - 1;
		while (true) {
			let t = (b + a) >> 1;
			let slt = t - a + 1 - this.bsearch[t];
			if ((slt == k + 1) && (!this.toggles[t])) {
				this.bsearch[t]++;
				this.toggles.set(t);
				return t;
			}
			if (slt > k) {
				this.bsearch[t]++;
				b = t;
			} else {
				a = t + 1;
				k -= slt;
			}
		}
	}

	numULE(i) {
		if (i >= this.bsearch.length) return 0;
		let a = 0;
		let b = this.bsearch.length - 1;
		let ns = i;
		while (a != b) {
			let t = (b + a) >> 1;
			if (i <= t)
				b = t;
			else {
				ns -= this.bsearch[t];
				a = t + 1;
			}
		}
		return i - ns;
	}

	numULI(i) { return this.numULE(i) + this.toggles[i];      }
	numURE(i) { return this.upCount - this.numULI(i);         }
	numURI(i) { return this.upCount - this.numULE(i);         }
	numDLE(i) { return i - this.numULE(i);                    }
	numDLI(i) { return i - this.numULE(i) + !this.toggles[i]; }
	numDRE(i) { return this.downCount() - this.numDLI(i);     }
	numDRI(i) { return this.downCount() - i + this.numULE(i); }
}

function shuffle(array) {
	let i = array.length;
	while (i --> 1) {
		const j = Math.floor(Math.random() * (i + 1));
		[array[i], array[j]] = [array[j], array[i]];
	}
}

function getPermutation(n) {
	let perm = new Uint32Array(n);
	while (n --> 0) perm[n] = n;
	return perm;
}

function lehmer(perm) {
	const len = perm.length;
	let lehmer = new Uint32Array(len);
	let ta = new ToggleArray(len);
	perm.forEach((e, i) => {
		const n = ta.numDLE(e);
		ta.setUp(n);
		lehmer[i] = n;
	});
	return lehmer;
}

const N = 10000000;
console.log(`Creating an array of ${N} elements.`);
console.time("Creating and shuffle");
const perm = getPermutation(N);
shuffle(perm);
console.timeEnd("Creating and shuffle");
console.time("Lehmer duration");
const lehm = lehmer(perm);
console.timeEnd("Lehmer duration");
console.log("Done");
