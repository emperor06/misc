"use strict";

function getPath(sessionID) {
	let path = db.user.profiles.userbuilds;
	return path.replace("__REPLACEME__", sessionID);
}

function getUserBuilds(sessionID) {
	let userBuildsMap = json.parse(json.read(getPath(sessionID)));

	let userBuilds = [];

	for (let buildName in userBuildsMap) {
		userBuilds.push(userBuildsMap[buildName]);
	}

	return userBuilds;
}

function SaveBuild(pmcData, body, sessionID) {
    let output = item_f.itemServer.getOutput();
    let savedBuilds = json.parse(json.read(getPath(sessionID)));
    let rootIndex = body.items.findIndex(x => x._id === body.root);

    delete body.Action;
    itm_hf.replaceIDs(body.items);
    body.id = utility.generateNewItemId();
    body.root = body.items[rootIndex]._id;
    savedBuilds[body.name] = body;
    json.write(getPath(sessionID), savedBuilds);
    output.data.builds.push(body);

    return output;
}

function RemoveBuild(pmcData, body, sessionID) {
    let savedBuilds = json.parse(json.read(getPath(sessionID)));
    let name = Object.values(savedBuilds).find(build => build.id === body.id).name;

    delete savedBuilds[name];
    json.write(getPath(sessionID), savedBuilds);
    return item_f.itemServer.getOutput();
}

module.exports.getPath = getPath;
module.exports.getUserBuilds = getUserBuilds;
module.exports.saveBuild = SaveBuild;
module.exports.removeBuild = RemoveBuild;