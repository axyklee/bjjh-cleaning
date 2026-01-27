import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";

// NextAuth tables
export const accounts = sqliteTable("Account", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("userId").notNull(),
  type: text("type").notNull(),
  provider: text("provider").notNull(),
  providerAccountId: text("providerAccountId").notNull(),
  refresh_token: text("refresh_token"),
  access_token: text("access_token"),
  expires_at: integer("expires_at"),
  token_type: text("token_type"),
  scope: text("scope"),
  id_token: text("id_token"),
  session_state: text("session_state"),
  refresh_token_expires_in: integer("refresh_token_expires_in"),
}, (table) => ({
  providerProviderAccountIdIdx: index("Account_provider_providerAccountId_key").on(table.provider, table.providerAccountId),
}));

export const sessions = sqliteTable("Session", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  sessionToken: text("sessionToken").notNull().unique(),
  userId: text("userId").notNull(),
  expires: integer("expires", { mode: "timestamp_ms" }).notNull(),
});

export const users = sqliteTable("User", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: text("email").unique(),
  emailVerified: integer("emailVerified", { mode: "timestamp_ms" }),
  image: text("image"),
});

export const verificationTokens = sqliteTable("VerificationToken", {
  identifier: text("identifier").notNull(),
  token: text("token").notNull().unique(),
  expires: integer("expires", { mode: "timestamp_ms" }).notNull(),
}, (table) => ({
  identifierTokenIdx: index("VerificationToken_identifier_token_key").on(table.identifier, table.token),
}));

// Application tables
export const defaults = sqliteTable("Default", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  shorthand: text("shorthand").notNull().unique(),
  text: text("text").notNull().unique(),
  rank: integer("rank").notNull().unique(),
  createdAt: integer("createdAt", { mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updatedAt", { mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date()),
});

export const classes = sqliteTable("Class", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull().unique(),
  createdAt: integer("createdAt", { mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updatedAt", { mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date()),
}, (table) => ({
  nameIdx: index("Class_name_idx").on(table.name),
}));

export const areas = sqliteTable("Area", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull().unique(),
  classId: integer("classId").notNull(),
  rank: integer("rank").notNull().unique(),
  createdAt: integer("createdAt", { mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updatedAt", { mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date()),
}, (table) => ({
  nameIdx: index("Area_name_idx").on(table.name),
}));

export const reports = sqliteTable("Report", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  date: text("date").notNull(), // YYYY-MM-DD
  text: text("text").notNull(),
  evidence: text("evidence"), // URL to the picture(s) in JSON array format
  comment: text("comment"), // Additional comments from the reporter
  repeated: integer("repeated").notNull().default(0), // How many times this report has been reported again
  areaId: integer("areaId").notNull(),
  createdAt: integer("createdAt", { mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updatedAt", { mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date()),
}, (table) => ({
  textIdx: index("Report_text_idx").on(table.text),
}));

// Relations
export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, {
    fields: [accounts.userId],
    references: [users.id],
  }),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));

export const usersRelations = relations(users, ({ many }) => ({
  accounts: many(accounts),
  sessions: many(sessions),
}));

export const classesRelations = relations(classes, ({ many }) => ({
  areas: many(areas),
}));

export const areasRelations = relations(areas, ({ one, many }) => ({
  class: one(classes, {
    fields: [areas.classId],
    references: [classes.id],
  }),
  reports: many(reports),
}));

export const reportsRelations = relations(reports, ({ one }) => ({
  area: one(areas, {
    fields: [reports.areaId],
    references: [areas.id],
  }),
}));
