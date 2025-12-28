
import { z } from 'zod';
import { insertUserSchema, insertCitizenSchema, insertAuditLogSchema, users, citizens, auditLogs, type InsertCitizen } from './schema';

// Shared error schemas
export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  unauthorized: z.object({
    message: z.string(),
  }),
};

export const api = {
  auth: {
    login: {
      method: 'POST' as const,
      path: '/api/auth/login',
      input: z.object({
        username: z.string(),
        password: z.string(),
      }),
      responses: {
        200: z.custom<typeof users.$inferSelect>(),
        401: errorSchemas.unauthorized,
      },
    },
    logout: {
      method: 'POST' as const,
      path: '/api/auth/logout',
      responses: {
        200: z.object({ message: z.string() }),
      },
    },
    me: {
      method: 'GET' as const,
      path: '/api/auth/me',
      responses: {
        200: z.custom<typeof users.$inferSelect>(),
        401: errorSchemas.unauthorized,
      },
    },
  },
  users: {
    list: {
      method: 'GET' as const,
      path: '/api/users',
      responses: {
        200: z.array(z.custom<typeof users.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/users',
      input: insertUserSchema,
      responses: {
        201: z.custom<typeof users.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    toggleStatus: {
      method: 'PATCH' as const,
      path: '/api/users/:id/status',
      input: z.object({ isActive: z.boolean() }),
      responses: {
        200: z.custom<typeof users.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
  },
  citizens: {
    search: {
      method: 'GET' as const,
      path: '/api/citizens/search',
      input: z.object({
        nationalId: z.string().optional(),
        firstName: z.string().optional(),
        fatherName: z.string().optional(),
        grandfatherName: z.string().optional(),
        lastName: z.string().optional(),
      }).optional(),
      responses: {
        200: z.array(z.custom<typeof citizens.$inferSelect>()),
      },
    },
    create: { // For seeding or admin use
      method: 'POST' as const,
      path: '/api/citizens',
      input: insertCitizenSchema,
      responses: {
        201: z.custom<typeof citizens.$inferSelect>(),
      },
    },
  },
  logs: {
    list: {
      method: 'GET' as const,
      path: '/api/logs',
      responses: {
        200: z.array(z.custom<typeof auditLogs.$inferSelect & { username?: string }>()),
      },
    },
    create: { // For frontend to report navigation events
      method: 'POST' as const,
      path: '/api/logs',
      input: z.object({
        action: z.string(),
        details: z.string().optional(),
      }),
      responses: {
        201: z.void(),
      },
    }
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}

// Export types for use in client
export type LoginRequest = z.infer<typeof api.auth.login.input>;
export { type InsertCitizen } from './schema';
