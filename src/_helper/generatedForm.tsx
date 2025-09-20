// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
/* eslint-disable */

"use client"

import { Button } from "~/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import { Switch } from "~/components/ui/switch";
import { Textarea } from "~/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { type ControllerRenderProps, useForm, type UseFormReturn } from "react-hook-form";
import { type z } from "zod";

export type zGenForm = {
    name: string;
    label: string;
    defaultValue?: string | number | boolean;
    type: "text" | "number" | "email" | "password" | "switch" | "textarea" | "select" | "hidden" | "custom";
    options?: { label: string; value: number }[]; // for select type
    helperText?: string;
    disabled?: boolean;
    custom?: (
        form: UseFormReturn<Record<string, any>, any, undefined>,
        field: ControllerRenderProps<Record<string, any>, string>
    ) => JSX.Element;
}[];

/**
 * 
 * @param schema Zod schema
 * @param defaultValues Default values conforming to the schema
 * @param handleSubmit Async function to handle form submission
 */
export default function GeneratedForm(props: {
    schema: z.ZodObject<any>,
    formGen: zGenForm,
    handleSubmit: (data: any, form: UseFormReturn<Record<string, any>, any, undefined>) => Promise<{
        success: boolean;
        message?: string;
    }>
}) {
    const queryClient = useQueryClient();

    const [disabled, setDisabled] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const { schema, formGen, handleSubmit } = props;

    const form = useForm<z.infer<typeof schema>>({
        resolver: zodResolver(schema),
        defaultValues: formGen.reduce((acc, item) => {
            acc[item.name] = item.defaultValue;
            return acc;
        }, {} as any),
        disabled
    });
    const formHandleSubmit = form.handleSubmit(async (data) => {
        // set is submitting to true
        setDisabled(true);
        const result = await handleSubmit(data, form);
        if (!result.success) {
            setError(result.message ?? "Failed to submit form");
            setSuccess(null);
        } else {
            setError(null);
            setSuccess(result.message ?? "Form submitted successfully");
        }
        await queryClient.invalidateQueries();
        setDisabled(false);
    });

    return (
        <Form {...form}>
            <form onSubmit={formHandleSubmit}>
                {
                    formGen.map((item) =>
                        <FormField key={item.name} control={form.control} name={item.name} render={({ field }) => (
                            <FormItem>
                                <div className="my-2 max-w-96">
                                    {
                                        item.type !== "hidden" ?
                                            <FormLabel className="mb-1" htmlFor={item.name}>{item.label}</FormLabel> : null
                                    }
                                    {
                                        item.type == "select" ?
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="請選擇" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {item.options?.map((option) => (
                                                        <SelectItem key={option.value} value={option.value.toString()}>{option.label}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            :
                                            <FormControl>
                                                {
                                                    item.type === "text" ? <Input className="w-full" disabled={item.disabled ?? false} {...field} /> :
                                                        item.type === "number" ? <Input className="w-full" type="number" disabled={item.disabled ?? false} {...field} /> :
                                                            item.type === "email" ? <Input className="w-full" type="email" disabled={item.disabled ?? false} {...field} /> :
                                                                item.type === "password" ? <Input className="w-full" type="password" disabled={item.disabled ?? false} {...field} /> :
                                                                    item.type === "switch" ? <Switch className="ml-2" checked={field.value} onCheckedChange={field.onChange} disabled={item.disabled ?? false} /> :
                                                                        item.type === "textarea" ? <Textarea className="w-full" disabled={item.disabled ?? false} {...field} /> :
                                                                            item.type === "hidden" ? <Input className="w-full" type="hidden" disabled={item.disabled ?? false} {...field} /> :
                                                                                item.type === "custom" ? item.custom!(form, field) : null
                                                }
                                            </FormControl>
                                    }
                                    {item.helperText && <FormDescription>{item.helperText}</FormDescription>}
                                    <FormMessage />
                                </div>
                            </FormItem>
                        )} />
                    )
                }
                <Button type="submit" disabled={disabled}>
                    送出
                </Button>
                {error && <p className="mt-2 text-red-500">{error}</p>}
                {success && <p className="mt-2 text-green-500">{success}</p>}
            </form>
        </Form>
    )
}