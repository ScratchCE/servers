// The main file.

const {app} = require("./app.js");
const {data, commitToDb} = require("./db.js");
const fs = require("fs");

// Clear screen, thanks stackoverflow
process.stdout.write('\033c');

console.log("====== Servers ======");
console.log("        (WIP)        \n");

app.get("/", (req, res) => {
	console.log("Request to homepage")
	res.send("E");
});

require("./projects.js");
require("./assets.js");

app.use(function (req, res) {
	console.log("Nonexistent path request")
	res.status(404).send("Not found lol");
});

app.listen(8080, () => {
	console.log("Server up!");
	console.log("Current database:\n", data, "\n\n");
	console.log("==========LOGS==========");
});