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

import {app} from "./app.js";
import {getSession} from "./auth.js";
import db from "./db.js";

// I know Scratch's project.json limit is slightly bigger but...
const projectSizeLimit = 5 * 1000 * 1000;

const sizeLimitMb = projectSizeLimit / 1000 / 1000;

function sizeLimitMsg(res) {
	res.status(413).send(`Exceeded project.json size limit - maximum is ${projectSizeLimit} bytes (${sizeLimitMb} megabytes). Try clearing large lists or using more efficient code in the project.`);
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
		const title = "Untitled";
		let creator = 0;
		try {
			const session = await getSession(req.get("X-Token"));
			creator = session.userId || 0;
		} catch(e) {}
		const result = await db.run(`
			INSERT INTO projects (
				title, data, dateCreated, dateModified, creator, owner
			) VALUES (
				?, ?, ?, ?, ?, ?
			);
		`, title, stringified, Date.now(), Date.now(), creator, creator);

		res.status(201).json({
			status: "ok",
			"content-name": result.lastID.toString(),
			"content-title": toBase64(title),
			"autosave-interval": "120"
		});
	} catch(e) {
		// Oops
		console.log("Error uploading project:", e);
		res.status(500).send(e);
	}
});

app.get("/projects/:id", async (req, res) => {	
	if (req.params.id === "count") {
		res.status(200).send(
			(await db.all(`SELECT id FROM projects`)).length.toString()
		);
		return;
	}
	
	const id = req.params.id;
	if (isNaN(id)) {
		// TurboWarp detects a < at the start to see if
		// the project is existent (to bring up the not found project)
		res.status(404).send("<> Not found lol");
		return;
	}

	const returnVal = await db.get(`
		SELECT data FROM projects WHERE id == ?
	`, id);

	if (returnVal !== undefined) {
		res.status(200).json(JSON.parse(returnVal.data.toString()));
	} else {
		res.status(404).send("<> Not found lol");
	}
});

// Quick (unofficial) way to get if a project exists -
// not actually used by GUI but for external sites
app.get("/projects/:id/exists", async (req, res) => {
	const id = req.params.id;
	if (isNaN(id)) {
		// See project GET function
		res.status(404).send("<> Not found lol");
		return;
	}

	const exists = await db.get(`
		SELECT id FROM projects WHERE id == ?
	`, id);

	if (exists !== undefined) {
		res.status(204).end();
	} else {
		// See project GET function
		res.status(404).send("<> Not found lol");
	}
});


app.put("/projects/:id", async (req, res) => {
	const id = req.params.id;
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

	const exists = await db.get(`
		SELECT id FROM projects WHERE id == ?
	`, id);

	if (exists !== undefined) {
		await db.run(`
			UPDATE projects SET data = ?, dateModified = ? WHERE id == ?
		`, stringified, Date.now(), id);
		res.status(200).json(project);
	} else {
		console.log("Error uploading project:", e);
		res.status(500).send(e);
	}
});

function toBase64(string) {
	const bfr = Buffer.from(string);
	return bfr.toString('base64');
}