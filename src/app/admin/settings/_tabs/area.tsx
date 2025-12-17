"use client"

import { Button } from "~/components/ui/button";
import { Skeleton } from "~/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "~/components/ui/table";
import { EditableCell, EditableSelectCell } from "~/components/ui/editable-cell";
import { api } from "~/trpc/react";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowDown, ArrowUp, Trash2 } from "lucide-react";
import GeneratedForm, { type zGenForm } from "~/_helper/generatedForm";
import { areaCreateSchema } from "~/lib/schema/admin";
import type z from "zod";

export default function AreaTab() {
    const queryClient = useQueryClient();

    const classes = api.admin.settings.classGetAll.useQuery();
    const areas = api.admin.settings.areaGetAll.useQuery();
    const createArea = api.admin.settings.areaCreate.useMutation();
    const updateArea = api.admin.settings.areaUpdate.useMutation();
    const deleteArea = api.admin.settings.areaDelete.useMutation();

    const moveUpArea = api.admin.settings.areaMoveUp.useMutation();
    const moveDownArea = api.admin.settings.areaMoveDown.useMutation();

    const formGen: zGenForm = [
        {
            name: "name",
            label: "掃區名稱",
            type: "text"
        },
        {
            name: "classId",
            label: "所屬班級",
            type: "select",
            options: classes.data?.map(c => ({ label: c.name, value: c.id })) ?? [],
        }
    ];

    return (
        areas.isSuccess ? (
            <div className="w-[600px] md:w-[800px] max-w-[90vw]">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>掃區</TableHead>
                            <TableHead>所屬班級</TableHead>
                            <TableHead>動作</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {areas.data?.map((areaItem) => (
                            <TableRow key={areaItem.id}>
                                <TableCell>
                                    <EditableCell
                                        value={areaItem.name}
                                        onSave={async (newName) => {
                                            await updateArea.mutateAsync({
                                                id: areaItem.id,
                                                name: newName,
                                                classId: areaItem.class.id.toString()
                                            });
                                            await queryClient.invalidateQueries();
                                        }}
                                    />
                                </TableCell>
                                <TableCell>
                                    <EditableSelectCell
                                        value={areaItem.class.id}
                                        options={classes.data?.map(c => ({ label: c.name, value: c.id })) ?? []}
                                        displayValue={areaItem.class.name}
                                        onSave={async (newClassId) => {
                                            await updateArea.mutateAsync({
                                                id: areaItem.id,
                                                name: areaItem.name,
                                                classId: newClassId.toString()
                                            });
                                            await queryClient.invalidateQueries();
                                        }}
                                    />
                                </TableCell>
                                <TableCell>
                                    <Button variant="outline" onClick={
                                        async () => {
                                            await moveUpArea.mutateAsync(areaItem.id);
                                            await queryClient.invalidateQueries();
                                        }
                                    } className="mr-2"><ArrowUp /> 上移</Button>
                                    <Button variant="outline" onClick={
                                        async () => {
                                            await moveDownArea.mutateAsync(areaItem.id);
                                            await queryClient.invalidateQueries();
                                        }
                                    } className="mr-2"><ArrowDown /> 下移</Button>
                                    <Button variant="destructive" onClick={
                                        async () => {
                                            if (confirm(`確定要刪除掃區 ${areaItem.name} 嗎？`)) {
                                                await deleteArea.mutateAsync(areaItem.id);
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
                    <GeneratedForm schema={areaCreateSchema}
                        formGen={formGen}
                        handleSubmit={async (data: z.infer<typeof areaCreateSchema>) => {
                            return await createArea.mutateAsync(data)
                                .then(() => {
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