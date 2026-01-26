"use client";

import { format } from 'date-fns';
import { CalendarIcon, Check, CircleQuestionMark, Download, HomeIcon, Printer } from 'lucide-react';
import { useState } from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '~/components/ui/accordion';
import { Button } from '~/components/ui/button';
import { Calendar } from '~/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '~/components/ui/popover';
import { api } from '~/trpc/react';
import Notification from './_components/notification';
import Link from 'next/link';
import { Skeleton } from '~/components/ui/skeleton';
import { Badge } from '~/components/ui/badge';
import JSZip from 'jszip';
import { Progress } from '~/components/ui/progress';
import { Tooltip, TooltipContent, TooltipTrigger } from '~/components/ui/tooltip';
import { asyncPool } from '~/lib/utils';

const AdminPage = () => {
    const [date, setDate] = useState<Date>(new Date());
    const reports = api.admin.home.getReportsSortedByClass.useQuery({
        date: date ? format(date, "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd")
    }, {
        enabled: !!date,
        refetchOnWindowFocus: false,
    });
    const downloadReports = api.admin.home.downloadReports.useMutation();
    const [downloadStatus, setDownloadStatus] = useState(0);

    return (
        <div>
            <div className="flex items-center gap-2 mb-3"><HomeIcon className="h-5 w-5" /><h2 className="text-xl font-bold"> 檢視打掃狀況</h2></div>
            <div className="flex items-center flex-wrap gap-2">
                <Popover>
                    <PopoverTrigger asChild>
                        <Button
                            variant="outline"
                            data-empty={!date}
                            className="data-[empty=true]:text-muted-foreground w-[280px] justify-start text-left font-normal"
                        >
                            <CalendarIcon />
                            {date ? format(date, "yyyy-MM-dd") : <span>請選擇日期</span>}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                        <Calendar mode="single" selected={date} onSelect={setDate} required />
                    </PopoverContent>
                </Popover>
                <Link href={`/printable/${date ? format(date, "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd")}`} target="_blank">
                    <Button>
                        <Printer />
                        列印所有通知單
                    </Button>
                </Link>
                <Link href={`printable/${date ? format(date, "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd")}?interleaved=true`} target="_blank">
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="outline">
                                <Printer />
                                列印 (交錯分頁)
                                <CircleQuestionMark className="ml-1 h-4 w-4" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom">
                            因通知單為 A5 大小，交錯分頁方便裁切後保持順序。
                            <img src="/interleaved_example.png" alt="交錯分頁示意圖" className="mt-2 w-[150px] border" />
                        </TooltipContent>
                    </Tooltip>

                </Link>
                <Button
                    disabled={!reports.data || reports.data.length === 0 || downloadStatus > 0}
                    onClick={async () => {
                        setDownloadStatus(0);
                        const data = await downloadReports.mutateAsync({ date: date ? format(date, "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd") });
                        const zip = new JSZip();

                        const evidenceCount = data.map(c => c.evidence.length).reduce((a, b) => a + b, 0);
                        let processedCount = 0;

                        const tasks = data.map((report) => async () => {
                            const folder = zip.folder(report.area.class.name) ?? zip;
                            const areaName = report.area.name;
                            const content =  `地點: ${areaName}
日期: ${report.date}
時間: ${format(new Date(report.createdAt), "HH:mm")}
狀況: ${report.text}
備註: ${report.comment ?? "無"}\n`;
                            const fileName = `${areaName}_${report.text}_${report.id}.txt`;
                            folder.file(fileName, content);

                            await Promise.all(report.evidence.map(async (url, index) => {
                                const imgData = await fetch(url).then(res => res.blob());
                                const imgFileName = `${areaName}_${report.text}_${report.id}_img${index + 1}.png`;
                                folder.file(imgFileName, imgData);

                                processedCount += 1;
                                setDownloadStatus(Math.floor((1.0 * processedCount / evidenceCount) * 100));
                            }));

                            return undefined;
                        });
                        await asyncPool<undefined>(5, tasks);

                        const blob = await zip.generateAsync({ type: "blob" });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement("a");
                        a.href = url;
                        a.download = `reports_${date ? format(date, "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd")}.zip`;
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        URL.revokeObjectURL(url);
                        setDownloadStatus(0);
                    }}>
                    {
                        downloadStatus > 0 ? "下載中..." : <>
                            <Download />下載今日資料
                        </>
                    }
                </Button>
                {
                    downloadStatus > 0 && <Progress className="ml-2 w-[200px]" value={downloadStatus ? 100 : 0} />
                }
            </div>
            {
                reports.isSuccess ? (
                    <Accordion type="multiple" className="mt-4 w-full">
                        {
                            reports.data?.map((c) => (
                                <AccordionItem key={c.id} value={c.id.toString()}>
                                    <AccordionTrigger>
                                        <div className='font-mono'>
                                            {c.name}
                                            {c.reports.length > 0 ? <Badge variant="secondary" className="ml-2 bg-yellow-500">{c.reports.length}</Badge> :
                                                <Badge variant="secondary" className="ml-2 bg-green-500"><Check /></Badge>}
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent className="w-full flex items-center justify-center">
                                        <div className="overflow-x-auto">
                                            <Notification className={c.name} date={reports.data ? format(date, "yyyy-MM-dd") : ""}
                                                showDelete={true}
                                                time={format(c.reports.length > 0 ? new Date(c.reports[0]!.createdAt) :
                                                    new Date(), "HH:mm")} reports={c.reports} />
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                            ))
                        }
                    </Accordion>
                ) : <div className="space-y-1 mt-5">
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
        </div>
    )
};

export default AdminPage;
