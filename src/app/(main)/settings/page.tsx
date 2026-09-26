import { ApiKeySettings } from "@/components/settings/api-key-settings";
import { ModelSettings } from "@/components/settings/model-settings";
import { TelegramSettings } from "@/components/settings/telegram-settings";
import { backend } from "@/lib/api/server";

export default async function SettingsPage() {
  const [providers, models, telegram, apiKeys, workflows] = await Promise.all([
    backend.GET("/api/v1/providers"),
    backend.GET("/api/v1/models"),
    backend.GET("/api/v1/integrations/telegram"),
    backend.GET("/api/v1/api-keys"),
    backend.GET("/api/v1/workflows"),
  ]);

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 p-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-semibold">설정</h1>
          <p className="text-muted-foreground text-sm">
            대화·에이전트·워크플로우에서 쓸 모델과 알림 받을 곳을 연결합니다. 키와 토큰은 실제로 확인된 것만 암호화해
            저장됩니다.
          </p>
        </div>
        <ModelSettings
          providers={providers.data ?? []}
          options={models.data?.options ?? []}
          defaultModel={models.data?.default ?? null}
        />
        <TelegramSettings status={telegram.data ?? { connected: false }} />
        <ApiKeySettings
          keys={apiKeys.data ?? []}
          workflows={(workflows.data ?? []).map((w) => ({ id: w.id, name: w.name }))}
        />
      </div>
    </div>
  );
}
