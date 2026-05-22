import { getSleepfitAdminMetrics } from "@/lib/sleepfit/events";

export const dynamic = "force-dynamic";

interface AdminPageProps {
  searchParams: Promise<{ key?: string; mallId?: string }>;
}

function pct(value: number) {
  return `${value.toFixed(1)}%`;
}

function number(value: number) {
  return new Intl.NumberFormat("ko-KR").format(value);
}

function MetricCard({ label, value, helper }: { label: string; value: string; helper: string }) {
  return (
    <section className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-slate-950">{value}</p>
      <p className="mt-1 text-xs text-slate-500">{helper}</p>
    </section>
  );
}

function StatusBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600">
      {children}
    </span>
  );
}

export default async function SleepfitAdminPage({ searchParams }: AdminPageProps) {
  const params = await searchParams;
  const requiredKey = process.env.SLEEPFIT_ADMIN_KEY || process.env.SLEEPFIT_ADMIN_TOKEN || "demo";
  const suppliedKey = params.key || "";
  const mallId = params.mallId || "sleepnsleepmall";

  if (suppliedKey !== requiredKey) {
    return (
      <main className="min-h-screen bg-slate-50 px-5 py-12 text-slate-950">
        <div className="mx-auto max-w-md rounded-md border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold text-slate-500">SleepFit AI Admin</p>
          <h1 className="mt-2 text-2xl font-semibold">운영 지표 보호키가 필요합니다</h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Vercel 환경변수 <code className="rounded bg-slate-100 px-1">SLEEPFIT_ADMIN_KEY</code>가 있으면 해당 키를
            사용합니다. 아직 운영 키를 설정하지 않은 배포에서는 <code className="rounded bg-slate-100 px-1">demo</code> 키로
            mock fallback 화면을 확인할 수 있습니다.
          </p>
          <form className="mt-5 space-y-3" action="/sleepfit-admin">
            <input
              name="key"
              type="password"
              placeholder="관리자 키"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none ring-slate-900/10 focus:ring-4"
            />
            <input type="hidden" name="mallId" value={mallId} />
            <button className="w-full rounded-md bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white">
              지표 보기
            </button>
          </form>
        </div>
      </main>
    );
  }

  const metrics = getSleepfitAdminMetrics(mallId);
  const keyMetrics = metrics.keyMetrics;

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-col gap-4 border-b border-slate-200 pb-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-500">SleepFit AI v1.5</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-normal">전환 성과 대시보드</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">{metrics.notes}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <StatusBadge>mall: {metrics.mallId}</StatusBadge>
            <StatusBadge>storage: {metrics.storageMode}</StatusBadge>
            <StatusBadge>{new Date(metrics.generatedAt).toLocaleString("ko-KR")}</StatusBadge>
          </div>
        </header>

        <section className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard label="전체 위젯 노출" value={number(keyMetrics.widgetViews)} helper="widget_view 기준" />
          <MetricCard label="진단 시작 수" value={number(keyMetrics.quizStarts)} helper={`시작률 ${pct(keyMetrics.quizStartRate)}`} />
          <MetricCard
            label="진단 완료율"
            value={pct(keyMetrics.quizCompletionRate)}
            helper={`${number(keyMetrics.recommendationShown)}회 추천 노출`}
          />
          <MetricCard label="CTA 클릭률" value={pct(keyMetrics.ctaClickRate)} helper={`${number(keyMetrics.ctaClicks)}회 클릭`} />
        </section>

        <section className="mt-6 grid gap-4 lg:grid-cols-2">
          <div className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="text-base font-semibold">A/B 그룹별 성과</h2>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[520px] text-left text-sm">
                <thead className="text-xs text-slate-500">
                  <tr>
                    <th className="py-2">그룹</th>
                    <th>시작률</th>
                    <th>추천 CTR</th>
                    <th>CTA 클릭률</th>
                    <th>추천 노출</th>
                  </tr>
                </thead>
                <tbody>
                  {metrics.abPerformance.map((item) => (
                    <tr key={item.abGroup} className="border-t border-slate-100">
                      <td className="py-3 font-semibold">{item.abGroup}</td>
                      <td>{pct(item.quizStartRate)}</td>
                      <td>{pct(item.recommendationCtr)}</td>
                      <td>{pct(item.ctaClickRate)}</td>
                      <td>{number(item.recommendationShown)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="text-base font-semibold">최근 7일 이벤트 추이</h2>
            <div className="mt-4 space-y-3">
              {metrics.recent7Days.map((day) => {
                const total = Math.max(day.widgetViews, day.quizStarts, day.recommendationShown, day.productClicks, 1);
                return (
                  <div key={day.date}>
                    <div className="flex justify-between text-xs text-slate-500">
                      <span>{day.date}</span>
                      <span>{number(day.productClicks)} clicks</span>
                    </div>
                    <div className="mt-1 h-2 rounded-full bg-slate-100">
                      <div
                        className="h-2 rounded-full bg-slate-900"
                        style={{ width: `${Math.max(6, (day.productClicks / total) * 100)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-4 lg:grid-cols-2">
          <div className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="text-base font-semibold">페이지별 성과</h2>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[560px] text-left text-sm">
                <thead className="text-xs text-slate-500">
                  <tr>
                    <th className="py-2">페이지</th>
                    <th>노출</th>
                    <th>시작</th>
                    <th>완료율</th>
                    <th>CTA</th>
                  </tr>
                </thead>
                <tbody>
                  {metrics.pagePerformance.map((item) => (
                    <tr key={item.pageType} className="border-t border-slate-100">
                      <td className="py-3 font-semibold">{item.pageType}</td>
                      <td>{number(item.widgetViews)}</td>
                      <td>{number(item.quizStarts)}</td>
                      <td>{pct(item.quizCompletionRate)}</td>
                      <td>{number(item.ctaClicks)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="text-base font-semibold">클릭 TOP 상품</h2>
            <div className="mt-4 space-y-3">
              {metrics.topProducts.map((item) => (
                <div key={item.productNo} className="flex items-center justify-between gap-4 rounded-md bg-slate-50 px-3 py-2">
                  <div>
                    <p className="text-sm font-medium">{item.name}</p>
                    <p className="text-xs text-slate-500">상품번호 {item.productNo} · CTR {pct(item.ctr)}</p>
                  </div>
                  <p className="text-sm font-semibold">{number(item.clicks)} 클릭</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-md border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-base font-semibold">시나리오별 성과</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {metrics.scenarioPerformance.map((item) => (
              <div key={item.scenario} className="rounded-md bg-slate-50 p-3">
                <p className="text-sm font-medium">{item.scenario}</p>
                <p className="mt-2 text-xs text-slate-500">
                  추천 {number(item.recommendationShown)}회 · CTR {pct(item.recommendationCtr)} · CTA {pct(item.ctaClickRate)}
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
