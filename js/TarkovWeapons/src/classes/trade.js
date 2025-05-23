"use strict";

function buyItem(pmcData, body, sessionID) {
    if (!itm_hf.payMoney(pmcData, body, sessionID)) {
        logger.logError("no money found");
        return "";
    }

    logger.logSuccess("Bought item: " + body.item_id);
    
    return move_f.addItem(pmcData, body, item_f.itemServer.getOutput(), sessionID);
}

// Selling item to trader
function sellItem(pmcData, body, sessionID) {
    const traderId = body.tid;
    let money = 0;
    let prices = trader_f.getPurchasesData(traderId, sessionID);
    let output = item_f.itemServer.getOutput();

    for (let sellItem of body.items) {
        for (let item of pmcData.Inventory.items) {
            // profile inventory, look into it if item exist
            let isThereSpace = sellItem.id.search(" ");
            let checkID = sellItem.id;

            if (isThereSpace !== -1) {
                checkID = checkID.substr(0, isThereSpace);
            }

            // item found
            if (item._id === checkID) {
                logger.logInfo("Selling: " + checkID);

                // remove item
                insurance_f.insuranceServer.remove(pmcData, checkID, sessionID);
                output = move_f.removeItem(pmcData, checkID, output, sessionID);

                // add money to return to the player
                if (output !== "") {
                    money += parseInt(prices[item._id][0][0].count);
                    break;
                }

                return "";
            }
        }
    }

    // get money the item]
    return itm_hf.getMoney(pmcData, money, traderId, output, sessionID);
}

// separate is that selling or buying
function confirmTrading(pmcData, body, sessionID) {
    // buying
    if (body.type === "buy_from_trader") {
        return buyItem(pmcData, body, sessionID);
    }

    // selling
    if (body.type === "sell_to_trader") {
        return sellItem(pmcData, body, sessionID);
    }

    return "";
}

// Ragfair trading
function confirmRagfairTrading(pmcData, body, sessionID) {
    let offers = body.offers;
    let output = item_f.itemServer.getOutput()

    for (let offer of offers) {
        pmcData = profile_f.profileServer.getPmcProfile(sessionID);

        body = {
            "Action": "TradingConfirm",
            "type": "buy_from_trader",
            "tid": "579dc571d53a0658a154fbec",
            "item_id": offer.id,
            "count": offer.count,
            "scheme_id": 0,
            "scheme_items": offer.items
        };

        output = confirmTrading(pmcData, body, sessionID);
    }
    
    return output;
}

module.exports.buyItem = buyItem;
module.exports.sellItem = sellItem;
module.exports.confirmTrading = confirmTrading;
module.exports.confirmRagfairTrading = confirmRagfairTrading;
