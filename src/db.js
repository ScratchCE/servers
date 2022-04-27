// Database stuff; get/set the modified data and commit it to the database.json file

const fs = require("fs");

createDir("db/");
createDir("db/assets/");
createDir("db/projects/");

createFile("db/database.json", "{}");
createFile("db/database-backup.json", "{}");

// Read database
let data;
try {
	// Yeah IK I should use a non-sync fs function but...
	data = fs.readFileSync("db/database.json", "utf8");
	data = JSON.parse(data);
} catch (err) {
	try {
		//Attempt reading from backup
		data = fs.readFileSync("db/database-backup.json", "utf8");
		data = JSON.parse(data);
	} catch (err2) {
		throw err2;
		return;
	}
}

try {
	const entries = fs.readdirSync("db/projects/", {
		withFileTypes: true
	});
	const projects = entries.filter(
		e => e.isFile()
	);
	if (projects.length === 0) {
		data.projCount = 0;
	} else {
		data.projCount = Math.max(
			Number(
				projects[projects.length - 1].name
				.split(".")[0]
			),
			projects.length
		);
	}
} catch (err) {
	throw err;
}

commitToDb();

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


function createFile(file, data) {
	// existsSync is not deprecated sooo
	if (!fs.existsSync(file)){
		fs.writeFileSync(file, data);
	}
}
function createDir(dir) {
	if (!fs.existsSync(dir)){
		fs.mkdirSync(dir);
	}
}