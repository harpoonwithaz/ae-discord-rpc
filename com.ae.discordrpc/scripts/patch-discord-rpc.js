"use strict";

var fs = require("fs");
var path = require("path");

var targetPath = path.join(
  __dirname,
  "..",
  "node_modules",
  "discord-rpc",
  "src",
  "transports",
  "websocket.js"
);

if (!fs.existsSync(targetPath)) {
  console.log("discord-rpc patch not needed (file missing).");
  process.exit(0);
}

var source = fs.readFileSync(targetPath, "utf8");
var patched = source.replace(
  /catch\s*\{\}\s*\/\/ eslint-disable-line no-empty/g,
  "catch (err) {} // eslint-disable-line no-empty"
);

if (patched !== source) {
  fs.writeFileSync(targetPath, patched, "utf8");
  console.log("Patched discord-rpc for CEP Node compatibility.");
} else {
  console.log("discord-rpc patch not needed.");
}
