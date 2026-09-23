import { ModelSettings } from "@/components/settings/model-settings";
import { backend } from "@/lib/api/server";

export default async function SettingsPage() {
  const [providers, models] = await Promise.all([backend.GET("/api/v1/providers"), backend.GET("/api/v1/models")]);

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 p-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-semibold">설정</h1>
          <p className="text-muted-foreground text-sm">
            대화·에이전트·워크플로우에서 쓸 모델을 연결합니다. API 키는 실제로 확인된 것만 저장됩니다.
          </p>
        </div>
        <ModelSettings
          providers={providers.data ?? []}
          options={models.data?.options ?? []}
          defaultModel={models.data?.default ?? null}
        />
      </div>
    </div>
  );
}
