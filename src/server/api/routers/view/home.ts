import z from "zod";
import { eq, and } from "drizzle-orm";
import { createTRPCRouter, publicProcedure } from "../../trpc";
import { getBucketName } from "~/server/storage";
import { reports, areas, classes } from "~/server/db/schema";

export const viewHomeRouter = createTRPCRouter({
    getRecords: publicProcedure
        .input(z.object({
            date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
            className: z.string().min(1).max(10),
        }))
        .query(async ({ input, ctx }) => {
            const { date, className } = input;
            
            // First, get the class by name
            const classRecord = await ctx.db.query.classes.findFirst({
                where: eq(classes.name, className),
                columns: { id: true }
            });
            
            if (!classRecord) {
                return [];
            }
            
            // Then get reports with areas filtered by classId
            const records = await ctx.db.query.reports.findMany({
                where: eq(reports.date, date),
                columns: {
                    id: true,
                    evidence: true,
                    repeated: true,
                    text: true,
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
            
            // Filter by classId
            const filteredRecords = records.filter(r => r.area.classId === classRecord.id);
            
            return await Promise.all(filteredRecords.map(async r => {
                const evidencePaths = r.evidence ? JSON.parse(r.evidence) as string[] : [];
                const evidenceHrefs = await Promise.all(evidencePaths.map(async (path) => {
                    return await ctx.s3.presignedGetObject(getBucketName(), path, 24 * 60 * 60); // 24 hours
                }));
                return {
                    id: r.id,
                    evidence: evidenceHrefs,
                    area: {
                        name: r.area.name
                    },
                    repeated: r.repeated,
                    text: r.text,
                    comment: r.comment,
                    createdAt: r.createdAt
                }
            }))
        })
})