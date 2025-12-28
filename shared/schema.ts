import {
  mysqlTable,
  serial,
  text,
  boolean,
  timestamp,
  varchar,
  int,
} from "drizzle-orm/mysql-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

/* ================= USERS ================= */
export const users = mysqlTable("users", {
  id: serial("id").primaryKey(),
  username: varchar("username", { length: 255 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(),
  isAdmin: boolean("is_admin").notNull().default(false),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

/* ================= CITIZENS ================= */
export const citizens = mysqlTable("citizens", {
  id: serial("id").primaryKey(),
  nationalId: varchar("national_id", { length: 20 }).notNull().unique(),
  firstName: varchar("first_name", { length: 100 }).notNull(),
  fatherName: varchar("father_name", { length: 100 }).notNull(),
  grandfatherName: varchar("grandfather_name", { length: 100 }).notNull(),
  lastName: varchar("last_name", { length: 100 }).notNull(),
  motherName: varchar("mother_name", { length: 100 }),
  dob: timestamp("dob"),
  gender: varchar("gender", { length: 10 }), // male / female
  address: text("address"),
});

export const insertCitizenSchema = createInsertSchema(citizens).omit({
  id: true,
});

export type Citizen = typeof citizens.$inferSelect;
export type InsertCitizen = z.infer<typeof insertCitizenSchema>;

export type SearchCitizenParams = {
  nationalId?: string;
  firstName?: string;
  fatherName?: string;
  grandfatherName?: string;
  lastName?: string;
};

/* ================= AUDIT LOGS ================= */
export const auditLogs = mysqlTable("audit_logs", {
  id: serial("id").primaryKey(),
  userId: int("user_id").references(() => users.id),
  action: varchar("action", { length: 50 }).notNull(),
  details: text("details"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertAuditLogSchema = createInsertSchema(auditLogs).omit({
  id: true,
  createdAt: true,
});

export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;
