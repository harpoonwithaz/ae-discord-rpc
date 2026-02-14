// Created by Oliver. (c) 2026. All rights reserved.
// https://github.com/harpoonwithaz/ae-discord-rpc
/* global CSInterface */

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
var isConnected = false; // Only set by event handlers
var isConnecting = false; // Prevents race conditions
var lastStatus = "Disconnected";

function parseAeContext(raw) {
	if (!raw || typeof raw !== "string") {
		return { projectName: "Unsaved Project", compName: "No Active Comp" };
	}

	var parts = raw.split("||");
	return {
		projectName: parts[0].replace("%20", " ") || "Unsaved Project",
		compName: parts[1] || "No Active Comp"
	};
}

function buildActivity(context) {
    return {
        details: "Project: " + context.projectName,
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

function setStatus(status) {
    lastStatus = status;
    if (typeof window.refreshStatus === "function") {
        window.refreshStatus();
    }
}


// Changes discord status to include current project info
function updatePresence(csInterface) {
    if (!rpcClient) {
        log("rpcClient not ready");
        return;
    }
    csInterface.evalScript("getAeContext()", function (result) {
        var context = parseAeContext(result);
        rpcClient.setActivity(buildActivity(context))
            .then(function () { log("setActivity OK"); })
            .catch(function (err) {
                log("setActivity failed", err);
                setStatus("Error");
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
    if (isConnected || isConnecting) {
        log("Already connected or connecting.");
        return;
    }
    isConnecting = true;
    setStatus("Connecting...");

    var loader = null;
    if (typeof window !== "undefined" && window.cep_node && typeof window.cep_node.require === "function") {
        loader = window.cep_node.require;
    } else if (typeof require === "function") {
        loader = require;
    }

    var nodeResolveModule = null;
    if (loader) {
        try {
            nodeResolveModule = loader("./discord-node-resolve.js");
        } catch (err) {
            try {
                var path = loader("path");
                var extensionPath = csInterface.getSystemPath(SystemPath.EXTENSION);
                var modulePath = path.join(extensionPath, "client", "discord-node-resolve.js");
                nodeResolveModule = loader(modulePath);
            } catch (err2) {
                log("Failed to load discord-node-resolve module", err2);
                setStatus("Error");
                isConnecting = false;
                return;
            }
        }
    }

    if (!nodeResolveModule || !nodeResolveModule.resolveDiscordRpc) {
        log("Discord RPC helper module not available. Check node integration and file path.");
        setStatus("Error");
        isConnecting = false;
        return;
    }

    var DiscordRPC = nodeResolveModule.resolveDiscordRpc(csInterface);

    if (!DiscordRPC || !DiscordRPC.Client) {
        log("Discord RPC module not available. Check node integration and node_modules.");
        log("cep_node: " + (typeof window !== "undefined" && !!window.cep_node));
        log("loader: " + !!loader);
        setStatus("Error");
        isConnecting = false;
        return;
    }

    var resolvedClientId = CLIENT_ID
        || (typeof window !== "undefined" && window.AE_DISCORD_CLIENT_ID)
        || "1469933901261701212"; // fallback behavior

    if (typeof window !== "undefined") {
        window.AE_DISCORD_CLIENT_ID = resolvedClientId;
    }

    log("Resolved CLIENT_ID: " + resolvedClientId);

    // treat only the real placeholder as invalid
    if (!resolvedClientId || resolvedClientId === "YOUR_DISCORD_APP_CLIENT_ID") {
        log("Discord RPC client id is not set.");
        log("CLIENT_ID: " + resolvedClientId);
        setStatus("Error");
        isConnecting = false;
        return;
    }

    rpcClient = new DiscordRPC.Client({ transport: "ipc" });

    rpcClient.on("ready", function () {
        log("Discord RPC connected.");
        isConnected = true;
        isConnecting = false;
        setStatus("Connected");
        startPolling(csInterface);
    });

    rpcClient.on("disconnected", function () {
        log("Discord RPC disconnected.");
        isConnected = false;
        isConnecting = false;
        setStatus("Disconnected");
        cleanupRpcClient();
    });

    rpcClient.on("error", function (err) {
        log("Discord RPC error", err);
        isConnected = false;
        isConnecting = false;
        setStatus("Error");
        cleanupRpcClient();
    });

    rpcClient.login({ clientId: resolvedClientId }).catch(function (err) {
        log("Failed to login to Discord RPC", err);
        isConnected = false;
        isConnecting = false;
        setStatus("Error");
        cleanupRpcClient();
    });
}


function cleanupRpcClient() {
    if (pollTimer) {
        clearInterval(pollTimer);
        pollTimer = null;
    }
    if (rpcClient) {
        try {
            rpcClient.removeAllListeners && rpcClient.removeAllListeners();
        } catch (e) {}
        rpcClient = null;
    }
}

function disconnectDiscordRpc() {
    if (!rpcClient) {
        isConnected = false;
        setStatus("Disconnected");
        return;
    }
    setStatus("Disconnecting...");
    Promise.resolve()
        .then(function () {
            if (typeof rpcClient.clearActivity === "function") {
                return rpcClient.clearActivity();
            }
        })
        .then(function () {
            if (typeof rpcClient.destroy === "function") {
                return rpcClient.destroy();
            }
        })
        .then(function () {
            log("Discord RPC disconnected.");
            isConnected = false;
            setStatus("Disconnected");
            cleanupRpcClient();
        })
        .catch(function (err) {
            log("Error disconnecting Discord RPC", err);
            setStatus("Error");
            cleanupRpcClient();
        });
}


function isDiscordRPCConnected() {
    return !!rpcClient && isConnected;
}

function getDiscordRpcStatus() {
    if (isConnecting) return "Connecting...";
    if (!rpcClient) return "Disconnected";
    if (isConnected) return "Connected";
    return lastStatus || "Disconnected";
}

// Toggle connection state
function initDiscordRpc(csInterface) {
    if (isConnecting) {
        log("Already connecting, please wait.");
        return;
    }
    if (isDiscordRPCConnected()) {
        disconnectDiscordRpc();
    } else {
        connectDiscordRpc(csInterface);
    }
}

window.initDiscordRpc = initDiscordRpc;
window.getDiscordRpcStatus = getDiscordRpcStatus;
window.refreshStatus = function() {
    var statusEl = document.getElementById('status');
    if (statusEl) {
        var status = getDiscordRpcStatus();
        statusEl.textContent = status;
        statusEl.className = 'status status-' + status.toLowerCase().replace(/[^a-z]+/g, '');
    }
    // Optionally update connect button text
    var btn = document.getElementById('connect-btn');
    if (btn) {
        if (isConnecting) {
            btn.disabled = true;
            btn.textContent = 'Connecting...';
        } else if (isDiscordRPCConnected()) {
            btn.disabled = false;
            btn.textContent = 'Disconnect';
        } else {
            btn.disabled = false;
            btn.textContent = 'Connect';
        }
    }
};
