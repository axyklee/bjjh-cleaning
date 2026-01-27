import z from "zod";
import { eq } from "drizzle-orm";
import { createTRPCRouter, protectedProcedure } from "../../trpc";
import { assert } from "console";
import { getBucketName } from "~/server/storage";
import { classes, reports } from "~/server/db/schema";

export const adminHomeRouter = createTRPCRouter({
    getReportsSortedByClass: protectedProcedure
        .input(z.object({
            date: z.string().min(1, "請輸入日期").regex(/^\d{4}-\d{2}-\d{2}$/, "日期格式錯誤，請使用 YYYY-MM-DD"),
            interleaved: z.boolean().optional(),
        }))
        .query(async ({ ctx, input }) => {
            const allClasses = await ctx.db.query.classes.findMany({
                columns: {
                    id: true,
                    name: true
                },
                orderBy: (classes, { asc }) => [asc(classes.id)]
            });
            const ret =
                await Promise.all(allClasses.map(async (c) => {
                    const classReports = await ctx.db.query.reports.findMany({
                        where: eq(reports.date, input.date),
                        columns: {
                            id: true,
                            text: true,
                            repeated: true,
                            evidence: true,
                            comment: true,
                            createdAt: true
                        },
                        with: {
                            area: {
                                columns: {
                                    name: true,
                                    classId: true
                                }
                            }
                        }
                    });
                    const filteredReports = classReports.filter(r => r.area.classId === c.id);
                    return {
                        ...c,
                        reports: filteredReports.map(r => ({
                            area: {
                                name: r.area.name
                            },
                            id: r.id,
                            text: r.text,
                            repeated: r.repeated,
                            evidence: r.evidence,
                            comment: r.comment,
                            createdAt: r.createdAt
                        }))
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
            await ctx.db.delete(reports).where(eq(reports.id, input.reportId));
        }),
    downloadReports: protectedProcedure
        .input(z.object({
            date: z.string().min(1, "請輸入日期").regex(/^\d{4}-\d{2}-\d{2}$/, "日期格式錯誤，請使用 YYYY-MM-DD"),
        }))
        .mutation(async ({ ctx, input }) => {
            const allReports = await ctx.db.query.reports.findMany({
                where: eq(reports.date, input.date),
                columns: {
                    evidence: true,
                    date: true,
                    createdAt: true,
                    text: true,
                    comment: true,
                    id: true
                },
                with: {
                    area: {
                        columns: {
                            rank: true,
                            name: true
                        },
                        with: {
                            class: {
                                columns: {
                                    id: true,
                                    name: true
                                }
                            }
                        }
                    }
                },
                orderBy: (reports, { asc }) => [asc(reports.id)]
            });
            const sortedReports = allReports.sort((a, b) => {
                if (a.area.class.id !== b.area.class.id) {
                    return a.area.class.id - b.area.class.id;
                }
                return a.area.rank - b.area.rank;
            });
            return await Promise.all(sortedReports.map(async (r) => {
                const evidence = await Promise.all((JSON.parse(r.evidence ?? "[]") as string[]).map(async (path) => {
                    const imgPath = await ctx.s3.presignedGetObject(getBucketName(), path, 24 * 60 * 60);
                    return imgPath;
                }));
                return {
                    ...r,
                    evidence
                };
            }))
        })
});