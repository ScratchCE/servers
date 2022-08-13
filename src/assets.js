// assets.scratch.mit.edu implementation - hybrid assets mirror/independent server to minimize stored files

/*
	sheep_maker's "docs":
	https://scratch.mit.edu/discuss/post/3892702
	
	The asset host has all the other files, such as bitmap and vector costumes and sounds. GET /internalapi/asset/[md5].[file_type]/get/ gets the asset, and POST /[md5].[file_type] with the request body containing the asset file uploads it. Assets are given an ID based on the md5 hash of the file so that the same asset is stored in the same place on the servers.
	
	Example URL: https://assets.scratch.mit.edu/internalapi/asset/4d4e2400c5989a5ebeccc918aa0ec2f8.svg/get/ and https://assets.scratch.mit.edu/e37d49c1e6fdf02edd09385e0471f6d0.svg Making a GET request to the latter URL works, but I don't think the Scratch editor uses that.
*/

import {app} from "./app.js";
import fetch from "node-fetch";
import db from "./db.js";

// NOTE: If you're modifying this, app.js also has a max buffer size of 1000MB.
// Make sure to set that too to something higher than your asset size limit
// (although it's not like anyone will have a 1GB asset, right?)
const assetSizeLimit = 10 * 1000 * 1000;

const assetTypes = {
	png: "image/png",
	svg: "image/svg+xml",
	wav: "audio/x-wav",
	mp3: "audio/mpeg",
}

// Support both the /internalapi/asset/md5/get/ longhand that Scratch uses
// and the /md5 shorthand that is usually used by unofficial stuff
app.get("/assets/internalapi/asset/:asset/get", (req, res) => {
	getAsset(req, res);
});
app.get("/assets/internalapi/asset/:asset/get", (req, res) => {
	getAsset(req, res);
});

async function getAsset(req, res) {
	const asset = req.params.asset;

	const returnVal = await db.get(`
		SELECT data FROM assets WHERE hash == ? AND ext == ?
	`, asset.split(".")[0], asset.split(".")[1]);
	
	if (returnVal !== undefined) {
		res.set("Content-Type", assetTypes[asset.split(".")[1]] || "application/octet-stream");
		res.status(200).send(returnVal.data);
	} else {
		// Fetch from the Scratch servers too
		// (assets that already exist on assets.scratch are not stored
		// to minimize space usage)
		const resp = await fetch(`https://assets.scratch.mit.edu/${asset}`);
		const data = await resp.arrayBuffer();
		
		res.set("Content-Type", resp.headers.get("Content-Type"));
		
		res.status(resp.status).send(Buffer.from(data));
	}
}

app.post("/assets/:asset", async (req, res) => {
	const asset = req.params.asset;
	
	// First, attempt to get the asset locally...
	const returnVal = await db.get(`
		SELECT data FROM assets WHERE hash == ? AND ext == ?
	`, asset.split(".")[0], asset.split(".")[1]);

	if (returnVal !== undefined) {
		// If it exists, then it is uploaded!
		res.status(200).json({
			status: "ok",
			"content-name": asset
		});
	} else {
		// Otherwise...
		
		// Fetch from the Scratch servers too
		// (assets that already exist on assets.scratch are not stored
		// to minimize space usage)
		const resp = await fetch(`https://assets.scratch.mit.edu/${asset}`);
		if (resp.ok) {
			// Scratch has the file, pretend we actually uploaded it
			// (GET will get from Scratch if necessary)
			res.status(200).json({
				status: "ok",
				"content-name": asset
			});
		} else {
			// Upload it!
			try {
				const data = req.body;
				const ext =  asset.split(".")[1];
				if (data.length <= assetSizeLimit) {
					await db.run(`
						INSERT INTO assets (
							hash, ext, data
						) VALUES (
							?, ?, ?
						)
					`, asset.split(".")[0], ext, data);
					res.status(200).json({
						status: "ok",
						"content-name": asset
					});
				} else {
					switch (ext) {
						case "wav":
							res.status(413).send(`Sound exceeded asset size limit - maximum is ${assetSizeLimit} bytes (${assetSizeLimit/1000/1000} megabytes). Try converting large sounds to MP3`);
						break;
						case "mp3":
							res.status(413).send(`Sound exceeded asset size limit - maximum is ${assetSizeLimit} bytes (${assetSizeLimit/1000/1000} megabytes).`);
						break;
						default:
							res.status(413).send(`Exceeded asset size limit - maximum is ${assetSizeLimit} bytes (${assetSizeLimit/1000/1000} megabytes)`);
					}
				}
			} catch(e2) {
				// Oops
				console.log("Error uploading asset", e2);
				res.status(500).send(e2);
			}
		}
	}
});
