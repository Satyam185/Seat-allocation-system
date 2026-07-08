import { config } from "dotenv";
import { defineConfig, env } from "prisma/config";

config({ path: ".env" });

export default defineConfig({
    schema: "prisma/schema.prisma",
    migrations: {
        seed: "tsx prisma/seed.ts",
    },
    datasource: {
        url: env("DIRECT_URL"),
    },
});