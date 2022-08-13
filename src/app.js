// The Express app for actually implementing all the endpoints.
// Also exports `express` for using middleware in other scripts.

console.log("app.js required");

import express from "express";
import cors from "cors";

const app = express();

const corsOptions = {
	origin: true,
	credentials: true,
};

app.options("*", cors(corsOptions));
app.use(cors(corsOptions));
app.use(express.urlencoded({extended: true, limit: "1000mb"}));
app.use(express.text({limit: "1000mb"}));
app.use(express.json({limit: "1000mb"}));
app.use(express.raw({type: () => true, limit: "1000mb"}));

export {app, express};