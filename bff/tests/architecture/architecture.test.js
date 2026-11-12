/**
 * TESTES UNITÁRIOS DE ARQUITETURA — BFF
 * Mesmas regras do Serviço de Restaurante (ADR 6): Clean Architecture e
 * Vertical Slice verificadas com dependency-cruiser a cada `npm test`.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, existsSync } from 'node:fs';
import { cruise } from 'dependency-cruiser';

const R = 'server/bff';

const rules = [
  {
    name: 'dominio-nao-depende-de-nada',
    comment: 'Clean Architecture: o domínio não pode importar application, infrastructure, api ou shared.',
    from: { path: `^${R}/domain/` },
    to: { path: '^(server|api)/', pathNot: `^${R}/domain/` },
  },
  {
    name: 'dominio-sem-bibliotecas-externas',
    comment: 'Clean Architecture: o domínio não pode depender de frameworks/drivers (ex.: express).',
    from: { path: `^${R}/domain/` },
    to: { dependencyTypes: ['npm', 'npm-dev', 'npm-optional', 'npm-peer', 'npm-unknown', 'core'] },
  },
  {
    name: 'casos-de-uso-nao-dependem-de-infraestrutura',
    comment: 'Dependency Rule: features (aplicação) só conhecem o domínio, nunca a infraestrutura.',
    from: { path: `^${R}/features/` },
    to: { path: `^${R}/infrastructure/` },
  },
  {
    name: 'casos-de-uso-sem-bibliotecas-externas',
    comment: 'Casos de uso não importam drivers (express): recebem portas por injeção.',
    from: { path: `^${R}/features/` },
    to: { dependencyTypes: ['npm', 'npm-dev', 'npm-optional', 'npm-peer', 'npm-unknown'] },
  },
  {
    name: 'fatias-sao-independentes',
    comment: 'Vertical Slice: uma feature não pode importar outra feature.',
    from: { path: `^${R}/features/([^/]+)/` },
    to: { path: `^${R}/features/`, pathNot: `^${R}/features/$1/` },
  },
  {
    name: 'infraestrutura-nao-depende-de-features',
    comment: 'Clean Architecture: a infraestrutura não conhece os casos de uso.',
    from: { path: `^${R}/infrastructure/` },
    to: { path: `^${R}/features/` },
  },
  {
    name: 'somente-composition-root-liga-infraestrutura',
    comment: 'Somente o composition root (e a própria infraestrutura) pode importar a infraestrutura.',
    from: { path: '^(server|api)/', pathNot: `^${R}/(composition\\.js|infrastructure/)` },
    to: { path: `^${R}/infrastructure/` },
  },
  {
    name: 'api-so-conhece-composition-e-shared',
    comment: 'A camada api/ (Express) é apenas adaptador: não acessa domain, features nem infraestrutura.',
    from: { path: '^api/' },
    to: { path: `^${R}/(domain|features|infrastructure)/` },
  },
  {
    name: 'shared-nao-depende-de-features-nem-infra',
    comment: 'O kernel compartilhado não pode depender de fatias nem de infraestrutura.',
    from: { path: '^server/shared/' },
    to: { path: `^${R}/(features|infrastructure)/` },
  },
  {
    name: 'sem-dependencias-circulares',
    comment: 'Não são permitidos ciclos de dependência.',
    from: {},
    to: { circular: true },
  },
].map((r) => ({ severity: 'error', ...r }));

const result = await cruise(['server', 'api'], {
  validate: true,
  ruleSet: { forbidden: rules },
  doNotFollow: { path: 'node_modules' },
});
const violations = result.output.summary.violations;

for (const rule of rules) {
  test(`Arquitetura: ${rule.name}`, () => {
    const broken = violations.filter((v) => v.rule.name === rule.name).map((v) => `${v.from} -> ${v.to}`);
    assert.deepEqual(broken, [], `${rule.comment}\nViolações:\n${broken.join('\n')}`);
  });
}

test('Arquitetura: estrutura Vertical Slice (cada fatia tem caso de uso e handler)', () => {
  const base = `${R}/features`;
  const features = readdirSync(base, { withFileTypes: true }).filter((d) => d.isDirectory());
  assert.ok(features.length >= 5, 'Esperadas as fatias de agregação, proxies, criar e simular pedido.');
  for (const f of features) {
    const files = readdirSync(`${base}/${f.name}`);
    assert.ok(existsSync(`${base}/${f.name}/handler.js`), `Fatia ${f.name} sem handler.js`);
    assert.ok(files.some((n) => /^[A-Z]\w+\.js$/.test(n)), `Fatia ${f.name} sem caso de uso`);
  }
});
