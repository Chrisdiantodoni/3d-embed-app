import { sql } from "drizzle-orm";
import {
  int,
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

export const projects = sqliteTable("projects", {
  id: text("id").primaryKey(), // nanoid
  userId: text("user_id").notNull(), // Clerk user id
  name: text("name").notNull(),
  fileName: text("file_name").notNull(), // original upload name
  fileUrl: text("file_url").notNull(), // public R2 URL
  fileSize: int("file_size"), // bytes
  thumbnailUrl: text("thumbnail_url"), // captured PNG thumbnail
  // Viewer config
  intensity: text("intensity").default("0.6"),
  autoRotate: int("auto_rotate", { mode: "boolean" }).default(true),
  environment: text("environment").default("city"), // city | studio | lobby
  bgColor: text("bg_color").default("#fafafa"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const hotspots = sqliteTable("hotspots", {
  id: text("id").primaryKey(), // nanoid
  projectId: text("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  positionX: text("position_x").notNull(),
  positionY: text("position_y").notNull(),
  positionZ: text("position_z").notNull(),
  label: text("label").notNull(),
  description: text("description"),
  linkUrl: text("link_url"),
  createdAt: text("created_at").notNull(),
});

export const analyticsEvents = sqliteTable("analytics_events", {
  id: text("id").primaryKey(), // nanoid
  projectId: text("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  eventType: text("event_type").notNull(), // "view" | "rotate" | "zoom" | "hotspot_click"
  metadata: text("metadata"), // JSON string
  createdAt: text("created_at").notNull(),
});
