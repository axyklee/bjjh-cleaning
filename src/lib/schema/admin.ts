import z from "zod";

export const classCreateSchema = z.object({
    name: z.string().min(1, "請輸入班級名稱"),
})

export const classUpdateSchema = z.object({
    id: z.number().int(),
    name: z.string().min(1, "請輸入班級名稱"),
})

export const areaCreateSchema = z.object({
    name: z.string().min(1, "請輸入掃區名稱"),
    classId: z.string().min(1, "請選擇班級"),
})

export const areaUpdateSchema = z.object({
    id: z.number().int(),
    name: z.string().min(1, "請輸入掃區名稱"),
    classId: z.number().int().min(1, "請選擇班級"),
})

export const defaultCreateSchema = z.object({
    shorthand: z.string().min(1, "請輸入簡寫"),
    text: z.string().min(1, "請輸入完整訊息"),
})

export const defaultUpdateSchema = z.object({
    id: z.number().int(),
    shorthand: z.string().min(1, "請輸入簡寫"),
    text: z.string().min(1, "請輸入完整訊息"),
})

export const accountCreateSchema = z.object({
    email: z.email("請輸入有效的電子郵件地址"),
});

export const evaluateReportSchema = z.object({
    date: z.string().min(1, "請輸入日期").regex(/^\d{4}-\d{2}-\d{2}$/, "日期格式錯誤，請使用 YYYY-MM-DD"),
    text: z.string().min(1, "請輸入未清潔狀況"),
    repeated: z.string().refine((val) => {
        const num = parseInt(val);
        return !isNaN(num) && num >= 1 && num <= 30;
    }, {
        message: "請輸入正確的連續未清潔天數",
    }), 
    areaId: z.number().min(1, "請選擇掃區"),
    // evidence should be an string of JSON array strings
    evidence: z.string().superRefine((val, ctx) => {
        try {
            const arr = JSON.parse(val) as string[];
            if (!Array.isArray(arr) || !arr.every((item: string) => typeof item === "string")) {
                ctx.addIssue({
                    code: "custom",
                    message: "請確認證明照片格式正確",
                });
            }
        } catch {
            return;
        }
        return;
    }),
    comment: z.string().optional(),
});