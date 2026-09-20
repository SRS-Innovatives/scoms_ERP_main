const { resolveEnabledModulesForInstitution, isRegistryGloballyEnabled } = require('./resolveModules');
const { seedModuleRegistry } = require('./seedModuleRegistry');

module.exports = {
  resolveEnabledModulesForInstitution,
  isRegistryGloballyEnabled,
  seedModuleRegistry,
};
