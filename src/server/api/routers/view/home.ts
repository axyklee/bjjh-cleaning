import z from "zod";
import { createTRPCRouter, publicProcedure } from "../../trpc";
import { env } from "~/env";

export const viewHomeRouter = createTRPCRouter({
    getRecords: publicProcedure
        .input(z.object({
            date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
            className: z.string().min(1).max(10),
        }))
        .query(async ({ input, ctx }) => {
            const { date, className } = input;
            const records = await ctx.db.report.findMany({
                where: {
                    date,
                    area: {
                        class: {
                            name: className
                        }
                    }
                },
                select: {
                    id: true,
                    evidence: true,
                    area: {
                        select: {
                            name: true
                        }
                    },
                    repeated: true,
                    text: true,
                    comment: true,
                    createdAt: true
                }
            });
            return await Promise.all(records.map(async r => {
                const evidencePaths = r.evidence ? JSON.parse(r.evidence) as string[] : [];
                const evidenceHrefs = await Promise.all(evidencePaths.map(async (path) => {
                    return await ctx.s3.presignedGetObject(env.MINIO_BUCKET, path, 24 * 60 * 60); // 24 hours
                }));
                return {
                    ...r,
                    evidence: evidenceHrefs
                }
            }))
        })
})