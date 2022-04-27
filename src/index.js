// The main file.

const {app} = require("./app.js");
const {data, commitToDb} = require("./db.js");
const fs = require("fs");

// Clear screen, thanks stackoverflow
process.stdout.write('\033c');

console.log("====== SCE Servers ======");
console.log("          (WIP)          \n");

app.get("/", (req, res) => {
	res.send("Pong");
});

require("./projects.js");
require("./assets.js");

app.listen(8079, () => {
	console.log("Server up!");
	console.log("Current database:\n", data);
});