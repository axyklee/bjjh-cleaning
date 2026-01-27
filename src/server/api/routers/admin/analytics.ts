import z from "zod";
import { gte, lte, and } from "drizzle-orm";
import { createTRPCRouter, protectedProcedure } from "../../trpc";
import { defaults, reports } from "~/server/db/schema";

const getDefaults = async (db: typeof import("~/server/db").db) => {
    return await db.query.defaults.findMany({
        columns: {
            id: true,
            text: true,
            shorthand: true,
        }
    })
}

const countReports = (i: {
    key: string;
    [key: number]: string | number;
}) => Object.entries(i).reduce((sum, [key, value]) => {
    if (key !== "key" && typeof value === "number") {
        return sum + value;
    }
    return sum;
}, 0);

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
            const allReports = await ctx.db.query.reports.findMany({
                where: and(
                    gte(reports.date, startDate),
                    lte(reports.date, endDate)
                ),
                columns: {
                    text: true
                },
                with: {
                    area: {
                        columns: {
                            id: true,
                            name: true
                        }
                    }
                }
            })
            const allDefaults = await getDefaults(ctx.db);
            const areaMap: {
                key: string;
                [key: number]: string | number;
            }[] = [];
            allReports.forEach(report => {
                const areaName = report.area.name;
                const reportText = report.text;
                const reportDefaultId = allDefaults.find(def => def.text === reportText)?.id ?? 0;

                const areaEntry = areaMap.find(entry => entry.key === areaName);
                if (!areaEntry) {
                    areaMap.push({ key: areaName, [reportDefaultId]: 1 });
                } else if (areaEntry[reportDefaultId]) {
                    areaEntry[reportDefaultId] = (areaEntry[reportDefaultId] as number) + 1;
                } else {
                    areaEntry[reportDefaultId] = 1;
                }
            })
            areaMap.sort((a, b) => {
                return countReports(b) - countReports(a);
            });
            return areaMap;
        }),
    getReportsInRangeByClass: protectedProcedure
        .input(z.object({
            startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format, expected YYYY-MM-DD"),
            endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format, expected YYYY-MM-DD"),
        }))
        .query(async ({ input, ctx }) => {
            const { startDate, endDate } = input;
            const allReports = await ctx.db.query.reports.findMany({
                where: and(
                    gte(reports.date, startDate),
                    lte(reports.date, endDate)
                ),
                columns: {
                    text: true
                },
                with: {
                    area: {
                        columns: {},
                        with: {
                            class: {
                                columns: {
                                    id: true,
                                    name: true
                                }
                            }
                        }
                    }
                }
            })
            const allDefaults = await getDefaults(ctx.db);
            const classMap: {
                key: string;
                [key: number]: string | number;
            }[] = [];
            allReports.forEach(report => {
                const className = report.area.class.name;
                const reportText = report.text;
                const reportDefaultId = allDefaults.find(def => def.text === reportText)?.id ?? 0;
                const classEntry = classMap.find(entry => entry.key === className);
                if (!classEntry) {
                    classMap.push({ key: className, [reportDefaultId]: 1 });
                } else if (classEntry[reportDefaultId]) {
                    classEntry[reportDefaultId] = (classEntry[reportDefaultId] as number) + 1;
                } else {
                    classEntry[reportDefaultId] = 1;
                }
            })
            classMap.sort((a, b) => {
                return countReports(b) - countReports(a);
            });
            return classMap;
        }),
})