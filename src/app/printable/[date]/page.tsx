"use client"

import { format } from "date-fns";
import { useParams } from "next/navigation";
import { useEffect } from "react";
import Notification from "~/app/admin/_components/notification";
import { api } from "~/trpc/react";

export default function PrintablePage() {
  const params = useParams<{ date: string }>()
  const date = params.date ? new Date(params.date) : new Date();

  const reports = api.admin.home.getReportsSortedByClass.useQuery({
    date: date ? format(date, "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd")
  }, {
    enabled: !!date,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (reports.isSuccess) {
      window.print();
    }
  }, [reports.isSuccess]);

  return (<div className="bg-white">{
    reports.data?.map((c) => (
      <div key={c.id} className="mb-18!">
        <Notification className={c.name} date={reports.data ? format(date, "yyyy-MM-dd") : ""} time={format(
          c.reports.length > 0 ? new Date(c.reports[0]!.createdAt) : new Date()
          , "HH:mm")} reports={c.reports} />
      </div>
    ))
  }</div>);
}
