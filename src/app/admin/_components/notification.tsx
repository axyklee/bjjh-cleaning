"use client"

import { DialogTrigger } from "@radix-ui/react-dialog";
import { useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "~/components/ui/dialog";
import { Skeleton } from "~/components/ui/skeleton";
import { api } from "~/trpc/react";
import { QRCodeSVG } from 'qrcode.react';
import { Trash } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

export default function Notification(props: {
    className: string;
    date: string;
    time: string;
    showDelete?: boolean;
    reports: ({
        area: {
            name: string;
        },
        id: number;
        text: string;
        repeated: number;
        evidence: string | null;
        comment: string | null;
    })[]
}) {
    const { className, date, time, reports, showDelete } = props;
    const [selectedEvidencePaths, setSelectedEvidencePaths] = useState<string[]>([]);
    const queryClient = useQueryClient();

    const imgUrls = api.admin.evaluate.getImageUrls.useQuery({
        paths: selectedEvidencePaths
    }, {
        enabled: selectedEvidencePaths.length > 0,
        refetchOnWindowFocus: false,
    });
    const deleteReport = api.admin.home.reportDeleteOne.useMutation();
    const getBaseUrl = () => {
        if (typeof window !== 'undefined') {
            return window.location.origin;
        }
        return '';
    }

    return <Dialog>
        <div className="w-[19cm] relative">
            <QRCodeSVG value={`${getBaseUrl()}/view/${date}/${className}`} size={46} className="absolute right-0 top-0" />
            <table className="font-mono notification">
                <tbody>
                    <tr>
                        <td colSpan={12} className="title">
                            臺北市濱江實驗國民中學 班級打掃工作 改善通知單
                        </td>
                    </tr>
                    <tr>
                        <td colSpan={2}>班級</td>
                        <td colSpan={2}>{className}</td>
                        <td colSpan={2}>檢查日期</td>
                        <td colSpan={2}>{date}</td>
                        <td colSpan={2}>
                            {
                                reports.length > 0 ? "檢查時間" : "列印時間"
                            }
                        </td>
                        <td colSpan={2}>{time}</td>
                    </tr>
                    <tr>
                        <td colSpan={12} className="section-title">區域雜亂情形說明</td>
                    </tr>
                    {
                        reports.length > 0 ? reports.map((r, index) => (

                            <tr key={index}>
                                <DialogTrigger onClick={() => {
                                    setSelectedEvidencePaths((r.evidence ? JSON.parse(r.evidence) : []) as string[]);
                                }} asChild>
                                    <td className="text-start! border-x-0! border-l-1! cursor-pointer" colSpan={3}>
                                        {r.area.name}
                                    </td>
                                </DialogTrigger>
                                <DialogTrigger onClick={() => {
                                    setSelectedEvidencePaths((r.evidence ? JSON.parse(r.evidence) : []) as string[]);
                                }} asChild>
                                    <td className="text-start! border-x-0! cursor-pointer" colSpan={2}>
                                        {r.repeated > 1 ? ` 連續 ${r.repeated} 日` : ""}
                                    </td>
                                </DialogTrigger>
                                <DialogTrigger onClick={() => {
                                    setSelectedEvidencePaths((r.evidence ? JSON.parse(r.evidence) : []) as string[]);
                                }} asChild>
                                    <td className="text-start! border-x-0! border-r-1! cursor-pointer" colSpan={showDelete ? 6 : 7}>
                                        {r.text}{r.comment ? ` (${r.comment})` : ""}
                                    </td>
                                </DialogTrigger>
                                {showDelete ? <td className="text-start! border-l-0! border-r-1! p-0! bg-red-500 text-white cursor-pointer" colSpan={1}
                                    onClick={async () => {
                                        if (confirm(`確定要刪除 ${r.area.name} 的這筆紀錄嗎？`)) {
                                            await deleteReport.mutateAsync({ reportId: r.id });
                                            await queryClient.invalidateQueries();
                                        }
                                    }}>
                                    <div className="flex items-center justify-center"><Trash /></div>
                                </td> : null}
                            </tr>
                        )) : <tr><td className="text-start!" colSpan={12}>今日打掃良好，謝謝老師同學們的辛勞，請繼續保持 :)</td></tr>
                    }
                    {
                        reports.length > 0 &&
                            reports.length < 9 ? Array.from({ length: 9 - reports.length }).map((_, index) => (
                                <tr key={index}>
                                    <td colSpan={12}>&nbsp;</td>
                                </tr>
                            )) : reports.length === 0 ? Array.from({ length: 8 }).map((_, index) => (
                                <tr key={index}>
                                    <td colSpan={12}>&nbsp;</td>
                                </tr>
                            )) : null
                    }
                    <tr>
                        <td colSpan={8} className="footer-left">敬會導師協助督導 / 歡迎使用上方 QR Code 查看照片</td>
                        <td colSpan={4} className="footer">督導人員: 學務處</td>
                    </tr>
                    <DialogContent className="w-[90vw] max-w-5xl">
                        <DialogTitle>督導照片</DialogTitle>
                        <div className="space-y-4">
                            {imgUrls.isSuccess && imgUrls.data.length > 0 ? <div className="grid grid-cols-2 gap-2">
                                {
                                    imgUrls.data.map((url, index) => (
                                        <img key={index} src={url} alt={`evidence-${index}`} className="w-full h-auto rounded-md" />
                                    ))
                                }
                            </div> : selectedEvidencePaths.length === 0 ? <p>無證明照片</p> : <div className="space-y-1">
                                <div className="w-full space-y-3">
                                    <Skeleton className="w-full h-96 bg-gray-200 rounded-md"></Skeleton>
                                </div>
                            </div>}
                        </div>
                    </DialogContent>
                    <style>{`
                table.notification {
                    border-collapse: collapse;
                    margin: auto;
                    width: 19cm;
                    height: 12.8cm;
                    table-layout: fixed;
                    overflow: clip;
                    white-space: nowrap;
                }
                table.notification td, table.notification th {
                    border: 1px solid black;
                    padding: 0 5px;
                    text-align: center;
                    height: 0.7cm;
                    width: 16.66%;
                    font-size: 16px;
                }
                table.notification td.title {
                    font-size: 22px;
                    font-weight: bold;
                    border: none;
                }
                table.notification td.section-title {
                    background-color: #dcdcdc;
                    font-weight: bold;
                }
                table.notification td.footer {
                    border: none;
                    text-align: right;
                    padding-top: 0;
                }
                table.notification td.footer-left {
                    border: none;
                    text-align: left;
                    padding-top: 0;
                }
            `}</style>
                </tbody>
            </table>
        </div>
    </Dialog >;
}