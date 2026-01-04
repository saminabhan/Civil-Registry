import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { execSync } from "child_process";

let buildChecked = false;

export function serveStatic(app: Express) {
  const distPath = path.resolve(__dirname, "public");
  
  // Auto-build if dist doesn't exist (only once to avoid multiple builds)
  if (!buildChecked && !fs.existsSync(distPath)) {
    buildChecked = true;
    console.warn("⚠️  Build directory not found. Attempting to build...");
    try {
      // Get the project root directory
      // __dirname will be dist/ in compiled code, so we go up one level
      // But we should use process.cwd() which is more reliable
      const projectRoot = process.cwd();
      console.log(`Building from: ${projectRoot}`);
      execSync("npm run build", {
        stdio: "inherit",
        cwd: projectRoot,
        env: { ...process.env, NODE_ENV: "production" },
      });
      console.log("✅ Build completed successfully!");
    } catch (error) {
      console.error("❌ Auto-build failed. Please run 'npm run build' manually.");
      throw new Error(
        `Could not find the build directory: ${distPath}, and auto-build failed. Please run 'npm run build' first.`,
      );
    }
  }
  
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  app.use(express.static(distPath));

  // fall through to index.html if the file doesn't exist
  app.use("*", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
