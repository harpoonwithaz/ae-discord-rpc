// Created by Oliver. (c) 2026. All rights reserved.
// https://github.com/harpoonwithaz/ae-discord-rpc

var csInterface = new CSInterface();
var statusSpan = document.getElementById('status');

var refreshButton = document.getElementById('refresh-btn');
var connectButton = document.getElementById('connect-btn');

var connected = false;
var isLaunching = false;

function loadBridge() {
    if (isLaunching) return;
    isLaunching = true;

    var extensionPath = csInterface.getSystemPath(SystemPath.EXTENSION);
    csInterface.evalScript('launchBridge("' + extensionPath.replace(/\\/g, '\\\\') + '")', function() {
        // Allow another launch attempt after 10 seconds if still not connected
        setTimeout(function() { isLaunching = false; }, 10000);
    });
};

function updateStatus() {
    csInterface.evalScript('getBridgeStatus()', function(result) {
        try {
            var response = JSON.parse(result); 

            if (response.status === "CONNECTED") {
                connected = true;
                isLaunching = false; // Reset launching state on successful connection
                statusSpan.innerText = "Connected";
                statusSpan.className = "status-connected"; 
                connectButton.innerText = "Disconnect";
            } else if (response.status === "DISCONNECTED") {
                connected = false;
                statusSpan.innerText = "Disconnected";
                statusSpan.className = "status-error";
                connectButton.innerText = "Connect";
            } else if (response.status === "ERROR") {
                connected = false;
                statusSpan.innerText = response.message;
                statusSpan.className = "status-error";
                connectButton.innerText = "Connect";
            } else {
                connected = false;
                statusSpan.innerText = "Bridge Offline";
                statusSpan.className = "status-disconnected";
                connectButton.innerText = "Connect";
            }
        } catch (e) {
            // Attempt to relaunch the bridge if connection is lost
            if (!isLaunching) {
                statusSpan.innerText = "Reconnecting...";
                statusSpan.className = "status-disconnected";
                loadBridge();
            } else {
                statusSpan.innerText = "Bridge Offline";
                statusSpan.className = "status-disconnected";
            }
        }
    });
}

refreshButton.onclick = function() {
    updateStatus();
}

connectButton.onclick = function() {
    if (connected) {
        csInterface.evalScript('disconnectDiscord()', function() {
            updateStatus();
        });
    } else {
        csInterface.evalScript('connectToDiscord()', function() {
            updateStatus();
        });
    }
};

// Start the bridge
loadBridge();

// Automatically poll the backend for status every 3 seconds
setInterval(updateStatus, 3000);