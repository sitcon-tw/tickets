#!/usr/bin/env node
/**
 * @fileoverview Database initialization script
 * Automatically checks and syncs database schema on startup
 */

import { exec } from "child_process";
import { createHash } from "crypto";
import { existsSync, readFileSync, writeFileSync } from "fs";
import { promisify } from "util";

const execAsync = promisify(exec);

const isProduction = process.env.NODE_ENV === "production";
const isDevelopment = !isProduction;
const SCHEMA_HASH_FILE = ".prisma-schema-hash";

function getSchemaHash() {
	try {
		const schemaPath = "prisma/schema.prisma";
		if (!existsSync(schemaPath)) return null;
		const schemaContent = readFileSync(schemaPath, "utf-8");
		return createHash("md5").update(schemaContent).digest("hex");
	} catch (error) {
		return null;
	}
}

function hasSchemaChanged() {
	const currentHash = getSchemaHash();
	if (!currentHash) return true;

	if (!existsSync(SCHEMA_HASH_FILE)) return true;

	try {
		const previousHash = readFileSync(SCHEMA_HASH_FILE, "utf-8").trim();
		return previousHash !== currentHash;
	} catch {
		return true;
	}
}

function saveSchemaHash() {
	const currentHash = getSchemaHash();
	if (currentHash) {
		writeFileSync(SCHEMA_HASH_FILE, currentHash);
	}
}

async function runCommand(command, description) {
	console.log(`\n🔄 ${description}...`);
	try {
		const { stdout, stderr } = await execAsync(command, {
			cwd: process.cwd(),
			env: process.env
		});
		if (stdout) console.log(stdout);
		if (stderr) console.error(stderr);
		console.log(`✅ ${description} completed`);
		return true;
	} catch (error) {
		console.error(`❌ ${description} failed:`, error.message);
		if (error.stdout) console.log(error.stdout);
		if (error.stderr) console.error(error.stderr);
		return false;
	}
}

async function initDatabase() {
	console.log("\n🚀 Starting database initialization...");
	console.log(`📍 Environment: ${isProduction ? "PRODUCTION" : "DEVELOPMENT"}`);

	if (isProduction) {
		// Production: Use migrations only (safe, no data loss)
		console.log("\n⚠️  Production mode: Using safe migration strategy");

		const migrateSuccess = await runCommand("npx prisma migrate deploy", "Applying pending migrations");

		if (!migrateSuccess) {
			console.error("\n❌ Migration failed! Please check your database connection and migrations.");
			process.exit(1);
		}
	} else {
		// Development: Use db push for rapid iteration
		console.log("\n🛠️  Development mode: Using db push for rapid iteration");

		const pushSuccess = await runCommand("npx prisma db push --skip-generate", "Syncing database schema");

		if (!pushSuccess) {
			console.error("\n❌ Database sync failed! Please check your database connection.");
			process.exit(1);
		}
	}

	// Only generate Prisma Client if schema changed
	const schemaChanged = hasSchemaChanged();

	if (schemaChanged) {
		const generateSuccess = await runCommand("npx prisma generate", "Generating Prisma Client");

		if (!generateSuccess) {
			console.error("\n❌ Prisma Client generation failed!");
			process.exit(1);
		}

		saveSchemaHash();
	} else {
		console.log("\n⚡ Schema unchanged, skipping Prisma Client generation");
	}

	console.log("\n✨ Database initialization completed successfully!\n");
}

// Run initialization
initDatabase().catch(error => {
	console.error("\n💥 Database initialization error:", error);
	process.exit(1);
});
