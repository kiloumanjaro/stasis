import { readdirSync, readFileSync } from 'node:fs';
import { extname, join, relative } from 'node:path';

type Violation = {
  file: string;
  line: number;
  type: string;
  detail: string;
};

const SRC_DIR = join(process.cwd(), 'src');
const ALLOWED_EXTENSIONS = new Set(['.ts', '.tsx']);

const forbiddenImportChecks = [
  {
    detail: 'Forbidden import: drizzle-orm',
    regex:
      /\b(?:from\s*['"]drizzle-orm['"]|import\s*\(\s*['"]drizzle-orm['"]\s*\)|require\(\s*['"]drizzle-orm['"]\s*\))/,
  },
  {
    detail: 'Forbidden import: drizzle-zod',
    regex:
      /\b(?:from\s*['"]drizzle-zod['"]|import\s*\(\s*['"]drizzle-zod['"]\s*\)|require\(\s*['"]drizzle-zod['"]\s*\))/,
  },
  {
    detail: 'Forbidden import: @/database',
    regex:
      /\b(?:from\s*['"]@\/database(?:\/[^'"]*)?['"]|import\s*\(\s*['"]@\/database(?:\/[^'"]*)?['"]\s*\)|require\(\s*['"]@\/database(?:\/[^'"]*)?['"]\s*\))/,
  },
  {
    detail: 'Forbidden import: postgres',
    regex:
      /\b(?:from\s*['"]postgres['"]|import\s*\(\s*['"]postgres['"]\s*\)|require\(\s*['"]postgres['"]\s*\))/,
  },
  {
    detail: 'Forbidden import: mysql2',
    regex:
      /\b(?:from\s*['"]mysql2['"]|import\s*\(\s*['"]mysql2['"]\s*\)|require\(\s*['"]mysql2['"]\s*\))/,
  },
  {
    detail: 'Forbidden import: better-sqlite3',
    regex:
      /\b(?:from\s*['"]better-sqlite3['"]|import\s*\(\s*['"]better-sqlite3['"]\s*\)|require\(\s*['"]better-sqlite3['"]\s*\))/,
  },
  {
    detail: 'Forbidden import: mongoose',
    regex:
      /\b(?:from\s*['"]mongoose['"]|import\s*\(\s*['"]mongoose['"]\s*\)|require\(\s*['"]mongoose['"]\s*\))/,
  },
  {
    detail: 'Forbidden import: prisma/client',
    regex:
      /\b(?:from\s*['"]@?prisma\/client['"]|import\s*\(\s*['"]@?prisma\/client['"]\s*\)|require\(\s*['"]@?prisma\/client['"]\s*\))/,
  },
  {
    detail: 'Forbidden import: sequelize',
    regex:
      /\b(?:from\s*['"]sequelize['"]|import\s*\(\s*['"]sequelize['"]\s*\)|require\(\s*['"]sequelize['"]\s*\))/,
  },
] as const;

function collectFiles(dir: string): string[] {
  const entries = readdirSync(dir, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);

    if (entry.isDirectory()) {
      files.push(...collectFiles(fullPath));
      continue;
    }

    if (entry.isFile() && ALLOWED_EXTENSIONS.has(extname(entry.name))) {
      files.push(fullPath);
    }
  }

  return files;
}

function scanFile(filePath: string): Violation[] {
  const lines = readFileSync(filePath, 'utf8').split(/\r?\n/);
  const violations: Violation[] = [];

  lines.forEach((line, index) => {
    for (const check of forbiddenImportChecks) {
      if (check.regex.test(line)) {
        violations.push({
          file: relative(process.cwd(), filePath),
          line: index + 1,
          type: 'import',
          detail: check.detail,
        });
      }
    }

    if (/\bprocess\.env\.DATABASE_URL\b/.test(line)) {
      violations.push({
        file: relative(process.cwd(), filePath),
        line: index + 1,
        type: 'env',
        detail: 'Forbidden environment usage: process.env.DATABASE_URL',
      });
    }
  });

  return violations;
}

const violations = collectFiles(SRC_DIR)
  .flatMap(scanFile)
  .sort((a, b) =>
    a.file === b.file ? a.line - b.line : a.file.localeCompare(b.file)
  );

if (violations.length > 0) {
  for (const violation of violations) {
    console.error(
      `${violation.file}:${violation.line} [${violation.type}] ${violation.detail}`
    );
  }

  process.exit(1);
}

console.log('✅ No backend boundary violations found');
