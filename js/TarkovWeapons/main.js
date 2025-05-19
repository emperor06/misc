"use strict";

const json = require("./json.js");
const Item = require('./item.js'); 

const itemsDb = json.parse(json.read('user/cache/items.json')).data;

let obj = json.parse('{"a": 4, "b": 5}');

console.log(obj.b);

let item = Item.fromPlain({id: "zob", tpl: "chatte", parent: null});

item.toString();

console.log(Object.keys(itemsDb)[0]);