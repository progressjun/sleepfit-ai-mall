import { CheckCircle2Icon, ShieldAlertIcon, SparklesIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { WorkbenchRun } from "@/types";

export function WorkbenchRunSummary({ run }: { run: WorkbenchRun }) {
  const completed = run.tasks.filter((task) => task.status === "completed").length;

  return (
    <Card className="border-slate-200 bg-gradient-to-br from-white to-violet-50 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <SparklesIcon />
          {run.title}
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_280px]">
        <div className="flex flex-col gap-4">
          <p className="text-sm leading-6 text-slate-700">{run.summary}</p>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-2xl bg-white p-4 shadow-sm">
              <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-950">
                <CheckCircle2Icon className="text-emerald-600" />
                성공 기준
              </div>
              <ul className="flex flex-col gap-2 text-sm leading-6 text-slate-600">
                {run.successCriteria.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl bg-white p-4 shadow-sm">
              <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-950">
                <ShieldAlertIcon className="text-amber-600" />
                전제/리스크
              </div>
              <ul className="flex flex-col gap-2 text-sm leading-6 text-slate-600">
                {[...run.assumptions, ...run.riskNotes].slice(0, 5).map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
        <div className="rounded-2xl bg-slate-950 p-5 text-white">
          <p className="text-sm text-slate-300">작업 진행</p>
          <p className="mt-2 text-4xl font-semibold">
            {completed}/{run.tasks.length}
          </p>
          <p className="mt-4 text-sm leading-6 text-slate-300">
            실행된 작업은 생성 결과와 승인 대기열, 작업 로그에 바로 반영됩니다.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
