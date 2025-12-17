"use client"

import { Button } from "~/components/ui/button";
import { Skeleton } from "~/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "~/components/ui/table";
import { api } from "~/trpc/react";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowDown, ArrowUp, GripVertical, Trash2 } from "lucide-react";
import GeneratedForm, { type zGenForm } from "~/_helper/generatedForm";
import { areaCreateSchema } from "~/lib/schema/admin";
import type z from "zod";
import React, { useState } from "react";
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    type DragEndEvent,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

type AreaItem = {
    id: number;
    name: string;
    rank: number;
    class: {
        id: number;
        name: string;
    };
};

function SortableAreaRow({ areaItem, onDelete, onMoveUp, onMoveDown }: {
    areaItem: AreaItem;
    onDelete: () => void;
    onMoveUp: () => void;
    onMoveDown: () => void;
}) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: areaItem.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <TableRow ref={setNodeRef} style={style}>
            <TableCell>
                <div className="flex items-center gap-2">
                    <button
                        className="cursor-grab active:cursor-grabbing touch-none"
                        {...attributes}
                        {...listeners}
                    >
                        <GripVertical className="h-5 w-5 text-gray-400" />
                    </button>
                    {areaItem.name}
                </div>
            </TableCell>
            <TableCell>{areaItem.class.name}</TableCell>
            <TableCell>
                <Button variant="outline" onClick={onMoveUp} className="mr-2">
                    <ArrowUp /> 上移
                </Button>
                <Button variant="outline" onClick={onMoveDown} className="mr-2">
                    <ArrowDown /> 下移
                </Button>
                <Button variant="destructive" onClick={onDelete}>
                    <Trash2 />
                </Button>
            </TableCell>
        </TableRow>
    );
}

export default function AreaTab() {
    const queryClient = useQueryClient();

    const classes = api.admin.settings.classGetAll.useQuery();
    const areas = api.admin.settings.areaGetAll.useQuery();
    const createArea = api.admin.settings.areaCreate.useMutation();
    const deleteArea = api.admin.settings.areaDelete.useMutation();

    const moveUpArea = api.admin.settings.areaMoveUp.useMutation();
    const moveDownArea = api.admin.settings.areaMoveDown.useMutation();
    const updateRanks = api.admin.settings.areaUpdateRanks.useMutation();

    const [items, setItems] = useState<AreaItem[]>([]);

    // Update items when areas data changes
    React.useEffect(() => {
        if (areas.data) {
            setItems(areas.data);
        }
    }, [areas.data]);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            const oldIndex = items.findIndex((item) => item.id === active.id);
            const newIndex = items.findIndex((item) => item.id === over.id);

            const newItems = arrayMove(items, oldIndex, newIndex);
            setItems(newItems);

            // Update ranks based on new order
            const updates = newItems.map((item, index) => ({
                id: item.id,
                rank: index + 1,
            }));

            await updateRanks.mutateAsync(updates);
            await queryClient.invalidateQueries({ queryKey: [["admin", "settings", "areaGetAll"]] });
        }
    };

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
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                >
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>掃區</TableHead>
                                <TableHead>所屬班級</TableHead>
                                <TableHead>動作</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            <SortableContext
                                items={items.map(item => item.id)}
                                strategy={verticalListSortingStrategy}
                            >
                                {items.map((areaItem) => (
                                    <SortableAreaRow
                                        key={areaItem.id}
                                        areaItem={areaItem}
                                        onDelete={async () => {
                                            if (confirm(`確定要刪除掃區 ${areaItem.name} 嗎？`)) {
                                                await deleteArea.mutateAsync(areaItem.id);
                                                await queryClient.invalidateQueries({ queryKey: [["admin", "settings", "areaGetAll"]] });
                                            }
                                        }}
                                        onMoveUp={async () => {
                                            await moveUpArea.mutateAsync(areaItem.id);
                                            await queryClient.invalidateQueries({ queryKey: [["admin", "settings", "areaGetAll"]] });
                                        }}
                                        onMoveDown={async () => {
                                            await moveDownArea.mutateAsync(areaItem.id);
                                            await queryClient.invalidateQueries({ queryKey: [["admin", "settings", "areaGetAll"]] });
                                        }}
                                    />
                                ))}
                            </SortableContext>
                        </TableBody>
                    </Table>
                </DndContext>
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