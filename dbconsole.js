import prompt from "prompt";
import db from "./src/db.js";

(async () => {
	prompt.start();
	while (true) {
		try {
			console.log(
				await db.all(
					(await prompt.get(["query"])).query
				)
			);
		} catch (e) {
			console.error("error:", e);
		}
	}
})();