"use client"

import { ArrowLeft, ArrowRight, CalendarIcon, SearchCheck } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "~/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { Skeleton } from "~/components/ui/skeleton";
import { api } from "~/trpc/react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "~/components/ui/dialog"
import type { zGenForm } from "~/_helper/generatedForm";
import GeneratedForm from "~/_helper/generatedForm";
import { evaluateReportSchema } from "~/lib/schema/admin";
import { Input } from "~/components/ui/input";
import type z from "zod";
import { Progress } from "~/components/ui/progress";
import { Popover, PopoverContent, PopoverTrigger } from "~/components/ui/popover";
import { Calendar } from "~/components/ui/calendar";
import { getLastWorkday } from "~/lib/utils";
import { format } from "date-fns";

export default function EvaluatePage() {
    const areas = api.admin.settings.areaGetAll.useQuery(undefined, {
        refetchOnWindowFocus: false,
        refetchOnMount: false,
        refetchInterval: false,
        refetchOnReconnect: false,
        staleTime: Infinity,
    });
    const submitReport = api.admin.evaluate.submitReport.useMutation();

    const [selectedArea, setSelectedArea] = useState<string | undefined>(areas.data?.[0]?.id.toString());
    const [reportText, setReportText] = useState<string>("");
    const [repeatedCount, setRepeatedCount] = useState<number>(1);

    const [uploadedImagePaths, setUploadedImagePaths] = useState<string[]>([]);
    const [fileUploadMsg, setFileUploadMsg] = useState<string | null>(null);
    const uploadUrl = api.admin.evaluate.getEvidenceUploadUrl.useQuery();

    const uploadedImageUrls = api.admin.evaluate.getImageUrls.useQuery({
        paths: uploadedImagePaths
    }, { enabled: uploadedImagePaths.length > 0 });

    // when areas.data changes, set selectedArea to the first area only the first time
    const [hasSetInitialArea, setHasSetInitialArea] = useState(false);
    useEffect(() => {
        if (areas.data && areas.data.length > 0 && !hasSetInitialArea) {
            setSelectedArea(areas.data[0]?.id.toString());
            setHasSetInitialArea(true);
        }
    }, [areas.data]);

    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    const lastWorkday = getLastWorkday(`${yyyy}-${mm}-${dd}`);
    const [standardDate, setStandardDate] = useState<string>(lastWorkday);

    const defaults = api.admin.evaluate.defaultGetAll.useQuery({
        areaId: parseInt(selectedArea ?? "0"),
        standardDate: standardDate
    });

    const formGen = useMemo<zGenForm>(() => [
        {
            name: "date",
            label: "日期",
            type: "text",
            defaultValue: new Date().toISOString().split("T")[0],
        },
        {
            name: "text",
            label: "未清潔狀況",
            defaultValue: reportText,
            type: "text",
        },
        {
            name: "repeated",
            label: "連續未清潔天數",
            type: "number",
            defaultValue: repeatedCount.toString(),
            helperText: "若非連續未清潔, 請填寫 1",
        },
        {
            name: "file",
            label: "證明照片",
            type: "custom",
            disabled: uploadUrl.isLoading || fileUploadMsg === "上傳檔案中...",
            custom: (form) => (<div className="m-0">
                <Input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={async (e) => {
                        form.clearErrors("file");
                        setFileUploadMsg(null);

                        if (!uploadUrl.data) {
                            form.setError("file", {
                                type: "manual",
                                message: "Failed to get upload URLs. Please try again later.",
                            });
                            return;
                        }
                        if (!e.target.files || e.target.files.length === 0) {
                            form.setError("file", {
                                type: "manual",
                                message: "請選擇要上傳的檔案",
                            });
                            return;
                        }

                        setFileUploadMsg("上傳檔案中...");

                        const file = e.target.files[0];
                        try {
                            await fetch(
                                uploadUrl.data?.url ?? "",
                                {
                                    method: "PUT",
                                    body: file,
                                    headers: {
                                        "Content-Type": "image/*",
                                    },
                                }
                            );

                            setUploadedImagePaths((prev) => {
                                const newPaths = [...prev, uploadUrl.data?.path ?? ""];
                                // Update form value with the new paths
                                form.setValue("evidence", JSON.stringify(newPaths));
                                return newPaths;
                            });

                            await uploadUrl.refetch();

                            await uploadedImageUrls.refetch();
                            setFileUploadMsg("上傳檔案成功");
                        } catch (error: unknown) {
                            if (error instanceof Error) {
                                form.setError("file", {
                                    type: "manual",
                                    message: `上傳檔案失敗: ${error.message}`,
                                });
                            }
                        }
                    }}
                />
                {fileUploadMsg && <p>{fileUploadMsg}</p>}
                <div className="list">
                    {uploadedImageUrls.data?.map((url, index) => (
                        <div key={index} className="inline-block relative m-2">
                            <img src={url} alt={`Uploaded image ${index}`} className="w-32 h-32 object-cover rounded-md" />
                        </div>
                    ))}
                </div>
            </div>)
        },
        {
            name: "comment",
            label: "備註",
            type: "textarea",
            helperText: "若有其他想說的話, 可以寫在這裡",
        },
        {
            name: "areaId",
            label: "掃區",
            type: "hidden",
            defaultValue: parseInt(selectedArea ?? "0"),
        },
        {
            name: "evidence",
            label: "證明照片路徑",
            type: "hidden",
            defaultValue: "[]",
        }
    ], [selectedArea, repeatedCount, reportText, uploadUrl.data, uploadedImagePaths, uploadedImageUrls.data, fileUploadMsg]);

    if (areas.isLoading) {
        return <div className="space-y-1">
            <div className="w-full space-y-3">
                <Skeleton className="w-80 h-6 bg-gray-200 rounded-md"></Skeleton>
                <Skeleton className="w-60 h-6 bg-gray-200 rounded-md"></Skeleton>
                <Skeleton className="w-70 h-6 bg-gray-200 rounded-md"></Skeleton>
                <Skeleton className="w-40 h-6 bg-gray-200 rounded-md"></Skeleton>
                <Skeleton className="w-80 h-6 bg-gray-200 rounded-md"></Skeleton>
                <Skeleton className="w-90 h-6 bg-gray-200 rounded-md"></Skeleton>
                <Skeleton className="w-30 h-6 bg-gray-200 rounded-md"></Skeleton>
            </div>
        </div>
    }

    return (
        <div>
            <div className="flex items-center gap-2 mb-3"><SearchCheck className="h-5 w-5" /><h2 className="text-xl font-bold"> 評比</h2></div>
            <Progress value={areas.data && selectedArea ? (areas.data.findIndex(a => a.id.toString() === selectedArea) + 1) / areas.data.length * 100 : 0} className="mb-5" />
            <div className="flex items-center mb-5">
                <Button className="w-15 h-15" disabled={areas.data?.findIndex(a => a.id.toString() === selectedArea) === 0 || areas.data?.findIndex(a => a.id.toString() === selectedArea) === undefined}
                    onClick={() => {
                        // find the previous area in the areas list
                        const currentIndex = areas.data?.findIndex(a => a.id.toString() === selectedArea);
                        if (currentIndex && currentIndex > 0) {
                            setSelectedArea(areas.data?.[currentIndex - 1]?.id.toString());
                        }
                    }}><ArrowLeft /></Button>
                {/* shadcn select with all areas */}
                <Select onValueChange={(field) => {
                    setSelectedArea(field);
                }} defaultValue={areas.data?.[0]?.id.toString()} value={selectedArea}>
                    <SelectTrigger className="w-full mx-2 h-15! text-xl font-mono">
                        <SelectValue placeholder="請選擇" />
                    </SelectTrigger>
                    <SelectContent className="text-lg font-mono">
                        {areas.data?.map((area) => (
                            <SelectItem key={area.id} value={area.id.toString()}>{area.name} ({area.class.name})</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Button className="w-15 h-15" disabled={areas.data?.findIndex(a => a.id.toString() === selectedArea) === (areas.data?.length ?? 0) - 1 || areas.data?.findIndex(a => a.id.toString() === selectedArea) === undefined}
                    onClick={() => {
                        // find the next area in the areas list
                        const currentIndex = areas.data?.findIndex(a => a.id.toString() === selectedArea);
                        if (currentIndex !== undefined && currentIndex < (areas.data?.length ?? 0) - 1) {
                            setSelectedArea(areas.data?.[currentIndex + 1]?.id.toString());
                        }
                    }}><ArrowRight /></Button>
            </div>

            <Popover>
                <PopoverTrigger asChild>
                    <div>
                        <p>上一個檢查打掃日</p>
                        <Button
                            variant="outline"
                            data-empty={!standardDate}
                            className="data-[empty=true]:text-muted-foreground w-[280px] justify-start text-left font-normal"
                        >
                            <CalendarIcon />
                            {standardDate ? standardDate : <span>上一個檢查打掃日</span>}
                        </Button>
                    </div>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                    <Calendar mode="single" selected={new Date(standardDate)} onSelect={async (date) => {
                        setStandardDate(format(date, "yyyy-MM-dd"));
                        await defaults.refetch();
                    }} required />
                </PopoverContent>
            </Popover>

            {defaults.isSuccess ? (
                <div className="flex flex-wrap gap-2 mt-5">
                    <Dialog onOpenChange={async (open) => {
                        if (!open) {
                            setReportText("");
                            setRepeatedCount(1);
                            setUploadedImagePaths([]);
                            setFileUploadMsg(null);
                            await uploadedImageUrls.refetch();
                        }
                    }}>
                        {defaults.data?.map((defaultItem) => (
                            <DialogTrigger asChild key={defaultItem.id}>
                                <Button className={`${defaultItem.reportedToday ? "bg-red-600 text-white hover:bg-red-700" :
                                    defaultItem.repeatedToday > 1 ? "bg-yellow-600 text-white hover:bg-yellow-700" : ""
                                    } w-26 h-26 text-2xl`}
                                    onClick={() => {
                                        setReportText(defaultItem.text);
                                        setRepeatedCount(defaultItem.repeatedToday > 1 ? defaultItem.repeatedToday : 1);
                                    }}>
                                    <div>
                                        <p className="text-wrap">{defaultItem.shorthand}</p>
                                        <p className="text-sm mb-0">
                                            {defaultItem.repeatedToday > 1 ? `(連續${defaultItem.repeatedToday}日)` : ""}
                                        </p>
                                        <p className="text-sm mt-0">
                                            {defaultItem.reportedToday ? " (今日已回報)" : ""}
                                        </p>
                                    </div>
                                </Button>
                            </DialogTrigger>
                        ))}
                        <DialogTrigger asChild>
                            <Button variant="outline" className="w-25 h-25 text-2xl" onClick={() => {
                                setReportText("");
                                setRepeatedCount(1);
                            }}>自訂</Button>
                        </DialogTrigger>
                        <DialogContent onOpenAutoFocus={(e) => e.preventDefault()}>
                            <DialogHeader>
                                <DialogTitle>回報狀況</DialogTitle>
                                <DialogDescription>
                                    請確認以下狀況是否屬實，並按下送出。
                                </DialogDescription>
                            </DialogHeader>
                            <GeneratedForm schema={evaluateReportSchema}
                                formGen={formGen}
                                handleSubmit={async (data: z.infer<typeof evaluateReportSchema>) => {
                                    return await submitReport.mutateAsync(data)
                                        .then(async () => {
                                            setReportText("");
                                            setRepeatedCount(1);
                                            setUploadedImagePaths([]);
                                            setFileUploadMsg(null);
                                            await uploadedImageUrls.refetch();
                                            await defaults.refetch();
                                            await uploadUrl.refetch();
                                            return {
                                                success: true,
                                                message: "成功回報狀況"
                                            }
                                        });
                                }}
                            />
                        </DialogContent>
                    </Dialog>
                </div>
            ) : (
                <div className="space-y-1">
                    <div className="w-full space-y-3">
                        <Skeleton className="w-80 h-6 bg-gray-200 rounded-md"></Skeleton>
                        <Skeleton className="w-60 h-6 bg-gray-200 rounded-md"></Skeleton>
                        <Skeleton className="w-70 h-6 bg-gray-200 rounded-md"></Skeleton>
                        <Skeleton className="w-40 h-6 bg-gray-200 rounded-md"></Skeleton>
                        <Skeleton className="w-80 h-6 bg-gray-200 rounded-md"></Skeleton>
                        <Skeleton className="w-90 h-6 bg-gray-200 rounded-md"></Skeleton>
                        <Skeleton className="w-30 h-6 bg-gray-200 rounded-md"></Skeleton>
                    </div>
                </div>
            )}
        </div>
    );
}