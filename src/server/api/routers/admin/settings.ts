import z from "zod";
import { createTRPCRouter, protectedProcedure } from "../../trpc";
import { accountCreateSchema, areaCreateSchema, classCreateSchema, defaultCreateSchema } from "~/lib/schema/admin";
import { env } from "~/env";

export const settingsRouter = createTRPCRouter({
    classGetAll: protectedProcedure.query(async ({ ctx }) => {
        return ctx.db.class.findMany({
            select: {
                id: true,
                name: true
            }
        });
    }),
    classCreate: protectedProcedure
        .input(classCreateSchema)
        .mutation(async ({ ctx, input }) => {
            // CHECK IF THE S3 BUCKET EXISTS :)
            await ctx.s3.bucketExists(env.MINIO_BUCKET)
                .then(async (exists) => {
                    if (!exists) {
                        await ctx.s3.makeBucket(env.MINIO_BUCKET);
                    }
                });

            await ctx.db.class.create({
                data: {
                    name: input.name,
                },
            });
        }
    ),
    classDelete: protectedProcedure
        .input(z.number().int())
        .mutation(async ({ ctx, input }) => {
            await ctx.db.class.delete({
                where: {
                    id: input,
                },
            });
        }),

    areaGetAll: protectedProcedure.query(async ({ ctx }) => {
        return ctx.db.area.findMany({
            select: {
                class: {
                    select: {
                        id: true,
                        name: true
                    }
                },
                rank: true,
                id: true,
                name: true
            },
            orderBy: {
                rank: "asc"
            }
        });
    }),
    areaCreate: protectedProcedure
        .input(areaCreateSchema)
        .mutation(async ({ ctx, input }) => {
            // get the last area with the highest id and increment by 1
            const lastArea = await ctx.db.area.findFirst({
                select: {
                    rank: true
                },
                orderBy: {
                    rank: "desc"
                }
            });
            const newRank = lastArea ? lastArea.rank + 1 : 1;
            await ctx.db.area.create({
                data: {
                    name: input.name,
                    classId: parseInt(input.classId),
                    rank: newRank
                },
            });
        }
    ),
    areaDelete: protectedProcedure
        .input(z.number().int())
        .mutation(async ({ ctx, input }) => {
            await ctx.db.area.delete({
                where: {
                    id: input,
                },
            });
        }),
    areaMoveUp: protectedProcedure
        .input(z.number().int())
        .mutation(async ({ ctx, input }) => {
            const area = await ctx.db.area.findUnique({
                where: { id: input }
            });
            if (!area) throw new Error("Area not found");
            const upperArea = await ctx.db.area.findFirst({
                select: {
                    id: true,
                    rank: true
                },
                where: {
                    rank: {
                        lt: area.rank
                    }
                },
                orderBy: {
                    rank: "desc"
                }
            });
            if (!upperArea) throw new Error("已經在最上方");
            await ctx.db.$transaction([
                ctx.db.area.update({
                    where: { id: area.id },
                    data: { rank: -1 }
                }),
                ctx.db.area.update({
                    where: { id: upperArea.id },
                    data: { rank: area.rank }
                }),
                ctx.db.area.update({
                    where: { id: area.id },
                    data: { rank: upperArea.rank }
                })
            ]);
        }),
    areaMoveDown: protectedProcedure
        .input(z.number().int())
        .mutation(async ({ ctx, input }) => {
            const area = await ctx.db.area.findUnique({
                where: { id: input }
            });
            if (!area) throw new Error("Area not found");
            const lowerArea = await ctx.db.area.findFirst({
                select: {
                    id: true,
                    rank: true
                },
                where: {
                    rank: {
                        gt: area.rank
                    }
                },
                orderBy: {
                    rank: "asc"
                }
            });
            if (!lowerArea) throw new Error("已經在最下方");
            await ctx.db.$transaction([
                ctx.db.area.update({
                    where: { id: lowerArea.id },
                    data: { rank: -1 }
                }),
                ctx.db.area.update({
                    where: { id: area.id },
                    data: { rank: lowerArea.rank }
                }),
                ctx.db.area.update({
                    where: { id: lowerArea.id },
                    data: { rank: area.rank }
                })
            ]);
        }),
    areaUpdateRanks: protectedProcedure
        .input(z.array(z.object({
            id: z.number().int(),
            rank: z.number().int()
        })))
        .mutation(async ({ ctx, input }) => {
            await ctx.db.$transaction(
                input.map(({ id, rank }) =>
                    ctx.db.area.update({
                        where: { id },
                        data: { rank }
                    })
                )
            );
        }),
    defaultGetAll: protectedProcedure.query(async ({ ctx }) => {
        return ctx.db.default.findMany({
            select: {
                id: true,
                shorthand: true,
                text: true
            },
            orderBy: {
                rank: "asc"
            }
        });
    }),
    defaultCreate: protectedProcedure
        .input(defaultCreateSchema)
        .mutation(async ({ ctx, input }) => {
            // get the last area with the highest id and increment by 1
            const lastDefault = await ctx.db.default.findFirst({
                select: {
                    rank: true
                },
                orderBy: {
                    rank: "desc"
                }
            });
            const newRank = lastDefault ? lastDefault.rank + 1 : 1;
            await ctx.db.default.create({
                data: {
                    shorthand: input.shorthand,
                    text: input.text,
                    rank: newRank
                },
            });
        }
    ),
    defaultDelete: protectedProcedure
        .input(z.number().int())
        .mutation(async ({ ctx, input }) => {
            await ctx.db.default.delete({
                where: {
                    id: input,
                },
            });
        }),
    defaultMoveUp: protectedProcedure
        .input(z.number().int())
        .mutation(async ({ ctx, input }) => {
            const def = await ctx.db.default.findUnique({
                select: {
                    rank: true,
                    id: true
                },
                where: { id: input }
            });
            if (!def) throw new Error("Default not found");
            const upperDef = await ctx.db.default.findFirst({
                select: {
                    id: true,
                    rank: true
                },
                where: {
                    rank: {
                        lt: def.rank
                    }
                },
                orderBy: {
                    rank: "desc"
                }
            });
            if (!upperDef) throw new Error("已經在最上方");
            await ctx.db.$transaction([
                ctx.db.default.update({
                    where: { id: def.id },
                    data: { rank: -1 }
                }),
                ctx.db.default.update({
                    where: { id: upperDef.id },
                    data: { rank: def.rank }
                }),
                ctx.db.default.update({
                    where: { id: def.id },
                    data: { rank: upperDef.rank }
                })
            ]);
        }),
    defaultMoveDown: protectedProcedure
        .input(z.number().int())
        .mutation(async ({ ctx, input }) => {
            const def = await ctx.db.default.findUnique({
                select: {
                    rank: true,
                    id: true
                },
                where: { id: input }
            });
            if (!def) throw new Error("Default not found");
            const lowerDef = await ctx.db.default.findFirst({
                select: {
                    id: true,
                    rank: true
                },
                where: {
                    rank: {
                        gt: def.rank
                    }
                },
                orderBy: {
                    rank: "asc"
                }
            });
            if (!lowerDef) throw new Error("已經在最下方");
            await ctx.db.$transaction([
                ctx.db.default.update({
                    where: { id: lowerDef.id },
                    data: { rank: -1 }
                }),
                ctx.db.default.update({
                    where: { id: def.id },
                    data: { rank: lowerDef.rank }
                }),
                ctx.db.default.update({
                    where: { id: lowerDef.id },
                    data: { rank: def.rank }
                })
            ]);
        }),
    defaultUpdateRanks: protectedProcedure
        .input(z.array(z.object({
            id: z.number().int(),
            rank: z.number().int()
        })))
        .mutation(async ({ ctx, input }) => {
            await ctx.db.$transaction(
                input.map(({ id, rank }) =>
                    ctx.db.default.update({
                        where: { id },
                        data: { rank }
                    })
                )
            );
        }),
    accountGetAll: protectedProcedure
        .query(async ({ ctx }) => {
            return ctx.db.user.findMany({
                select: {
                    id: true,
                    email: true,
                }
            });
        }),
    accountCreate: protectedProcedure
        .input(accountCreateSchema)
        .mutation(async ({ ctx, input }) => {
            return ctx.db.user.create({
                data: {
                    email: input.email,
                }
            });
        }),
    accountDelete: protectedProcedure
        .input(z.string())
        .mutation(async ({ ctx, input }) => {
            return ctx.db.user.delete({
                where: {
                    id: input,
                }
            });
        })
});