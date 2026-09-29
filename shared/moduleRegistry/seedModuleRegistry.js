/**
 * Seeds ModuleDefinition (+ an initial "1.0.0" ModuleVersion each) from the existing,
 * still-authoritative MODULE_CATALOG in shared/constants/institutionModules.js.
 *
 * Deliberately does NOT create any InstitutionModuleAssignment rows — running this seed
 * never changes what a single existing institution can see. It only populates the
 * registry itself so it's ready for an institution to be explicitly opted into later
 * (Phase 2+). Fully idempotent: safe to re-run any time, same convention as
 * shared/reportEngine/seedDefaultReports.js.
 *
 * Run directly:  node shared/moduleRegistry/seedModuleRegistry.js
 * Or import:     const { seedModuleRegistry } = require('.../moduleRegistry/seedModuleRegistry');
 */
const prisma = require('../database/client');
const { CORE_MODULE_KEYS, MODULE_CATALOG } = require('../constants/institutionModules');

const seedModuleRegistry = async () => {
  let seeded = 0;

  // Core modules (dashboard, setup, settings) are always-on and never gated by
  // requireModule today — registered here as CORE so the registry has a complete,
  // accurate picture of the platform, not because anything currently checks them.
  for (const key of CORE_MODULE_KEYS) {
    const def = await prisma.moduleDefinition.upsert({
      where: { key },
      update: { name: key.charAt(0).toUpperCase() + key.slice(1), moduleType: 'CORE' },
      create: { key, name: key.charAt(0).toUpperCase() + key.slice(1), moduleType: 'CORE', currentVersion: '1.0.0' },
    });
    await prisma.moduleVersion.upsert({
      where: { moduleId_version: { moduleId: def.id, version: '1.0.0' } },
      update: {},
      create: { moduleId: def.id, version: '1.0.0', changelog: 'Initial registry entry, mirrors existing core behavior.' },
    });
    seeded++;
  }

  for (const m of MODULE_CATALOG) {
    const def = await prisma.moduleDefinition.upsert({
      where: { key: m.key },
      update: { name: m.label, description: m.description, moduleType: 'STANDARD' },
      create: { key: m.key, name: m.label, description: m.description, moduleType: 'STANDARD', currentVersion: '1.0.0' },
    });
    await prisma.moduleVersion.upsert({
      where: { moduleId_version: { moduleId: def.id, version: '1.0.0' } },
      update: {},
      create: { moduleId: def.id, version: '1.0.0', changelog: 'Initial registry entry, mirrors existing MODULE_CATALOG entry.' },
    });
    seeded++;
  }

  return { seeded };
};

module.exports = { seedModuleRegistry };

if (require.main === module) {
  seedModuleRegistry()
    .then((result) => {
      console.log(`✅ Seeded ${result.seeded} module definitions into the registry (no institution assignments created).`);
      process.exit(0);
    })
    .catch((err) => {
      console.error('❌ Failed to seed module registry:', err);
      process.exit(1);
    });
}
