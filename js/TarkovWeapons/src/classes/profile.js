﻿"use strict";

/*
* ProfileServer class maintains list of active profiles for each sessionID in memory. All first-time loads and save
* operations also write to disk.*
*/
class ProfileServer {
    constructor() {
        this.profiles = {};
    }

    initializeProfile(sessionID) {
        this.profiles[sessionID] = {};
        this.loadProfilesFromDisk(sessionID);
    }

    loadProfilesFromDisk(sessionID) {
        this.profiles[sessionID]['pmc'] = json.parse(json.read(getPmcPath(sessionID)));
        this.generateScav(sessionID);
    }

    getOpenSessions() {
        return Object.keys(this.profiles);
    }

    saveToDisk(sessionID) {
        if ("pmc" in this.profiles[sessionID]) {
            json.write(getPmcPath(sessionID), this.profiles[sessionID]['pmc']);
        }
    }

    /* 
    * Get profile with sessionID of type (profile type in string, i.e. 'pmc').
    * If we don't have a profile for this sessionID yet, then load it and other related data
    * from disk.
    */
    getProfile(sessionID, type) {
        if (!(sessionID in this.profiles)) {
            this.initializeProfile(sessionID);
            dialogue_f.dialogueServer.initializeDialogue(sessionID);
            health_f.healthServer.initializeHealth(sessionID);
        }

        return this.profiles[sessionID][type];
    }

    getPmcProfile(sessionID) {
        return this.getProfile(sessionID, 'pmc');
    }

    getScavProfile(sessionID) {
        return this.getProfile(sessionID, 'scav');
    }

    createProfile(info, sessionID) {
        let account = account_f.accountServer.find(sessionID);
        let folder = account_f.getPath(account.id);
        let pmcData = json.parse(json.read(db.profile.character[account.edition + "_" + info.side.toLowerCase()]));
        let storage = json.parse(json.read(db.profile.storage));

        // pmc info
        pmcData._id = "pmc" + account.id;
        pmcData.aid = account.id;
        pmcData.savage = "scav" + account.id;
        pmcData.Info.Nickname = info.nickname;
        pmcData.Info.LowerNickname = info.nickname.toLowerCase();
        pmcData.Info.RegistrationDate = Math.floor(new Date() / 1000);

        // storage info
        storage.data._id = "pmc" + account.id;
        storage.data.suites = (info.side === "Usec") ? ["5cde9ec17d6c8b04723cf479", "5cde9e957d6c8b0474535da7"] : ["5cd946231388ce000d572fe3", "5cd945d71388ce000a659dfb"];

        // set trader standing      
        for (let trader of Object.keys(db.traders)) {
            pmcData.TraderStandings[trader] = {
                "currentLevel": 1,
                "currentSalesSum": 0,
                "currentStanding": 0,
                "NextLoyalty": null,
                "loyaltyLevels": ((trader_f.traderServer.getTrader(trader)).data.loyalty.loyaltyLevels)
            };
        }

        // create profile
        json.write(folder + "character.json", pmcData);
        json.write(folder + "storage.json", storage);
        json.write(folder + "userbuilds.json", {});
        json.write(folder + "dialogue.json", {});

        // load to memory.
        this.getProfile(sessionID, 'pmc');

        // don't wipe profile again
        account_f.accountServer.setWipe(account.id, false);
    }

    generateScav(sessionID) {
        let pmcData = this.getPmcProfile(sessionID);
        let scavData = bots_f.generatePlayerScav();

        scavData._id = pmcData.savage;
        scavData.aid = sessionID;
        
        this.profiles[sessionID]['scav'] = scavData;
        return scavData;
    }

    changeNickname(info, sessionID) {
        let pmcData = this.getPmcProfile(sessionID);

        // check if the nickname exists
        if (account_f.nicknameTaken(info)) {
            return '{"err":225, "errmsg":"this nickname is already in use", "data":null}';
        }

        // change nickname
        pmcData.Info.Nickname = info.nickname;
        pmcData.Info.LowerNickname = info.nickname.toLowerCase();
        return ('{"err":0, "errmsg":null, "data":{"status":0, "nicknamechangedate":' + Math.floor(new Date() / 1000) + "}}");
    }

    changeVoice(info, sessionID) {
        let pmcData = this.getPmcProfile(sessionID);
        pmcData.Info.Voice = info.voice;
    }
}

function getPmcPath(sessionID) {
    let pmcPath = db.user.profiles.character;
    return pmcPath.replace("__REPLACEME__", sessionID);
}

function getStashType(sessionID) {
    let pmcData = profile_f.profileServer.getPmcProfile(sessionID);

    for (let item of pmcData.Inventory.items) {
        if (item._id === pmcData.Inventory.stash) {
            return item._tpl;
        }
    }

    logger.logError("No stash found");
    return "";
}

module.exports.profileServer = new ProfileServer();
module.exports.getStashType = getStashType;
