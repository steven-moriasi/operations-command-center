import { z } from "zod";

const configurationSchema = z
  .object({
    authMode: z.enum(["fixture", "oidc"]).default("fixture"),
    baseUrl: z.url().default("http://localhost:3000"),
    databaseMaxConnections: z.coerce.number().int().min(1).max(50).default(10),
    databaseUrl: z.string().optional(),
    dataMode: z.enum(["fixture", "postgres"]).default("fixture"),
    fixtureTenantId: z.string().min(1).default("astra-demo"),
    oidcAudience: z.string().min(1).optional(),
    oidcClientId: z.string().min(1).optional(),
    oidcIssuer: z.url().optional(),
    sessionSecret: z.string().min(32).optional(),
  })
  .superRefine((configuration, context) => {
    if (
      configuration.dataMode === "postgres" &&
      configuration.databaseUrl === undefined
    ) {
      context.addIssue({
        code: "custom",
        message: "COMMAND_CENTER_DATABASE_URL is required in postgres mode",
        path: ["databaseUrl"],
      });
    }

    if (configuration.authMode === "oidc") {
      for (const key of [
        "oidcAudience",
        "oidcClientId",
        "oidcIssuer",
        "sessionSecret",
      ] as const) {
        if (configuration[key] === undefined) {
          context.addIssue({
            code: "custom",
            message: `${key} is required in OIDC mode`,
            path: [key],
          });
        }
      }
    }
  });

export type CommandCenterConfig = z.infer<typeof configurationSchema>;

export function loadConfig(
  environment: Record<string, string | undefined> = process.env,
): CommandCenterConfig {
  return configurationSchema.parse({
    authMode: environment.COMMAND_CENTER_AUTH_MODE,
    baseUrl: environment.COMMAND_CENTER_BASE_URL,
    databaseMaxConnections:
      environment.COMMAND_CENTER_DATABASE_MAX_CONNECTIONS,
    databaseUrl: environment.COMMAND_CENTER_DATABASE_URL,
    dataMode: environment.COMMAND_CENTER_DATA_MODE,
    fixtureTenantId: environment.COMMAND_CENTER_FIXTURE_TENANT_ID,
    oidcAudience: environment.COMMAND_CENTER_OIDC_AUDIENCE,
    oidcClientId: environment.COMMAND_CENTER_OIDC_CLIENT_ID,
    oidcIssuer: environment.COMMAND_CENTER_OIDC_ISSUER,
    sessionSecret: environment.COMMAND_CENTER_SESSION_SECRET,
  });
}
