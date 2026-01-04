import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { execSync } from "child_process";

let buildChecked = false;

export function serveStatic(app: Express) {
  // Try multiple possible paths for dist/public
  // In compiled code, __dirname will be the directory where dist/index.cjs is located
  const possiblePaths = [
    path.resolve(__dirname, "public"), // Standard case: dist/public
    path.resolve(process.cwd(), "dist", "public"), // Fallback: from project root
    path.resolve(__dirname, "..", "public"), // Alternative structure
  ];

  let distPath: string | null = null;
  
  // Find the first existing path
  for (const possiblePath of possiblePaths) {
    if (fs.existsSync(possiblePath) && fs.existsSync(path.resolve(possiblePath, "index.html"))) {
      distPath = possiblePath;
      break;
    }
  }

  // If no dist found, try to build (only once)
  if (!distPath && !buildChecked) {
    buildChecked = true;
    console.warn("⚠️  Build directory not found. Attempting to build...");
    try {
      const projectRoot = process.cwd();
      console.log(`Building from: ${projectRoot}`);
      execSync("npm run build", {
        stdio: "inherit",
        cwd: projectRoot,
        env: { ...process.env, NODE_ENV: "production" },
      });
      console.log("✅ Build completed successfully!");
      
      // Try to find dist again after build
      for (const possiblePath of possiblePaths) {
        if (fs.existsSync(possiblePath) && fs.existsSync(path.resolve(possiblePath, "index.html"))) {
          distPath = possiblePath;
          break;
        }
      }
    } catch (error) {
      console.error("❌ Auto-build failed. Please run 'npm run build' manually.");
      throw new Error(
        `Could not find the build directory and auto-build failed. Please run 'npm run build' first.`,
      );
    }
  }
  
  if (!distPath || !fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory (dist/public). Please run 'npm run build' first.`,
    );
  }

  app.use(express.static(distPath));

  // fall through to index.html if the file doesn't exist
  app.use("*", (_req, res) => {
    res.sendFile(path.resolve(distPath!, "index.html"));
  });
}
