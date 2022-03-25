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

const app = require("./app.js");
const {data, commitToDb} = require("./db.js");
const projectSizeLimit = 5000000;

app.get("/projects", (req, res) => {
	console.log("Request to level DB")
	res.json(data.projects);
});

app.post("/projects", (req, res) => {	

	const project = req.body;
	
	console.log(project);
		
	if (Object.keys(project).length < 1) {
		console.log("Invalid project save")
		res.status(400).send("Invalid project data. Make sure to send Content-Type: application/json as a header because that's required for some reason");
		return;
	}
	
	if (JSON.stringify(project).length > projectSizeLimit) {
		console.log("Project size limit reached")
		res.status(413).send("Size limit is 5MB");
		return;
	}
	
	data.projects.push(project);
	const projectId = data.projects.length + 1;
	commitToDb();
	
	console.log("Successful project upload")
	res.status(201).json({
		status: "ok",
		"content-name": projectId.toString(),
		"content-title": toBase64("Untitled"),
		"autosave-interval": "120"
	});
});

app.get(/^\/projects\/[0-9]+$/, (req, res) => {	

	const id = req.path.split("/")[2] - 1;
	if (isNaN(id)) {
		console.log("Invalid project request")
		res.status(404).send("<> Not found lol");
		return;
	}
	
	const project = data.projects[id];
	if (!project) {
		console.log("Nonexistent project request")
		res.status(404).send("<> Not found lol");
		return;
	}
	
	console.log("Project request")
	res.status(200).json(project);
});

app.put(/^\/projects\/[0-9]+$/, (req, res) => {	
	
	const id = req.path.split("/")[2] - 1;
	if (isNaN(id)) {
		console.log("Invalid project ID save")
		res.status(404).send("Not found lol");
		return;
	}
	if (id > data.projects.length - 1) {
		console.log("Nonexistent project ID save")
		res.status(404).send("Not found lol");
		return;
	}
	if (id < 0) {
		console.log("Nonexistent project ID save")
		res.status(404).send("Not found lol");
		return;
	}
	
	const project = req.body;
	if (Object.keys(project).length < 1) {
		console.log("Invalid project save")
		res.status(400).send("Invalid project data. Make sure to send <code>Content-Type: application/json</code> as a header because that's required for some reason");
		return;
	}
	
	if (JSON.stringify(project).length > projectSizeLimit) {
		console.log("Project size limit reached")
		res.status(413).send("Size limit is 5MB");
		return;
	}
	
	data.projects[id] = project;
	commitToDb();
	
	console.log("Project save, ID", id + 1);
	res.status(200).json(data.projects[id]);
});

app.options(/^\/projects\/[0-9]+$/, (req, res) => {	
	console.log("Project OPTIONS request")
	
	const id = req.path.split("/")[2] - 1;
	if (isNaN(id)) {
		console.log("Invalid project OPTIONS request")
		res.status(404).send("<> Not found lol");
		return;
	}
	
	const project = data.projects[id];
	if (!project) {
		console.log("Nonexistent project OPTIONS request")
		res.status(404).send("<> Not found lol");
		return;
	}
	res.status(204).end();
});


function toBase64(string) {
	const bfr = Buffer.from(string);
	return bfr.toString('base64');
}