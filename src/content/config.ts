import { defineCollection, z } from 'astro:content';

const lessonsCollection = defineCollection({
    type: 'content',
    schema: z.object({
        title: z.string(),
        order: z.number(),
        description: z.string(),
    }),
});

export const collections = {
    'lessons': lessonsCollection,
};
