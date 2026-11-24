/** Mirrors shared/appModules/resolveAppModules.js — GET /app-modules on the mobile gateway. */
export type AppModuleReason =
  | 'NOT_FOR_ROLE'
  | 'INSTITUTION_MODULE_DISABLED'
  | 'HIDDEN_BY_SUPER_ADMIN'
  | 'NO_INSTITUTION'
  | null;

export interface AppModule {
  key: string;
  label: string;
  group: string;
  visible: boolean;
  reason: AppModuleReason;
}

export interface AppModulesResponse {
  app: string;
  role: string;
  modules: AppModule[];
}
