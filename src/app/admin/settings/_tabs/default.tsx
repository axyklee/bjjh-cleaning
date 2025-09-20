"use client"

import { Button } from "~/components/ui/button";
import { Skeleton } from "~/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "~/components/ui/table";
import { api } from "~/trpc/react";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowDown, ArrowUp, Trash2 } from "lucide-react";
import GeneratedForm, { type zGenForm } from "~/_helper/generatedForm";
import { defaultCreateSchema } from "~/lib/schema/admin";
import type z from "zod";

export default function DefaultTab() {
    const queryClient = useQueryClient();

    const defaults = api.admin.settings.defaultGetAll.useQuery();
    const createDefault = api.admin.settings.defaultCreate.useMutation();
    const deleteDefault = api.admin.settings.defaultDelete.useMutation();

    const moveUpDefault = api.admin.settings.defaultMoveUp.useMutation();
    const moveDownDefault = api.admin.settings.defaultMoveDown.useMutation();

    const formGen: zGenForm = [
        {
            name: "shorthand",
            label: "簡寫",
            type: "text"
        },
        {
            name: "text",
            label: "完整訊息",
            type: "text"
        }
    ];

    return (
        defaults.isSuccess ? (
            <div className="w-[600px] md:w-[800px] max-w-[90vw]">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>簡寫</TableHead>
                            <TableHead>完整訊息</TableHead>
                            <TableHead>動作</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {defaults.data?.map((defaultItem) => (
                            <TableRow key={defaultItem.id}>
                                <TableCell>{defaultItem.shorthand}</TableCell>
                                <TableCell>{defaultItem.text}</TableCell>
                                <TableCell>
                                    <Button variant="outline" onClick={
                                        async () => {
                                            await moveUpDefault.mutateAsync(defaultItem.id);
                                            await queryClient.invalidateQueries();
                                        }
                                    } className="mr-2"><ArrowUp /> 上移</Button>
                                    <Button variant="outline" onClick={
                                        async () => {
                                            await moveDownDefault.mutateAsync(defaultItem.id);
                                            await queryClient.invalidateQueries();
                                        }
                                    } className="mr-2"><ArrowDown /> 下移</Button>
                                    <Button variant="destructive" onClick={
                                        async () => {
                                            await deleteDefault.mutateAsync(defaultItem.id);
                                            await queryClient.invalidateQueries();
                                        }
                                    }><Trash2 /></Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
                <div className="mt-3">
                    <GeneratedForm schema={defaultCreateSchema}
                        formGen={formGen}
                        handleSubmit={async (data: z.infer<typeof defaultCreateSchema>, form) => {
                            return await createDefault.mutateAsync(data)
                                .then(() => {
                                    form.reset();
                                    return {
                                        success: true,
                                        message: "成功加入掃區"
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