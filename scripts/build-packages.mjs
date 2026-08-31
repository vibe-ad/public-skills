#!/usr/bin/env node

import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, posix, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import JSZip from "jszip";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const DIST = join(ROOT, "dist");
const ARCHIVE_DATE = new Date("1980-01-01T00:00:00.000Z");
const PROVIDERS = {
  openai: ".codex-plugin",
  anthropic: ".claude-plugin",
};

function listFiles(directory) {
  return readdirSync(directory, { withFileTypes: true })
    .sort((left, right) => left.name.localeCompare(right.name))
    .flatMap((entry) => {
      const path = join(directory, entry.name);
      if (entry.isDirectory()) {
        return listFiles(path);
      }
      return entry.isFile() ? [path] : [];
    });
}

function addTree(zip, source, archiveRoot) {
  for (const path of listFiles(source)) {
    const archivePath = posix.join(
      archiveRoot,
      relative(source, path).split("\\").join("/"),
    );
    zip.file(archivePath, readFileSync(path), {
      createFolders: false,
      date: ARCHIVE_DATE,
      unixPermissions: 0o100644,
    });
  }
}

async function build(provider) {
  const archivePath = join(DIST, `vibeco-${provider}.zip`);
  const zip = new JSZip();

  addTree(zip, join(ROOT, "skills"), "skills");
  addTree(zip, join(ROOT, PROVIDERS[provider]), PROVIDERS[provider]);

  for (const filename of ["README.md", "LICENSE"]) {
    const source = join(ROOT, filename);
    if (existsSync(source)) {
      zip.file(filename, readFileSync(source), {
        createFolders: false,
        date: ARCHIVE_DATE,
        unixPermissions: 0o100644,
      });
    }
  }

  rmSync(archivePath, { force: true });
  const contents = await zip.generateAsync({
    type: "nodebuffer",
    compression: "DEFLATE",
    compressionOptions: { level: 9 },
    platform: "UNIX",
    streamFiles: false,
  });
  writeFileSync(archivePath, contents);
  return archivePath;
}

mkdirSync(DIST, { recursive: true });
for (const provider of Object.keys(PROVIDERS)) {
  const archivePath = await build(provider);
  console.log(relative(ROOT, archivePath));
}
