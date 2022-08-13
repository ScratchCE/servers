// Database stuff; initializes the SQLite database and handles migration of the old database

import fs from "node:fs";

import sqlite3 from "sqlite3";
import {open} from "sqlite";

console.log("Loading database")

if (!fs.existsSync("db/")) {
	fs.mkdirSync("db/");
}

const db = await open({
	filename: "db/database.sqlite",
	driver: sqlite3.Database
});
export default db;

await db.exec(`
	CREATE TABLE IF NOT EXISTS projects (
		id INTEGER PRIMARY KEY ASC,
		owner INTEGER DEFAULT 0,
		creator INTEGER DEFAULT 0,
		title TEXT DEFAULT "Untitled",
		data BLOB DEFAULT "{}",
		dateCreated INTEGER DEFAULT 0,
		dateModified INTEGER DEFAULT 0,
		dateShared INTEGER DEFAULT 0,
		datePublished INTEGER DEFAULT 0,
		shared INTEGER DEFAULT 0,
		published INTEGER DEFAULT 0
	);
	CREATE TABLE IF NOT EXISTS assets (
		hash TEXT PRIMARY KEY,
		ext TEXT,
		data BLOB
	);
	CREATE TABLE IF NOT EXISTS users (
		id INTEGER PRIMARY KEY,
		username TEXT,
		scratchId TEXT,
		scratchUsername TEXT,
		bio TEXT DEFAULT "",
		work TEXT DEFAULT "",
		unbanTime INTEGER DEFAULT 0,
		deleted INTEGER DEFAULT 0,
		rank INTEGER DEFAULT 0,
		dateCreated INTEGER DEFAULT 0
	);
	CREATE TABLE IF NOT EXISTS sessions (
		id TEXT PRIMARY KEY,
		userId INTEGER,
		expires INTEGER DEFAULT 0
	);
`);
console.log("Initialization ran")

if (!await columnExists("projects", "dateCreated")) {
	console.log("Upgrading database (changes: add dates, shared and published to projects)")
	await db.exec(`
		ALTER TABLE projects ADD COLUMN dateCreated INTEGER DEFAULT 0;
		ALTER TABLE projects ADD COLUMN dateModified INTEGER DEFAULT 0;
		ALTER TABLE projects ADD COLUMN dateShared INTEGER DEFAULT 0;
		ALTER TABLE projects ADD COLUMN datePublished INTEGER DEFAULT 0;
		ALTER TABLE projects ADD COLUMN shared INTEGER DEFAULT 0;
		ALTER TABLE projects ADD COLUMN published INTEGER DEFAULT 0;
	`);
}
if (!await columnExists("projects", "description")) {
	console.log("Upgrading database (changes: add notes and instructions to projects)")
	await db.exec(`
		ALTER TABLE projects ADD COLUMN description TEXT DEFAULT "";
		ALTER TABLE projects ADD COLUMN instructions TEXT DEFAULT "";
	`);
}

if (fs.existsSync("db/database.json")) {
	// Migrate the old JSON+file-based database
	console.log("database.json detected, converting database");
	
	let count;

	const projectEntries = fs.readdirSync("db/projects/", {
		withFileTypes: true
	});
	const projects = projectEntries.filter(
		e => e.isFile()
	)
	const projCount = Math.max(
		Number(
			projects[projects.length - 1].name
			.split(".")[0]
		),
		projects.length
	);
	count = 0;
	for (let i = 1; i <= projCount; i++) {
		const pj = fs.readFileSync(
			"db/projects/" + i + ".json",
			{encoding: "utf8"}
		);
		await db.run(`
			INSERT INTO projects (
				title, data
			) VALUES (
				?, ?
			);
		`, "Old Project with ID " + i, pj);
		console.log("Migrated project " + i);
		count++;
	}
	console.log(count + " projects migrated");

	const assetEntries = fs.readdirSync("db/assets/", {
		withFileTypes: true
	});
	const assets = assetEntries.filter(
		e => e.isFile()
	)
	count = 0;
	for (const asset of assets) {
		const a = fs.readFileSync(
			"db/assets/" + asset.name
		);
		await db.run(`
			INSERT INTO assets (
				hash, ext, data
			) VALUES (
				?, ?, ?
			);
		`, asset.name.split(".")[0], asset.name.split(".")[1], a);
		console.log("Migrated asset " + asset.name);
		count++;
	}
	console.log(count + " assets migrated");

	// Delete all old files
	console.log("Deleting old database");
	fs.rmSync("db/database.json");
	fs.rmSync("db/database-backup.json");
	console.log("Deleting old projects");
	fs.rmSync("db/projects", {
		recursive: true
	});
	console.log("Deleting old assets");
	fs.rmSync("db/assets", {
		recursive: true
	});

	console.log("Migration complete!");
}

console.log("Database loaded")

export async function columnExists(table, col) {
	const filterRegex = /[^a-zA-Z0-9_-]/g;
	const newTable = table.replaceAll(filterRegex, "");
	const newCol = col.replaceAll(filterRegex, "");
	try {
		await db.get(`SELECT ${newCol} FROM ${newTable}`);
		return true;
	} catch(e) {
		return false;
	}
}