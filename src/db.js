// Database stuff; get/set the modified data and commit it to the database.json file

const fs = require("fs");

// Read database
let data;
try {
	// Yeah IK I should use a non-sync fs function but...
	data = fs.readFileSync('db/database.json', 'utf8');
	data = JSON.parse(data);
} catch (err) {
	throw err;
}

if (!data.projects) {
	data.projects = [];
	commitToDb();
}

function commitToDb() {
	console.log("Database commit")
	let dataString = JSON.stringify(data);
	fs.writeFile("db/database.json", dataString, ()=>{});
	fs.writeFile("db/database-backup.json", dataString, ()=>{});
}

module.exports = {
	commitToDb: commitToDb,
	data: data
};