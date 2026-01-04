import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const distPath = path.resolve(process.cwd(), "dist");
const distPublicPath = path.resolve(distPath, "public");
const distIndexPath = path.resolve(distPath, "index.cjs");

// Check if dist directory exists and has required files
function needsBuild(): boolean {
  // Check if dist directory exists
  if (!fs.existsSync(distPath)) {
    return true;
  }

  // Check if dist/public exists (client build)
  if (!fs.existsSync(distPublicPath)) {
    return true;
  }

  // Check if dist/index.cjs exists (server build)
  if (!fs.existsSync(distIndexPath)) {
    return true;
  }

  // Check if dist/public/index.html exists
  const indexHtmlPath = path.resolve(distPublicPath, "index.html");
  if (!fs.existsSync(indexHtmlPath)) {
    return true;
  }

  return false;
}

async function ensureBuild() {
  if (needsBuild()) {
    console.log("⚠️  Build directory not found or incomplete. Building project...");
    console.log("   This may take a few moments...\n");
    
    try {
      // Run the build script
      execSync("npm run build", {
        stdio: "inherit",
        cwd: process.cwd(),
      });
      console.log("\n✅ Build completed successfully!\n");
    } catch (error) {
      console.error("\n❌ Build failed:", error);
      process.exit(1);
    }
  } else {
    console.log("✅ Build directory found, skipping build.");
  }
}

ensureBuild();

