import { Router } from "express";
import type { ApiTesterRequestBody } from "./types.js";
import { runChecks } from "./run-checks.js";

export const apiTesterRouter = Router();

apiTesterRouter.post("/", async (req, res) => {
	const { requests } = req.body as ApiTesterRequestBody;

	if (!Array.isArray(requests) || requests.length === 0) {
		res.status(400).json({ error: "requests field must be a non-empty array" });
		return;
	}

	try {
		const result = await runChecks(requests);
		res.json(result);
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		res.status(500).json({ error: message });
	}
});
