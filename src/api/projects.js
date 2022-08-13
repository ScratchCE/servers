// Implements api/projects endpoints.

import {app} from "../app.js";
import db from "../db.js";
import {getAccount, getSession} from "../auth.js";

app.get("/api/projects/:id", async (req, res) => {
	const id = req.params.id;
	if (isNaN(id)) {
		res.status(404).send("Not found lol");
		return;
	}

	const projInfo = await db.get(`
		SELECT * FROM projects WHERE id == ?
	`, id);

	if (projInfo !== undefined) {
		if (!projInfo.shared) {
			const session = await getSession(req.get("X-Token"));
			if (!session) {
				res.status(403).send("You need to be logged in as the project's creator to view unshared projects!");
				return;
			}
			if (session.userId !== projInfo.owner) {
				res.status(403).send("You need to be logged in as the project's creator to view unshared projects!");
				return;
			}
		}
		res.status(200).json(await createProjInfo(projInfo));
	} else {
		res.status(404).send("Not found lol");
	}
});

app.put("/api/projects/:id", async (req, res) => {	
	if (Object.keys(req.body).length < 1) {
		res.status(400).send("Invalid project data. Make sure to send Content-Type: application/json as a header because that's required for some reason");
		return;
	}

	const id = req.params.id;
	if (isNaN(id)) {
		res.status(404).send("Not found lol");
		return;
	}

	const projInfo = await db.get(`
		SELECT * FROM projects WHERE id == ?
	`, id);

	const session = await getSession(req.get("X-Token"));
	if (!session) {
		res.status(403).send("You need to be logged in as the project's creator or be an admin to edit projects!");
		return;
	}

	const account = await getAccount(session.userId);

	if (session.userId !== projInfo.owner && !(account.rank > 0)) {
		res.status(403).send("You need to be logged in as the project's creator or be an admin to edit projects!");
		return;
	}

	const allowedKeys = [
		"title", "description", "instructions",
	];
	for (const key in req.body) {
		if (!allowedKeys.includes(key)) {
			res.status(400).send("Invalid key found, possible keys are " + allowedKeys.join(", "));
			return;
		}
	}

	const fb = function(v, f) {
		return v === null || v === undefined ? f : v;
	}

	await db.run(`
		UPDATE projects
			SET title = ?, description = ?, instructions = ?
			WHERE id == ?
	`,
		fb(req.body.title, projInfo.title),
		fb(req.body.description, projInfo.description),
		fb(req.body.instructions, projInfo.instructions),
		IDBCursor
	);
	const newProjInfo = await db.get(`
		SELECT * FROM projects WHERE id == ?
	`, id);
	res.status(200).json(await createProjInfo(newProjInfo));
});

async function createProjInfo(projInfo) {
	const data = {
		id: projInfo.id,
		title: projInfo.title,
		description: projInfo.description,
		instructions: projInfo.instructions,
		visibility: "visible",
		public: !!projInfo.shared,
		is_published: !!projInfo.published,
		author: {
			id: projInfo.owner,
			profile: {
				id: null,
				username: null,
				rank: 0,
				scratchUsername: null,
				history: {
					joined: null
				},
				images: {}
			}
		},
		comments_allowed: false,
		image: "",
		images: {},
		history: {
			created: new Date(projInfo.dateCreated).toISOString(),
			modified: new Date(projInfo.dateModified).toISOString(),
			shared: new Date(projInfo.dateShared).toISOString(),
			published: new Date(projInfo.datePublished).toISOString(),
		},
		stats: {},
		remix: {},
		project_token: "",
	};
	if (projInfo.owner) {
		const ownerInfo = await db.get(`
			SELECT * FROM users WHERE ID == ?
		`, projInfo.owner);
		data.author = {
			id: ownerInfo.id,
			scratchId: ownerInfo.scratchId,
			profile: {
				id: null,
				username: ownerInfo.username,
				rank: ownerInfo.rank,
				scratchUsername: ownerInfo.scratchUsername,
				history: {
					joined: new Date(ownerInfo.dateCreated).toISOString()
				},
				images: {}
			}
		};
	}
	return data;
}