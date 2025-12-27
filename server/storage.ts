
import { users, citizens, auditLogs, type User, type InsertUser, type Citizen, type InsertCitizen, type AuditLog, type InsertAuditLog, type SearchCitizenParams } from "@shared/schema";
import { db } from "./db";
import { eq, like, and, desc } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
  updateUserStatus(id: number, isActive: boolean): Promise<User | undefined>;

  // Citizens
  searchCitizens(params: SearchCitizenParams): Promise<Citizen[]>;
  createCitizen(citizen: InsertCitizen): Promise<Citizen>;
  
  // Logs
  createAuditLog(log: InsertAuditLog): Promise<void>;
  getAuditLogs(): Promise<(AuditLog & { username: string | null })[]>;
}

export class DatabaseStorage implements IStorage {
  // Users
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(desc(users.createdAt));
  }

  async updateUserStatus(id: number, isActive: boolean): Promise<User | undefined> {
    const [user] = await db.update(users)
      .set({ isActive })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  // Citizens
  async searchCitizens(params: SearchCitizenParams): Promise<Citizen[]> {
    const conditions = [];

    if (params.nationalId) {
      conditions.push(eq(citizens.nationalId, params.nationalId));
    }
    
    // For names, we use simple LIKE search. In a real app, maybe full text search.
    if (params.firstName) conditions.push(like(citizens.firstName, `%${params.firstName}%`));
    if (params.fatherName) conditions.push(like(citizens.fatherName, `%${params.fatherName}%`));
    if (params.grandfatherName) conditions.push(like(citizens.grandfatherName, `%${params.grandfatherName}%`));
    if (params.lastName) conditions.push(like(citizens.lastName, `%${params.lastName}%`));

    if (conditions.length === 0) return []; // Don't return all citizens on empty search

    return await db.select().from(citizens).where(and(...conditions));
  }

  async createCitizen(insertCitizen: InsertCitizen): Promise<Citizen> {
    const [citizen] = await db.insert(citizens).values(insertCitizen).returning();
    return citizen;
  }

  // Logs
  async createAuditLog(log: InsertAuditLog): Promise<void> {
    await db.insert(auditLogs).values(log);
  }

  async getAuditLogs(): Promise<(AuditLog & { username: string | null })[]> {
    const logs = await db.select({
      id: auditLogs.id,
      userId: auditLogs.userId,
      action: auditLogs.action,
      details: auditLogs.details,
      timestamp: auditLogs.timestamp,
      username: users.username,
    })
    .from(auditLogs)
    .leftJoin(users, eq(auditLogs.userId, users.id))
    .orderBy(desc(auditLogs.timestamp))
    .limit(100); // Limit logs for performance
    
    return logs;
  }
}

export const storage = new DatabaseStorage();
