"use strict";

const moneyContainers = new Set([
    "5783c43d2459774bbe137486", // wallet (money + keycard)
    "590c60fc86f77412b13fddcf", // docbag
    "590dde5786f77405e71908b2", // bank case
    "5910922b86f7747d96753483", // carbon case
    "59fb016586f7746d0d4b423a", // money case
    "5d235bb686f77443f4331278"  // item_container_lopouch
]);


/* A reverse lookup for templates */
function createLookup() {
    let lookup = {
        items: {
            byId: {},
            byParent: {}
        },
        categories: {
            byId: {},
            byParent: {}
        }
    }

    for (let x of templates.data.Items) {
        lookup.items.byId[x.Id] = x.Price;
        lookup.items.byParent[x.ParentId] || (lookup.items.byParent[x.ParentId] = []);
        lookup.items.byParent[x.ParentId].push(x.Id);
    }

    for (let x of templates.data.Categories) {
        lookup.categories.byId[x.Id] = x.ParentId ? x.ParentId : null;
        if (x.ParentId) { // root as no parent
            lookup.categories.byParent[x.ParentId] || (lookup.categories.byParent[x.ParentId] = []);
            lookup.categories.byParent[x.ParentId].push(x.Id);
        }
    }

    return lookup;
}

function getTemplatePrice(x) {
    return (x in tplLookup.items.byId) ? tplLookup.items.byId[x] : 1;
}

/* all items in template with the given parent category */
function templatesWithParent(x) {
    return (x in tplLookup.items.byParent) ? tplLookup.items.byParent[x] : [];
}

function isCategory(x) {
    return x in tplLookup.categories.byId;
}

function childrenCategories(x) {
    return (x in tplLookup.categories.byParent) ? tplLookup.categories.byParent[x] : [];
}

/* Use real containers only (stash, money case, etc.), not magazines or regular items!
 * items must contain at least all the items (recursively) present in the container.
 * returns a binary map [line][row] where false = used slot, true = free slot
 */
function getContainerFreeSpace(itemsList, container) {
    let childrenIds = new Set(getChildren(itemsList, container._id));
    let containedItems = itemsList.filter(x => childrenIds.has(x._id));

    let gridProps = global.items.data[container._tpl]._props.Grids[0]._props;
    let sizeX = (gridProps.cellsH !== 0) ? gridProps.cellsH : 10;
    let sizeY = (gridProps.cellsV !== 0) ? gridProps.cellsV : 66;
    let stash2D = new Array(sizeY).fill(0).map(x => new Array(sizeX).fill(true));

    containedItems.filter(x => x.parentId === container._id).forEach(function (item) {
        const itemSize = getSize(item._tpl, item._id, containedItems);
        let w = itemSize[0];
        let h = itemSize[1];

        if ("upd" in item && "Foldable" in item.upd && item.upd.Foldable.Folded) {
            w--;
        }

        if (item.location.r === "Vertical" || item.location.rotation === "Vertical") {
            let tmp = w;
            w = h;
            h = tmp;
        }

        for (let y = 0; y < h; y++) {
            stash2D[item.location.y + y].fill(false, item.location.x, item.location.x + w);
        }
    });


    return stash2D;
}

function isMoneyTpl(tpl) {
    const moneyTplArray = ['569668774bdc2da2298b4568', '5696686a4bdc2da3298b456a', '5449016a4bdc2d6f028b456f'];
    return moneyTplArray.findIndex(moneyTlp => moneyTlp === tpl) > -1;
}

/* Gets currency TPL from TAG
* input: currency(tag)
* output: template ID
* */
function getCurrency(currency) {
    switch (currency) {
        case "EUR":
            return "569668774bdc2da2298b4568";
        case "USD":
            return "5696686a4bdc2da3298b456a";
        default:
            return "5449016a4bdc2d6f028b456f"; // RUB set by default
    }
}

/* Gets Currency to Ruble conversion Value
* input:  value, currency tpl
* output: value after conversion
*/
function inRUB(value, currency) {
    return Math.round(value * getTemplatePrice(currency));
}

/* Gets Ruble to Currency conversion Value
* input: value, currency tpl
* output: value after conversion
* */
function fromRUB(value, currency) {
    return Math.round(value / getTemplatePrice(currency));
}

/* take money and insert items into return to server request
* input:
* output: boolean
* */
function payMoney(pmcData, body, sessionID) {
    let output = item_f.itemServer.getOutput();
    let tmpTraderInfo = trader_f.traderServer.getTrader(body.tid, sessionID);
    let currencyTpl = getCurrency(tmpTraderInfo.data.currency);

    // delete barter things(not a money) from inventory
    if (body.Action === 'TradingConfirm') {
        for (let index in body.scheme_items) {
            let item = undefined;

            for (let element of pmcData.Inventory.items) {
                if (body.scheme_items[index].id === element._id) {
                    item = element;
                }
            }

            if (item !== undefined) {
                if (!isMoneyTpl(item._tpl)) {
                    output = move_f.removeItem(pmcData, item._id, output, sessionID);
                    body.scheme_items[index].count = 0;
                } else {
                    currencyTpl = item._tpl;
                    break;
                }
            }
        }
    }

    // find all items with currency _tpl id
    const moneyItems = itm_hf.findMoney("tpl", pmcData, currencyTpl);

    // prepare a price for barter
    let barterPrice = 0;
    
    for (let item of body.scheme_items) {
        barterPrice += item.count;
    }

    // prepare the amount of money in the profile
    let amountMoney = 0;
    
    for (let item of moneyItems) {
        amountMoney += item.upd.StackObjectsCount;
    }

    // if no money in inventory or amount is not enough we return false
    if (moneyItems.length <= 0 || amountMoney < barterPrice) {
        return false;
    }

    let leftToPay = barterPrice;

    for (let moneyItem of moneyItems) {
        let itemAmount = moneyItem.upd.StackObjectsCount;

        if (leftToPay >= itemAmount) {
            leftToPay -= itemAmount;
            output = move_f.removeItem(pmcData, moneyItem._id, output, sessionID);
        } else {
            moneyItem.upd.StackObjectsCount -= leftToPay;
            leftToPay = 0;
            output.data.items.change.push(moneyItem);
        }

        if (leftToPay === 0) {
            break;
        }
    }

    // set current sale sum
    // convert barterPrice itemTpl into RUB then convert RUB into trader currency
    let saleSum = pmcData.TraderStandings[body.tid].currentSalesSum += fromRUB(inRUB(barterPrice, currencyTpl), getCurrency(tmpTraderInfo.data.currency));

    pmcData.TraderStandings[body.tid].currentSalesSum = saleSum;
    trader_f.traderServer.lvlUp(body.tid, sessionID);
    output.data.currentSalesSums[body.tid] = saleSum;

    // save changes
    logger.logSuccess("Items taken. Status OK.");
    item_f.itemServer.setOutput(output);
    return true;
}

/* Find Barter items in the inventory
* input: object of player data, string BarteredItem ID
* output: array of Item from inventory
* */
function findMoney(by, pmcData, barter_itemID) { // find required items to take after buying (handles multiple items)
    const barterIDs = typeof barter_itemID === "string" ? [barter_itemID] : barter_itemID;
    let itemsArray = [];

    for (const barterID of barterIDs) {
        let mapResult = pmcData.Inventory.items.filter(item => {
            return by === "tpl" ? (item._tpl === barterID) : (item._id === barterID);
        });
        
        itemsArray = Object.assign(itemsArray, mapResult);
    }

    return itemsArray;
}

/* Recursively checks if the given item is
* inside the stash, that is it has the stash as
* ancestor with slotId=hideout
*/
function isItemInStash(pmcData, item) {
    let container = item;

    while ("parentId" in container) {
        if (container.parentId === pmcData.Inventory.stash && container.slotId === "hideout") {
            return true;
        }

        container = pmcData.Inventory.items.find(x => x._id === container.parentId);

        if (container === undefined) {
            break;
        }
    }

    return false;
}

function addMoneyToContainer(pmcData, output, container, amount, maxStackSize, currency) {
    if (amount) {
        const isStash = container._id === pmcData.Inventory.stash;
        const slotId = isStash ? "hideout" : "main";
        const containerMap = getContainerFreeSpace(pmcData.Inventory.items, container);

        for (let cy = 0; cy < containerMap.length; cy++) {
            for (let cx = 0; cx < containerMap[cy].length; cx++) {
                if (amount && containerMap[cy][cx]) {
                    let newStackSize = Math.min(amount, maxStackSize);
                    amount -= newStackSize;

                    let moneyItem = {
                        "_id": utility.generateNewItemId(),
                        "_tpl": currency,
                        "parentId": container._id,
                        "slotId": slotId,
                        location: {
                            x: cx,
                            y: cy,
                            r: "Horizontal"
                        },
                        upd: {StackObjectsCount: newStackSize}
                    };

                    pmcData.Inventory.items.push(moneyItem);
                    output.data.items.new.push(moneyItem);
                }
            }
        }

        // Mark container dirty
        if (!isStash) {
            output.data.items.change.push(container);
        }
    }

    return amount;
}

/* receive money back after selling
* input: pmcData, numberToReturn, traderId,
* output: none (output is sent to item.js, and profile is saved to file)
* */
function getMoney(pmcData, amount, traderId, output, sessionID) {
    const trader = trader_f.traderServer.getTrader(traderId, sessionID);
    const currencyStr = trader.data.currency;
    const currency = getCurrency(currencyStr);
    const maxStackSize = (json.parse(json.read(db.items[currency])))._props.StackMaxSize;
    const moneyStacks = pmcData.Inventory.items.filter(x => x._tpl === currency && x.upd.StackObjectsCount < maxStackSize && isItemInStash(pmcData, x));
    let calcAmount = amount;
    let N;

    // Complete existing money stacks
    N = moneyStacks.length;
    while (calcAmount && N --> 0) {
        const stack = moneyStacks[N];
        const val = Math.min(maxStackSize - stack.upd.StackObjectsCount, calcAmount);
        stack.upd.StackObjectsCount += val;
        calcAmount -= val;
        output.data.items.change.push(stack);
    }

    if (calcAmount !== amount) {
        logger.logSuccess(`${amount - calcAmount} ${currencyStr} added to existing stacks`);
    }

    // [BUG] Adding new objects to a container does not update the client's inventory properly!
    // If a new money stack is created inside a container, the total cash displayed does not take it into account.
    // Also, the container is displayed without that new stack, as if it does not exist. Restarting the client makes
    // it appear. Adding the container to output.data.items.change to force a refresh crashes the client,
    // apparently because the client destroys then recreate the container while adding the new stack
    // error: no parent with id (container) found for item (newStack)

    // If that's not enough, try to add the remaining cash to a money container
    //if (calcAmount) {
    //    const containers = pmcData.Inventory.items.filter(x => moneyContainers.has(x._tpl) && isItemInStash(pmcData, x));

    //    for (let container of containers) {
    //        calcAmount = addMoneyToContainer(pmcData, output, container, calcAmount, maxStackSize, currency);
    //    }
    //}

    // If we still have money to place, use the stash
    if (calcAmount) {
        let stash = pmcData.Inventory.items.find(x => x._id === pmcData.Inventory.stash);
        let tmp = calcAmount;
        calcAmount = addMoneyToContainer(pmcData, output, stash, calcAmount, maxStackSize, currency);
        logger.logSuccess(`${tmp - calcAmount} ${currencyStr} added to the stash`);
    }

    if (calcAmount) {
        logger.logWarning(calcAmount + " money could not be added: no more room in inventory");
    }

    // set current sale sum
    pmcData.TraderStandings[traderId].currentSalesSum += amount - calcAmount;
    trader_f.traderServer.lvlUp(traderId, sessionID);
    output.data.currentSalesSums[traderId] = pmcData.TraderStandings[traderId].currentSalesSum;

    return output;
}

/* Get Player Stash Proper Size
* input: null
* output: [stashSizeWidth, stashSizeHeight]
* */
function getPlayerStash(sessionID) { //this sets automaticly a stash size from items.json (its not added anywhere yet cause we still use base stash)
    let stashTPL = profile_f.getStashType(sessionID);
    let stashX = (items.data[stashTPL]._props.Grids[0]._props.cellsH !== 0) ? items.data[stashTPL]._props.Grids[0]._props.cellsH : 10;
    let stashY = (items.data[stashTPL]._props.Grids[0]._props.cellsV !== 0) ? items.data[stashTPL]._props.Grids[0]._props.cellsV : 66;
    return [stashX, stashY];
}

/* Calculate Size of item inputed
* inputs Item template ID, Item Id, InventoryItem (item from inventory having _id and _tpl)
* outputs [width, height]
* */
function getSize(itemtpl, itemID, InventoryItem) { // -> Prepares item Width and height returns [sizeX, sizeY]
    let toDo = [itemID];
    let tmpItem = items.data[itemtpl];
    let isFolded = false;
    let isMagazine = false;
    let isGrip = false;
    let isMainBaseHasis = false;
    let isBarrel = false;
    let BxH_diffrence_stock = 0;
    let BxH_diffrence_barrel = 0;
    let outX = tmpItem._props.Width;
    let outY = tmpItem._props.Height;
    let skipThisItems = ["5448e53e4bdc2d60728b4567", "566168634bdc2d144c8b456c", "5795f317245977243854e041"];

    // containers big no no
    if (!skipThisItems.includes(tmpItem._parent)) {
        while (toDo.length) {
            for (let item of InventoryItem) {
                if (item._id === toDo[0]) {
                    if ("upd" in item && "Foldable" in item.upd && item.upd.Foldable.Folded) {
                        isFolded = true;
                    }
                }
                else if (item.parentId === toDo[0]) {
                    let itm = items.data[item._tpl];

                    if (item.slotId != "mod_handguard") {
                        if (item.slotId == "mod_magazine") {
                            if ("ExtraSizeDown" in itm._props && itm._props.ExtraSizeDown > 0) {
                                isMagazine = true;
                            }
                        }

                        if (item.slotId == "mod_pistol_grip" || item.slotId == "mod_pistolgrip") {
                            isGrip = true;
                        }

                        if (item.slotId == "mod_stock") {
                            if ("ExtraSizeDown" in itm._props && itm._props.ExtraSizeDown > 0) {
                                isGrip = true;
                            }
                        }

                        if (item.slotId == "mod_stock") {
                            if ("ExtraSizeLeft" in itm._props && itm._props.ExtraSizeLeft > 0) {
                                BxH_diffrence_stock = itm._props.ExtraSizeLeft;
                                isMainBaseHasis = true;
                            }
                        }

                        if (item.slotId == "mod_barrel") {
                            if ("ExtraSizeLeft" in itm._props && itm._props.ExtraSizeLeft > 0) {
                                BxH_diffrence_barrel = itm._props.ExtraSizeLeft;
                                isBarrel = true;
                            }
                        }

                        if ("ExtraSizeLeft" in itm._props && itm._props.ExtraSizeLeft > 0) {
                            if (item.slotId == "mod_barrel" && itm._props.ExtraSizeLeft > 1 || item.slotId != "mod_barrel") {
                                outX += itm._props.ExtraSizeLeft;
                            }
                        }

                        if ("ExtraSizeRight" in itm._props && itm._props.ExtraSizeRight > 0) {
                            outX += itm._props.ExtraSizeRight;
                        }

                        if ("ExtraSizeUp" in itm._props && itm._props.ExtraSizeUp > 0) {
                            outY += itm._props.ExtraSizeUp;
                        }

                        if ("ExtraSizeDown" in itm._props && itm._props.ExtraSizeDown > 0) {
                            outY += itm._props.ExtraSizeDown;
                        }
                    }

                    toDo.push(item._id);
                }
            }

            toDo.splice(0, 1);
        }
    }

    if (isBarrel && isMainBaseHasis) {
        let calculate = Math.abs(BxH_diffrence_stock - BxH_diffrence_barrel);
        calculate = ((BxH_diffrence_stock > BxH_diffrence_barrel) ? BxH_diffrence_stock : BxH_diffrence_barrel) - calculate;
        outX -= calculate;
    }

    if (isMagazine && isGrip) {
        outY -= 1;
    }

    if (isFolded) {
        outX -= 1;
    }

    return [outX, outY];
}

function getChildren(items, id) {
    return [...items.filter(x => x.parentId === id).map(x => getChildren(items, x._id)).flat(1), id];
}

/* Is Dogtag
* input: itemId
* output: bool
* Checks if an item is a dogtag. Used under profile_f.js to modify preparePrice based
* on the level of the dogtag
*/
function isDogtag(itemId) {
    return itemId === "59f32bb586f774757e1e8442" || itemId === "59f32c3b86f77472a31742f0";
}

/* Gets the identifier for a child using slotId, locationX and locationY. */
function getChildId(item) {
    if (!("location" in item)) {
        return item.slotId;
    }

    return item.slotId + ',' + item.location.x + ',' + item.location.y;
}

function getProtectedIds(pmcData) {
    let ids = [ pmcData.Inventory.equipment, pmcData.Inventory.questRaidItems, pmcData.Inventory.questStashItems ];
    ids = ids.concat(pmcData.InsuredItems.map(x => x.itemId));

    return ids;
}

function replaceIDs(items, protectedIds = []) {
    let map = {}

    for (let item of items) {
        let newId = protectedIds.includes(item._id) ? item._id : utility.generateNewItemId();

        map[item._id] = map[item._id] || newId;
        item._id = map[item._id];
    }

    items.filter(x => x.hasOwnProperty("parentId")).map(x => x.parentId = map[x.parentId]);

    return items; // for chaining
}

/* split item stack if it exceeds StackMaxSize
*  input: an item
*  output: an array of these items with StackObjectsCount <= StackMaxSize
*/
function splitStack(item) {
    if (!("upd" in item) || !("StackObjectsCount" in item.upd)) {
        return [item];
    }

    const maxStack = json.parse(json.read(db.items[item._tpl]))._props.StackMaxSize;
    const stacks = [];
    let count = item.upd.StackObjectsCount;

    while (count) {
        let amount = Math.min(count, maxStack);
        let newStack = clone(item);

        newStack.upd.StackObjectsCount = amount;
        count -= amount;
        stacks.push(newStack);
    }

    return stacks;
}

function clone(x) {
    return json.parse(json.stringify(x));
}

function arrayIntersect(a, b) {
    return a.filter(x => b.includes(x));
}

/* Draws a maximum of n numbers at random between min and max, no duplicates O(n) */
function randomDraw(n, min, max) {
    if (min > max) {
        return [];
    }

    let N = max - min + 1;
    if (n > N) n = N;
    let ar = [...Array(N).keys()].map(i => i + min);
    let j, tmp, stop = N - n;

    while (N --> stop) {
        j = Math.floor(Math.random() * (N + 1));
        tmp = ar[N];
        ar[N] = ar[j];
        ar[j] = tmp;
    }

    return ar.slice(-n);
}

module.exports.createLookup = createLookup;
module.exports.getTemplatePrice = getTemplatePrice;
module.exports.templatesWithParent = templatesWithParent;
module.exports.isCategory = isCategory;
module.exports.childrenCategories = childrenCategories;
module.exports.getContainerFreeSpace = getContainerFreeSpace;
module.exports.getCurrency = getCurrency;
module.exports.inRUB = inRUB;
module.exports.fromRUB = fromRUB;
module.exports.payMoney = payMoney;
module.exports.findMoney = findMoney;
module.exports.getMoney = getMoney;
module.exports.getPlayerStash = getPlayerStash;
module.exports.getSize = getSize;
module.exports.getChildren = getChildren;
module.exports.isDogtag = isDogtag;
module.exports.getProtectedIds = getProtectedIds;
module.exports.replaceIDs = replaceIDs;
module.exports.splitStack = splitStack;
module.exports.clone = clone;
module.exports.arrayIntersect = arrayIntersect;
module.exports.randomDraw = randomDraw;
