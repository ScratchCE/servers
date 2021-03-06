// The Express app for actually implementing all the endpoints.
// Also exports `express` for using middleware in other scripts.

console.log("app.js required");

const express = require("express");
const cors = require('cors');

const app = express();

app.use(cors({
	origin: true,
	credentials: true
}));
app.use(express.urlencoded({extended: true, limit: "1000mb"}));
app.use(express.text({limit: "1000mb"}));
app.use(express.json({limit: "1000mb"}));
app.use(express.raw({type: () => true, limit: "1000mb"}));

module.exports = {app, express};