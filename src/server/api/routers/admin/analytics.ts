import z from "zod";
import { createTRPCRouter, protectedProcedure } from "../../trpc";
import type { PrismaClient } from "@prisma/client";
import type { DefaultArgs } from "@prisma/client/runtime/library";

const getDefaults = async (db: PrismaClient<{
        log: ("query" | "warn" | "error")[];
    }, "query" | "warn" | "error", DefaultArgs>) => {
    return await db.default.findMany({
        select: {
            id: true,
            text: true,
            shorthand: true,
        }
    })
}

export const analyticsRouter = createTRPCRouter({
    getDefaultsAsArray: protectedProcedure
        .query(async ({ ctx }) => {
            return await getDefaults(ctx.db);
        }),
    getReportsInRangeByArea: protectedProcedure
        .input(z.object({
            startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format, expected YYYY-MM-DD"),
            endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format, expected YYYY-MM-DD"),
        }))
        .query(async ({ input, ctx }) => {
            const { startDate, endDate } = input;
            const reports = await ctx.db.report.findMany({
                where: {
                    date: {
                        gte: startDate,
                        lte: endDate,
                    }
                },
                select: {
                    area: {
                        select: {
                            id: true,
                            name: true
                        }
                    },
                    text: true
                }
            })
            const defaults = await getDefaults(ctx.db);
            const areaMap: {
                key: string;
                [key: number]: string | number;
            }[] = [];
            reports.forEach(report => {
                const areaName = report.area.name;
                const reportText = report.text;
                const reportDefaultId = defaults.find(def => def.text === reportText)?.id ?? 0;

                const areaEntry = areaMap.find(entry => entry.key === areaName);
                if (!areaEntry) {
                    areaMap.push({ key: areaName, [reportDefaultId]: 1 });
                } else if (areaEntry[reportDefaultId]) {
                    areaEntry[reportDefaultId] = (areaEntry[reportDefaultId] as number) + 1;
                } else {
                    areaEntry[reportDefaultId] = 1;
                }
            })
            return areaMap;
        }),
    getReportsInRangeByClass: protectedProcedure
        .input(z.object({
            startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format, expected YYYY-MM-DD"),
            endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format, expected YYYY-MM-DD"),
        }))
        .query(async ({ input, ctx }) => {
            const { startDate, endDate } = input;
            const reports = await ctx.db.report.findMany({
                where: {
                    date: {
                        gte: startDate,
                        lte: endDate,
                    }
                },
                select: {
                    area: {
                        select: {
                            class: {
                                select: {
                                    id: true,
                                    name: true
                                }
                            }
                        }
                    },
                    text: true
                }
            })
            const defaults = await getDefaults(ctx.db);
            const classMap: {
                key: string;
                [key: number]: string | number;
            }[] = [];
            reports.forEach(report => {
                const className = report.area.class.name;
                const reportText = report.text;
                const reportDefaultId = defaults.find(def => def.text === reportText)?.id ?? 0;
                const classEntry = classMap.find(entry => entry.key === className);
                if (!classEntry) {
                    classMap.push({ key: className, [reportDefaultId]: 1 });
                } else if (classEntry[reportDefaultId]) {
                    classEntry[reportDefaultId] = (classEntry[reportDefaultId] as number) + 1;
                } else {
                    classEntry[reportDefaultId] = 1;
                }
            })
            return classMap;
        }),
})