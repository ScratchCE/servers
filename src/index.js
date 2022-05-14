// The main file.

const {app} = require("./app.js");
const {data, commitToDb} = require("./db.js");
const fs = require("fs");
const http = require("http");
const https = require("https");

// Clear screen, thanks stackoverflow
process.stdout.write('\033c');

console.log("====== SCE Servers ======");
console.log("          (WIP)          \n");

app.get("/", (req, res) => {
	res.send(`
<body style="font-family: sans-serif;">
	<h1>Connection successful!</h1>
	Click <a href="https://scratchce.github.io/beta/anarchy">here</a> to go back to Scratch CE.
</body>`);
});

require("./projects.js");
require("./assets.js");

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