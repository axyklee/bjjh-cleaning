import z from "zod";
import { createTRPCRouter, protectedProcedure } from "../../trpc";
import { env } from "~/env";
import { assert } from "console";

export const adminHomeRouter = createTRPCRouter({
    getReportsSortedByClass: protectedProcedure
        .input(z.object({
            date: z.string().min(1, "請輸入日期").regex(/^\d{4}-\d{2}-\d{2}$/, "日期格式錯誤，請使用 YYYY-MM-DD"),
            interleaved: z.boolean().optional(),
        }))
        .query(async ({ ctx, input }) => {
            const classes = await ctx.db.class.findMany({
                orderBy: {
                    id: "asc"
                },
                select: {
                    id: true,
                    name: true
                }
            });
            const ret =
                await Promise.all(classes.map(async (c) => {
                    const reports = await ctx.db.report.findMany({
                        where: {
                            date: input.date,
                            area: {
                                classId: c.id
                            }
                        },
                        select: {
                            area: {
                                select: {
                                    name: true
                                }
                            },
                            id: true,
                            text: true,
                            repeated: true,
                            evidence: true,
                            comment: true,
                            createdAt: true
                        }
                    });
                    return {
                        ...c,
                        reports: reports
                    };
                }));
            if (input.interleaved) {
                const interleavedRet = [];
                const halfLength = Math.ceil(ret.length / 2);
                for (let i = 0; i < halfLength; i += 1) {
                    interleavedRet.push(ret[i]!);  
                    if (i + halfLength < ret.length) {
                        interleavedRet.push(ret[i + halfLength]!);
                    }
                }
                assert(interleavedRet.length === ret.length);
                return interleavedRet;
            }
            return ret;
        }),
    reportDeleteOne: protectedProcedure
        .input(z.object({
            reportId: z.number().min(1),
        }))
        .mutation(async ({ ctx, input }) => {
            const report = await ctx.db.report.delete({
                where: {
                    id: input.reportId
                }
            });
            if (report.evidence) {
                await ctx.s3.removeObjects(env.MINIO_BUCKET, JSON.parse(report.evidence as string));
            }
        }),
    downloadReports: protectedProcedure
        .input(z.object({
            date: z.string().min(1, "請輸入日期").regex(/^\d{4}-\d{2}-\d{2}$/, "日期格式錯誤，請使用 YYYY-MM-DD"),
        }))
        .mutation(async ({ ctx, input }) => {
            const reports = await ctx.db.report.findMany({
                where: {
                    date: input.date
                },
                select: {
                    area: {
                        select: {
                            class: {
                                select: {
                                    id: true,
                                    name: true
                                }
                            },
                            rank: true,
                            name: true
                        }
                    },
                    evidence: true,
                    date: true,
                    createdAt: true,
                    text: true,
                    comment: true,
                    id: true
                },
                orderBy: [
                    { area: { class: { id: "asc" } } },
                    { area: { rank: "asc" } }
                ]
            });
            return await Promise.all(reports.map(async (r) => {
                const evidence = await Promise.all((JSON.parse(r.evidence ?? "[]") as string[]).map(async (path) => {
                    const imgPath = await ctx.s3.presignedGetObject(env.MINIO_BUCKET, path, 24 * 60 * 60);
                    return imgPath;
                }));
                return {
                    ...r,
                    evidence
                };
            }))
        })
});