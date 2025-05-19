"use strict";

/* Based on the item action, determine whose inventories we should be looking at for from and to. */
function getOwnerInventoryItems(body, sessionID) {
    let isSameInventory = false;
    let pmcItems = profile_f.profileServer.getPmcProfile(sessionID).Inventory.items;
    let scavData = profile_f.profileServer.getScavProfile(sessionID);
    let fromInventoryItems = pmcItems;
    let fromType = "pmc";

    if ("fromOwner" in body) {
        if (body.fromOwner.id === scavData._id) {
            fromInventoryItems = scavData.Inventory.items;
            fromType = "scav";
        } else if (body.fromOwner.type === "Mail") {
            fromInventoryItems = dialogue_f.dialogueServer.getMessageItemContents(body.fromOwner.id, sessionID);
            fromType = "mail";
        }
    }

    // Don't need to worry about mail for destination because client doesn't allow
    // users to move items back into the mail stash.
    let toInventoryItems = pmcItems;
    let toType = "pmc";

    if ("toOwner" in body && body.toOwner.id === scavData._id) {
        toInventoryItems = scavData.Inventory.items;
        toType = "scav";
    }

    if (fromType === toType) {
        isSameInventory = true;
    }

    return {
        from: fromInventoryItems,
        to: toInventoryItems,
        sameInventory: isSameInventory,
        isMail: fromType === "mail"
    };
}

/* Move Item
* change location of item with parentId and slotId
* transfers items from one profile to another if fromOwner/toOwner is set in the body.
* otherwise, move is contained within the same profile_f.
* */
function moveItem(pmcData, body, sessionID) {
    let output = item_f.itemServer.getOutput();
    let items = getOwnerInventoryItems(body, sessionID);

    if (items.isMail) {
        let idsToMove = itm_hf.getChildren(items.from, body.item);

        items.to.push(...items.from.filter(x => idsToMove.includes(x._id)));
        moveItemInternal(items.to, body);
    } else if (items.sameInventory) {
        moveItemInternal(items.from, body);
    } else {
        moveItemToProfile(items.from, items.to, body);
    }

    return output;
}

/* Internal helper function to transfer an item from one profile to another.
* fromProfileData: Profile of the source.
* toProfileData: Profile of the destination.
* body: Move request
*/
function moveItemToProfile(fromItems, toItems, body) {
    handleCartridges(fromItems, body);

    let idsToMove = itm_hf.getChildren(fromItems, body.item);

    for (let itemId of idsToMove) {
        for (let itemIndex in fromItems) {
            if (fromItems[itemIndex]._id && fromItems[itemIndex]._id === itemId) {
                if (itemId === body.item) {
                    fromItems[itemIndex].parentId = body.to.id;
                    fromItems[itemIndex].slotId = body.to.container;

                    if ("location" in body.to) {
                        fromItems[itemIndex].location = body.to.location;
                    } else {
                        if (fromItems[itemIndex].location) {
                            delete fromItems[itemIndex].location;
                        }
                    }
                }

                toItems.push(fromItems[itemIndex]);
                fromItems.splice(itemIndex, 1);
            }
        }
    }
}

/* Internal helper function to move item within the same profile_f.
* items: Items
* body: Move request
*/
function moveItemInternal(items, body) {
    handleCartridges(items, body);

    for (let item of items) {
        if (item._id && item._id === body.item) {
            item.parentId = body.to.id;
            item.slotId = body.to.container;

            if ("location" in body.to) {
                item.location = body.to.location;
            } else {
                if (item.location) {
                    delete item.location;
                }
            }

            return;
        }
    }
}

/* Internal helper function to handle cartridges in inventory if any of them exist.
* items: Items
* body: Move request
*/
function handleCartridges(items, body) {
    // -> Move item to diffrent place - counts with equiping filling magazine etc
    if (body.to.container === 'cartridges') {
        let tmp_counter = 0;

        for (let item_ammo in items) {
            if (body.to.id === items[item_ammo].parentId) {
                tmp_counter++;
            }
        }

        body.to.location = tmp_counter;//wrong location for first cartrige
    }
}

/* Remove item of itemId and all of its descendants from profile. */
function removeItemFromProfile(profileData, itemId, output = null) {
    let ids_toremove = new Set(itm_hf.getChildren(profileData.Inventory.items, itemId));
    profileData.Inventory.items = profileData.Inventory.items.filter(x => !ids_toremove.has(x._id));

    if (output !== null) {
        for (let id of ids_toremove) {
            output.data.items.del.push({"_id": id}); // Tell client to remove this from live game
        }
    }
}

/*
* Remove Item
* Deep tree item deletion / Delets main item and all sub items with sub items ... and so on.
*/
function removeItem(profileData, body, output, sessionID) {
    let toDo = [body];

    //Find the item and all of it's relates
    if (toDo[0] === undefined || toDo[0] === null || toDo[0] === "undefined") {
        logger.logError("item id is not valid");
        return "";
    }

    removeItemFromProfile(profileData, toDo[0], output);
    return output;
}

function discardItem(pmcData, body, sessionID) {
    insurance_f.insuranceServer.remove(pmcData, body.item, sessionID);
    return removeItem(pmcData, body.item, item_f.itemServer.getOutput(), sessionID);
}

/* Split Item
* spliting 1 item into 2 separate items ...
* */
function splitItem(pmcData, body, sessionID) {
    let output = item_f.itemServer.getOutput();
    let location = body.container.location;

    let items = getOwnerInventoryItems(body, sessionID);

    if (!("location" in body.container) && body.container.container === "cartridges") {
        let tmp_counter = 0;

        for (let item_ammo in items.to) {
            if (items.to[item_ammo].parentId === body.container.id) {
                tmp_counter++;
            }
        }

        location = tmp_counter;//wrong location for first cartrige
    }


    // The item being merged is possible from three different sources: pmc, scav, or mail.
    for (let item of items.from) {
        if (item._id && item._id === body.item) {
            item.upd.StackObjectsCount -= body.count;

            let newItem = utility.generateNewItemId();

            output.data.items.new.push({
                "_id": newItem,
                "_tpl": item._tpl,
                "parentId": body.container.id,
                "slotId": body.container.container,
                "location": location,
                "upd": {"StackObjectsCount": body.count}
            });

            items.to.push({
                "_id": newItem,
                "_tpl": item._tpl,
                "parentId": body.container.id,
                "slotId": body.container.container,
                "location": location,
                "upd": {"StackObjectsCount": body.count}
            });

            return output;
        }
    }

    return "";
}

/* Merge Item
* merges 2 items into one, deletes item from body.item and adding number of stacks into body.with
* */
function mergeItem(pmcData, body, sessionID) {
    let output = item_f.itemServer.getOutput();
    let items = getOwnerInventoryItems(body, sessionID);

    for (let key in items.to) {
        if (items.to[key]._id && items.to[key]._id === body.with) {
            for (let key2 in items.from) {
                if (items.from[key2]._id && items.from[key2]._id === body.item) {
                    let stackItem0 = 1;
                    let stackItem1 = 1;

                    if ("upd" in items.to[key]) {
                        stackItem0 = items.to[key].upd.StackObjectsCount;
                    }

                    if ("upd" in items.from[key2]) {
                        stackItem1 = items.from[key2].upd.StackObjectsCount;
                    }

                    if (stackItem0 === 1) {
                        Object.assign(items.to[key], {"upd": {"StackObjectsCount": 1}});
                    }

                    items.to[key].upd.StackObjectsCount = stackItem0 + stackItem1;
                    output.data.items.del.push({"_id": items.from[key2]._id});
                    items.from.splice(key2, 1);
                    return output;
                }
            }
        }
    }

    return "";
}

/* Transfer item
* Used to take items from scav inventory into stash or to insert ammo into mags (shotgun ones) and reloading weapon by clicking "Reload"
* */
function transferItem(pmcData, body, sessionID) {
    let output = item_f.itemServer.getOutput();

    let itemFrom = null, itemTo = null;

    for (let iterItem of pmcData.Inventory.items) {
        if (iterItem._id === body.item) {
            itemFrom = iterItem;
        }
        else if (iterItem._id === body.with) {
            itemTo = iterItem;
        }
        if (itemFrom !== null && itemTo !== null) break;
    }

    if (itemFrom !== null && itemTo !== null)
    {
        let stackFrom = 1;

        if ("upd" in itemFrom) {
            stackFrom = itemFrom.upd.StackObjectsCount;
        } else {
            Object.assign(itemFrom, {"upd": {"StackObjectsCount": 1}});
        }

        if (stackFrom > body.count) {
            itemFrom.upd.StackObjectsCount = stackFrom - body.count;
        } else {
            // Moving a full stack onto a smaller stack
            itemFrom.upd.StackObjectsCount = stackFrom - 1;
        }

        let stackTo = 1;

        if ("upd" in itemTo) {
            stackTo = itemTo.upd.StackObjectsCount;
        } else {
            Object.assign(itemTo, {"upd": {"StackObjectsCount": 1}});
        }

        itemTo.upd.StackObjectsCount = stackTo + body.count;
    }

    return output;
}

/* Swap Item
* its used for "reload" if you have weapon in hands and magazine is somewhere else in rig or backpack in equipment
* */
function swapItem(pmcData, body, sessionID) {
    let output = item_f.itemServer.getOutput();

    for (let iterItem of pmcData.Inventory.items) {
        if (iterItem._id === body.item) {
            iterItem.parentId = body.to.id;         // parentId
            iterItem.slotId = body.to.container;    // slotId
            iterItem.location = body.to.location    // location
        }

        if (iterItem._id === body.item2) {
            iterItem.parentId = body.to2.id;
            iterItem.slotId = body.to2.container;
            delete iterItem.location;
        }
    }

    return output;
}

/**
 * Given a container's free space map, finds a suitable slot for an item of size (sizeX,sizeY).
 * Also, modify the map so that the area is now marked as occupied
 * return slot coordinate {x, y}, or false if the item does not fit at all
 */
function reserveSlotForItem(slots, sizeX, sizeY) {
    let map = (new Array(slots[0].length)).fill(0);
    let running = 0;

    for (let row = 0; row < slots.length; row++) {
        for (let col = 0; col < slots[0].length; col++) {
            if (slots[row][col]) {
                if (++running >= sizeX) {
                    map[col - sizeX + 1]++;

                    if (map[col - sizeX + 1] === sizeY) {
                        let coords = {x: (col - sizeX + 1), y: (row - sizeY + 1)}
                        markAsOccupied(slots, sizeX, sizeY, coords);

                        return coords;
                    }
                }
            }
            else {
                running = 0;
                map[col] = 0;
            }
        }
    }

    return false;
}

function markAsOccupied(slots, sizeX, sizeY, coords) {
    for (let y = coords.y; y < coords.y + sizeY; y++) {
        slots[y].fill(false, coords.x, coords.x + sizeX);
    }
}

/* Adds an item to the player's inventory
 * [TODO] use something similar to quest::processReward
 */
function addItem(pmcData, body, output, sessionID, foundInRaid = false) {
    let items;
    if (body.item_id in globals.data.ItemPresets) {
        items = globals.data.ItemPresets[body.item_id]._items;
        body.item_id = items[0]._id;
    }
    else if ("579dc571d53a0658a154fbec" === body.tid) {
        items = [{_id: body.item_id, _tpl: body.item_id}];
    }
    else {
        items = trader_f.traderServer.getAssort(body.tid).data.items;
    }
    let item = items.find(x => x._id === body.item_id);

    if (item === undefined) {
        logger.logError("addItem() error: item " + body.item_id + " not found in the given list");
        return "";
    }

    const stackMaxSize = global.items.data[item._tpl]._props.StackMaxSize;
    const remainder = 1 + (body.count - 1) % stackMaxSize;
    const nbStacks = 1 + Math.floor((body.count - 1) / stackMaxSize);
    const stash = { _id: pmcData.Inventory.stash, _tpl: profile_f.getStashType(sessionID) };
    const stash2D = itm_hf.getContainerFreeSpace(pmcData.Inventory.items, stash);
    const itemSize = itm_hf.getSize(item._tpl, item._id, items);

    for (let stacks = 0; stacks < nbStacks; stacks++) {
        let slot = reserveSlotForItem(stash2D, itemSize[0], itemSize[1]);

        if (!slot) {
            logger.logWarning("No more room for items! They will be lost.");
            return output;
        }

        let upd = {}

        if (stackMaxSize !== 1) {
            let count = (stacks === nbStacks - 1) ? remainder : stackMaxSize;
            upd.StackObjectsCount = count;
        }

        // hideout items need to be marked as found in raid
        if (foundInRaid || settings.gameplay.trading.buyItemsMarkedFound) {
            upd.SpawnedInSession = true;
        }

        let newItem = {
            "_id": utility.generateNewItemId(),
            "_tpl": item._tpl,
            "parentId": stash._id,
            "slotId": "hideout",
            "location": {"x": slot.x, "y": slot.y, "r": "Horizontal"}
        }

        if (Object.keys(upd).length) {
            newItem.upd = upd;
        }

        output.data.items.new.push(newItem);
        pmcData.Inventory.items.push(newItem);
        logger.logInfo(`Item ${newItem._id} placed at position [${slot.x}, ${slot.y}]`);

        // This whole business is just about applying mods to unstacked weapons (see quest::processReward)
        let toDo = [];
        toDo.push([item._id, newItem._id]);

        while (toDo.length) {
            let current = toDo.shift();

            for (let mod of items) {
                if (mod.parentId && mod.parentId === current[0]) {
                    if (mod.slotId === "hideout") {
                        logger.logError("[ASSERT] addItem(): slotId should not be hideout!");
                        return output;
                    }

                    newItem = {
                        "_id": utility.generateNewItemId(),
                        "_tpl": mod._tpl,
                        "parentId": current[1],
                        "slotId": mod.slotId
                    }

                    if (foundInRaid || settings.gameplay.trading.buyItemsMarkedFound) {
                        newItem.upd = { "SpawnedInSession": true }
                    }

                    output.data.items.new.push(newItem);
                    pmcData.Inventory.items.push(newItem);
                    toDo.push([mod._id, newItem._id]);
                }
            }
        }
    }

    return output;
}

module.exports.moveItem = moveItem;
module.exports.removeItemFromProfile = removeItemFromProfile;
module.exports.removeItem = removeItem;
module.exports.discardItem = discardItem;
module.exports.splitItem = splitItem;
module.exports.mergeItem = mergeItem;
module.exports.transferItem = transferItem;
module.exports.swapItem = swapItem;
module.exports.addItem = addItem;
