// The Express app for actually implementing all the endpoints.

console.log("app.js required")

const express = require("express");
const cors = require('cors');

const app = express();

app.use(cors({
	origin: true,
	credentials: true
}));
app.use(express.urlencoded({ extended: true }));
app.use(express.text());
app.use(express.json());

module.exports = app;