import { build as esbuild } from "esbuild";
import { build as viteBuild } from "vite";
import { rm, readFile, mkdir, copyFile, readdir, stat } from "fs/promises";
import { join } from "path";

// server deps to bundle to reduce openat(2) syscalls
// which helps cold start times
const allowlist = [
  "@google/generative-ai",
  "axios",
  "connect-pg-simple",
  "cors",
  "date-fns",
  "drizzle-orm",
  "drizzle-zod",
  "express",
  "express-rate-limit",
  "express-session",
  "jsonwebtoken",
  "memorystore",
  "multer",
  "nanoid",
  "nodemailer",
  "openai",
  "passport",
  "passport-local",
  "pg",
  "stripe",
  "uuid",
  "ws",
  "xlsx",
  "zod",
  "zod-validation-error",
];

// Helper function to copy directory recursively
async function copyDir(src: string, dest: string) {
  await mkdir(dest, { recursive: true });
  const entries = await readdir(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = join(src, entry.name);
    const destPath = join(dest, entry.name);
    if (entry.isDirectory()) {
      await copyDir(srcPath, destPath);
    } else {
      await copyFile(srcPath, destPath);
    }
  }
}

async function buildAll() {
  // Save API proxy files before deleting dist
  const apiProxyPath = "dist/public/api";
  const htaccessPath = "dist/public/.htaccess";
  const tempDir = ".build-temp";
  
  let savedApiFiles = false;
  let savedHtaccess = false;
  
  try {
    // Check if API proxy exists and save it
    try {
      const apiStat = await stat(apiProxyPath);
      if (apiStat.isDirectory()) {
        await mkdir(tempDir, { recursive: true });
        await copyDir(apiProxyPath, join(tempDir, "api"));
        savedApiFiles = true;
        console.log("Saved API proxy files (including test-path.php)");
      }
    } catch (e) {
      // API proxy doesn't exist, skip
    }
    
    // Check if .htaccess exists and save it
    try {
      const htaccessStat = await stat(htaccessPath);
      if (htaccessStat.isFile()) {
        if (!savedApiFiles) {
          await mkdir(tempDir, { recursive: true });
        }
        await copyFile(htaccessPath, join(tempDir, ".htaccess"));
        savedHtaccess = true;
        console.log("Saved .htaccess file");
      }
    } catch (e) {
      // .htaccess doesn't exist, skip
    }
  } catch (e) {
    console.warn("Could not save API proxy files:", e);
  }
  
  await rm("dist", { recursive: true, force: true });

  console.log("building client...");
  await viteBuild();

  console.log("building server...");
  const pkg = JSON.parse(await readFile("package.json", "utf-8"));
  const allDeps = [
    ...Object.keys(pkg.dependencies || {}),
    ...Object.keys(pkg.devDependencies || {}),
  ];
  const externals = allDeps.filter((dep) => !allowlist.includes(dep));

  await esbuild({
    entryPoints: ["server/index.ts"],
    platform: "node",
    bundle: true,
    format: "cjs",
    outfile: "dist/index.cjs",
    define: {
      "process.env.NODE_ENV": '"production"',
    },
    minify: true,
    external: externals,
    logLevel: "info",
  });
  
  // Restore API proxy files after build
  if (savedApiFiles || savedHtaccess) {
    try {
      await mkdir("dist/public", { recursive: true });
      
      if (savedApiFiles) {
        await copyDir(join(tempDir, "api"), apiProxyPath);
        console.log("Restored API proxy files");
      }
      
      if (savedHtaccess) {
        await copyFile(join(tempDir, ".htaccess"), htaccessPath);
        console.log("Restored .htaccess file");
      }
      
      // Clean up temp directory
      await rm(tempDir, { recursive: true, force: true });
    } catch (e) {
      console.warn("Could not restore API proxy files:", e);
    }
  }
}

buildAll().catch((err) => {
  console.error(err);
  process.exit(1);
});
