import { SettingsClient } from "./settings-client";

export default function SettingsPage() {
  return <SettingsClient openAIReady={Boolean(process.env.OPENAI_API_KEY)} />;
}
