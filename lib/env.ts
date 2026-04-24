import { z } from "zod"

const envSchema = z
  .object({
    SONARR_URL: z.string().url().optional(),
    SONARR_API_KEY: z.string().optional(),
    RADARR_URL: z.string().url().optional(),
    RADARR_API_KEY: z.string().optional(),
    LIDARR_URL: z.string().url().optional(),
    LIDARR_API_KEY: z.string().optional(),
    PROWLARR_URL: z.string().url().optional(),
    PROWLARR_API_KEY: z.string().optional(),
    AUTH_ENABLED: z.coerce.boolean().default(false),
    AUTH_PASSWORD: z.string().min(8).optional(),
  })
  .refine((data) => !data.AUTH_ENABLED || data.AUTH_PASSWORD, {
    message:
      "AUTH_PASSWORD is required (min 8 characters) when AUTH_ENABLED is true",
    path: ["AUTH_PASSWORD"],
  })

export const env = envSchema.parse(process.env)
