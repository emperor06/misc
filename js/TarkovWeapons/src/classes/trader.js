"use strict";

/* TraderServer class maintains list of traders for each sessionID in memory. */
class TraderServer {
    constructor() {
        this.traders = {};
        this.assorts = {};
        this.customization = {};

        this.initializeTraders();
    }

    /* Load all the traders into memory. */
    initializeTraders() {
        logger.logWarning("Loading traders into RAM...");

        for (let id in db.traders) {
            this.traders[id] = json.parse(json.read(db.traders[id]));
        }
    }

    getTrader(id) {
        return {err: 0, errmsg: null, data: this.traders[id]};
    }

    getAllTraders(sessionID) {
        let pmcData = profile_f.profileServer.getPmcProfile(sessionID);
        let traders = [];

        for (let traderId in this.traders) {
            let trader = this.traders[traderId];

            trader.loyalty.currentLevel = pmcData.TraderStandings[traderId].currentLevel;
            trader.loyalty.currentStanding = pmcData.TraderStandings[traderId].currentStanding;
            trader.loyalty.currentSalesSum = pmcData.TraderStandings[traderId].currentSalesSum;
            traders.push(trader);
        }

        return {err: 0, errmsg: null, data: traders};
    }

    lvlUp(id, sessionID) {
        let pmcData = profile_f.profileServer.getPmcProfile(sessionID);
        let loyaltyLevels = this.traders[id].loyalty.loyaltyLevels;

        // level up player
        let checkedExp = 0;

        for (let level in globals.data.config.exp.level.exp_table) {
            if (pmcData.Info.Experience < checkedExp) {
                break;
            }

            pmcData.Info.Level = parseInt(level);
            checkedExp += globals.data.config.exp.level.exp_table[level].exp;
        }

        // level up traders
        let targetLevel = 0;
        
        for (let level in loyaltyLevels) {
            // level reached
            if ((loyaltyLevels[level].minLevel <= pmcData.Info.Level
            && loyaltyLevels[level].minSalesSum <= pmcData.TraderStandings[id].currentSalesSum
            && loyaltyLevels[level].minStanding <= pmcData.TraderStandings[id].currentStanding)
            && targetLevel < 4) {
                targetLevel++;
                continue;
            }

            pmcData.TraderStandings[id].currentLevel = targetLevel;
            break;
        }

        // set assort
        this.generateAssort(id);
    }

    getAssort(traderId) {
        if (!(traderId in this.assorts)) {
            this.generateAssort(traderId);
        }
        
        return this.assorts[traderId];
    }

    generateAssort(traderId) {
        if (traderId === "579dc571d53a0658a154fbec") {
            logger.logWarning("generating fence");
            this.generateFence();
            return;
        }

        let base = json.parse(json.read(db.user.cache["assort_" + traderId]));

        // 1 is min level, 4 is max level
        if (traderId !== "579dc571d53a0658a154fbec") {
            let keys = Object.keys(base.data.loyal_level_items);
            let level = this.traders[traderId].loyalty.currentLevel;

            for (let i = 1; i < 4; i++) {
                for (let key of keys) {
                    if (base.data.loyal_level_items[key] > level) {
                        base = this.removeItemFromAssort(base, key);
                    }
                }
            }
        }

        this.assorts[traderId] = base;
    }

    generateFence() {
        let base = json.parse(json.read("db/cache/assort.json"));
        let names = Object.keys(db.assort["579dc571d53a0658a154fbec"].loyal_level_items);
        let added = [];

        for (let i = 0; i < settings.gameplay.trading.fenceAssortSize; i++) {
            let id = names[utility.getRandomInt(0, names.length - 1)];

            if (added.includes(id)) {
                i--;
                continue;
            }

            added.push(id);
            base.data.items.push(json.parse(json.read(db.assort["579dc571d53a0658a154fbec"].items[id])));
            base.data.barter_scheme[id] = json.parse(json.read(db.assort["579dc571d53a0658a154fbec"].barter_scheme[id]));
            base.data.loyal_level_items[id] = json.parse(json.read(db.assort["579dc571d53a0658a154fbec"].loyal_level_items[id]));
        }

        this.assorts['579dc571d53a0658a154fbec'] = base;
    }

    removeItemFromAssort(assort, id) {
        let toDo = [id];

        // delete assort keys
        delete assort.data.barter_scheme[id];
        delete assort.data.loyal_level_items[id];

        // find and delete all related items
        if (toDo[0] !== undefined && toDo[0] !== null && toDo[0] !== "undefined") {
            let ids_toremove = itm_hf.getChildren(assort.data.items, toDo[0]);

            for (let i in ids_toremove) {
                for (let a in assort.data.items) {
                    if (assort.data.items[a]._id === ids_toremove[i]) {
                        assort.data.items.splice(a, 1);
                    }
                }
            }

            return assort;
        }

        logger.logError("assort item id is not valid");
        return "";
    }

    getCustomization(traderId) {
        if (!("traderId" in this.customization) && "customization_" + traderId in db.user.cache) {
            this.customization[traderId] = json.parse(json.read(db.user.cache["customization_" + traderId]));
        }
        
        return this.customization[traderId];
    }

    getAllCustomization() {
        let output = [];

        for (let traderId in this.customization) {
            output = output.concat(this.getCustomization(traderId));
        }

        return output;
    }
}

// Computes the total price of an item, that is the price
// of the whole package (item, count, and children)
// memo is used for memoization to avoid useless computations
function getItemTotalPrice(inv, item, memo) {
    // if we have already computed it, we're good
    if (item._id in memo) {
        return memo[item._id];
    }

    let basePrice = (items.data[item._tpl]._props.CreditsPrice >= 1 ? items.data[item._tpl]._props.CreditsPrice : 1);
    let count = (typeof item.upd !== "undefined" ? (typeof item.upd.StackObjectsCount !== "undefined" ? item.upd.StackObjectsCount : 1) : 1);
    let children = inv.filter(x => item._id === x.parentId);
    let childrenPrice = 0;
    for (let child of children) {
        childrenPrice += getItemTotalPrice(inv, child, memo);
    }
    // store it for later use
    memo[item._id] = (basePrice + childrenPrice) * count;

    return memo[item._id];
}

const notSellable = new Set([
        "544901bf4bdc2ddf018b456d", // wad of rubles
        "5449016a4bdc2d6f028b456f", // rubles
        "569668774bdc2da2298b4568", // euros
        "5696686a4bdc2da3298b456a"  // dolars
    ]);

function getPurchasesData(tmpTraderInfo, sessionID) {
    let inv = profile_f.profileServer.getPmcProfile(sessionID).Inventory;
    let currency = itm_hf.getCurrency(trader_f.traderServer.getTrader(tmpTraderInfo, sessionID).data.currency);
    let output = {};
    let memo = {};
    let containers = new Set([inv.equipment, inv.stash, inv.questRaidItems, inv.questStashItems]);

    let goodItems = function (it) {
        return !(notSellable.has(it._tpl) || containers.has(it._id));
    }

    inv.items.filter(goodItems).forEach(function (item) {
        let price = getItemTotalPrice(inv.items, item, memo);

        if ("upd" in item && "Dogtag" in item.upd && itm_hf.isDogtag(item._tpl)) {
            price *= item.upd.Dogtag.Level;
        }

        price *= settings.gameplay.trading.sellMultiplier;
        price = itm_hf.fromRUB(price, currency);
        if (price <= 0 || price === "NaN") price = 1;

        output[item._id] = [[{_tpl: currency, count: price.toFixed(0)}]];
    });

    return output;
}

module.exports.traderServer = new TraderServer();
module.exports.getPurchasesData = getPurchasesData;