/* global CSInterface */

var nodeRequire = null;

if (typeof window !== "undefined" && window.cep_node && typeof window.cep_node.require === "function") {
    nodeRequire = window.cep_node.require;
} else if (typeof require === "function") {
    nodeRequire = require;
}

if (nodeRequire) {
    try {
        var nodeProcess = nodeRequire("process");
        log("Node version: " + nodeProcess.version);
    } catch (err) {
        log("Node version check failed: " + (err.message || err));
    }
}

function resolveDiscordRpc(csInterface) {
    if (!nodeRequire) {
        return null;
    }

    try {
        return nodeRequire("discord-rpc");
    } catch (err) {
        log("discord-rpc require failed (module): " + (err.message || err));
        if (err && err.stack) {
            log("discord-rpc require stack: " + err.stack);
        }
    }

    try {
        var path = nodeRequire("path");
        var extensionPath = csInterface.getSystemPath(SystemPath.EXTENSION);
        var modulePath = path.join(extensionPath, "node_modules", "discord-rpc");
        return nodeRequire(modulePath);
    } catch (err) {
        log("discord-rpc require failed (path): " + (err.message || err));
        if (err && err.stack) {
            log("discord-rpc require stack: " + err.stack);
        }
    }

    return null;
}

var CLIENT_ID = (typeof window !== "undefined" && window.AE_DISCORD_CLIENT_ID)
    ? window.AE_DISCORD_CLIENT_ID
    : "1469933901261701212";

if (typeof window !== "undefined") {
    window.AE_DISCORD_CLIENT_ID = CLIENT_ID;
}
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
        details: "Project: " + context.projectName.replace("%20", " "),
        state: "Comp: " + context.compName,
        largeImageKey: "adobe_after_effects_cc_icon_svg",
        largeImageText: "Adobe After Effects",
        startTimestamp: activityStart.getTime(),
		buttons: [{
			label: "Download Extension",
			url: "https://github.com/harpoonwithaz/ae-discord-rpc"
		}]
    };
}

function log(msg, err) {
    if (window.rpcLog) {
        window.rpcLog(msg + (err ? " | " + (err.message || err) : ""));
    }
}

function updatePresence(csInterface) {
    csInterface.evalScript("getAeContext()", function (result) {
        var context = parseAeContext(result);

        if (!rpcClient) {
            log("rpcClient not ready");
            return;
        }

        rpcClient.setActivity(buildActivity(context))
            .then(function () { log("setActivity OK"); })
            .catch(function (err) {
                log("setActivity failed", err);
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
    var DiscordRPC = resolveDiscordRpc(csInterface);

    if (!DiscordRPC || !DiscordRPC.Client) {
        log("Discord RPC module not available. Check node integration and node_modules.");
        log("cep_node: " + (typeof window !== "undefined" && !!window.cep_node));
        log("nodeRequire: " + !!nodeRequire);
        return;
    }

    var resolvedClientId = CLIENT_ID
        || (typeof window !== "undefined" && window.AE_DISCORD_CLIENT_ID)
        || "1469933901261701212";

    if (typeof window !== "undefined") {
        window.AE_DISCORD_CLIENT_ID = resolvedClientId;
    }

    log("Resolved CLIENT_ID: " + resolvedClientId);

    // treat only the real placeholder as invalid
    if (!resolvedClientId || resolvedClientId === "YOUR_DISCORD_APP_CLIENT_ID") {
        log("Discord RPC client id is not set.");
        log("CLIENT_ID: " + resolvedClientId);
        console.warn("Discord RPC client id is not set.");
        console.warn("CLIENT_ID:", resolvedClientId);
        return;
    }

    rpcClient = new DiscordRPC.Client({ transport: "ipc" });

    rpcClient.on("ready", function () {
        log("Discord RPC connected.");
        startPolling(csInterface);
    });

    rpcClient.on("error", function (err) {
        log("Discord RPC error", err);
        console.error("Discord RPC error", err);
    });

    // use the variable instead of a hardcoded string
    rpcClient.login({ clientId: resolvedClientId }).catch(function (err) {
        log("Failed to login to Discord RPC", err);
        console.error("Failed to login to Discord RPC", err);
    });
}

function initDiscordRpc(csInterface) {
	connectDiscordRpc(csInterface);
}

window.initDiscordRpc = initDiscordRpc;
