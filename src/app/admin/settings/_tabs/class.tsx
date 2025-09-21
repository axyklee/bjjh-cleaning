"use client"

import { Button } from "~/components/ui/button";
import { Skeleton } from "~/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "~/components/ui/table";
import { api } from "~/trpc/react";
import { useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import GeneratedForm, { type zGenForm } from "~/_helper/generatedForm";
import { classCreateSchema } from "~/lib/schema/admin";
import type z from "zod";

export default function ClassTab() {
    const queryClient = useQueryClient();

    const classes = api.admin.settings.classGetAll.useQuery();
    const createClass = api.admin.settings.classCreate.useMutation();
    const deleteClass = api.admin.settings.classDelete.useMutation();

    const formGen: zGenForm = [
        {
            name: "name",
            label: "班級名稱",
            type: "text"
        }
    ];

    return (
        classes.isSuccess ? (
            <div className="w-[600px] md:w-[800px] max-w-[90vw]">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>班級</TableHead>
                            <TableHead>動作</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {classes.data?.map((classItem) => (
                            <TableRow key={classItem.id}>
                                <TableCell>
                                    <code>{classItem.name}</code>
                                </TableCell>
                                <TableCell>
                                    <Button variant="destructive" onClick={
                                        async () => {
                                            if (confirm(`確定要刪除班級 ${classItem.name} 嗎？\n請確認該班級下沒有任何掃區, 否則無法刪除`)) {
                                                await deleteClass.mutateAsync(classItem.id);
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
                    <GeneratedForm schema={classCreateSchema}
                        formGen={formGen}
                        handleSubmit={async (data: z.infer<typeof classCreateSchema>, form) => {
                            return await createClass.mutateAsync(data)
                                .then(() => {
                                    return {
                                        success: true,
                                        message: "成功加入班級"
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