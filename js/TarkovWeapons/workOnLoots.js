"use strict";

const json = require("./core/util/json.js");
const utility = require("./core/util/utility.js");
const util = require("./dev/src/sha1.js")

var dupes = 0;

function statics(path) {
    console.log(path);
    let loots = json.parse(json.read(path));
    let map = new Map();

    for (let loot of loots) {
        // Fix variation duplicates
        processVariation(loot);
        let oldVars = loot.Variations;
        loot.Variations = [];

        for (let variation of oldVars) {
            if (!map.has(loot.Id)) {
                map.set(loot.Id, getRoot(variation)._id);
            }

            // Remove empty variations and fix ids
            if (variation.Items.length > 1) {
                fixRootId(variation, map.get(loot.Id));
                loot.Variations.push(variation);
            }
            
        }
        if (loot.Variations.length <= 1) {
            console.log(loot.Id + " has " + loot.Variations.length + " variations");
        }
    }

    console.log("#loots: " + map.size);
    json.write(path, loots);
}

function getRoot(variation) {
    return variation.Items.find(x => x._id === variation.Root);
}

function fixRootId(variation, newRoot) {
    let oldRoot = variation.Root;
    variation.Root = newRoot;

    for (let item of variation.Items) {
        if (item._id === oldRoot) {
            item._id = newRoot;
        }
        if (item.parentId === oldRoot) {
            item.parentId = newRoot;
        }
    }
}

function getAttachments(variation, oldRoot, newRoot) {
    let res = variation.Items.filter(x => x._id !== oldRoot);
    res.forEach(function (e) {
        if (e.parentId === oldRoot) {
            e.parentId = newRoot;
        }
    });

    return res;
}

function processStaticVariation(loot) {
    let N = loot.Variations.length;
    let varItems = loot.Variations.map(arr => arr.map(item => item._tpl + getItemCount(item)).sort().join());
    let newVars = [];
    let set = new Set();

    for (let n = 0; n < N; n++) {
        if (!set.has(varItems[n])) {
            set.add(varItems[n]);
            newVars.push(loot.Variations[n]);
        }
        else {
            dupes++;
        }
    }

    loot.Variations = newVars;
}

function processVariation(loot) {
    let N = loot.Variations.length;
    let varItems = loot.Variations.map(x => x.Items.map(y => y._tpl + getItemCount(y)).sort().join());
    let newVars = [];
    let set = new Set();

    for (let n = 0; n < N; n++) {
        if (!set.has(varItems[n])) {
            set.add(varItems[n]);
            newVars.push(loot.Variations[n]);
        }
        else {
            dupes++;
        }
    }

    loot.Variations = newVars;
}

function getItemCount(item) {
    if ("upd" in item && "StackObjectsCount" in item.upd) {
        return item.upd.StackObjectsCount;
    }

    return 1;
}

function dynamics(path) {
    console.log(path);
    let loots = json.parse(json.read(path));
    //let map = new Map();

    for (let loot of loots) {
        processVariation(loot);
        /*
        let p = loot.Position;
        let position = `${p.x};${p.y};${p.z}`;
        if (!map.has(position)) {
            map.set(position, loot);
        }
        else {
            let old = map.get(position);
            old.Variations.push(...loot.Variations);
            if (old.Rotation.x !== loot.Rotation.x
             || old.Rotation.y !== loot.Rotation.y
             || old.Rotation.z !== loot.Rotation.z
             || old.randomRotation !== loot.randomRotation
             || old.IsGroupPosition !== loot.IsGroupPosition) {
                 console.log("Maybe pb with " + old.Id + " and " + loot.Id);
             }
            dupes++;
        }
        */
    }

    //let newLoots = Array.from(map.values());
    //json.write(path, newLoots);
    json.write(path, loots);
}

/*function processVariations(id, variations) {
    let base = variations[0].Items[0]._tpl;
    let n = variations.length;

    while (n --> 1) {
        if (variations[n].Items[0]._tpl !== base) {
            console.log("Variation zoby " + id);
        }
    }
}*/

function fixForced(dyn, forc) {
    let dynamics = json.parse(json.read(dyn));
    let forced = json.parse(json.read(forc));
    let ids = new Set( forced.map(x => x.Id) );
    let newDynamics = dynamics.filter(x => !ids.has(x.Id));

    json.write(dyn, newDynamics);
}

function showVariationsPerLoot(path) {
    console.log(path);
    let loots = json.parse(json.read(path));
    let counts = loots.map(function (x) {return {Id: x.Id, Count: x.Variations.length} });

    counts.forEach(function (e) { console.log(e) });
}

function allStaticTemplates(path) {
    let loots = json.parse(json.read(path));
    let set = new Set();

    for (let loot of loots) {
        for (let variation of loot.Variations) {
            let Root = variation.Root;
            let tpl = variation.Items.find(x => x._id === Root)._tpl;
            set.add(tpl);
        }
    }

    set.forEach(x => console.log(x));
}

let maps = ["bigmap", "develop", "factory4_day", "factory4_night", "interchange", "laboratory", "rezervbase", "shoreline", "woods"];
let forcedMaps = ["bigmap", "factory4_day", "factory4_night", "interchange", "shoreline", "woods"];


for (let map of maps) {
    //statics("db/locations/" + map + "/loot/statics.json");
    //dynamics("db/locations/" + map + "/loot/dynamics.json");
    //showVariationsPerLoot("db/locations/" + map + "/loot/dynamics.json");
}

allStaticTemplates("db/locations/bigmap/loot/statics.json");

//for (let map of forcedMaps) {
//    fixForced("db/locations/" + map + "/loot/dynamics.json", "db/locations/" + map + "/loot/forced.json");
//}

//console.log("dupes removed: " + dupes);



/*
    NOTES
    
    Lootable_00028 variations have different tpl
    Removed static dupe variations: 59008







*/
