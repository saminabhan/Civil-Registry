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
  
  // Copy API proxy files and .htaccess from source to dist
  const sourceApiPath = "public/api";
  const sourceHtaccessPath = "public/.htaccess";
  const distApiPath = "dist/public/api";
  const distHtaccessPath = "dist/public/.htaccess";
  
  try {
    // Copy API proxy files
    try {
      const apiStat = await stat(sourceApiPath);
      if (apiStat.isDirectory()) {
        await mkdir(distApiPath, { recursive: true });
        await copyDir(sourceApiPath, distApiPath);
        console.log("Copied API proxy files from source");
      }
    } catch (e) {
      console.warn("API proxy directory not found in source, skipping...");
    }
    
    // Copy .htaccess file
    try {
      const htaccessStat = await stat(sourceHtaccessPath);
      if (htaccessStat.isFile()) {
        await mkdir("dist/public", { recursive: true });
        await copyFile(sourceHtaccessPath, distHtaccessPath);
        console.log("Copied .htaccess file from source");
      }
    } catch (e) {
      console.warn(".htaccess file not found in source, skipping...");
    }
  } catch (e) {
    console.warn("Could not copy API proxy files:", e);
  }
}

buildAll().catch((err) => {
  console.error(err);
  process.exit(1);
});
