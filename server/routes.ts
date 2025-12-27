
import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import session from "express-session";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import MemoryStore from "memorystore";

const scryptAsync = promisify(scrypt);

// Simple password hashing helpers
async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // === AUTH SETUP ===
  const SessionStore = MemoryStore(session);
  app.use(session({
    secret: process.env.SESSION_SECRET || "civil-registry-secret",
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 86400000 },
    store: new SessionStore({ checkPeriod: 86400000 }),
  }));

  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(new LocalStrategy(async (username, password, done) => {
    try {
      const user = await storage.getUserByUsername(username);
      if (!user || !(await comparePasswords(password, user.password))) {
        return done(null, false, { message: "Invalid credentials" });
      }
      if (!user.isActive) {
        return done(null, false, { message: "Account is inactive" });
      }
      return done(null, user);
    } catch (err) {
      return done(err);
    }
  }));

  passport.serializeUser((user: any, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (err) {
      done(err);
    }
  });

  // === MIDDLEWARE ===
  const requireAuth = (req: any, res: any, next: any) => {
    if (req.isAuthenticated()) return next();
    res.status(401).json({ message: "Unauthorized" });
  };

  const requireAdmin = (req: any, res: any, next: any) => {
    if (req.isAuthenticated() && req.user.isAdmin) return next();
    res.status(403).json({ message: "Forbidden" });
  };

  const logAction = async (userId: number, action: string, details?: string) => {
    try {
      await storage.createAuditLog({ userId, action, details });
    } catch (e) {
      console.error("Failed to audit log:", e);
    }
  };

  // === ROUTES ===

  // Auth
  app.post(api.auth.login.path, passport.authenticate("local"), (req, res) => {
    logAction(req.user!.id, "LOGIN", "User logged in");
    res.json(req.user);
  });

  app.post(api.auth.logout.path, (req, res, next) => {
    if (req.user) logAction(req.user.id, "LOGOUT", "User logged out");
    req.logout((err) => {
      if (err) return next(err);
      res.json({ message: "Logged out" });
    });
  });

  app.get(api.auth.me.path, (req, res) => {
    if (req.isAuthenticated()) res.json(req.user);
    else res.status(401).json({ message: "Not logged in" });
  });

  // Users (Admin Only)
  app.get(api.users.list.path, requireAdmin, async (req, res) => {
    const users = await storage.getAllUsers();
    res.json(users);
  });

  app.post(api.users.create.path, requireAdmin, async (req, res) => {
    try {
      const input = api.users.create.input.parse(req.body);
      const existing = await storage.getUserByUsername(input.username);
      if (existing) return res.status(400).json({ message: "Username exists" });

      const hashedPassword = await hashPassword(input.password);
      const user = await storage.createUser({ ...input, password: hashedPassword });
      
      logAction(req.user!.id, "CREATE_USER", `Created user ${user.username}`);
      res.status(201).json(user);
    } catch (err) {
       if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch(api.users.toggleStatus.path, requireAdmin, async (req, res) => {
    const id = parseInt(req.params.id);
    const { isActive } = req.body;
    const user = await storage.updateUserStatus(id, isActive);
    if (!user) return res.status(404).json({ message: "User not found" });
    
    logAction(req.user!.id, "UPDATE_USER_STATUS", `Set user ${user.username} to ${isActive ? 'active' : 'inactive'}`);
    res.json(user);
  });

  // Citizens
  app.get(api.citizens.search.path, requireAuth, async (req, res) => {
    const params = req.query;
    // Audit search
    const queryDetails = JSON.stringify(params);
    logAction(req.user!.id, "SEARCH", `Searched citizens: ${queryDetails}`);

    const results = await storage.searchCitizens(params);
    res.json(results);
  });

  // Audit Logs
  app.get(api.logs.list.path, requireAdmin, async (req, res) => {
    const logs = await storage.getAuditLogs();
    res.json(logs);
  });

  app.post(api.logs.create.path, requireAuth, async (req, res) => {
    const { action, details } = req.body;
    await logAction(req.user!.id, action, details);
    res.status(201).send();
  });

  // === SEED DATA ===
  await seed();

  return httpServer;
}

async function seed() {
  const admin = await storage.getUserByUsername("admin");
  if (!admin) {
    console.log("Seeding admin user...");
    const hashedPassword = await hashPassword("admin123");
    await storage.createUser({
      username: "admin",
      password: hashedPassword,
      isAdmin: true,
      isActive: true,
    });
  }

  // Seed citizens if empty
  // Hacky check for empty search
  const results = await storage.searchCitizens({ firstName: "a" }); 
  if (results.length === 0) { // Rough check, assume empty if no "a" names (unlikely in prod but ok for dev)
     console.log("Seeding citizens...");
     await storage.createCitizen({
       nationalId: "123456789",
       firstName: "Ahmed",
       fatherName: "Mohamed",
       grandfatherName: "Ali",
       lastName: "Hassan",
       gender: "male",
       address: "Riyadh, Saudi Arabia",
       dob: new Date("1990-01-01")
     });
     await storage.createCitizen({
       nationalId: "987654321",
       firstName: "Sara",
       fatherName: "Khalid",
       grandfatherName: "Abdullah",
       lastName: "Omar",
       gender: "female",
       address: "Jeddah, Saudi Arabia",
       dob: new Date("1995-05-15")
     });
     // Add more dummy data as needed
  }
}
