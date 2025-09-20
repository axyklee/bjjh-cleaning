"use client"

import { BrushCleaning } from "lucide-react";
import { useParams } from "next/navigation";
import { Skeleton } from "~/components/ui/skeleton";
import { api } from "~/trpc/react";

export default function Page() {
    const params = useParams<{ date: string, className: string }>()
    const { date, className } = params;

    const records = api.view.home.getRecords.useQuery({
        date,
        className
    });

    return (
        <div>
            <div className="flex items-center space-x-2 mb-4">
                <BrushCleaning />
                <h1 className="text-2xl font-bold">班級打掃工作紀錄</h1>
            </div>
            <h2 className="text-xl">班級: <code>{className}</code></h2>
            <h2 className="text-xl mb-4">日期: <code>{date}</code></h2>
            {records.isSuccess ? (
                <div className="space-y-4">
                    {records.data.length === 0 ? (
                        <p className="text-gray-500">今日打掃良好, 謝謝老師同學們的辛勞 :)</p>
                    ) : (
                        records.data.map((r) => (
                            <div key={r.id} className="p-4 border border-gray-200 rounded-md">
                                <h3 className="text-lg font-semibold mb-2 font-mono">
                                    {r.area.name} {r.repeated > 0 ? ` 連續 ${r.repeated} 日` : ""} {r.text}{r.comment ? ` (${r.comment})` : ""}
                                </h3>
                                <p className="text-sm text-gray-500 mb-4">回報時間: {new Date(r.createdAt).toLocaleString()}</p>
                                {r.evidence ? (
                                    <div className="space-x-2">
                                        {r.evidence.map((path: string, index: number) => (
                                            <img key={index} src={path} className="w-150 rounded" />
                                        ))}
                                    </div>
                                ) : null}
                            </div>
                        ))
                    )}
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