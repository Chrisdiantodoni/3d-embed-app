import { sql } from "drizzle-orm";
import {
  sqliteTable,
  text,
  integer,
  index,
} from "drizzle-orm/sqlite-core";

export const assets = sqliteTable(
  "assets",
  {
    id: text("id").primaryKey(), // Gunakan CUID atau UUID
    name: text("name").notNull(), // Nama Model (e.g., "Cyberpunk Car")
    url: text("url").notNull(), // Link file .glb (S3/R2/Vercel Blob)
    thumbnailUrl: text("thumbnail_url"), // Screenshot model untuk Grid

    // Info Teknikal
    fileSize: integer("file_size").notNull(), // Dalam bytes

    // User Management
    userId: text("user_id").notNull(), // ID User dari Clerk/Auth.js

    // Timestamps & Analytics
    createdAt: integer("created_at", { mode: "timestamp" }).default(
      sql`(strftime('%s', 'now'))`,
    ),
    updatedAt: integer("updated_at", { mode: "timestamp" }).default(
      sql`(strftime('%s', 'now'))`,
    ),
  },
  (table) => ({
    nameIdx: index("name_idx").on(table.name),
    userIdIdx: index("user_id_idx").on(table.userId),
  }),
);

export const projects = sqliteTable(
  "projects",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    name: text("name").notNull(),
    description: text("description"),

    // The "Snapshot" URL we discussed
    thumbnailUrl: text("thumbnail_url"),

    // Example: { intensity: 0.5, type: 'studio', color: '#ffffff' }
    lightingSettings: text("lighting_settings").default("{}"),

    // Example: { position: [5, 5, 5], target: [0, 0, 0], fov: 50 }
    cameraSettings: text("camera_settings").default("{}"),

    // Metadata
    createdAt: integer("created_at", { mode: "timestamp" }).default(
      sql`(strftime('%s', 'now'))`,
    ),
    updatedAt: integer("updated_at", { mode: "timestamp" }).default(
      sql`(strftime('%s', 'now'))`,
    ),
  },
  (table) => ({
    userIdIdx: index("projects_user_id_idx").on(table.userId),
  }),
);

export const projectAssets = sqliteTable(
  "project_assets",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    projectId: text("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    assetId: text("asset_id")
      .notNull()
      .references(() => assets.id),

    // Transformasi Spesifik per Instance Asset
    // Contoh: { x: 2, y: 0, z: -5 }
    position: text("position").default('{"x":0,"y":0,"z":0}'),
    // Contoh: { x: 0, y: 1.57, z: 0 } (dalam radian)
    rotation: text("rotation").default('{"x":0,"y":0,"z":0}'),
    // Contoh: { x: 1, y: 1, z: 1 }
    scale: text("scale").default('{"x":1,"y":1,"z":1}'),

    createdAt: integer("created_at", { mode: "timestamp" }).default(
      sql`(strftime('%s', 'now'))`,
    ),
  },
  (table) => ({
    projectIdx: index("pa_project_id_idx").on(table.projectId),
  }),
);

export const projectEmbedDomains = sqliteTable(
  "project_embed_domains",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    projectId: text("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    domain: text("domain").notNull(),
    createdAt: integer("created_at", { mode: "timestamp" }).default(
      sql`(strftime('%s', 'now'))`,
    ),
  },
  (table) => ({
    projectIdx: index("ped_project_id_idx").on(table.projectId),
    domainIdx: index("ped_domain_idx").on(table.domain),
  }),
);
