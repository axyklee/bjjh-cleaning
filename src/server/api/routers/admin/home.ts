import z from "zod";
import { createTRPCRouter, protectedProcedure } from "../../trpc";

export const adminHomeRouter = createTRPCRouter({
    getReportsSortedByClass: protectedProcedure
        .input(z.object({
            date: z.string().min(1, "請輸入日期").regex(/^\d{4}-\d{2}-\d{2}$/, "日期格式錯誤，請使用 YYYY-MM-DD"),
        }))
        .query(async ({ ctx, input }) => {
            const classes = await ctx.db.class.findMany({
                orderBy: {
                    id: "asc"
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
                        include: {
                            area: true
                        }
                    });
                    return {
                        ...c,
                        reports: reports
                    };
                }));
            return ret;
        }),
    reportDeleteOne: protectedProcedure
        .input(z.object({
            reportId: z.number().min(1),
        }))
        .mutation(async ({ ctx, input }) => {
            await ctx.db.report.delete({
                where: {
                    id: input.reportId
                }
            });
        })
});