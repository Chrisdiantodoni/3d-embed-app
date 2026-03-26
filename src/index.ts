import { drizzle } from "drizzle-orm/libsql";
import * as schema from "@/src/db/schema";
import { createClient } from "@libsql/client";

const client = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

const db = drizzle(client, { schema });

export { db };
