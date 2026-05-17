// src/content.config.ts
import { defineCollection, z } from 'astro:content';

const work = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    role: z.string(),
    period: z.string(),
    tags: z.array(z.string()),
    description: z.string(),
    featured: z.boolean().default(false),
  }),
});

const projects = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    tags: z.array(z.string()),
    description: z.string(),
    github: z.string().optional(),
    live: z.string().optional(),
  }),
});

const credentials = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    issuer: z.string(),
    date: z.string().optional(),
    category: z.string().optional().default('Certification'),
    description: z.string().optional(),
    url: z.string().optional(),
  }),
});

export const collections = { work, projects, credentials };
