"use client"

import { Button } from "~/components/ui/button";
import { Skeleton } from "~/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "~/components/ui/table";
import { EditableCell } from "~/components/ui/editable-cell";
import { api } from "~/trpc/react";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowDown, ArrowUp, Trash2 } from "lucide-react";
import GeneratedForm, { type zGenForm } from "~/_helper/generatedForm";
import { announcementCreateSchema } from "~/lib/schema/admin";
import type z from "zod";

export default function AnnouncementTab() {
    const queryClient = useQueryClient();

    const announcements = api.admin.settings.announcementGetAll.useQuery();
    const createAnnouncement = api.admin.settings.announcementCreate.useMutation();
    const updateAnnouncement = api.admin.settings.announcementUpdate.useMutation();
    const deleteAnnouncement = api.admin.settings.announcementDelete.useMutation();

    const moveUpAnnouncement = api.admin.settings.announcementMoveUp.useMutation();
    const moveDownAnnouncement = api.admin.settings.announcementMoveDown.useMutation();

    const formGen: zGenForm = [
        {
            name: "content",
            label: "公告訊息",
            type: "text"
        }
    ];

    return (
        announcements.isSuccess ? (
            <div className="w-[600px] md:w-[800px] max-w-[90vw]">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>公告訊息</TableHead>
                            <TableHead>動作</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {announcements.data?.map((announcement) => (
                            <TableRow key={announcement.id}>
                                <TableCell>
                                    <EditableCell
                                        value={announcement.content}
                                        onSave={async (newContent) => {
                                            await updateAnnouncement.mutateAsync({
                                                id: announcement.id,
                                                content: newContent
                                            });
                                            await queryClient.invalidateQueries();
                                        }}
                                    />
                                </TableCell>
                                <TableCell>
                                    <Button variant="outline" onClick={
                                        async () => {
                                            await moveUpAnnouncement.mutateAsync(announcement.id);
                                            await queryClient.invalidateQueries();
                                        }
                                    } className="mr-2"><ArrowUp /> 上移</Button>
                                    <Button variant="outline" onClick={
                                        async () => {
                                            await moveDownAnnouncement.mutateAsync(announcement.id);
                                            await queryClient.invalidateQueries();
                                        }
                                    } className="mr-2"><ArrowDown /> 下移</Button>
                                    <Button variant="destructive" onClick={
                                        async () => {
                                            if (confirm(`確定要刪除此公告 ${announcement.content} 嗎？`)) {
                                                await deleteAnnouncement.mutateAsync(announcement.id);
                                                await queryClient.invalidateQueries();
                                            }
                                        }
                                    }><Trash2 /></Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
                <div className="mt-3">
                    <GeneratedForm schema={announcementCreateSchema}
                        formGen={formGen}
                        handleSubmit={async (data: z.infer<typeof announcementCreateSchema>) => {
                            return await createAnnouncement.mutateAsync(data)
                                .then(() => {
                                    return {
                                        success: true,
                                        message: "成功加入公告"
                                    }
                                })
                                .catch((err: Error) => {
                                    return {
                                        success: false,
                                        message: err.message
                                    }
                                })
                        }}
                    />
                </div>
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
        )
    );

}