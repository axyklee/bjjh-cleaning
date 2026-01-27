import z from "zod";
import { evaluateReportSchema } from "~/lib/schema/admin";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { getBucketName } from "~/server/storage";

export const evaluateRouter = createTRPCRouter({
    defaultGetAll: protectedProcedure
        .input(z.object({
            areaId: z.number(),
            standardDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format, expected YYYY-MM-DD")
        }))
        .query(async ({ ctx, input }) => {
            const defaults = await ctx.db.default.findMany({
                orderBy: {
                    rank: "asc"
                },
                select: {
                    id: true,
                    text: true,
                    shorthand: true
                }
            });
            const today = new Date();

            const yyyy = today.getFullYear();
            const mm = String(today.getMonth() + 1).padStart(2, "0");
            const dd = String(today.getDate()).padStart(2, "0");

            const reportsLastWorkday = await ctx.db.report.findMany({
                where: {
                    date: input.standardDate,
                    areaId: input.areaId
                }
            });

            const reportsToday = await ctx.db.report.findMany({
                where: {
                    date: `${yyyy}-${mm}-${dd}`,
                    areaId: input.areaId
                }
            });

            return defaults.map((d) => {
                let reportedToday = false;
                let repeatedToday = 0;
                if (reportsToday.find(r => r.text === d.text)) {
                    reportedToday = true;
                }
                if (reportsLastWorkday.find(r => r.text === d.text)) {
                    repeatedToday = (reportsLastWorkday.find(r => r.text === d.text)?.repeated ?? 0) + 1;
                }
                return {
                    ...d,
                    reportedToday,
                    repeatedToday
                };
            });
        }),
    getEvidenceUploadUrl: protectedProcedure
        .query(async ({ ctx }) => {
            const path = "evidence/" + Math.random().toString(10).substring(2, 13);
            return {
                path: path,
                url: await ctx.s3.presignedPutObject(getBucketName(), path, 60 * 60) // 1 hour
            };
        }),
    getImageUrls: protectedProcedure
        .input(z.object({
            paths: z.array(z.string())
        }))
        .query(async ({ ctx, input }) => {
            return await Promise.all(input.paths.map(async (path) => {
                return await ctx.s3.presignedGetObject(getBucketName(), path, 24 * 60 * 60); // 24 hours
            }));
        }),
    submitReport: protectedProcedure
        .input(evaluateReportSchema)
        .mutation(async ({ ctx, input }) => {
            await ctx.db.report.create({
                data: {
                    date: input.date,
                    text: input.text,
                    repeated: parseInt(input.repeated),
                    areaId: input.areaId,
                    evidence: input.evidence,
                    comment: input.comment
                }
            });
        }),
});