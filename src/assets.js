// Dummy assets.scratch.mit.edu implementation - mirror of the official assets.scratch.mit.edu.

const app = require("./app.js");
const fetch = require("node-fetch");

app.get(/\/assets\/internalapi\/asset\/[a-zA-Z0-9]+\.[a-zA-Z0-9]+\/get/, async (req, res) => {
	const asset = req.path.split("/")[4];
	console.log("Request to asset", asset);
	
	const resp = await fetch(`https://assets.scratch.mit.edu/${asset}`);
	const data = await resp.arrayBuffer();
	
	res.status(resp.status).send(Buffer.from(data));
});

app.post(/\/assets\/[a-zA-Z0-9]+\.[a-zA-Z0-9]/, async (req, res) => {
	console.log("Post to assets");
	
	res.status(200).send(res.body);
});