<<<<<<< Updated upstream
import "dotenv/config"
=======
import "dotenv/config";
>>>>>>> Stashed changes
import { defineConfig } from "prisma/config";


export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "npx tsx prisma/seed.ts",
  },
  datasource: {
    url: process.env["DATABASE_URL"],
  },
});
