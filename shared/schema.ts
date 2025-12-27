
import { pgTable, text, serial, boolean, timestamp, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// === USERS ===
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  isAdmin: boolean("is_admin").default(false),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

// === CITIZENS (CIVIL REGISTRY) ===
export const citizens = pgTable("citizens", {
  id: serial("id").primaryKey(),
  nationalId: varchar("national_id", { length: 20 }).notNull().unique(),
  firstName: text("first_name").notNull(),
  fatherName: text("father_name").notNull(),
  grandfatherName: text("grandfather_name").notNull(),
  lastName: text("last_name").notNull(),
  motherName: text("mother_name"),
  dob: timestamp("dob"),
  gender: text("gender"), // 'male', 'female'
  address: text("address"),
});

export const insertCitizenSchema = createInsertSchema(citizens).omit({ id: true });
export type Citizen = typeof citizens.$inferSelect;
export type InsertCitizen = z.infer<typeof insertCitizenSchema>;

// === AUDIT LOGS ===
export const auditLogs = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  action: text("action").notNull(), // 'LOGIN', 'SEARCH', 'VIEW', 'NAVIGATE'
  details: text("details"),
  timestamp: timestamp("timestamp").defaultNow(),
});

export const insertAuditLogSchema = createInsertSchema(auditLogs).omit({ id: true, timestamp: true });
export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;

// === API TYPES ===
export type LoginRequest = { username: string; password: string };
export type LoginResponse = { user: User; token?: string };

export type SearchCitizenParams = {
  nationalId?: string;
  firstName?: string;
  fatherName?: string;
  grandfatherName?: string;
  lastName?: string;
};

// Relation helpers (if needed in future)
import { integer } from "drizzle-orm/pg-core";
