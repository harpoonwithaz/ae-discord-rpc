/* global CSInterface */

var DiscordRPC = require("discord-rpc");

var CLIENT_ID = "1469933901261701212";
var POLL_INTERVAL_MS = 15000;

var rpcClient = null;
var activityStart = new Date();
var pollTimer = null;

function parseAeContext(raw) {
	if (!raw || typeof raw !== "string") {
		return { projectName: "Unsaved Project", compName: "No Active Comp" };
	}

	var parts = raw.split("||");
	return {
		projectName: parts[0] || "Unsaved Project",
		compName: parts[1] || "No Active Comp"
	};
}

function buildActivity(context) {
	return {
		details: "Project: " + context.projectName,
		state: "Comp: " + context.compName,
		startTimestamp: activityStart,
		largeImageKey: "adobe_after_effects_cc_icon_svg",
		largeImageText: "Adobe After Effects",
		startTimestamp: activityStart.getTime()
	};
}

function updatePresence(csInterface) {
	csInterface.evalScript("getAeContext()", function (result) {
		var context = parseAeContext(result);

		if (!rpcClient) {
			return;
		}

		rpcClient.setActivity(buildActivity(context)).catch(function (err) {
			console.error("Failed to set activity", err);
		});
	});
}

function startPolling(csInterface) {
	updatePresence(csInterface);

	if (pollTimer) {
		clearInterval(pollTimer);
	}

	pollTimer = setInterval(function () {
		updatePresence(csInterface);
	}, POLL_INTERVAL_MS);
}

function connectDiscordRpc(csInterface) {
	if (!CLIENT_ID || CLIENT_ID === "YOUR_DISCORD_APP_CLIENT_ID") {
		console.warn("Discord RPC client id is not set.");
		return;
	}

	rpcClient = new DiscordRPC.Client({ transport: "ipc" });

	rpcClient.on("ready", function () {
		console.log("Discord RPC connected.");
		startPolling(csInterface);
	});

	rpcClient.on("error", function (err) {
		console.error("Discord RPC error", err);
	});

	rpcClient.login({ clientId: CLIENT_ID }).catch(function (err) {
		console.error("Failed to login to Discord RPC", err);
	});
}

function initDiscordRpc(csInterface) {
	connectDiscordRpc(csInterface);
}

window.initDiscordRpc = initDiscordRpc;
