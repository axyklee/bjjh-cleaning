"use client";

import { useEffect, type Dispatch, type SetStateAction } from "react";
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";
import { Button } from "~/components/ui/button";
import { ButtonGroup } from "~/components/ui/button-group";
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent, type ChartConfig } from "~/components/ui/chart";
import { Input } from "~/components/ui/input";
import { Skeleton } from "~/components/ui/skeleton";

export default function Chart(props: {
    title: string;
    chartData: Record<string, unknown>[];
    chartConfig: ChartConfig;
    loading: boolean;
    dateRange: { startDate: string; endDate: string };
    setDateRange: Dispatch<SetStateAction<{
        startDate: string;
        endDate: string;
    }>>;
}) {
    const { title, chartData, chartConfig, loading, dateRange, setDateRange } = props;

    useEffect(() => {
        const today = new Date();
        const firstDayOfWeek = new Date(today.setDate(today.getDate() - today.getDay() + 1));
        const lastDayOfWeek = new Date(today.setDate(firstDayOfWeek.getDate() + 6));
        setDateRange({
            startDate: firstDayOfWeek.toISOString().split("T")[0]!,
            endDate: lastDayOfWeek.toISOString().split("T")[0]!,
        });
    }, []);

    return (<div className="md:w-[50%] w-full min-w-[300px] my-3">
        <div className="lg:flex justify-between items-center mb-3">
            <h3 className="text-lg">{title}</h3>
            <div className="flex items-center gap-2">
                <Input type="date" value={dateRange.startDate} onChange={(e) => {
                    setDateRange?.(prev => ({ ...prev, startDate: e.target.value }))
                }} />
                <p>~</p>
                <Input type="date" value={dateRange.endDate} onChange={(e) => {
                    setDateRange(prev => ({ ...prev, endDate: e.target.value }))
                }} />
                <ButtonGroup>
                    <Button size="sm" variant="outline" onClick={() => {
                        const today = new Date();
                        const firstDayOfWeek = new Date(today.setDate(today.getDate() - today.getDay() + 1));
                        const lastDayOfWeek = new Date(today.setDate(firstDayOfWeek.getDate() + 6));
                        setDateRange({
                            startDate: firstDayOfWeek.toISOString().split("T")[0]!,
                            endDate: lastDayOfWeek.toISOString().split("T")[0]!,
                        });
                    }}>
                        本週
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => {
                        const today = new Date();
                        const priorDate = new Date(new Date().setDate(today.getDate() - 7));
                        setDateRange({
                            startDate: priorDate.toISOString().split("T")[0]!,
                            endDate: today.toISOString().split("T")[0]!,
                        });
                    }}>
                        最近 7 天
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => {
                        const today = new Date();
                        const priorDate = new Date(new Date().setDate(today.getDate() - 30));
                        setDateRange({
                            startDate: priorDate.toISOString().split("T")[0]!,
                            endDate: today.toISOString().split("T")[0]!,
                        });
                    }}>
                        最近 30 天
                    </Button>
                </ButtonGroup>
            </div>
        </div>
        {
            !loading ? <ChartContainer config={chartConfig} className="min-h-[200px] max-h-[400px] w-full">
                <BarChart accessibilityLayer data={chartData}>
                    <CartesianGrid vertical={false} />
                    <XAxis
                        dataKey="key"
                        tickLine={false}
                        tickMargin={10}
                        axisLine={false}
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <ChartLegend content={<ChartLegendContent />} />
                    {Object.keys(chartConfig).map((key) => (
                        <Bar key={key} dataKey={key} stackId="a" fill={chartConfig[key]?.color ?? "#000000"} />
                    ))}
                </BarChart>
            </ChartContainer> : <Skeleton className="w-[50%] h-64" />
        }
    </div>);
}