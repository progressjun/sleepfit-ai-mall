"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  BrainIcon,
  CheckCircle2Icon,
  ClipboardListIcon,
  EraserIcon,
  EyeOffIcon,
  KeyRoundIcon,
  Loader2Icon,
  LockIcon,
  MessageSquareTextIcon,
  RefreshCwIcon,
  SendIcon,
  ShieldIcon,
  TerminalSquareIcon,
  Trash2Icon,
  WandSparklesIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type {
  AgentAccessMode,
  AgentClientSettings,
  AgentMemory,
  AgentMessage,
  AgentReview,
  AgentToolEvent,
} from "@/lib/agent/types";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "hermes-agent-state-v1";

interface StoredAgentState {
  settings: AgentClientSettings;
  messages: AgentMessage[];
  memories: AgentMemory[];
  reviews: AgentReview[];
  toolEvents: AgentToolEvent[];
}

interface MemoryCandidate {
  text: string;
  importance: number;
}

const defaultSettings: AgentClientSettings = {
  apiKey: "",
  model: "gpt-5.4-mini",
  accessMode: "auto",
  workingDirectory: "",
  maxToolSteps: 8,
};

const starterMessage: AgentMessage = {
  id: "starter",
  role: "assistant",
  content:
    "Hermes 운영 에이전트 준비됨. Cafe24형 이전, 스킨, 상품상세, CS, 전환 스크립트, 결제 테스트를 자연어로 요청하면 계획과 실행 결과를 이 화면에서 정리합니다.",
  createdAt: new Date().toISOString(),
};

const commercePrompts = [
  "현재 프로젝트를 Cafe24 운영 기준으로 전면 점검하고 차단 요소만 정리해줘",
  "상품상세 3개를 과장 표현 없이 다시 만들고 승인 대기 항목까지 정리해줘",
  "GA4, Meta, Naver 구매 이벤트 테스트 계획과 중복 전환 방지 체크리스트를 만들어줘",
  "게시판/상품문의 상담원 매크로와 금지 표현 검수표를 만들어줘",
];

function createId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function todayKey(value = new Date()) {
  return value.toLocaleDateString("en-CA");
}

function isReviewDue(reviews: AgentReview[]) {
  if (reviews.length === 0) return true;
  return todayKey(new Date(reviews[0].createdAt)) !== todayKey();
}

function mergeMemoryCandidates(current: AgentMemory[], candidates: MemoryCandidate[]) {
  const now = new Date().toISOString();
  const seen = new Set(current.map((memory) => memory.text.trim().toLowerCase()));
  const additions = candidates
    .map((candidate) => ({
      id: createId("memory"),
      text: candidate.text.trim(),
      weight: Math.min(Math.max(candidate.importance || 3, 1), 5),
      createdAt: now,
      lastUsedAt: now,
    }))
    .filter((candidate) => candidate.text && !seen.has(candidate.text.toLowerCase()));

  return [...additions, ...current].sort((a, b) => b.weight - a.weight).slice(0, 120);
}

function mergeReviewMemories(current: AgentMemory[], updates: string[]) {
  return mergeMemoryCandidates(
    current,
    updates.map((text) => ({ text, importance: 4 })),
  );
}

function displaySecret(value: string) {
  if (!value) return "키 없음";
  if (value.length <= 10) return "저장됨";
  return `${value.slice(0, 4)}...${value.slice(-4)}`;
}

export function HermesAgentClient() {
  const [hydrated, setHydrated] = useState(false);
  const [settings, setSettings] = useState<AgentClientSettings>(defaultSettings);
  const [messages, setMessages] = useState<AgentMessage[]>([starterMessage]);
  const [memories, setMemories] = useState<AgentMemory[]>([]);
  const [reviews, setReviews] = useState<AgentReview[]>([]);
  const [toolEvents, setToolEvents] = useState<AgentToolEvent[]>([]);
  const [draft, setDraft] = useState(commercePrompts[0]);
  const [error, setError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [isReviewing, setIsReviewing] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const canSend = Boolean(settings.apiKey.trim()) && Boolean(draft.trim()) && !isSending;
  const latestReview = reviews[0];

  const activityStats = useMemo(
    () => [
      { label: "대화", value: messages.length },
      { label: "기억", value: memories.length },
      { label: "도구 실행", value: toolEvents.length },
    ],
    [messages.length, memories.length, toolEvents.length],
  );

  useEffect(() => {
    queueMicrotask(() => {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        try {
          const stored = JSON.parse(raw) as Partial<StoredAgentState>;
          setSettings({ ...defaultSettings, ...(stored.settings ?? {}) });
          setMessages(stored.messages?.length ? stored.messages : [starterMessage]);
          setMemories(stored.memories ?? []);
          setReviews(stored.reviews ?? []);
          setToolEvents(stored.toolEvents ?? []);
        } catch {
          window.localStorage.removeItem(STORAGE_KEY);
        }
      }
      setHydrated(true);
    });
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const stored: StoredAgentState = {
      settings,
      messages,
      memories,
      reviews,
      toolEvents,
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
  }, [hydrated, settings, messages, memories, reviews, toolEvents]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!hydrated || !settings.apiKey || messages.length < 4 || !isReviewDue(reviews) || isReviewing) return;
    void runDailyReview();
    // Daily review should only auto-fire once after local state hydration.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated]);

  function updateSetting<Key extends keyof AgentClientSettings>(key: Key, value: AgentClientSettings[Key]) {
    setSettings((current) => ({ ...current, [key]: value }));
  }

  async function sendMessage() {
    if (!canSend) return;
    setError(null);
    setIsSending(true);

    const userMessage: AgentMessage = {
      id: createId("msg"),
      role: "user",
      content: draft.trim(),
      createdAt: new Date().toISOString(),
    };
    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setDraft("");

    try {
      const response = await fetch("/api/agent/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiKey: settings.apiKey,
          model: settings.model,
          accessMode: settings.accessMode,
          workingDirectory: settings.workingDirectory,
          maxToolSteps: settings.maxToolSteps,
          messages: nextMessages.map(({ role, content, createdAt }) => ({ role, content, createdAt })),
          memories,
        }),
      });

      const payload = await response.json();
      if (!response.ok) throw new Error(payload.message ?? "Agent request failed.");

      setMessages((current) => [...current, payload.message as AgentMessage]);
      setToolEvents((current) => [...((payload.toolEvents ?? []) as AgentToolEvent[]), ...current].slice(0, 100));
      setMemories((current) => mergeMemoryCandidates(current, (payload.memoryCandidates ?? []) as MemoryCandidate[]));
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "Agent request failed.";
      setError(message);
      setMessages((current) => [
        ...current,
        {
          id: createId("msg"),
          role: "assistant",
          content: `처리 중 오류가 발생했습니다: ${message}`,
          createdAt: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsSending(false);
    }
  }

  async function runDailyReview() {
    if (!settings.apiKey || isReviewing || messages.length < 2) return;
    setError(null);
    setIsReviewing(true);

    try {
      const response = await fetch("/api/agent/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiKey: settings.apiKey,
          model: settings.model,
          messages: messages.map(({ role, content, createdAt }) => ({ role, content, createdAt })),
          memories,
        }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.message ?? "Daily review failed.");

      const review = payload.review as AgentReview;
      setReviews((current) => [review, ...current].slice(0, 30));
      setMemories((current) => mergeReviewMemories(current, review.memoryUpdates));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Daily review failed.");
    } finally {
      setIsReviewing(false);
    }
  }

  function clearConversation() {
    setMessages([starterMessage]);
    setToolEvents([]);
    setError(null);
  }

  function resetAgent() {
    setSettings(defaultSettings);
    setMessages([starterMessage]);
    setMemories([]);
    setReviews([]);
    setToolEvents([]);
    setDraft(commercePrompts[0]);
    setError(null);
    window.localStorage.removeItem(STORAGE_KEY);
  }

  return (
    <div className="flex flex-col gap-5">
      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="grid gap-0 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="p-6">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="bg-slate-950 text-white hover:bg-slate-950">Hermes Operator</Badge>
              <Badge variant="outline">로컬 도구 실행 가능</Badge>
              <Badge variant="secondary">승인 전 자동 적용 금지</Badge>
            </div>
            <h1 className="mt-5 text-2xl font-semibold leading-tight text-slate-950 2xl:text-3xl">
              커머스 이전 프로젝트를 자연어로 지휘하는 작업 에이전트
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
              Hermes는 일반 챗봇이 아니라 파일 확인, 명령 실행, 작업 기억, 일일 리뷰까지 묶은 운영 워크스테이션입니다. Cafe24형 이전/스킨/상세/CS/스크립트 작업을 한 문장으로 맡기고 결과를 검수하세요.
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              {activityStats.map((stat) => (
                <div key={stat.label} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <p className="text-xs text-slate-500">{stat.label}</p>
                  <p className="mt-1 text-2xl font-semibold text-slate-950">{stat.value}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-slate-950 p-6 text-white">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm text-slate-300">실행 모드</p>
                <p className="mt-2 text-2xl font-semibold">
                  {settings.accessMode === "auto" ? "Owner mode" : "Chat mode"}
                </p>
              </div>
              {settings.accessMode === "auto" ? <TerminalSquareIcon className="size-9 text-emerald-300" /> : <LockIcon className="size-9 text-slate-300" />}
            </div>
            <div className="mt-6 rounded-lg bg-white/10 p-4 text-sm leading-6 text-slate-200">
              API Key: {displaySecret(settings.apiKey)}
              <br />
              Model: {settings.model}
              <br />
              Tool steps: {settings.maxToolSteps}
            </div>
            <p className="mt-4 text-xs leading-5 text-slate-300">
              API 키는 이 브라우저의 localStorage와 서버 route 요청에만 사용됩니다. 실제 서비스화 단계에서는 서버 저장소와 암호화가 필요합니다.
            </p>
          </div>
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
        <section className="flex min-w-0 flex-col gap-5">
          <Card className="min-h-[620px] border-slate-200 bg-white shadow-sm">
            <CardHeader className="border-b border-slate-100">
              <CardTitle className="flex items-center gap-2">
                <MessageSquareTextIcon />
                작업 대화
              </CardTitle>
              <CardDescription>
                {settings.accessMode === "auto"
                  ? "로컬 파일 확인과 명령 실행까지 허용된 모드입니다."
                  : "대화만 수행하고 로컬 도구 실행은 막습니다."}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex min-h-[540px] flex-col gap-4 pt-4">
              <div ref={scrollRef} className="flex h-[420px] flex-col gap-3 overflow-y-auto pr-2">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={cn(
                      "max-w-[86%] rounded-lg px-4 py-3 text-sm leading-6 shadow-sm",
                      message.role === "user"
                        ? "self-end bg-slate-950 text-white"
                        : "self-start border border-slate-200 bg-slate-50 text-slate-800",
                    )}
                  >
                    <div className="whitespace-pre-wrap">{message.content}</div>
                    <div className={cn("mt-2 text-[11px]", message.role === "user" ? "text-slate-300" : "text-slate-500")}>
                      {new Date(message.createdAt).toLocaleString()}
                    </div>
                  </div>
                ))}
                {isSending ? (
                  <div className="flex items-center gap-2 self-start rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 shadow-sm">
                    <Loader2Icon className="animate-spin" />
                    작업을 해석하고 실행 중입니다...
                  </div>
                ) : null}
              </div>

              {error ? (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
              ) : null}

              <div className="flex flex-col gap-3">
                <Textarea
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
                      event.preventDefault();
                      void sendMessage();
                    }
                  }}
                  placeholder="예: 상품상세 3개와 전환 스크립트 테스트 계획을 만들어줘"
                  className="min-h-24 resize-none text-sm leading-6"
                />
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap gap-2">
                    <Button onClick={sendMessage} disabled={!canSend} className="bg-slate-950 text-white hover:bg-slate-800">
                      {isSending ? <Loader2Icon className="animate-spin" /> : <SendIcon />}
                      실행 요청
                    </Button>
                    <Button variant="outline" onClick={clearConversation}>
                      <EraserIcon />
                      대화 초기화
                    </Button>
                  </div>
                  <p className="text-xs text-slate-500">Ctrl Enter 전송</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <WandSparklesIcon />
                커머스 작업 프롬프트
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2 md:grid-cols-2">
              {commercePrompts.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => setDraft(prompt)}
                  className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 text-left text-sm leading-6 text-slate-700 hover:bg-white"
                >
                  {prompt}
                </button>
              ))}
            </CardContent>
          </Card>
        </section>

        <aside className="flex min-w-0 flex-col gap-5">
          <Card className="border-slate-200 bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <KeyRoundIcon />
                실행 환경
              </CardTitle>
              <CardDescription>Local only · {displaySecret(settings.apiKey)}</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <Input
                type="password"
                value={settings.apiKey}
                onChange={(event) => updateSetting("apiKey", event.target.value)}
                placeholder="OpenAI API key"
                autoComplete="off"
              />
              <Input value={settings.model} onChange={(event) => updateSetting("model", event.target.value)} placeholder="Model" />
              <Input
                value={settings.workingDirectory}
                onChange={(event) => updateSetting("workingDirectory", event.target.value)}
                placeholder="Working directory, blank = user home"
              />
              <div className="grid grid-cols-2 gap-2">
                {(["auto", "chat"] as AgentAccessMode[]).map((mode) => (
                  <Button
                    key={mode}
                    type="button"
                    variant={settings.accessMode === mode ? "default" : "outline"}
                    onClick={() => updateSetting("accessMode", mode)}
                    className={cn(settings.accessMode === mode && "bg-slate-950 text-white hover:bg-slate-800")}
                  >
                    {mode === "auto" ? <TerminalSquareIcon /> : <ShieldIcon />}
                    {mode === "auto" ? "Owner" : "Chat"}
                  </Button>
                ))}
              </div>
              <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                Tool steps
                <Input
                  type="number"
                  min={0}
                  max={8}
                  value={settings.maxToolSteps}
                  onChange={(event) => updateSetting("maxToolSteps", Number(event.target.value))}
                />
              </label>
            </CardContent>
          </Card>

          <Card className="border-slate-200 bg-white shadow-sm">
            <CardHeader className="flex-row items-start justify-between gap-3">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <RefreshCwIcon className={isReviewing ? "animate-spin" : ""} />
                  일일 리뷰
                </CardTitle>
                <CardDescription>{latestReview ? new Date(latestReview.createdAt).toLocaleString() : "아직 리뷰 없음"}</CardDescription>
              </div>
              <Button variant="outline" size="icon" onClick={runDailyReview} disabled={isReviewing || !settings.apiKey || messages.length < 2}>
                {isReviewing ? <Loader2Icon className="animate-spin" /> : <RefreshCwIcon />}
              </Button>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {latestReview ? (
                <>
                  <p className="text-sm leading-6 text-slate-700">{latestReview.summary}</p>
                  <div className="flex flex-col gap-2">
                    {latestReview.nextSuggestions.slice(0, 4).map((item) => (
                      <div key={item} className="rounded-lg bg-slate-50 px-3 py-2 text-xs leading-5 text-slate-700">
                        {item}
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <p className="text-sm leading-6 text-slate-600">대화와 기억을 복습해 다음 작업 지시 품질을 높입니다.</p>
              )}
            </CardContent>
          </Card>

          <Card className="border-slate-200 bg-white shadow-sm">
            <CardHeader className="flex-row items-start justify-between gap-3">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <BrainIcon />
                  작업 기억
                </CardTitle>
                <CardDescription>{memories.length}개 저장</CardDescription>
              </div>
              <Button variant="outline" size="icon" onClick={() => setMemories([])} aria-label="Clear memory">
                <EyeOffIcon />
              </Button>
            </CardHeader>
            <CardContent className="flex max-h-72 flex-col gap-2 overflow-y-auto">
              {memories.length ? (
                memories.slice(0, 20).map((memory) => (
                  <div key={memory.id} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm leading-5 text-slate-700">{memory.text}</p>
                      <Badge variant="outline">{memory.weight}</Badge>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm leading-6 text-slate-600">저장된 작업 기억이 없습니다.</p>
              )}
            </CardContent>
          </Card>

          <Card className="border-slate-200 bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClipboardListIcon />
                도구 실행 로그
              </CardTitle>
              <CardDescription>{toolEvents.length}개 로컬 액션</CardDescription>
            </CardHeader>
            <CardContent className="flex max-h-80 flex-col gap-2 overflow-y-auto">
              {toolEvents.length ? (
                toolEvents.slice(0, 30).map((event) => (
                  <details key={event.id} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
                    <summary className="cursor-pointer font-medium text-slate-800">
                      {event.name} <span className="text-xs text-slate-500">({event.status})</span>
                    </summary>
                    <pre className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap rounded-md bg-slate-950 p-3 text-xs text-slate-100">
                      {event.result}
                    </pre>
                  </details>
                ))
              ) : (
                <p className="text-sm leading-6 text-slate-600">아직 도구 실행 기록이 없습니다.</p>
              )}
            </CardContent>
          </Card>

          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
            <div className="mb-2 flex items-center gap-2 font-semibold">
              <CheckCircle2Icon className="size-4" />
              운영 안전장치
            </div>
            Hermes가 파일을 수정하거나 명령을 실행할 수 있어도, 쇼핑몰 외부 API에 자동 반영하는 플로우는 MVP에서 제공하지 않습니다.
          </div>

          <Button variant="destructive" onClick={resetAgent}>
            <Trash2Icon />
            Hermes 초기화
          </Button>
        </aside>
      </div>
    </div>
  );
}
