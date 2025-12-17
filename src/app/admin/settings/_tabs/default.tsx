"use client"

import { Button } from "~/components/ui/button";
import { Skeleton } from "~/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "~/components/ui/table";
import { api } from "~/trpc/react";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowDown, ArrowUp, GripVertical, Trash2 } from "lucide-react";
import GeneratedForm, { type zGenForm } from "~/_helper/generatedForm";
import { defaultCreateSchema } from "~/lib/schema/admin";
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

type DefaultItem = {
    id: number;
    shorthand: string;
    text: string;
};

function SortableDefaultRow({ defaultItem, onDelete, onMoveUp, onMoveDown }: {
    defaultItem: DefaultItem;
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
    } = useSortable({ id: defaultItem.id });

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
                    {defaultItem.shorthand}
                </div>
            </TableCell>
            <TableCell>{defaultItem.text}</TableCell>
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

export default function DefaultTab() {
    const queryClient = useQueryClient();

    const defaults = api.admin.settings.defaultGetAll.useQuery();
    const createDefault = api.admin.settings.defaultCreate.useMutation();
    const deleteDefault = api.admin.settings.defaultDelete.useMutation();

    const moveUpDefault = api.admin.settings.defaultMoveUp.useMutation();
    const moveDownDefault = api.admin.settings.defaultMoveDown.useMutation();
    const updateRanks = api.admin.settings.defaultUpdateRanks.useMutation();

    const [items, setItems] = useState<DefaultItem[]>(defaults.data ?? []);

    // Update items when defaults data changes
    React.useEffect(() => {
        if (defaults.data) {
            setItems(defaults.data);
        }
    }, [defaults.data]);

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
            await queryClient.invalidateQueries({ queryKey: [["admin", "settings", "defaultGetAll"]] });
        }
    };

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
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                >
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>簡寫</TableHead>
                                <TableHead>完整訊息</TableHead>
                                <TableHead>動作</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            <SortableContext
                                items={items.map(item => item.id)}
                                strategy={verticalListSortingStrategy}
                            >
                                {items.map((defaultItem) => (
                                    <SortableDefaultRow
                                        key={defaultItem.id}
                                        defaultItem={defaultItem}
                                        onDelete={async () => {
                                            if (confirm(`確定要刪除此預設訊息 ${defaultItem.shorthand} 嗎？`)) {
                                                await deleteDefault.mutateAsync(defaultItem.id);
                                                await queryClient.invalidateQueries({ queryKey: [["admin", "settings", "defaultGetAll"]] });
                                            }
                                        }}
                                        onMoveUp={async () => {
                                            await moveUpDefault.mutateAsync(defaultItem.id);
                                            await queryClient.invalidateQueries({ queryKey: [["admin", "settings", "defaultGetAll"]] });
                                        }}
                                        onMoveDown={async () => {
                                            await moveDownDefault.mutateAsync(defaultItem.id);
                                            await queryClient.invalidateQueries({ queryKey: [["admin", "settings", "defaultGetAll"]] });
                                        }}
                                    />
                                ))}
                            </SortableContext>
                        </TableBody>
                    </Table>
                </DndContext>
                <div className="mt-3">
                    <GeneratedForm schema={defaultCreateSchema}
                        formGen={formGen}
                        handleSubmit={async (data: z.infer<typeof defaultCreateSchema>) => {
                            return await createDefault.mutateAsync(data)
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