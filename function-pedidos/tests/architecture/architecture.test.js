/**
 * TESTES DE ARQUITETURA — Function (mesmas regras dos microserviços, ADR 6).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, existsSync } from 'node:fs';
import { cruise } from 'dependency-cruiser';

const L = 'lib';
const rules = [
  { name: 'dominio-nao-depende-de-nada', from: { path: `^${L}/domain/` }, to: { path: '^(lib|api)/', pathNot: `^${L}/domain/` } },
  { name: 'dominio-sem-bibliotecas-externas', from: { path: `^${L}/domain/` }, to: { dependencyTypes: ['npm', 'npm-dev', 'npm-unknown', 'core'] } },
  { name: 'casos-de-uso-nao-dependem-de-infraestrutura', from: { path: `^${L}/features/` }, to: { path: `^${L}/infrastructure/` } },
  { name: 'fatias-sao-independentes', from: { path: `^${L}/features/([^/]+)/` }, to: { path: `^${L}/features/`, pathNot: `^${L}/features/$1/` } },
  { name: 'infraestrutura-nao-depende-de-features', from: { path: `^${L}/infrastructure/` }, to: { path: `^${L}/features/` } },
  {
    name: 'somente-composition-root-liga-infraestrutura',
    from: { path: '^(lib|api)/', pathNot: `^${L}/(composition\\.js|infrastructure/)` },
    to: { path: `^${L}/infrastructure/` },
  },
  { name: 'api-so-conhece-composition-e-shared', from: { path: '^api/' }, to: { path: `^${L}/(domain|features|infrastructure)/` } },
  { name: 'sem-dependencias-circulares', from: {}, to: { circular: true } },
].map((r) => ({ severity: 'error', ...r }));

const result = await cruise(['lib', 'api'], { validate: true, ruleSet: { forbidden: rules }, doNotFollow: { path: 'node_modules' } });
const violations = result.output.summary.violations;

for (const rule of rules) {
  test(`Arquitetura: ${rule.name}`, () => {
    const broken = violations.filter((v) => v.rule.name === rule.name).map((v) => `${v.from} -> ${v.to}`);
    assert.deepEqual(broken, [], broken.join('\n'));
  });
}

test('Arquitetura: cada fatia tem caso de uso e handler', () => {
  const base = `${L}/features`;
  for (const f of readdirSync(base, { withFileTypes: true }).filter((d) => d.isDirectory())) {
    assert.ok(existsSync(`${base}/${f.name}/handler.js`), `Fatia ${f.name} sem handler.js`);
  }
});
