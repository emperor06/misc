"use strict";

/* LocationServer class maintains list of locations in memory. */
class LocationServer {
    constructor() {
        this.locations = {};
        this.initializeLocations();
    }

    /* Load all the locations into memory. */
    initializeLocations() {
        logger.logWarning("Loading locations into RAM...");

        for (let locationName in db.locations) {
            let node = db.locations[locationName];
            let location = json.parse(json.read(node.base));

            // set infill locations
            for (let entry in node.entries) {
                location.SpawnAreas.push(json.parse(json.read(node.entries[entry])));
            }

            // set exfill locations
            for (let exit in node.exits) {
                location.exits.push(json.parse(json.read(node.exits[exit])));
            }

            // set scav locations
            for (let wave in node.waves) {
                location.waves.push(json.parse(json.read(node.waves[wave])));
            }

            // set boss locations
            for (let spawn in node.bosses) {
                location.BossLocationSpawn.push(json.parse(json.read(node.bosses[spawn])));
            }

            this.locations[locationName] = location;
        }
    }

    /* generates a random location preset to use for local session */
    generate(locationName) {
        let output = this.locations[locationName];

        // don't generate loot on hideout
        if (locationName === "hideout") {
            return output;
        }

        let nbDynamicLoots = settings.gameplay.locationloot[locationName];
        let staticLoots = json.parse(json.read(db.locations[locationName].loot.statics));
        let dynamicLoots = json.parse(json.read(db.locations[locationName].loot.dynamics));
        let forcedLoots = db.locations[locationName].loot.forced ? json.parse(json.read(db.locations[locationName].loot.forced)) : false;

        if (nbDynamicLoots < 0) nbDynamicLoots = -nbDynamicLoots;
        if (nbDynamicLoots > dynamicLoots.length) nbDynamicLoots = dynamicLoots.length;
        let rands = itm_hf.randomDraw(nbDynamicLoots, 0, dynamicLoots.length - 1);

        staticLoots.forEach(toLoot);
        output.Loot = staticLoots;

        if (forcedLoots) {
            output.Loot.push(...forcedLoots);
        }

        for (let r of rands) {
            let loot = dynamicLoots[r];
            toLoot(loot);
            output.Loot.push(loot);
        }

        logger.logSuccess("Generated " + output.Loot.length + " loots for " + locationName);
        return output;
    }

    /* get a location with generated loot data */
    get(location) {
        let locationName = location.toLowerCase().replace(" ", "");
        return json.stringify(this.generate(locationName));
    }

    /* get all locations without loot data */
    generateAll() {
        let base = json.parse(json.read("db/cache/locations.json"));
        let data = {};

        // use right id's and strip loot
        for (let locationName in this.locations) {
            let map = this.locations[locationName];

            map.Loot = [];
            data[this.locations[locationName]._Id] = map;
        }

        base.data.locations = data;
        return json.stringify(base);
    }
}

/* Transforms a loot with variations to a regular loot
*  with a random variation in it.
*/
function toLoot(loot) {
    let n = loot["Variations"].length;

    // 10% chance of a static loot being empty
    if (loot.IsStatic && n !== 1 && Math.random() < 0.1) {
        let variation = loot.Variations[0];
        loot.Root = variation.Root;
        loot.Items = [variation.Items.find(x => x._id === loot.Root)];
    }
    else {
        let rand = Math.floor((Math.random() * n));
        let variation = loot.Variations[rand]; // choose a random content
        loot.Root = variation.Root;            // create missing nodes
        loot.Items = variation.Items;
    }

    delete loot["Variations"];                 // and remove Variations
}

module.exports.locationServer = new LocationServer();