#!/usr/bin/env node
/**
 * Interactive scaffolding for a new project created from this template.
 *
 * Usage: npm run init
 *
 * Renames the project, sets a package scope and display name, optionally
 * removes the example feature, and optionally resets git history.
 */
import { createInterface } from 'node:readline';
import { stdin as input, stdout as output } from 'node:process';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const ORIGINAL_SCOPE = '@repo';
const SKIP_DIRS = new Set([
  'node_modules',
  '.git',
  'dist',
  'coverage',
  '.turbo',
]);
const TEXT_EXTENSIONS = new Set([
  '.json',
  '.ts',
  '.tsx',
  '.js',
  '.mjs',
  '.md',
  '.graphql',
  '.yml',
  '.yaml',
  '.html',
  '.css',
  '.example',
]);

const questions = [
  {
    key: 'projectName',
    text: 'Project name (kebab-case)',
    fallback: 'my-app',
  },
  {
    key: 'scopeName',
    text: 'Package scope (without @)',
    fallback: 'repo',
  },
  {
    key: 'appName',
    text: 'Display name',
    fallback: null,
  },
  {
    key: 'locale',
    text: 'Default locale (en/km)',
    fallback: 'en',
  },
  {
    key: 'keepExample',
    text: 'Keep the pokemon example feature? [Y/n]',
    fallback: 'y',
  },
  {
    key: 'resetGit',
    text: 'Reset git history? [y/N]',
    fallback: 'n',
  },
];

async function collectAnswers() {
  const rl = createInterface({ input, output });
  const answers = {};
  let index = 0;

  const promptFor = (question, fallback) =>
    `${question}${fallback ? ` (${fallback})` : ''}: `;

  output.write('\nScaffold a new project from ts-fullstack-template\n\n');
  output.write(promptFor(questions[0].text, questions[0].fallback));

  for await (const line of rl) {
    const question = questions[index];
    const fallback = index === 2 ? answers.projectName : question.fallback;
    answers[question.key] = line.trim() || fallback || '';
    index += 1;
    if (index >= questions.length) break;
    output.write(promptFor(questions[index].text, index === 2 ? answers.projectName : questions[index].fallback));
  }

  rl.close();

  answers.appName = answers.appName || answers.projectName;
  answers.keepExample = /^y(es)?$/i.test(answers.keepExample ?? 'y');
  answers.resetGit = /^y(es)?$/i.test(answers.resetGit ?? 'n');
  return answers;
}

async function* walk(dir) {
  for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.') && entry.name !== '.github') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue;
      yield* walk(full);
    } else if (entry.isFile()) {
      yield full;
    }
  }
}

async function replaceAllInFile(file, from, to) {
  const contents = await fs.readFile(file, 'utf8');
  if (!contents.includes(from)) return false;
  await fs.writeFile(file, contents.split(from).join(to));
  return true;
}

async function replaceInTree(from, to) {
  for await (const file of walk(root)) {
    if (!TEXT_EXTENSIONS.has(path.extname(file))) continue;
    await replaceAllInFile(file, from, to);
  }
}

async function removeLines(file, predicate) {
  const contents = await fs.readFile(file, 'utf8');
  const next = contents
    .split('\n')
    .filter((line) => !predicate(line))
    .join('\n');
  if (next !== contents) await fs.writeFile(file, next);
}

async function rm(relativePath) {
  await fs.rm(path.join(root, relativePath), { recursive: true, force: true });
}

async function stripExample() {
  const deletions = [
    'apps/server/src/domain/pokemon',
    'apps/server/src/modules/pokemon',
    'apps/server/test/unit/domain/pokemon',
    'apps/server/test/unit/modules/pokemon',
    'apps/server/scripts/e2e-pokemon.ts',
    'apps/client/src/components/organisms/pokemon',
    'apps/client/src/routes/_authenticated/pokemon.tsx',
    'apps/client/test/components/organisms/pokemon',
    'apps/client/src/lib/pokemon-api.ts',
    'packages/contracts/src/pokemon.ts',
  ];
  for (const target of deletions) await rm(target);

  const edits = [
    ['apps/server/src/app.module.ts', "import { PokemonModule } from './modules/pokemon/pokemon.module.ts';\n", ''],
    ['apps/server/src/app.module.ts', '    PokemonModule,\n', ''],
    ['packages/contracts/src/index.ts', "export * from './pokemon.ts';\n", ''],
    ['apps/client/src/components/organisms/index.ts', "export * from './pokemon';\n", ''],
    ['apps/server/package.json', ',\n    "test:e2e:pokemon": "tsx --env-file=.env scripts/e2e-pokemon.ts"', ''],
    ['apps/client/src/routes/_authenticated/index.tsx', ' to="/pokemon"', ' to="/"'],
    [
      'apps/client/src/routes/_authenticated/index.tsx',
      "import { createFileRoute, Link } from '@tanstack/react-router';",
      "import { createFileRoute } from '@tanstack/react-router';",
    ],
  ];
  for (const [file, from, to] of edits) {
    await replaceAllInFile(path.join(root, file), from, to);
  }

  // RBAC test: drop the example resource assertions.
  const rbacSpec = path.join(root, 'apps/server/test/unit/auth/rbac.spec.ts');
  await replaceAllInFile(
    rbacSpec,
    "  it('both roles allow pokemon:read', () => {\n    expect(roles.admin.authorize({ pokemon: ['read'] })).toEqual({\n      success: true,\n    });\n    expect(roles.user.authorize({ pokemon: ['read'] })).toEqual({\n      success: true,\n    });\n  });\n",
    '',
  );
  await replaceAllInFile(
    rbacSpec,
    "    expect(permissions).toContain('pokemon:read');\n",
    '',
  );
  await replaceAllInFile(
    rbacSpec,
    "  it('grants the user role read access to the example resource', () => {\n    expect(permissionsForRoles('user')).toEqual(['pokemon:read']);\n  });",
    "  it('grants the user role no permissions by default', () => {\n    expect(permissionsForRoles('user')).toEqual([]);\n  });",
  );

  // Remove pokemon entries from the contracts test.
  const contractsTest = path.join(root, 'packages/contracts/test/contracts.spec.ts');
  const testContents = await fs.readFile(contractsTest, 'utf8');
  const marker = "describe('pokemon contract'";
  const markerIndex = testContents.indexOf(marker);
  if (markerIndex !== -1) {
    await fs.writeFile(
      contractsTest,
      testContents.slice(0, markerIndex).trimEnd() + '\n',
    );
  }
  await removeLines(
    contractsTest,
    (line) => line.includes('pokemonSchema') || line.includes('pokemonListInputSchema'),
  );

  // Coverage allowlist and RBAC.
  await removeLines(
    path.join(root, 'apps/server/vitest.config.ts'),
    (line) => line.includes('pokemon'),
  );
  await removeLines(
    path.join(root, 'apps/server/src/auth/rbac.ts'),
    (line) => line.includes("pokemon: ['read'],"),
  );
  await replaceAllInFile(
    path.join(root, 'apps/server/src/auth/rbac.ts'),
    'user: ac.newRole({\n  }),',
    'user: ac.newRole({}),',
  );

  // Environment variable.
  await removeLines(
    path.join(root, '.env.example'),
    (line) => line.includes('POKEAPI_BASE_URL'),
  );

  // CI no longer runs the example e2e job.
  await removeLines(
    path.join(root, '.github/workflows/ci.yml'),
    (line) =>
      line.includes('test:e2e:pokemon') || line.includes('POKEAPI_BASE_URL'),
  );

  // Client dashboard: drop the example card contents.
  const dashboard = path.join(
    root,
    'apps/client/src/routes/_authenticated/index.tsx',
  );
  const dashboardContents = await fs.readFile(dashboard, 'utf8');
  const cardStart = dashboardContents.indexOf('        <div className="mt-6');
  const cardEnd = dashboardContents.indexOf('        </div>\n      </main>');
  if (cardStart !== -1 && cardEnd !== -1) {
    await fs.writeFile(
      dashboard,
      dashboardContents.slice(0, cardStart) +
        dashboardContents.slice(cardEnd + '        </div>\n'.length),
    );
  }

  // Sidebar example group.
  const sidebar = path.join(
    root,
    'apps/client/src/components/organisms/sidebar/data.ts',
  );
  const sidebarContents = await fs.readFile(sidebar, 'utf8');
  await fs.writeFile(
    sidebar,
    sidebarContents.replace(
      /\n    \{\n      title: dict\.nav\.groups\.resources,[\s\S]*?\n    \},/,
      '',
    ),
  );

  // README phrasing.
  await replaceAllInFile(
    path.join(root, 'README.md'),
    'The template ships one complete vertical slice — a PokéAPI-backed `pokemon`\nexample — that exercises the shared contracts, the GraphQL API, the Effect\nservice boundary, and the client data layer end to end. Remove it once you have\nyour own feature, or run `npm run init` to scaffold a new project.',
    'Add your first feature by following the vertical-slice pattern described in\ndocs/getting-started.md.',
  );
}

async function main() {
  const answers = await collectAnswers();
  const { projectName, appName, resetGit, keepExample } = answers;
  const scope = `@${answers.scopeName.replace(/^@/, '')}`;
  const locale = answers.locale === 'km' ? 'km' : 'en';

  console.log('\nApplying changes…');

  await replaceInTree(ORIGINAL_SCOPE + '/', scope + '/');

  for (const file of [
    'package.json',
    'apps/client/package.json',
    'apps/server/package.json',
    'packages/contracts/package.json',
  ]) {
    await replaceAllInFile(
      path.join(root, file),
      '"name": "ts-fullstack-template"',
      `"name": "${projectName}"`,
    );
  }

  await replaceAllInFile(
    path.join(root, 'apps/client/index.html'),
    '<title>Fullstack Template</title>',
    `<title>${appName}</title>`,
  );
  await replaceAllInFile(
    path.join(root, 'apps/server/src/auth-options.ts'),
    "env.appName || 'Fullstack Template'",
    `env.appName || '${appName}'`,
  );
  await replaceAllInFile(
    path.join(root, '.env.example'),
    'APP_NAME=Fullstack Template',
    `APP_NAME=${appName}`,
  );
  await replaceAllInFile(
    path.join(root, 'apps/client/src/i18n/locales/en.ts'),
    "productName: 'Fullstack Template'",
    `productName: '${appName}'`,
  );
  await replaceAllInFile(
    path.join(root, 'apps/client/src/i18n/locales/en.ts'),
    "systemTagline: 'Fullstack Template'",
    `systemTagline: '${appName}'`,
  );
  await replaceAllInFile(
    path.join(root, 'README.md'),
    '# Fullstack TypeScript Template',
    `# ${appName}`,
  );

  if (locale !== 'en') {
    await replaceInTree("lang: SupportedLanguage = 'en'", `lang: SupportedLanguage = '${locale}'`);
    await replaceInTree("language: SidebarLanguage = 'en'", `language: SidebarLanguage = '${locale}'`);
    await replaceInTree("useState<SupportedLanguage>('en')", `useState<SupportedLanguage>('${locale}')`);
    await replaceInTree('useState<SupportedLanguage>("en")', `useState<SupportedLanguage>("${locale}")`);
    await replaceInTree("language = 'en'", `language = '${locale}'`);
    await replaceInTree('language = "en"', `language = "${locale}"`);
  }

  if (!keepExample) {
    console.log('Removing the example feature…');
    await stripExample();
  }

  if (resetGit) {
    console.log('Resetting git history…');
    try {
      await fs.rm(path.join(root, '.git'), { recursive: true, force: true });
      execFileSync('git', ['init'], { cwd: root, stdio: 'inherit' });
    } catch (error) {
      console.warn('Could not reset git history:', error.message);
    }
  }

  console.log('\nDone.');
  console.log('Note: the TanStack Router route tree regenerates on the next dev/build.');
  console.log('Next steps:');
  console.log('  1. npm install');
  console.log('  2. cp .env.example .env  (set BETTER_AUTH_SECRET and ADMIN_*)');
  console.log('  3. npm run db:migrate && npm run seed:admin');
  console.log('  4. npm run dev\n');
}

main().catch((error) => {
  console.error('\ninit failed:', error);
  process.exit(1);
});
