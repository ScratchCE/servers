// Implements api/proxy endpoints.

import {app} from "../app.js";
import db from "../db.js";

app.get("/api/proxy/featured", async (req, res) => {
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
})