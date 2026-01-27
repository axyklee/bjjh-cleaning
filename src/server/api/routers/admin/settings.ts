import z from "zod";
import { eq, lt, gt, desc, asc } from "drizzle-orm";
import { createTRPCRouter, protectedProcedure } from "../../trpc";
import { accountCreateSchema, areaCreateSchema, classCreateSchema, defaultCreateSchema, classUpdateSchema, areaUpdateSchema, defaultUpdateSchema } from "~/lib/schema/admin";
import { getBucketName } from "~/server/storage";
import { classes, areas, defaults, users } from "~/server/db/schema";

export const settingsRouter = createTRPCRouter({
    classGetAll: protectedProcedure.query(async ({ ctx }) => {
        return ctx.db.query.classes.findMany({
            columns: {
                id: true,
                name: true
            }
        });
    }),
    classCreate: protectedProcedure
        .input(classCreateSchema)
        .mutation(async ({ ctx, input }) => {
            // CHECK IF THE S3 BUCKET EXISTS :)
            if (ctx.s3.bucketExists && ctx.s3.makeBucket) {
                await ctx.s3.bucketExists(getBucketName())
                    .then(async (exists: boolean) => {
                        if (!exists && ctx.s3.makeBucket) {
                            await ctx.s3.makeBucket(getBucketName());
                        }
                    });
            }

            await ctx.db.insert(classes).values({
                name: input.name,
            });
        }
    ),
    classUpdate: protectedProcedure
        .input(classUpdateSchema)
        .mutation(async ({ ctx, input }) => {
            await ctx.db.update(classes)
                .set({ name: input.name })
                .where(eq(classes.id, input.id));
        }),
    classDelete: protectedProcedure
        .input(z.number().int())
        .mutation(async ({ ctx, input }) => {
            await ctx.db.delete(classes).where(eq(classes.id, input));
        }),

    areaGetAll: protectedProcedure.query(async ({ ctx }) => {
        return ctx.db.query.areas.findMany({
            columns: {
                rank: true,
                id: true,
                name: true
            },
            with: {
                class: {
                    columns: {
                        id: true,
                        name: true
                    }
                }
            },
            orderBy: (areas, { asc }) => [asc(areas.rank)]
        });
    }),
    areaCreate: protectedProcedure
        .input(areaCreateSchema)
        .mutation(async ({ ctx, input }) => {
            const lastArea = await ctx.db.query.areas.findFirst({
                columns: {
                    rank: true
                },
                orderBy: (areas, { desc }) => [desc(areas.rank)]
            });
            const newRank = lastArea ? lastArea.rank + 1 : 1;
            await ctx.db.insert(areas).values({
                name: input.name,
                classId: parseInt(input.classId),
                rank: newRank
            });
        }
    ),
    areaUpdate: protectedProcedure
        .input(areaUpdateSchema)
        .mutation(async ({ ctx, input }) => {
            await ctx.db.update(areas)
                .set({
                    name: input.name,
                    classId: parseInt(input.classId),
                })
                .where(eq(areas.id, input.id));
        }),
    areaDelete: protectedProcedure
        .input(z.number().int())
        .mutation(async ({ ctx, input }) => {
            await ctx.db.delete(areas).where(eq(areas.id, input));
        }),
    areaMoveUp: protectedProcedure
        .input(z.number().int())
        .mutation(async ({ ctx, input }) => {
            const area = await ctx.db.query.areas.findFirst({
                where: eq(areas.id, input)
            });
            if (!area) throw new Error("Area not found");
            const upperArea = await ctx.db.query.areas.findFirst({
                columns: {
                    id: true,
                    rank: true
                },
                where: lt(areas.rank, area.rank),
                orderBy: (areas, { desc }) => [desc(areas.rank)]
            });
            if (!upperArea) throw new Error("已經在最上方");
            // @ts-expect-error - Transaction type mismatch between D1 and better-sqlite3
            await ctx.db.transaction(async (tx) => {
                await tx.update(areas)
                    .set({ rank: -1 })
                    .where(eq(areas.id, area.id));
                await tx.update(areas)
                    .set({ rank: area.rank })
                    .where(eq(areas.id, upperArea.id));
                await tx.update(areas)
                    .set({ rank: upperArea.rank })
                    .where(eq(areas.id, area.id));
            });
        }),
    areaMoveDown: protectedProcedure
        .input(z.number().int())
        .mutation(async ({ ctx, input }) => {
            const area = await ctx.db.query.areas.findFirst({
                where: eq(areas.id, input)
            });
            if (!area) throw new Error("Area not found");
            const lowerArea = await ctx.db.query.areas.findFirst({
                columns: {
                    id: true,
                    rank: true
                },
                where: gt(areas.rank, area.rank),
                orderBy: (areas, { asc }) => [asc(areas.rank)]
            });
            if (!lowerArea) throw new Error("已經在最下方");
            // @ts-expect-error - Transaction type mismatch between D1 and better-sqlite3
            await ctx.db.transaction(async (tx) => {
                await tx.update(areas)
                    .set({ rank: -1 })
                    .where(eq(areas.id, lowerArea.id));
                await tx.update(areas)
                    .set({ rank: lowerArea.rank })
                    .where(eq(areas.id, area.id));
                await tx.update(areas)
                    .set({ rank: area.rank })
                    .where(eq(areas.id, lowerArea.id));
            });
        }),
    defaultGetAll: protectedProcedure.query(async ({ ctx }) => {
        return ctx.db.query.defaults.findMany({
            columns: {
                id: true,
                shorthand: true,
                text: true
            },
            orderBy: (defaults, { asc }) => [asc(defaults.rank)]
        });
    }),
    defaultCreate: protectedProcedure
        .input(defaultCreateSchema)
        .mutation(async ({ ctx, input }) => {
            const lastDefault = await ctx.db.query.defaults.findFirst({
                columns: {
                    rank: true
                },
                orderBy: (defaults, { desc }) => [desc(defaults.rank)]
            });
            const newRank = lastDefault ? lastDefault.rank + 1 : 1;
            await ctx.db.insert(defaults).values({
                shorthand: input.shorthand,
                text: input.text,
                rank: newRank
            });
        }
    ),
    defaultUpdate: protectedProcedure
        .input(defaultUpdateSchema)
        .mutation(async ({ ctx, input }) => {
            await ctx.db.update(defaults)
                .set({
                    shorthand: input.shorthand,
                    text: input.text,
                })
                .where(eq(defaults.id, input.id));
        }),
    defaultDelete: protectedProcedure
        .input(z.number().int())
        .mutation(async ({ ctx, input }) => {
            await ctx.db.delete(defaults).where(eq(defaults.id, input));
        }),
    defaultMoveUp: protectedProcedure
        .input(z.number().int())
        .mutation(async ({ ctx, input }) => {
            const def = await ctx.db.query.defaults.findFirst({
                columns: {
                    rank: true,
                    id: true
                },
                where: eq(defaults.id, input)
            });
            if (!def) throw new Error("Default not found");
            const upperDef = await ctx.db.query.defaults.findFirst({
                columns: {
                    id: true,
                    rank: true
                },
                where: lt(defaults.rank, def.rank),
                orderBy: (defaults, { desc }) => [desc(defaults.rank)]
            });
            if (!upperDef) throw new Error("已經在最上方");
            // @ts-expect-error - Transaction type mismatch between D1 and better-sqlite3
            await ctx.db.transaction(async (tx) => {
                await tx.update(defaults)
                    .set({ rank: -1 })
                    .where(eq(defaults.id, def.id));
                await tx.update(defaults)
                    .set({ rank: def.rank })
                    .where(eq(defaults.id, upperDef.id));
                await tx.update(defaults)
                    .set({ rank: upperDef.rank })
                    .where(eq(defaults.id, def.id));
            });
        }),
    defaultMoveDown: protectedProcedure
        .input(z.number().int())
        .mutation(async ({ ctx, input }) => {
            const def = await ctx.db.query.defaults.findFirst({
                columns: {
                    rank: true,
                    id: true
                },
                where: eq(defaults.id, input)
            });
            if (!def) throw new Error("Default not found");
            const lowerDef = await ctx.db.query.defaults.findFirst({
                columns: {
                    id: true,
                    rank: true
                },
                where: gt(defaults.rank, def.rank),
                orderBy: (defaults, { asc }) => [asc(defaults.rank)]
            });
            if (!lowerDef) throw new Error("已經在最下方");
            // @ts-expect-error - Transaction type mismatch between D1 and better-sqlite3
            await ctx.db.transaction(async (tx) => {
                await tx.update(defaults)
                    .set({ rank: -1 })
                    .where(eq(defaults.id, lowerDef.id));
                await tx.update(defaults)
                    .set({ rank: lowerDef.rank })
                    .where(eq(defaults.id, def.id));
                await tx.update(defaults)
                    .set({ rank: def.rank })
                    .where(eq(defaults.id, lowerDef.id));
            });
        }),
    accountGetAll: protectedProcedure
        .query(async ({ ctx }) => {
            return ctx.db.query.users.findMany({
                columns: {
                    id: true,
                    email: true,
                }
            });
        }),
    accountCreate: protectedProcedure
        .input(accountCreateSchema)
        .mutation(async ({ ctx, input }) => {
            return ctx.db.insert(users).values({
                email: input.email,
            });
        }),
    accountDelete: protectedProcedure
        .input(z.string())
        .mutation(async ({ ctx, input }) => {
            return ctx.db.delete(users).where(eq(users.id, input));
        })
});