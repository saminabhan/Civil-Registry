import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const distPath = path.resolve(process.cwd(), "dist");
const distPublicPath = path.resolve(distPath, "public");
const distIndexPath = path.resolve(distPath, "index.cjs");

// Check if dist directory exists and has required files
function needsBuild(): boolean {
  try {
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

    // Check if dist/public/assets exists and has files
    const assetsPath = path.resolve(distPublicPath, "assets");
    if (!fs.existsSync(assetsPath)) {
      return true;
    }

    return false;
  } catch (error) {
    // If any error occurs, assume we need to build
    console.warn("Error checking build directory:", error);
    return true;
  }
}

function ensureBuild() {
  if (needsBuild()) {
    console.log("⚠️  Build directory not found or incomplete. Building project...");
    console.log("   This may take a few moments...\n");
    
    try {
      // Run the build script
      execSync("npm run build", {
        stdio: "inherit",
        cwd: process.cwd(),
        env: { ...process.env, NODE_ENV: "production" },
      });
      console.log("\n✅ Build completed successfully!\n");
    } catch (error) {
      console.error("\n❌ Build failed:", error);
      // Don't exit in postinstall to avoid breaking npm install
      if (process.env.npm_lifecycle_event !== "postinstall") {
        process.exit(1);
      } else {
        console.warn("⚠️  Build failed during postinstall, but continuing...");
        console.warn("   You may need to run 'npm run build' manually.");
      }
    }
  } else {
    console.log("✅ Build directory found, skipping build.");
  }
}

// Always run ensureBuild when script is executed
ensureBuild();

// Also export for potential programmatic use
export { ensureBuild, needsBuild };

