import { Settings } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import ClassTab from "./_tabs/class";
import AreaTab from "./_tabs/area";
import DefaultTab from "./_tabs/default";

export default function SettingsPage() {
    return (<div>
        <div className="flex items-center gap-2 mb-3"><Settings className="h-5 w-5" /><h2 className="text-xl font-bold"> 後端設定</h2></div>
        <Tabs defaultValue="class" className="w-[400px]">
            <TabsList>
                <TabsTrigger value="class">班級</TabsTrigger>
                <TabsTrigger value="area">掃區</TabsTrigger>
                <TabsTrigger value="default">預設髒亂情況</TabsTrigger>
            </TabsList>
            <TabsContent value="class"><ClassTab /></TabsContent>
            <TabsContent value="area"><AreaTab /></TabsContent>
            <TabsContent value="default"><DefaultTab /></TabsContent>
        </Tabs>

    </div>);
}