import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DetailPageGeneration } from "@/types";

function List({ items }: { items: string[] }) {
  return (
    <div className="flex flex-col gap-2">
      {items.map((item) => (
        <div key={item} className="rounded-xl bg-slate-50 p-3 text-sm leading-6 text-slate-700">
          {item}
        </div>
      ))}
    </div>
  );
}

export function DetailPagePreview({ generation }: { generation?: DetailPageGeneration }) {
  if (!generation) {
    return (
      <Card className="border-dashed bg-white shadow-sm">
        <CardContent className="p-8 text-sm text-slate-500">
          상세페이지를 생성하면 USP, 상세 구성, FAQ, 광고 카피가 표시됩니다.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-slate-200 bg-white shadow-sm">
      <CardHeader>
        <CardTitle>{generation.headline}</CardTitle>
        <p className="text-sm leading-6 text-slate-600">{generation.subHeadline}</p>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="usp">
          <TabsList className="h-auto flex-wrap justify-start">
            <TabsTrigger value="usp">USP</TabsTrigger>
            <TabsTrigger value="offer">오퍼/근거</TabsTrigger>
            <TabsTrigger value="structure">상세 구성</TabsTrigger>
            <TabsTrigger value="faq">FAQ</TabsTrigger>
            <TabsTrigger value="ad">광고 카피</TabsTrigger>
            <TabsTrigger value="rewrite">표현 교정</TabsTrigger>
            <TabsTrigger value="apply">Cafe24 적용</TabsTrigger>
            <TabsTrigger value="risk">리스크</TabsTrigger>
          </TabsList>
          <TabsContent value="usp">
            <List items={generation.uspSummary} />
          </TabsContent>
          <TabsContent value="offer">
            <List items={[...(generation.offerStack ?? []), ...(generation.evidenceBlocks ?? [])]} />
          </TabsContent>
          <TabsContent value="structure">
            <List items={[...generation.sectionStructure, ...(generation.sectionWireframe ?? [])]} />
          </TabsContent>
          <TabsContent value="faq">
            <List items={generation.faq} />
          </TabsContent>
          <TabsContent value="ad">
            <List items={generation.adCopyVariants} />
          </TabsContent>
          <TabsContent value="rewrite">
            <List items={generation.complianceRewrites ?? ["표현 교정안이 생성되면 표시됩니다."]} />
          </TabsContent>
          <TabsContent value="apply">
            <List items={generation.cafe24ApplyChecklist ?? ["Cafe24 적용 체크리스트가 생성되면 표시됩니다."]} />
          </TabsContent>
          <TabsContent value="risk">
            <List items={generation.riskFlags.map((flag) => `${flag.title}: ${flag.description}`)} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
