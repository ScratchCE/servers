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

app.get("/", (req, res) => {
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


let useHTTPS = false;
try {
	fs.accessSync(`keys/server.crt`);
	useHTTPS = true;
} catch (e) {}

let privateKey, certificate;
if (useHTTPS) {
	privateKey = fs.readFileSync("keys/server.key", "utf8");
	certificate = fs.readFileSync("keys/server.crt", "utf8");
	
	if (!process.env.SCE_HTTPSPASSPHRASE) {
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