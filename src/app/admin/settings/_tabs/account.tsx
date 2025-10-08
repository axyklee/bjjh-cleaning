"use client"

import { Button } from "~/components/ui/button";
import { Skeleton } from "~/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "~/components/ui/table";
import { api } from "~/trpc/react";
import { useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import GeneratedForm, { type zGenForm } from "~/_helper/generatedForm";
import { accountCreateSchema } from "~/lib/schema/admin";
import type z from "zod";

export default function AccountTab() {
    const queryClient = useQueryClient();

    const defaults = api.admin.settings.accountGetAll.useQuery();
    const createDefault = api.admin.settings.accountCreate.useMutation();
    const deleteDefault = api.admin.settings.accountDelete.useMutation();

    const formGen: zGenForm = [
        {
            name: "email",
            label: "電子郵件",
            type: "email"
        }
    ];

    return (
        defaults.isSuccess ? (
            <div className="w-[600px] md:w-[800px] max-w-[90vw]">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>電子郵件</TableHead>
                            <TableHead>動作</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {defaults.data?.map((defaultItem) => (
                            <TableRow key={defaultItem.id}>
                                <TableCell>{defaultItem.email}</TableCell>
                                <TableCell>
                                    <Button variant="destructive" onClick={
                                        async () => {
                                            if (confirm(`確定要刪除此帳號 ${defaultItem.email} 嗎？`)) {
                                                await deleteDefault.mutateAsync(defaultItem.id);
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
                    <GeneratedForm schema={accountCreateSchema}
                        formGen={formGen}
                        handleSubmit={async (data: z.infer<typeof accountCreateSchema>) => {
                            return await createDefault.mutateAsync(data)
                                .then(() => {
                                    return {
                                        success: true,
                                        message: "成功加入帳號"
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