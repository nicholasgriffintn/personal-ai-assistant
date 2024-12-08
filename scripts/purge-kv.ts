import { execSync } from "child_process";
import fs from "fs";

const TEMP_FILE = "purge-keys.json";
const NAMESPACE_ID = process.env.NAMESPACE_ID;

if (!NAMESPACE_ID) {
	console.error("Please set NAMESPACE_ID environment variable");
	process.exit(1);
}

// Get all keys
execSync(
	`npx wrangler kv:key list --namespace-id=${NAMESPACE_ID} > ${TEMP_FILE}`,
);

// Read and format the keys
const rawKeys = JSON.parse(fs.readFileSync(TEMP_FILE, "utf-8"));
const formattedKeys = rawKeys.map((key: { name: string }) => key.name);

// Write formatted keys back
fs.writeFileSync(TEMP_FILE, JSON.stringify(formattedKeys));

// Delete the keys
execSync(
	`npx wrangler kv:bulk delete --namespace-id=${NAMESPACE_ID} ${TEMP_FILE}`,
);

// Clean up
fs.unlinkSync(TEMP_FILE);

console.log(`Successfully purged ${rawKeys.length} keys from KV namespace`);
