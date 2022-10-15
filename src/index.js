// The main file.

import {app} from "./app.js";

import fs from "node:fs";
import http from "node:http";
import https from "node:https";

import "dotenv/config";

// Clear screen, thanks stackoverflow
process.stdout.write("\u001bc");

console.log("====== SCE Servers ======");
console.log("          (WIP)          \n");

app.get("/", (_req, res) => {
	res.send(`
<body style="font-family: sans-serif;">
	<h1>Connection successful!</h1>
	Click <a href="https://scratchce.github.io/beta/anarchy">here</a> to go back to Scratch CE.
</body>`);
});

console.log("Loading module: auth")
await import("./auth.js");
console.log("Loading module: projects")
await import("./projects.js");
console.log("Loading module: assets")
await import("./assets.js");
console.log("Loading module: api/projects")
await import("./api/projects.js");
console.log("Loading module: api/proxy")
await import("./api/proxy.js");

const httpServer = http.createServer(app);
httpServer.listen(80);

const keyPath = process.env.SCE_HTTPSKEYPATH || "keys/server.key";
const crtPath = process.env.SCE_HTTPSCRTPATH || "keys/server.crt";

let useHTTPS = false;
try {
	fs.accessSync(crtPath);
	useHTTPS = true;
} catch (e) {}

let privateKey, certificate;
if (useHTTPS) {
	privateKey = fs.readFileSync(keyPath, "utf8");
	certificate = fs.readFileSync(crtPath, "utf8");
	
	if (process.env.SCE_HTTPSPASSPHRASE === undefined) {
		console.error("Passphrase missing. Set it in the SCE_HTTPSPASSPHRASE environment variable. The HTTPS server might break.");
	}
	
	const credentials = {
		key: privateKey,
		cert: certificate,
		passphrase: process.env.SCE_HTTPSPASSPHRASE
	};
	
	const httpsServer = https.createServer(credentials, app);
	httpsServer.listen(443);
	
	console.log("HTTPS server up")
}