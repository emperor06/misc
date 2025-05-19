#pragma once
#include <vector>
// by Drax


namespace drax {
	using sizint = unsigned int;
	using std::vector;

	/**
	 * Another implementation of Jörg Arndt's left_right_array.
	 */
	class ToggleArray {
	private:
		const sizint N;         // The size (number of toggles) of this toggle array
		sizint _upCount;        // number of Up toggles
		vector<sizint> bsearch; // Up indices Left (inclusive) in bsearch interval
		vector<bool> toggles;   // A representation of the toggles

	public:
		ToggleArray(sizint n);
		ToggleArray(const ToggleArray&) = delete;
		ToggleArray &operator = (const ToggleArray&) = delete;

	private:
		void init(sizint a, sizint b);

	public:
		void   allUp();
		void   allDown();
		sizint setDown(sizint k);
		sizint setUp(sizint k);
		sizint upCount()   const { return _upCount; }
		sizint downCount() const { return N - _upCount; }
		sizint getUpIndex(sizint k) const;
		sizint numULE(sizint i) const;
		sizint numULI(sizint i) const;
		sizint numURE(sizint i) const;
		sizint numURI(sizint i) const;
		sizint numDLE(sizint i) const;
		sizint numDLI(sizint i) const;
		sizint numDRE(sizint i) const;
		sizint numDRI(sizint i) const;
	};
}
