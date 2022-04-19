// A projects.scratch.mit.edu implementation - saving and loading projects.

/*
	old notes:
	= projects.scratch.mit.edu =
	POST to /:
		- request: JSON of the project data
		- returns:
			- status: "ok"
			- content-name: a string for the project ID
			- content-title: a base64 string for the project title
			- autosave-interval: a self-explanatory number string
	PUT to /<id>:
		- request: JSON of the project data
		- returns:
			- status: "ok"
			- autosave-interval: a self-explanatory number string
	GET to /<id>:
		- returns:
			- the project JSON directly as the body
			- projects.scratch gzips the request, but I think we could afford making it uncompressed for simplicity
*/

const {app, express} = require("./app.js");
const fs = require("fs/promises");
const {data, commitToDb} = require("./db.js");

// I know Scratch's project.json limit is slightly bigger but...
const projectSizeLimit = 5 * 1000 * 1000;

function sizeLimitMsg(res) {
	res.status(413).send(`Exceeded project.json size limit - maximum is ${projectSizeLimit} bytes (${projectSizeLimit/1000/1000} megabytes). Try clearing large lists or using more efficient code in the project.`);
}

app.post("/projects", async (req, res) => {	

	const project = req.body;
			
	if (Object.keys(project).length < 1) {
		res.status(400).send("Invalid project data. Make sure to send Content-Type: application/json as a header because that's required for some reason");
		return;
	}
	
	const stringified = JSON.stringify(project);
	
	if (stringified.length > projectSizeLimit) {
		sizeLimitMsg(res);
		return;
	}
	
	try {
		await fs.writeFile(`db/projects/${data.projCount + 1}.json`, stringified);
		data.projCount++;
		commitToDb();
		res.status(201).json({
			status: "ok",
			"content-name": data.projCount.toString(),
			"content-title": toBase64("Untitled"),
			"autosave-interval": "120"
		});
	} catch(e) {
		// Oops
		console.log("Error uploading project:", e);
		res.status(500).send(e);
	}
});

app.get(/^\/projects\/[0-9]+$/, async (req, res) => {	

	const id = req.path.split("/")[2];
	if (isNaN(id)) {
		// TurboWarp detects a < at the start to see if
		// the project is existent (to bring up the not found project)
		res.status(404).send("<> Not found lol");
		return;
	}
	
	try {
		const project = await fs.readFile(`db/projects/${id}.json`);
		res.status(200).json(JSON.parse(project.toString()));
	} catch(e) {
		// See above
		res.status(404).send("<> Not found lol");
		return;
	}
});

// Quick (unofficial) way to get if a project exists -
// not actually used by GUI but for external sites
app.get(/^\/projects\/[0-9]+\/exists$/, async (req, res) => {	

	const id = req.path.split("/")[2];
	if (isNaN(id)) {
		// See project GET function
		res.status(404).send("<> Not found lol");
		return;
	}
	
	try {
		await fs.access(`db/projects/${id}.json`);
		res.status(204).end();
	} catch(e) {
		// See project GET function
		res.status(404).send("<> Not found lol");
		return;
	}
});


app.put(/^\/projects\/[0-9]+$/, async (req, res) => {	
	
	const id = req.path.split("/")[2];
	if (isNaN(id)) {
		res.status(404).send("Not found lol");
		return;
	}
	if (id < 1) {
		res.status(404).send("Not found lol");
		return;
	}
	
	const project = req.body;
	if (Object.keys(project).length < 1) {
		res.status(400).send("Invalid project data. Make sure to send <code>Content-Type: application/json</code> as a header because that's required for some reason");
		return;
	}
	
	const stringified = JSON.stringify(project);
	
	if (stringified.length > projectSizeLimit) {
		sizeLimitMsg(res);
		return;
	}
	
	try {
		await fs.writeFile(`db/projects/${id}.json`, stringified);
		res.status(200).json(project);
	} catch(e) {
		// Oops
		console.log("Error uploading project:", e);
		res.status(500).send(e);
	}
});

// I don't know if the Scratch servers actually parse OPTIONS requests,
// but just to be sure
app.options(/^\/projects\/[0-9]+$/, async (req, res) => {		
	const id = req.path.split("/")[2];
	if (isNaN(id)) {
		// See project GET function
		res.status(404).send("<> Not found lol");
		return;
	}
	
	try {
		await fs.access(`db/projects/${id}.json`);
		res.status(204).end();
	} catch(e) {
		// See project GET function
		res.status(404).send("<> Not found lol");
		return;
	}
});


function toBase64(string) {
	const bfr = Buffer.from(string);
	return bfr.toString('base64');
}