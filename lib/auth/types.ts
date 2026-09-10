export interface Principal {
  clientId: string;
  displayName: string;
  email: string | null;
  roles: string[];
  scopes: string[];
  subject: string;
  tenantId: string;
}
