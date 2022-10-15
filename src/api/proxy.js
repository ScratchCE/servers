// Implements api/proxy endpoints.

import {app} from "../app.js";
import db from "../db.js";

import {
	createProjInfo, authProject,
	shareProject, unshareProject,
	publishProject, unpublishProject,
} from "./projects.js";

app.get("/api/proxy/featured", async (_req, res) => {
	const recentlyPublished = await db.all(`
		SELECT * FROM projects
			WHERE published == 1
			ORDER BY datePublished DESC NULLS LAST
			LIMIT 25
	`);

	const userCache = {};
	for (const obj of recentlyPublished) {
		userCache[obj.creator] = userCache[obj.creator] || await db.get(`
			SELECT username FROM users WHERE id == ?
		`, obj.creator) || null;
		userCache[obj.owner] = userCache[obj.owner] || await db.get(`
			SELECT username FROM users WHERE id == ?
		`, obj.owner) || null;
	}

	res.json({
		community_newest_projects: recentlyPublished.map(o => ({
			thumbnail_url: null,
			title: o.title,
			creator: userCache[o.creator],
			owner: userCache[o.owner],
			type: "project",
			id: o.id,
			love_count: 0
		})),
		// Dummy empty rows
		community_most_remixed_projects: [],
		scratch_design_studio: [],
		curator_top_projects: [],
		community_featured_studios: [],
		community_most_loved_projects: [],
		community_featured_projects: []
	});
});

app.put("/proxy/projects/:id/share", async (req, res) => {
	const projInfo = await authProject(req, res);
	if (!projInfo) return;

	if (!projInfo.shared) {
		shareProject(projInfo.id);
	}
	res.status(200).json(await createProjInfo(projInfo));
});
app.put("/proxy/projects/:id/unshare", async (req, res) => {
	const projInfo = await authProject(req, res);
	if (!projInfo) return;
	
	if (projInfo.shared) {
		unshareProject(projInfo.id);
	}
	res.status(200).json(await createProjInfo(projInfo));
});
app.put("/proxy/projects/:id/publish", async (req, res) => {
	const projInfo = await authProject(req, res);
	if (!projInfo) return;
	
	if (!projInfo.published) {
		publishProject(projInfo.id);
	}
	res.status(200).json(await createProjInfo(projInfo));
});
app.put("/proxy/projects/:id/unpublish", async (req, res) => {
	const projInfo = await authProject(req, res);
	if (!projInfo) return;

	if (projInfo.published) {
		unpublishProject(projInfo.id);
	}
	res.status(200).json(await createProjInfo(projInfo));
});