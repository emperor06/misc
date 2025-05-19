"use strict";

function handleRoutes(url, info, sessionID) {
    let ret = item_f.itemServer.handleRoutes(info, sessionID);

    if (ret !== "") {
        logger.logSuccess("Player progress autosaved!");
        saveHandler.saveOpenSessions();
    }

    return ret;
}

router.addStaticRoute("/client/game/profile/items/moving", handleRoutes);