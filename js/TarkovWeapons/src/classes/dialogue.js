"use strict";

class DialogueServer {
	constructor() {
		this.dialogues = {};
	}

	initializeDialogue(sessionID) {
		this.dialogues[sessionID] = json.parse(json.read(getPath(sessionID)));
	}

	saveToDisk(sessionID) {
		if (sessionID in this.dialogues) {
			json.write(getPath(sessionID), this.dialogues[sessionID]);
		}
	}

	/* Set the content of the dialogue on the list tab. */
	generateDialogueList(sessionID) {
		let data = [];
		for (let dialogueId in this.dialogues[sessionID]) {
			data.push(this.getDialogueInfo(dialogueId, sessionID));
		}

		return '{"err":0,"errmsg":null,"data":' + json.stringify(data) + '}';
	}

	/* Get the content of a dialogue. */
	getDialogueInfo(dialogueId, sessionID) {
		let dialogue = this.dialogues[sessionID][dialogueId];
		return {
			'_id': dialogueId,
			'type': 2, // Type npcTrader.
			'message': this.getMessagePreview(dialogue),
			'new': dialogue.new,
			'attachmentsNew': dialogue.attachmentsNew,
			'pinned': dialogue.pinned
		};
	}

	/*
	* Set the content of the dialogue on the details panel, showing all the messages
	* for the specified dialogue.
	*/
	generateDialogueView(dialogueId, sessionID) {
		// TODO(camo1018): Respect the message limit, but to heck with it for now.
		return '{"err":0,"errmsg":null, "data":' + json.stringify(
			{'messages': this.dialogues[sessionID][dialogueId].messages}) + '}';
	}

	/*
	* Add a templated message to the dialogue.
	*/
	addDialogueMessage(dialogueID, messageContent, sessionID, items = []) {
		let dialogueData = this.dialogues[sessionID];
		let isNewDialogue = !(dialogueID in dialogueData);
		let dialogue = dialogueData[dialogueID];

		if (isNewDialogue) {
			dialogue = {
				"_id": dialogueID,
				"messages": [],
				"pinned": false,
				"new": 0,
				"attachmentsNew": 0
			};
			dialogueData[dialogueID] = dialogue;
		}

		dialogue.new += 1;

		// Generate item stash if we have attachments.
		let attachments = {};

		if (items.length > 0) {
			const stashId = utility.generateNewItemId();

			attachments.stash = stashId;
			itm_hf.replaceIDs(items);
            reparentItems(stashId, items);
			attachments.data = items;
			dialogue.attachmentsNew += 1;
		}

		let message = {
			"_id": utility.generateNewDialogueId(),
			"uid": dialogueID,
			"type": messageContent.type,
			"dt": Date.now() / 1000,
			"templateId": messageContent.templateId,
			"text": messageContent.text,
			"hasRewards": items.length > 0,
			"items": attachments,
			"maxStorageTime": messageContent.maxStorageTime,
			"systemData": messageContent.systemData
		};

		dialogue.messages.push(message);

		let notificationMessage = notifier_f.createNewMessageNotification(message);
		notifier_f.notifierService.addToMessageQueue(notificationMessage, sessionID);
	}

	/*
	* Get the preview contents of the last message in a dialogue.
	*/
	getMessagePreview(dialogue) {
		// The last message of the dialogue should be shown on the preview.
		let message = dialogue.messages[dialogue.messages.length - 1];

		return {
			"dt": message.dt,
			"type": message.type,
			"templateId": message.templateId,
			"uid": dialogue._id
		};
	}

	/*
	* Get the item contents for a particular message.
	*/
	getMessageItemContents(messageId, sessionID) {
		let dialogueData = this.dialogues[sessionID];

		for (let dialogueId in dialogueData) {
			let messages = dialogueData[dialogueId].messages;

			for (let message of messages) {
				if (message._id === messageId) {
					return message.items.data;
				}
			}
		}

		return [];
	}

	removeDialogue(dialogueId, sessionID) {
		delete this.dialogues[sessionID][dialogueId];
	}

	setDialoguePin(dialogueId, shouldPin, sessionID) {
		this.dialogues[sessionID][dialogueId].pinned = shouldPin;
	}

	setRead(dialogueIds, sessionID) {
		let dialogueData = this.dialogues[sessionID];

		for (let dialogId of dialogueIds) {
			dialogueData[dialogId].new = 0;
			dialogueData[dialogId].attachmentsNew = 0;
		}
	}

	getAllAttachments(dialogueId, sessionID) {
		return {"messages": this.dialogues[sessionID][dialogueId].messages};
	}
}

function reparentItems(newParent, items) {
    let ids = new Set(items.map(x => x._id));
    items.filter(x => !ids.has(x.parentId)).forEach(function(x) { x.parentId = newParent; x.slotId = "main"; });
}

function getPath(sessionID) {
    let path = db.user.profiles.dialogue;
    return path.replace("__REPLACEME__", sessionID);
}

let messageTypes = {
	"npcTrader": 2,
	"insuranceReturn": 8,
	"questStart": 10,
	"questFail": 11,
	"questSuccess": 12
};

/*
* Return the int value associated with the messageType, for readability.
*/
function getMessageTypeValue(messageType) {
	return messageTypes[messageType];
}

module.exports.dialogueServer = new DialogueServer();
module.exports.getMessageTypeValue = getMessageTypeValue;
