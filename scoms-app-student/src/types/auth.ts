export interface EnabledModule {
  key: string;
  name: string;
  enabled: boolean;
  permissions?: string[];
}

export interface Institution {
  id: string;
  name: string;
  code: string;
  type: string;
  logo: string | null;
  enabledModules?: EnabledModule[] | string[];
}

export interface StudentSummary {
  id: string;
  firstName: string;
  lastName: string;
  rollNumber: string;
  course?: { name: string } | null;
  section?: { name: string } | null;
}

export interface AuthUser {
  id: string;
  email: string | null;
  mobile: string | null;
  admissionNumber: string | null;
  employeeCode: string | null;
  userCode?: string;
  avatar: string | null;
  role: string;
  status: string;
  institutionId: string | null;
  institutionName?: string | null;
  institution?: Institution;
  student?: StudentSummary | null;
  children?: (StudentSummary & { relation: string })[];
}

export interface LoginResponse {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
  redirectUrl: string;
}

export interface RefreshResponse {
  accessToken: string;
  refreshToken: string;
}
