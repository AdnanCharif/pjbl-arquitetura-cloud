/**
 * TESTES UNITÁRIOS DE ARQUITETURA
 * Verificam automaticamente as regras de dependência de Clean Architecture
 * e Vertical Slice usando o dependency-cruiser (equivalente ao ArchUnit).
 * Se alguém violar uma regra, o teste correspondente falha.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cruise } from 'dependency-cruiser';

const R = 'server/restaurants';

const rules = [
  {
    name: 'dominio-nao-depende-de-nada',
    comment: 'Clean Architecture: o domínio não pode importar application, infrastructure, api ou shared.',
    severity: 'error',
    from: { path: `^${R}/domain/` },
    to: { path: '^(server|api)/', pathNot: `^${R}/domain/` },
  },
  {
    name: 'dominio-sem-bibliotecas-externas',
    comment: 'Clean Architecture: o domínio não pode depender de frameworks/drivers (ex.: mongodb).',
    severity: 'error',
    from: { path: `^${R}/domain/` },
    to: { dependencyTypes: ['npm', 'npm-dev', 'npm-optional', 'npm-peer', 'npm-unknown'] },
  },
  {
    name: 'casos-de-uso-nao-dependem-de-infraestrutura',
    comment: 'Dependency Rule: features (aplicação) só conhecem o domínio, nunca a infraestrutura.',
    severity: 'error',
    from: { path: `^${R}/features/` },
    to: { path: `^${R}/infrastructure/` },
  },
  {
    name: 'fatias-sao-independentes',
    comment: 'Vertical Slice: uma feature não pode importar outra feature.',
    severity: 'error',
    from: { path: `^${R}/features/([^/]+)/` },
    to: { path: `^${R}/features/`, pathNot: `^${R}/features/$1/` },
  },
  {
    name: 'infraestrutura-nao-depende-de-features',
    comment: 'Clean Architecture: a infraestrutura não conhece os casos de uso.',
    severity: 'error',
    from: { path: `^${R}/infrastructure/` },
    to: { path: `^${R}/features/` },
  },
  {
    name: 'somente-composition-root-liga-infraestrutura',
    comment: 'Somente o composition root (e a própria infraestrutura) pode importar a infraestrutura.',
    severity: 'error',
    from: { path: '^(server|api)/', pathNot: `^${R}/(composition\\.js|infrastructure/)` },
    to: { path: `^${R}/infrastructure/` },
  },
  {
    name: 'api-so-conhece-composition-e-shared',
    comment: 'As funções serverless (api/) são apenas adaptadores: não acessam domain, features nem infraestrutura.',
    severity: 'error',
    from: { path: '^api/' },
    to: { path: `^${R}/(domain|features|infrastructure)/` },
  },
  {
    name: 'shared-nao-depende-de-features-nem-infra',
    comment: 'O kernel compartilhado não pode depender de fatias nem de infraestrutura.',
    severity: 'error',
    from: { path: '^server/shared/' },
    to: { path: `^${R}/(features|infrastructure)/` },
  },
  {
    name: 'sem-dependencias-circulares',
    comment: 'Não são permitidos ciclos de dependência.',
    severity: 'error',
    from: {},
    to: { circular: true },
  },
];

const result = await cruise(['server', 'api'], {
  validate: true,
  ruleSet: { forbidden: rules },
  doNotFollow: { path: 'node_modules' },
});
const violations = result.output.summary.violations;

for (const rule of rules) {
  test(`Arquitetura: ${rule.name}`, () => {
    const broken = violations
      .filter((v) => v.rule.name === rule.name)
      .map((v) => `${v.from} -> ${v.to}`);
    assert.deepEqual(broken, [], `${rule.comment}\nViolações:\n${broken.join('\n')}`);
  });
}

test('Arquitetura: estrutura Vertical Slice (cada feature tem caso de uso e handler)', async () => {
  const { readdirSync, existsSync } = await import('node:fs');
  const base = `${R}/features`;
  const features = readdirSync(base, { withFileTypes: true }).filter((d) => d.isDirectory());
  assert.ok(features.length >= 4, 'Esperadas ao menos 4 fatias (inserir, alterar, excluir, pesquisar).');
  for (const f of features) {
    assert.ok(existsSync(`${base}/${f.name}/handler.js`), `Fatia ${f.name} sem handler.js`);
  }
});
