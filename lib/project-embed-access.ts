import { eq, sql } from "drizzle-orm";
import { db } from "@/src";
import { projectEmbedAccess } from "@/src/db/schema";
import { createEmbedToken, verifyEmbedToken } from "./embed-auth";

export async function ensureProjectEmbedAccessTable() {
  await db.run(sql`
    CREATE TABLE IF NOT EXISTS project_embed_access (
      project_id TEXT PRIMARY KEY NOT NULL,
      active_token TEXT,
      created_at INTEGER DEFAULT (strftime('%s', 'now')),
      updated_at INTEGER DEFAULT (strftime('%s', 'now')),
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
    )
  `);

  await db.run(
    sql`CREATE INDEX IF NOT EXISTS pea_updated_idx ON project_embed_access(updated_at)`,
  );
}

export async function getProjectEmbedAccess(projectId: string) {
  await ensureProjectEmbedAccessTable();

  const [access] = await db
    .select()
    .from(projectEmbedAccess)
    .where(eq(projectEmbedAccess.projectId, projectId));

  return access ?? null;
}

export async function getProjectActiveEmbedToken(projectId: string) {
  const access = await getProjectEmbedAccess(projectId);
  return access?.activeToken ?? null;
}

export async function ensureOrCreateProjectEmbedToken(projectId: string) {
  await ensureProjectEmbedAccessTable();

  const current = await getProjectEmbedAccess(projectId);

  if (current?.activeToken) {
    const verified = verifyEmbedToken(current.activeToken);
    if (verified.ok && verified.payload.projectId === projectId) {
      return {
        token: current.activeToken,
        updatedAt: current.updatedAt,
      };
    }
  }

  const token = createEmbedToken({ projectId });
  const now = new Date();

  await db
    .insert(projectEmbedAccess)
    .values({
      projectId,
      activeToken: token,
      createdAt: current?.createdAt ?? now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: projectEmbedAccess.projectId,
      set: {
        activeToken: token,
        updatedAt: now,
      },
    });

  return { token, updatedAt: now };
}

export async function regenerateProjectEmbedToken(projectId: string) {
  await ensureProjectEmbedAccessTable();

  const token = createEmbedToken({ projectId });
  const now = new Date();

  await db
    .insert(projectEmbedAccess)
    .values({
      projectId,
      activeToken: token,
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: projectEmbedAccess.projectId,
      set: {
        activeToken: token,
        updatedAt: now,
      },
    });

  return { token, updatedAt: now };
}

export async function revokeProjectEmbedToken(projectId: string) {
  await ensureProjectEmbedAccessTable();

  const existing = await getProjectEmbedAccess(projectId);
  if (!existing) return false;

  await db
    .update(projectEmbedAccess)
    .set({
      activeToken: null,
      updatedAt: new Date(),
    })
    .where(eq(projectEmbedAccess.projectId, projectId));

  return true;
}
