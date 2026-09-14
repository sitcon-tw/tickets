import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
	schema: "prisma/schema.prisma",
	migrations: {
		path: "prisma/migrations",
		seed: "tsx prisma/seed.ts"
	},
	datasource: {
		// Read lazily instead of prisma's env() helper: `prisma generate` runs at
		// image build time, where no database URL exists yet. The CLI commands that
		// actually need it (migrate/db push) still fail loudly on an empty value.
		url: process.env.POSTGRES_URI ?? ""
	}
});
