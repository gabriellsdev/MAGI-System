import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Client ES Modules Integrity', () => {
  it('ensures all imports and re-exports in public/ resolve to valid exported symbols', () => {
    const publicDir = path.resolve(process.cwd(), 'public');
    const checkedFiles: string[] = [];

    function checkFile(filePath: string) {
      const content = fs.readFileSync(filePath, 'utf8');
      const importRegex = /(?:import|export)\s+(?:\{([^}]+)\}|\*\s+as\s+\w+|\w+)\s+from\s+['"]([^'"]+)['"]/g;
      let match: RegExpExecArray | null;

      while ((match = importRegex.exec(content)) !== null) {
        const symbols = match[1];
        const importPath = match[2];

        if (importPath.startsWith('.')) {
          const resolved = path.resolve(path.dirname(filePath), importPath);
          expect(fs.existsSync(resolved), `Referenced module file does not exist: ${resolved}`).toBe(true);

          if (symbols) {
            const targetContent = fs.readFileSync(resolved, 'utf8');
            const namedList = symbols.split(',').map(s => s.trim().split(/\s+as\s+/)[0].trim()).filter(Boolean);

            for (const sym of namedList) {
              const exportRegex = new RegExp('export\\s+(?:async\\s+)?(?:const|let|var|function|class)\\s+' + sym + '\\b|export\\s*\\{[^}]*\\b' + sym + '\\b');
              expect(exportRegex.test(targetContent), `Symbol "${sym}" is not exported in ${resolved} (referenced by ${filePath})`).toBe(true);
            }
          }
        }
      }
    }

    function walkDir(dir: string) {
      const files = fs.readdirSync(dir);
      for (const f of files) {
        const full = path.join(dir, f);
        if (fs.statSync(full).isDirectory()) {
          walkDir(full);
        } else if (f.endsWith('.js')) {
          checkedFiles.push(full);
          checkFile(full);
        }
      }
    }

    walkDir(publicDir);
    expect(checkedFiles.length).toBeGreaterThan(10);
  });

  it('ensures index.html does not render anime-view and diagnostic-view simultaneously before JS', () => {
    const indexPath = path.resolve(process.cwd(), 'public', 'index.html');
    const content = fs.readFileSync(indexPath, 'utf8');

    // anime-view must have hidden class by default
    expect(content).toMatch(/<section id="anime-view" class="anime-view-container hidden">/);
  });

  it('loads core state and i18n modules dynamically without ReferenceError or initialization failure', async () => {
    const stateMod = await import('../../public/js/core/state.js');
    expect(stateMod.state).toBeDefined();
    expect(stateMod.state.session).toBeDefined();
    expect(stateMod.isOperatorAuthenticated()).toBe(false);

    const i18nMod = await import('../../public/js/features/i18n/index.js');
    expect(i18nMod.CURATED_MOCK_DILEMMAS.length).toBeGreaterThan(0);
    expect(i18nMod.CURATED_MOCK_CATEGORIES).toBeDefined();
  });
});
