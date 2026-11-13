import { cp, mkdir, rm } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const projectRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const outputDirectory = join(projectRoot, "dist");

await rm(outputDirectory, { recursive: true, force: true });
await mkdir(outputDirectory, { recursive: true });
await cp(join(projectRoot, "index.html"), join(outputDirectory, "index.html"));
await cp(join(projectRoot, "public"), outputDirectory, { recursive: true });

console.log(`Built static website in ${outputDirectory}`);
