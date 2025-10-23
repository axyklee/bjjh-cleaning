import { ChartBar } from "lucide-react";
import ByArea from "./_components/byArea";
import ByClass from "./_components/byClass";

export default function AnalyticsPage() {

    return (
        <div>
            <div className="flex items-center gap-2 mb-3"><ChartBar className="h-5 w-5" /><h2 className="text-xl font-bold"> 評比分析</h2></div>
            <div className="flex flex-col md:flex-row gap-5">
                <ByArea />
                <ByClass />
            </div>
        </div>
    )
}
