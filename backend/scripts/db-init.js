#!/usr/bin/env node
/**
 * @fileoverview Database initialization script
 * Automatically checks and syncs database schema on startup
 */

import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

const isProduction = process.env.NODE_ENV === "production";
const isDevelopment = !isProduction;

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
		
		const migrateSuccess = await runCommand(
			"npx prisma migrate deploy",
			"Applying pending migrations"
		);
		
		if (!migrateSuccess) {
			console.error("\n❌ Migration failed! Please check your database connection and migrations.");
			process.exit(1);
		}
		
	} else {
		// Development: Use db push for rapid iteration
		console.log("\n🛠️  Development mode: Using db push for rapid iteration");
		
		const pushSuccess = await runCommand(
			"npx prisma db push --skip-generate",
			"Syncing database schema"
		);
		
		if (!pushSuccess) {
			console.error("\n❌ Database sync failed! Please check your database connection.");
			process.exit(1);
		}
	}

	// Always generate Prisma Client
	const generateSuccess = await runCommand(
		"npx prisma generate",
		"Generating Prisma Client"
	);
	
	if (!generateSuccess) {
		console.error("\n❌ Prisma Client generation failed!");
		process.exit(1);
	}

	console.log("\n✨ Database initialization completed successfully!\n");
}

// Run initialization
initDatabase().catch(error => {
	console.error("\n💥 Database initialization error:", error);
	process.exit(1);
});
