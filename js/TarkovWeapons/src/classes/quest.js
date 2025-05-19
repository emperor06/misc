"use strict";

/*
* Quest status values
* 0 - Locked
* 1 - AvailableForStart
* 2 - Started
* 3 - AvailableForFinish
* 4 - Success
* 5 - Fail
* 6 - FailRestartable
* 7 - MarkedAsFailed
*/

let questsCache = undefined;

function initialize() {
    questsCache = json.read(db.user.cache.quests);
}

function getQuestsCache() {
    return questsCache;
}

function processReward(reward) {
    let mods = reward.items.filter(x => x._id !== reward.target);

    return reward.items
                 .filter(x => x._id === reward.target)
                 .map(itm_hf.splitStack)
                 .flat(1)
                 .map(x => [x].concat(itm_hf.clone(mods)))
                 .map(function(x) { return itm_hf.replaceIDs(x); })
                 .flat(1);
}

function getQuestRewardItems(quest, state) {
    return quest.rewards[state].filter(x => x.type === "Item").map(processReward).flat(1);
}

function acceptQuest(pmcData, body, sessionID) {
    let state = "Started";
    let found = false;
    // If the quest already exists, update its status
    for (const quest of pmcData.Quests) {
        if (quest.qid === body.qid) {
            quest.startTime = utility.getTimestamp();
            quest.status = state;
            found = true;
            break;
        }
    }
    // Otherwise, add it
    if (!found) {
        pmcData.Quests.push({
            "qid": body.qid,
            "startTime": utility.getTimestamp(),
            "status": state
        });
    }

    // Create a dialog message for starting the quest.
    // Note that for starting quests, the correct locale field is "description", not "startedMessageText".
    let quest = json.parse(json.read(db.quests[body.qid]));
    let questLocale = json.parse(json.read(db.locales["en"].quest[body.qid]));
    let messageContent = {templateId: questLocale.description, type: dialogue_f.getMessageTypeValue('questStart')};
    let questRewards = getQuestRewardItems(quest, state);

    dialogue_f.dialogueServer.addDialogueMessage(quest.traderId, messageContent, sessionID, questRewards);

    return item_f.itemServer.getOutput();
}

function completeQuest(pmcData, body, sessionID) {
    let state = "Success";

    for (let quest in pmcData.Quests) {
        if (pmcData.Quests[quest].qid === body.qid) {
            pmcData.Quests[quest].status = state;
            break;
        }
    }

    // give reward
    let quest = json.parse(json.read(db.quests[body.qid]));
    let questRewards = getQuestRewardItems(quest, state);

    for (let reward of quest.rewards.Success) {
        switch (reward.type) {
            case "Skill":
                pmcData = profile_f.profileServer.getPmcProfile(sessionID);

                for (let skill of pmcData.Skills.Common) {
                    if (skill.Id === reward.target) {
                        skill.Progress += parseInt(reward.value);
                        break;
                    }
                }
                break;

            case "Experience":
                pmcData = profile_f.profileServer.getPmcProfile(sessionID);
                pmcData.Info.Experience += parseInt(reward.value);
                break;

            case "TraderStanding":
                pmcData = profile_f.profileServer.getPmcProfile(sessionID);
                pmcData.TraderStandings[quest.traderId].currentStanding += parseFloat(reward.value);
                trader_f.traderServer.lvlUp(quest.traderId, sessionID);
                break;
        }
    }

    // Create a dialog message for completing the quest.
    let questDb = json.parse(json.read(db.quests[body.qid]));
    let questLocale = json.parse(json.read(db.locales["en"].quest[body.qid]));
    let messageContent = {
        templateId: questLocale.successMessageText,
        type: dialogue_f.getMessageTypeValue('questSuccess')
    }

    dialogue_f.dialogueServer.addDialogueMessage(questDb.traderId, messageContent, sessionID, questRewards);

    return item_f.itemServer.getOutput();
}

function handoverQuest(pmcData, body, sessionID) {
    const quest = json.parse(json.read(db.quests[body.qid]));
    let output = item_f.itemServer.getOutput();
    let types = ["HandoverItem", "WeaponAssembly"];
    let handoverMode = true;
    let value = 0;
    let counter = 0;
    let amount;

    for (let condition of quest.conditions.AvailableForFinish) {
        if (condition._props.id === body.conditionId && types.includes(condition._parent)) {
            value = parseInt(condition._props.value);
            handoverMode = condition._parent === types[0];

            break;
        }
    }

    if (handoverMode && value === 0) {
        logger.logError("Quest handover error: condition not found or incorrect value. qid=" + body.qid + ", condition=" + body.conditionId);
        return output;
    }

    for (let itemHandover of body.items) {
        if (handoverMode) {
            // remove the right quantity of given items
            amount = Math.min(itemHandover.count, value - counter);
            counter += amount;
            changeItemStack(pmcData, itemHandover.id, itemHandover.count - amount, output);

            if (counter === value) {
                break;
            }
        }
        else {
            // for weapon assembly quests, remove the item and its children
            let toRemove = itm_hf.getChildren(pmcData.Inventory.items, itemHandover.id);
            let index = pmcData.Inventory.items.length;

            // important: don't tell the client to remove the attachments, it will handle it
            output.data.items.del.push({ "_id": itemHandover.id });
            counter = 1;

            // important: loop backward when removing items from the array we're looping on
            while (index --> 0) {
                if (toRemove.includes(pmcData.Inventory.items[index]._id)) {
                    pmcData.Inventory.items.splice(index, 1);
                }
            }
        }
    }

    if (pmcData.BackendCounters.hasOwnProperty(body.conditionId)) {
        pmcData.BackendCounters[body.conditionId].value += counter;
    } else {
        pmcData.BackendCounters[body.conditionId] = {"id": body.conditionId, "qid": body.qid, "value": counter};
    }

    return output;
}

function changeItemStack(pmcData, id, value, output) {
    for (let item in pmcData.Inventory.items) {
        if (pmcData.Inventory.items[item]._id === id) {
            if (value > 0) {
                pmcData.Inventory.items[item].upd.StackObjectsCount = value;

                output.data.items.change.push({
                    "_id": pmcData.Inventory.items[item]._id,
                    "_tpl": pmcData.Inventory.items[item]._tpl,
                    "parentId": pmcData.Inventory.items[item].parentId,
                    "slotId": pmcData.Inventory.items[item].slotId,
                    "location": pmcData.Inventory.items[item].location,
                    "upd": { "StackObjectsCount": pmcData.Inventory.items[item].upd.StackObjectsCount }
                });
            } else {
                output.data.items.del.push({ "_id": id });
                pmcData.Inventory.items.splice(item, 1);
            }

            break;
        }
    }
}

module.exports.initialize = initialize;
module.exports.getQuestsCache = getQuestsCache;
module.exports.acceptQuest = acceptQuest;
module.exports.completeQuest = completeQuest;
module.exports.handoverQuest = handoverQuest;