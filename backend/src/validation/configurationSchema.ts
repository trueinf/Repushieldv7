import { z } from 'zod';

export const entityTypeSchema = z.enum(['individual', 'political-party', 'brand', 'organization']);

export const entityDetailsSchema = z.object({
  name: z.string().min(1, 'Entity name is required').max(200, 'Entity name is too long'),
  alternateNames: z.array(z.string().min(1).max(100)).default([]),
  description: z.string().max(1000, 'Description is too long').default(''),
  handles: z.object({
    twitter: z.array(z.string().max(100)).default([]),
    youtube: z.array(z.string().max(200)).default([]),
    facebook: z.array(z.string().max(200)).default([]),
    website: z.array(z.string().max(200)).default([]),
  }).default({
    twitter: [],
    youtube: [],
    facebook: [],
    website: [],
  }),
  spokespersons: z.array(z.string().min(1).max(100)).default([]),
  leadership: z.array(z.string().min(1).max(100)).default([]),
  abbreviations: z.array(z.string().min(1).max(50)).default([]),
});

export const ontologySchema = z.object({
  coreKeywords: z.array(z.string().min(1).max(100))
    .min(1, 'At least one core keyword is required'),
  associatedKeywords: z.array(z.string().min(1).max(100)).default([]),
  narrativeKeywords: z.array(z.string().min(1).max(100)).default([]),
  exclusionKeywords: z.array(z.string().min(1).max(100)).default([]),
});

export const platformOptionsSchema = z.object({
  languages: z.array(z.string()).default([]),
  regions: z.array(z.string()).default([]),
  verifiedOnly: z.boolean().default(false),
});

export const platformConfigSchema = z.object({
  platforms: z.array(z.string().min(1))
    .min(1, 'At least one platform must be selected'),
  options: z.record(z.string(), platformOptionsSchema).default({}),
});

export const configurationSchema = z.object({
  entityType: entityTypeSchema,
  entityDetails: entityDetailsSchema,
  ontology: ontologySchema,
  platformConfig: platformConfigSchema,
  isActive: z.boolean().default(false),
});
