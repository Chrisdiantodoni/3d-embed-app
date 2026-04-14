import { and, asc, eq, sql } from "drizzle-orm";
import { db } from "@/src";
import { projectEmbedDomains, projects } from "@/src/db/schema";
import { normalizeAllowedDomain } from "./embed-auth";

export type StoredEmbedDomain = {
  id: string;
  projectId: string;
  domain: string;
  createdAt: Date | null;
};

export async function ensureProjectEmbedDomainsTable() {
  await db.run(sql`
    CREATE TABLE IF NOT EXISTS project_embed_domains (
      id TEXT PRIMARY KEY NOT NULL,
      project_id TEXT NOT NULL,
      domain TEXT NOT NULL,
      created_at INTEGER DEFAULT (strftime('%s', 'now')),
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
    )
  `);

  await db.run(
    sql`CREATE INDEX IF NOT EXISTS ped_project_id_idx ON project_embed_domains(project_id)`,
  );
  await db.run(
    sql`CREATE INDEX IF NOT EXISTS ped_domain_idx ON project_embed_domains(domain)`,
  );
}

export async function getOwnedProject(projectId: string, userId: string) {
  const [project] = await db
    .select({ id: projects.id, userId: projects.userId })
    .from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.userId, userId)));

  return project ?? null;
}

export async function listProjectEmbedDomains(projectId: string) {
  await ensureProjectEmbedDomainsTable();

  return db
    .select()
    .from(projectEmbedDomains)
    .where(eq(projectEmbedDomains.projectId, projectId))
    .orderBy(asc(projectEmbedDomains.domain));
}

export async function addProjectEmbedDomain(projectId: string, domainInput: string) {
  await ensureProjectEmbedDomainsTable();

  const normalizedDomain = normalizeAllowedDomain(domainInput);

  if (!normalizedDomain) {
    return { error: "Enter a valid domain, for example https://customer.com" };
  }

  const [existing] = await db
    .select()
    .from(projectEmbedDomains)
    .where(
      and(
        eq(projectEmbedDomains.projectId, projectId),
        eq(projectEmbedDomains.domain, normalizedDomain),
      ),
    );

  if (existing) {
    return { domain: existing };
  }

  const newDomain: StoredEmbedDomain = {
    id: crypto.randomUUID(),
    projectId,
    domain: normalizedDomain,
    createdAt: new Date(),
  };

  await db.insert(projectEmbedDomains).values({
    id: newDomain.id,
    projectId: newDomain.projectId,
    domain: newDomain.domain,
    createdAt: newDomain.createdAt,
  });

  return { domain: newDomain };
}

export async function deleteProjectEmbedDomain(projectId: string, domainId: string) {
  await ensureProjectEmbedDomainsTable();

  const [existing] = await db
    .select()
    .from(projectEmbedDomains)
    .where(
      and(
        eq(projectEmbedDomains.id, domainId),
        eq(projectEmbedDomains.projectId, projectId),
      ),
    );

  if (!existing) {
    return false;
  }

  await db
    .delete(projectEmbedDomains)
    .where(
      and(
        eq(projectEmbedDomains.id, domainId),
        eq(projectEmbedDomains.projectId, projectId),
      ),
    );

  return true;
}
