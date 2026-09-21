#!/usr/bin/env node

import { logger } from "#utils/logger";
import { exec } from "child_process";
import { createHash } from "crypto";
import { existsSync, readFileSync, writeFileSync } from "fs";
import { promisify } from "util";

const execAsync = promisify(exec);
const componentLogger = logger.child({ component: "db-init" });

const isProduction = process.env.NODE_ENV === "production";
const SCHEMA_HASH_FILE = ".prisma-schema-hash";

function getSchemaHash(): string | null {
	try {
		const schemaPath = "prisma/schema.prisma";
		if (!existsSync(schemaPath)) return null;
		const schemaContent = readFileSync(schemaPath, "utf-8");
		return createHash("md5").update(schemaContent).digest("hex");
	} catch {
		return null;
	}
}

function hasSchemaChanged(): boolean {
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

function saveSchemaHash(): void {
	const currentHash = getSchemaHash();
	if (currentHash) {
		writeFileSync(SCHEMA_HASH_FILE, currentHash);
	}
}

async function runCommand(command: string, description: string): Promise<boolean> {
	componentLogger.info({ description }, "\n🔄 Starting task...");
	try {
		const { stdout, stderr } = await execAsync(command, {
			cwd: process.cwd(),
			env: process.env
		});
		if (stdout) componentLogger.info({ channel: "stdout" }, stdout);
		if (stderr) componentLogger.info({ channel: "stderr" }, stderr);
		componentLogger.info({ description }, "✅ Task completed");
		return true;
	} catch (error) {
		const err = error as { message: string; stdout?: string; stderr?: string };
		componentLogger.error({ message: err.message }, `❌ ${description} failed`);
		if (err.stdout) componentLogger.info({ channel: "stdout" }, err.stdout);
		if (err.stderr) componentLogger.info({ channel: "stderr" }, err.stderr);
		return false;
	}
}

async function initDatabase(): Promise<void> {
	componentLogger.info("\n🚀 Starting database initialization...");
	const environment = isProduction ? "PRODUCTION" : "DEVELOPMENT";
	componentLogger.info({ environment }, "📍 Environment");

	if (isProduction) {
		// Production: Use migrations only (safe, no data loss)
		componentLogger.info("\n⚠️  Production mode: Using safe migration strategy");

		const migrateSuccess = await runCommand("npx prisma migrate deploy", "Applying pending migrations");

		if (!migrateSuccess) {
			componentLogger.error("\n❌ Migration failed! Please check your database connection and migrations.");
			process.exit(1);
		}
	} else {
		// Development: Use db push for rapid iteration
		componentLogger.info("\n🛠️  Development mode: Using db push for rapid iteration");

		const pushSuccess = await runCommand("npx prisma db push", "Syncing database schema");

		if (!pushSuccess) {
			componentLogger.error("\n❌ Database sync failed! Please check your database connection.");
			process.exit(1);
		}
	}

	// Only generate Prisma Client if schema changed
	const schemaChanged = hasSchemaChanged();

	if (schemaChanged) {
		const generateSuccess = await runCommand("npx prisma generate", "Generating Prisma Client");

		if (!generateSuccess) {
			componentLogger.error("\n❌ Prisma Client generation failed!");
			process.exit(1);
		}

		saveSchemaHash();
	} else {
		componentLogger.info("\n⚡ Schema unchanged, skipping Prisma Client generation");
	}

	componentLogger.info("\n✨ Database initialization completed successfully!\n");
}

// Run initialization
initDatabase().catch(error => {
	componentLogger.error({ error }, "\n💥 Database initialization error");
	process.exit(1);
});
