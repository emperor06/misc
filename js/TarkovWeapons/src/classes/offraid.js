"use strict";

// remove the labs keycard at the end of raid in labs
// TODO fix it! Rezerv also uses Common as entry point. And last raid I did in the lab, nothing got removed
function removeLabKeyCard(offraidData) {
    if (offraidData.Info.EntryPoint === "Common") {
        let equipment = itm_hf.getChildren(offraidData.Inventory.items, offraidData.Inventory.equipment);
        let keyCard = equipment.find(x => x._tpl === "5c94bbff86f7747ee735c08f");

        if (keyCard != undefined) {
            move_f.removeItemFromProfile(offraidData, keyCard._id);
        }
    }
}

function markItem(item) {
    if (!item.hasOwnProperty("upd")) {
        item.upd = {};
    }

    item.upd.SpawnedInSession = true;
}

function markFoundItems(pmcData, offraidData) {
    let items = offraidData.Inventory.items;

    if (!offraidData.isPlayerScav) {
        let pmcItemIds = pmcData.Inventory.items.map(x => x._id);
        items = items.filter(x => !pmcItemIds.includes(x._id));
    }

    items.forEach(markItem);
}

function setInventory(pmcData, offraidData) {
    move_f.removeItemFromProfile(pmcData, pmcData.Inventory.equipment);
    move_f.removeItemFromProfile(pmcData, pmcData.Inventory.questRaidItems);
    move_f.removeItemFromProfile(pmcData, pmcData.Inventory.questStashItems);

    for (let item of offraidData.Inventory.items) {
        pmcData.Inventory.items.push(item);
    }
}

function deleteInventory(inventory) {
    let items = inventory.items;
    let pocket = items.find(x => x.parentId === inventory.equipment && x.slotId === "Pockets");
    let slots = ["SecuredContainer", "Scabbard", "Pockets"];

    let toDelete = items.filter(x => x.parentId === inventory.equipment && !slots.includes(x.slotId)
                                  || x.parentId === inventory.questRaidItems
                                  || x.parentId === pocket._id)
                        .map(x => itm_hf.getChildren(items, x._id))
                        .flat(1);

    inventory.items = items.filter(x => !toDelete.includes(x._id));
    inventory.fastPanel = {}
}

/* Returns a list of items that are eligible for insurance
 * i.e. those that were both on pmcData.inv.equip and pmcData.InsuredItems but are not in offraidData.inv
 */
function processInsurance(pmcData, offraidData) {
    let insuredIds = pmcData.InsuredItems.map(x => x.itemId);
    let beforeRaid = itm_hf.getChildren(pmcData.Inventory.items, pmcData.Inventory.equipment);
    let afterRaid  = itm_hf.getChildren(offraidData.Inventory.items, offraidData.Inventory.equipment);
    let ids = beforeRaid.filter(x => insuredIds.includes(x)).filter(x => !afterRaid.includes(x));

    return pmcData.Inventory.items.filter(x => ids.includes(x._id));
}

function saveProgress(offraidData, sessionID) {
    if (!settings.gameplay.inraid.saveLootEnabled) {
        return;
    }

    const pmcData = profile_f.profileServer.getPmcProfile(sessionID);
    const scavData = profile_f.profileServer.getScavProfile(sessionID);
    const clearInventory = !(settings.gameplay.inraid.keepLoot || offraidData.exit === "survived" || offraidData.exit === "runner");

    // mark found items and replace item ID's
    markFoundItems(pmcData, offraidData.profile);
    itm_hf.replaceIDs(offraidData.profile.Inventory.items, itm_hf.getProtectedIds(offraidData.profile));

    // set pmc data
    if (!offraidData.isPlayerScav) {
        pmcData.Info.Level        = offraidData.profile.Info.Level;
        pmcData.Skills            = offraidData.profile.Skills;
        pmcData.Stats             = offraidData.profile.Stats;
        pmcData.Encyclopedia      = offraidData.profile.Encyclopedia;
        pmcData.ConditionCounters = offraidData.profile.ConditionCounters;
        pmcData.Quests            = offraidData.profile.Quests;

        // add experience points
        pmcData.Info.Experience += pmcData.Stats.TotalSessionExperience;
        pmcData.Stats.TotalSessionExperience = 0;

        // level 69 cap to prevent visual bug occuring at level 70
        if (pmcData.Info.Experience > 13129881) {
            pmcData.Info.Experience = 13129881;
        }

        // set player health now
        health_f.healthServer.applyHealth(pmcData, sessionID);

        // remove the Lab card TODO fix that function
        //removeLabKeyCard(offraidData.profile);

        // handle death
        if (clearInventory) {
            deleteInventory(offraidData.profile.Inventory);
        }

        // handle insurance
        let itemsForInsurance = processInsurance(pmcData, offraidData.profile);
        insurance_f.sendInsuredItems(pmcData, itemsForInsurance, sessionID);
    }

    // set profile equipment to the raid equipment
    setInventory(offraidData.isPlayerScav ? scavData : pmcData, offraidData.profile);
}

module.exports.saveProgress = saveProgress;
