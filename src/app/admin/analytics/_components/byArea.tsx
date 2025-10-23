"use client";

import { useEffect, useState } from "react";
import type { ChartConfig } from "~/components/ui/chart";
import { api } from "~/trpc/react";
import Chart from "./_components/chart";

export default function ByArea() {
    const [dateRange, setDateRange] = useState<{ startDate: string; endDate: string }>({
        startDate: new Date().toISOString().split("T")[0]!,
        endDate: new Date().toISOString().split("T")[0]!,
    });

    const chartData = api.admin.analytics.getReportsInRangeByArea.useQuery({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
    });
    const defaults = api.admin.analytics.getDefaultsAsArray.useQuery();
    const [chartConfig, setChartConfig] = useState<ChartConfig>({
        0: {
            label: "其他",
            color: "#000000",
        }
    });
    const [chartConfigCompleted, setChartConfigCompleted] = useState(false);

    useEffect(() => {
        if (defaults.data) {
            defaults.data.forEach((def, i) => {
                setChartConfig(prev => ({
                    ...prev,
                    [def.id]: {
                        label: def.shorthand,
                        color: "var(--chart-" + (i + 1) + ")",
                    }
                }));
            });
            setChartConfigCompleted(true);
        }
    }, [defaults.data]);

    return <Chart title="依掃區"
        chartData={chartData.data ?? []}
        chartConfig={chartConfig}
        loading={!chartConfigCompleted || chartData.isLoading}
        dateRange={dateRange}
        setDateRange={setDateRange}
        showXLabel={false}
    />

}