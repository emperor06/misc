"use strict";

class ItemServer {
    constructor() {
        this.output = "";
        this.routes = {};

        this.resetOutput();
    }

    /* adds route to check for */
    addRoute(route, callback) {
        this.routes[route] = callback;
    }

    handleRoutes(info, sessionID) {
        let pmcData = profile_f.profileServer.getPmcProfile(sessionID);
        let result = "";

        for (let body of info.data) {
            if (body.Action in this.routes) {
                result = this.routes[body.Action](pmcData, body, sessionID);
            } else {
                logger.logError("[UNHANDLED ACTION] " + body.Action);
            }
        }

        if (result !== "") {
            result = json.stringify(result);
        }

        this.resetOutput();
        return result;
    }

    getOutput() {
        if (this.output === "") {
            this.resetOutput();
        }

        return this.output;
    }

    setOutput(data) {
        this.output = data;
    }

    resetOutput() {
        this.output = {"err":0, "errmsg":null, "data":{"items":{"new":[], "change":[], "del":[]}, "badRequest":[], "quests":[], "ragFairOffers":[], "builds":[], "currentSalesSums":{}}};
    }
}

module.exports.itemServer = new ItemServer();