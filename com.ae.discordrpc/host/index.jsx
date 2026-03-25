// Created by Oliver. (c) 2026. All rights reserved.
// https://github.com/harpoonwithaz/ae-discord-rpc

// launches the discord rich presence GO backend process
function launchBridge(extPath) {
    var binFolderPath = extPath + "\\bin";
    var launcherFile = new File(binFolderPath + "\\launcher.exe");
    var exeFile = new File(binFolderPath + "\\discord-bridge.exe");

    // Prefer the launcher (it starts the backend without showing a console).
    if (launcherFile.exists) {
        launcherFile.execute();
    } else if (exeFile.exists) {
        // Fallback to running the backend directly
        exeFile.execute();
    }
}

function shutdownBridge() {
    return sendCommand("SHUTDOWN", {});
}

// sends the request to the GO backend using a json object format
function sendCommand(actionName, dataObject) {
    // Manually construct JSON to bypass ExtendScript's lack of a JSON object
    var p = "";
    var c = "";
    if (dataObject) {
        if (dataObject.project) p = dataObject.project.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
        if (dataObject.comp) c = dataObject.comp.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
    }

    // string for object
    var jsonString = '{"action":"' + actionName + '","data":{"project":"' + p + '","comp":"' + c + '"}}\n';

    // creates a new TCP connection
    var conn = new Socket();
    var resStatus = "OFFLINE";
    var resMessage = "Connection failed";

    conn.timeout = 2; 

    // ensure the port is the same as the GO backend
    if (conn.open("127.0.0.1:54345", "UTF-8")) {
        conn.write(jsonString); // sends request to the backend
        var rawResponse = conn.readln();
        conn.close();
        
        if (rawResponse && rawResponse.length > 0) {
            try {
                // Use eval() to safely parse the trusted JSON from Go backend
                var parsed = eval("(" + rawResponse + ")");
                resStatus = parsed.status;
                resMessage = parsed.message;
            } catch (e) {
                resStatus = "ERROR";
            }
        }
    }
    
    // Return a manually formatted string to the CEP JS environment
    return '{"status":"' + resStatus + '","message":"' + resMessage + '"}';
}

function getBridgeStatus() {
    // send status request with project info in-case there is a mismatch
    projectInfo = getProjectInfo()
    return sendCommand("STATUS", {
        project: projectInfo[0],
        comp: projectInfo[1]
    });
}

// Returns array containing project and comp name
// returns [-1, -1] if cant get info
function getProjectInfo() {
    var projectName = "Unsaved Project";
    var compName = "No Active Comp";

    try {
        if (app.project && app.project.file) {
            projectName = app.project.file.name;
        }
        if (app.project && app.project.activeItem && (app.project.activeItem instanceof CompItem)) {
            compName = app.project.activeItem.name;
        }
    } catch (err) {
        // Keep defaults
        alert("Error getting project info: " + err);
        return [-1, -1];
    }

    return [projectName, compName];
}

function connectToDiscord() {
    // alert("Connect to discord called");
    projectInfo = getProjectInfo();
    if (projectInfo[0] === -1 && projectInfo[1] === -1) {
        return;
    }

    return sendCommand("UPDATE_PRESENCE", {
        project: projectInfo[0],
        comp: projectInfo[1]
    });
}

function disconnectDiscord() {
    // alert("Disconnect discord called");
    return sendCommand("DISCONNECT", {});
}