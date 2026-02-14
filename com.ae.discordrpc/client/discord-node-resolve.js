// Created by Oliver. (c) 2026. All rights reserved.
// https://github.com/harpoonwithaz/ae-discord-rpc
/* Helper to resolve the `discord-rpc` module in CEP/node environments */

var nodeRequire = null;

if (typeof window !== "undefined" && window.cep_node && typeof window.cep_node.require === "function") {
    nodeRequire = window.cep_node.require;
} else if (typeof require === "function") {
    nodeRequire = require;
}

if (nodeRequire) {
    try {
        var nodeProcess = nodeRequire("process");
        if (typeof window !== "undefined" && window.rpcLog) {
            window.rpcLog("Node version: " + nodeProcess.version);
        }
    } catch (err) {
        if (typeof window !== "undefined" && window.rpcLog) {
            window.rpcLog("Node version check failed: " + (err.message || err));
        }
    }
}

function resolveDiscordRpc(csInterface) {
    if (!nodeRequire) {
        return null;
    }

    try {
        return nodeRequire("discord-rpc");
    } catch (err) {
        if (typeof window !== "undefined" && window.rpcLog) {
            window.rpcLog("discord-rpc require failed (module): " + (err.message || err));
            if (err && err.stack) {
                window.rpcLog("discord-rpc require stack: " + err.stack);
            }
        }
    }

    try {
        var path = nodeRequire("path");
        var extensionPath = csInterface.getSystemPath(SystemPath.EXTENSION);
        var modulePath = path.join(extensionPath, "node_modules", "discord-rpc");
        return nodeRequire(modulePath);
    } catch (err) {
        if (typeof window !== "undefined" && window.rpcLog) {
            window.rpcLog("discord-rpc require failed (path): " + (err.message || err));
            if (err && err.stack) {
                window.rpcLog("discord-rpc require stack: " + err.stack);
            }
        }
    }

    return null;
}

if (typeof module !== "undefined" && module.exports) {
    module.exports = { resolveDiscordRpc: resolveDiscordRpc, nodeRequire: nodeRequire };
} else if (typeof window !== "undefined") {
    window.resolveDiscordRpcModule = { resolveDiscordRpc: resolveDiscordRpc, nodeRequire: nodeRequire };
}
