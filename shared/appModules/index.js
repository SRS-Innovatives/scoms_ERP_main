module.exports = {
  ...require('./catalog'),
  ...require('./resolveAppModules'),
  requireAppModule: require('./requireAppModule'),
};
