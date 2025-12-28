
import type { Express } from "express";
import type { Request } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import session from "express-session";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import bcrypt from "bcryptjs";
import MemoryStore from "memorystore";
import type { User as UserSchema } from "@shared/schema";

// Extend Express Request to include user
declare global {
  namespace Express {
    interface User extends UserSchema {}
  }
}

// Password hashing helpers using bcrypt
async function hashPassword(password: string) {
  return await bcrypt.hash(password, 10);
}

async function comparePasswords(supplied: string, stored: string) {
  try {
    if (!stored || !supplied) {
      console.log("comparePasswords: Missing password data", { stored: !!stored, supplied: !!supplied });
      return false;
    }
    
    // Check if stored password is bcrypt format (starts with $2a$, $2b$, or $2y$)
    if (stored.startsWith("$2a$") || stored.startsWith("$2b$") || stored.startsWith("$2y$")) {
      // Use bcrypt for comparison
      const result = await bcrypt.compare(supplied, stored);
      console.log("comparePasswords (bcrypt) result:", result);
      return result;
    }
    
    // Fallback to old scrypt format for backward compatibility
    const [hashed, salt] = stored.split(".");
    if (!hashed || !salt) {
      console.log("comparePasswords: Invalid stored password format", { hasLength: stored.length });
      return false;
    }
    
    // Old scrypt format - we'll migrate users to bcrypt when they login
    // For now, return false to force re-hashing
    console.log("comparePasswords: Old scrypt format detected, migration needed");
    return false;
  } catch (error) {
    console.error("Error comparing passwords:", error);
    return false;
  }
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
    cookie: { 
      maxAge: 86400000,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax"
    },
    store: new SessionStore({ checkPeriod: 86400000 }),
  }));

  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(new LocalStrategy(
    {
      usernameField: 'username',
      passwordField: 'password',
      passReqToCallback: false
    },
    async (username, password, done) => {
      try {
        console.log("=== LocalStrategy called ===");
        console.log("Username received:", username);
        console.log("Password received:", password ? "***" : "MISSING");
        
        const user = await storage.getUserByUsername(username);
        console.log("User lookup result:", user ? {
          id: user.id,
          username: user.username,
          isAdmin: user.isAdmin,
          isActive: user.isActive,
          hasPassword: !!user.password,
          passwordLength: user.password?.length
        } : "NOT FOUND");
        
        if (!user) {
          console.log("User not found:", username);
          return done(null, false, { message: "Invalid credentials" });
        }
        
        if (!user.isActive) {
          console.log("User account is inactive:", username);
          return done(null, false, { message: "Account is inactive" });
        }
        
        console.log("Comparing password...");
        console.log("Stored password format:", user.password?.substring(0, 20) + "...");
        const passwordMatch = await comparePasswords(password, user.password);
        console.log("Password comparison result:", passwordMatch);
        
        if (!passwordMatch) {
          console.log("Password mismatch for user:", username);
          return done(null, false, { message: "Invalid credentials" });
        }
        
        console.log("Login successful for user:", username);
        return done(null, user);
      } catch (err) {
        console.error("Login error in LocalStrategy:", err);
        return done(err);
      }
    }
  ));

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
  app.post(api.auth.login.path, (req, res, next) => {
    console.log("Login request received:", { 
      body: req.body, 
      hasUsername: !!req.body?.username, 
      hasPassword: !!req.body?.password,
      username: req.body?.username
    });
    
    passport.authenticate("local", (err: any, user: any, info: any) => {
      console.log("Passport authenticate result:", { 
        err: err?.message || !!err, 
        hasUser: !!user, 
        userUsername: user?.username,
        info: info?.message,
        userId: user?.id
      });
      
      if (err) {
        console.error("Login error:", err);
        return res.status(500).json({ message: "حدث خطأ أثناء تسجيل الدخول" });
      }
      if (!user) {
        console.log("No user returned from passport. Info:", info);
        // Handle different error messages
        const message = info?.message === "Invalid credentials" 
          ? "اسم المستخدم أو كلمة المرور غير صحيحة"
          : info?.message === "Account is inactive"
          ? "الحساب معطل"
          : "اسم المستخدم أو كلمة المرور غير صحيحة";
        return res.status(401).json({ message });
      }
      req.logIn(user, (err) => {
        if (err) {
          console.error("logIn error:", err);
          return res.status(500).json({ message: "حدث خطأ أثناء تسجيل الدخول" });
        }
        console.log("User logged in successfully:", user.username, "ID:", user.id);
        logAction(user.id, "LOGIN", "User logged in");
        res.json(user);
      });
    })(req, res, next);
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
  try {
    console.log("=== Starting seed process ===");
    const admin = await storage.getUserByUsername("admin");
    if (!admin) {
      console.log("Admin user not found. Seeding admin user...");
      const hashedPassword = await hashPassword("admin123");
      console.log("Hashed password created:", hashedPassword.substring(0, 20) + "...");
      const newAdmin = await storage.createUser({
        username: "admin",
        password: hashedPassword,
        isAdmin: true,
        isActive: true,
      });
      console.log("Admin user created successfully:", {
        id: newAdmin.id,
        username: newAdmin.username,
        isAdmin: newAdmin.isAdmin,
        isActive: newAdmin.isActive
      });
      
      // Verify the password works
      const testPassword = await comparePasswords("admin123", newAdmin.password);
      console.log("Password verification test:", testPassword ? "SUCCESS" : "FAILED");
    } else {
      console.log("Admin user already exists:", {
        id: admin.id,
        username: admin.username,
        isAdmin: admin.isAdmin,
        isActive: admin.isActive,
        hasPassword: !!admin.password
      });
      
      // Test the existing password
      const testPassword = await comparePasswords("admin123", admin.password);
      console.log("Password verification test for existing user:", testPassword ? "SUCCESS" : "FAILED");
    }
    console.log("=== Seed process completed ===");
  } catch (error) {
    console.error("Error seeding admin user:", error);
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
