// Scratch Auth authentication and basic account stuff.
// Some of the responses are kinda wacky because of trying
// to be somewhat accurate to Scratch

import {app} from "./app.js";
import db from "./db.js";
import crypto from "node:crypto";
import fetch from "node-fetch";

app.post("/session", async (req, res) => {
	const body = req.body;

	if (Object.keys(body).length < 1) {
		res.status(400).send("Invalid project data. Make sure to send Content-Type: application/json as a header because that's required for some reason");
		return;
	}

	if (body.password) {
		res.status(400).send("Password login is not implemented!");
		return;
	}
	
	const vReq = await fetch(
		`https://auth.itinerary.eu.org/api/auth/verifyToken?privateCode=${body.privateCode}`
	);
	const json = await vReq.json();

	
	if (json.valid) {
		const sessionId = crypto.randomBytes(128).toString("hex");
		
		const oldAccount = await db.get(`
			SELECT id FROM users WHERE scratchUsername == ?
		`, json.username);
		if (oldAccount) {
			await db.run(`
				DELETE FROM sessions WHERE userId == ?
			`, oldAccount.id);
		}

		const account = await createAccount(json.username);

		const duration =
			body.duration === undefined ?
				(1000 * 60 * 60 * 24) : ((body.duration*1) || 0);
		const expireTime = Date.now() + duration;

		await db.run(`
			INSERT INTO sessions (
				id, userId, expires
			) VALUES (
				?, ?, ?
			)
		`, sessionId, account.id, (
			expireTime
		));

		
		const session = await getSession(sessionId);
		
		res.status(200).json({
			username: account.username,
			scratchUsername: account.scratchUsername,
			token: session.id,
			success: 1,
			msg: "",
			id: account.id,
			scratchId: account.scratchId,
			messages: [],
			expireTime,
		});
	} else {
		res.status(403).json({success: 0, msg: "Authentication failed"});
	}
});
app.get("/session", async (req, res) => {
	const session = await getSession(req.get("X-Token"));

	if (!session) {
		if (req.query.raw) {
			res.status(404).json({});
		} else {
			res.status(404).json({
				flags: {}
			});
		};
		return;
	}
	
	if (req.query.raw) {
		res.status(200).json(session);
	} else {
		const account = await getAccount(session.userId);
		res.status(200).json({
			user: {
				id: account.id,
				scratchId: account.scratchId,
				banned: account.unbanTime !== 0,
				username: account.username,
				scratchUsername: account.scratchUsername,
				token: session.id,
				thumbnailUrl:
					`//cdn2.scratch.mit.edu/get_image/user/${account.scratchId}_32x32.png`,
				dateJoined: new Date(account.dateCreated).toISOString(),
			},
			permissions: {
				admin: account.rank === 1,
			},
			session: {
				expires: session.expires,
			},
			flags: {},
		});
	};
});
app.delete("/session", async (req, res) => {
	const deleted = logOut(req.get("X-Token"));
	
	if (!deleted) {
		res.status(403).send("This session does not exist");
		return;
	}
	res.status(302).end();
});

async function createAccount(username) {
	// First, check if there's an existing account with this username
	const existingAccount = await db.get(`
		SELECT id FROM users WHERE scratchUsername == ?
	`, username);
	if (existingAccount) return existingAccount;
	
	// Contact the Scratch API
	// (SDB because I don't really want to stress api.scratch)
	let apiRequest, apiJson;
	try {
		apiRequest = await fetch("https://scratchdb.lefty.one/v3/user/info/" + username);
		apiJson = await apiRequest.json();
	} catch (e) {
		return null;
	}
	if (!apiRequest.ok) return null;
	
	// Only the ID matters to us currently
	const accountId = apiJson.id.toString();
	
	// There's a possibility the user has changed usernames
	// Search for that too
	const existingId = await db.get(`
		SELECT id FROM users WHERE scratchId == ?
	`, accountId);
	if (existingId) {
		// If the account exists, update the username and return it!
		await db.run(`
			UPDATE users SET (scratchUsername, username) = ? WHERE scratchId == ?
		`, username, accountId);
		return await db.get(`
			SELECT * FROM users WHERE scratchId == ?
		`, accountId);
	}
	
	// Otherwise, we actually don't have the account created
	// Create it!
	const result = await db.run(`
		INSERT INTO users (
			scratchUsername, scratchId, username, dateCreated
		) VALUES (
			?, ?, ?, ?
		)
	`, username, accountId, username, Date.now());
	return await getAccount(result.lastID);
}

export async function getSession(sessionId) {
	const session = await db.get(`
		SELECT * FROM sessions WHERE id == ?
	`, sessionId);
	if (!session) return undefined;
	if (session.expires < Date.now() && session.expires !== 0) {
		await db.run(`
			DELETE FROM sessions WHERE id == ?
		`, sessionId);
		return undefined;
	}
	return session;
}
export function getAccount(id) {
	return db.get(`
		SELECT * FROM users WHERE id == ?
	`, id);
}
export async function logOut(sessionId) {
	const session = await getSession(sessionId);
	if (!session) return false;
	
	await db.run(`
		DELETE FROM sessions WHERE id == ?
	`, sessionId);
	return true;
}