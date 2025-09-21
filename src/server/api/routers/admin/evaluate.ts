import z from "zod";
import { env } from "~/env";
import { evaluateReportSchema } from "~/lib/schema/admin";
import { getLastWorkday } from "~/lib/utils";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

export const evaluateRouter = createTRPCRouter({
    defaultGetAll: protectedProcedure
        .input(z.object({
            areaId: z.number()
        }))
        .query(async ({ ctx, input }) => {
            const defaults = await ctx.db.default.findMany({
                orderBy: {
                    rank: "asc"
                }
            });
            const today = new Date();

            const yyyy = today.getFullYear();
            const mm = String(today.getMonth() + 1).padStart(2, "0");
            const dd = String(today.getDate()).padStart(2, "0");

            const lastWorkday = getLastWorkday(`${yyyy}-${mm}-${dd}`);
            const reportsLastWorkday = await ctx.db.report.findMany({
                where: {
                    date: lastWorkday,
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
    getEvidenceUploadUrls: protectedProcedure
        .query(async ({ ctx }) => {
            return await Promise.all(Array.from({ length: 10 }).map(async () => {
                const path = "evidence/" + Math.random().toString(10).substring(2, 13);
                return {
                    path: path,
                    url: await ctx.s3.presignedPutObject(env.MINIO_BUCKET, path, 60 * 60) // 1 hour
                }
            }));
        }),
    getImageUrls: protectedProcedure
        .input(z.object({
            paths: z.array(z.string())
        }))
        .query(async ({ ctx, input }) => {
            return await Promise.all(input.paths.map(async (path) => {
                return await ctx.s3.presignedGetObject(env.MINIO_BUCKET, path, 24 * 60 * 60); // 24 hours
            }));
        }),
    submitReport: protectedProcedure
        .input(evaluateReportSchema)
        .mutation(async ({ ctx, input }) => {
            const report = await ctx.db.report.create({
                data: {
                    date: input.date,
                    text: input.text,
                    repeated: parseInt(input.repeated),
                    areaId: input.areaId,
                    evidence: input.evidence,
                    comment: input.comment
                }
            });
            return report;
        }),
});