class Item {
	id;
	tpl;
	parent;
	
	constructor() {}
	
	static fromPlain(obj) {
		return Object.assign(new Item(), obj);
	}
	
	toString() {
		console.log(this.id + " :: " + this.tpl);
	}

	static categories = new Set([
		"5447b5cf4bdc2d65278b4567",//Pistol
		"5447b5e04bdc2d62278b4567",//Smg
		"5447b5f14bdc2d61278b4567",//AssaultRifle
		"5447b5fc4bdc2d87278b4567",//AssaultCarbine
		"5447b6094bdc2dc3278b4567",//Shotgun
		"5447b6194bdc2d67278b4567",//MarksmanRifle
		"5447b6254bdc2dc3278b4568",//SniperRifle
		"5447bed64bdc2d97278b4568",//MachineGun
		"5447bee84bdc2dc3278b4569"//SpecialWeapon
	]);
	static weaponTpl = "5422acb9af1c889c16000029";
}

module.exports = Item
