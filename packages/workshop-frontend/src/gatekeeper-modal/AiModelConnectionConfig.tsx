import { useI18n } from "../i18n/I18nContext"
import { Select, type PortalContainer } from '@cloudflare/kumo'
import { AiChatAuthorInfo } from '@gadgets/workshop-shared/api'
import { ConnectionConfigField } from './ConnectionConfigField'

export interface AiModelConnectionConfigProps {
  availableModels: AiChatAuthorInfo[]
  selectedModelId: string | undefined
  onSelectedModelIdChange: (id: string | undefined) => void
  selectContainer?: PortalContainer
}

export function AiModelConnectionConfig({

  availableModels,
  selectedModelId,
  onSelectedModelIdChange,
  selectContainer,
}: AiModelConnectionConfigProps) {
  const { language } = useI18n()
  return (
    <section className="grid gap-3">
      <ConnectionConfigField
        label={language === "th" ? "โมเดล AI" : "Model"}
        description={language === "th" ? "เลือกโมเดล AI ที่ต้องการให้การเชื่อมต่อนี้ใช้งาน" : "Choose the model this connection can use."}
      >
        <Select
          aria-label="Select an AI model"
          className="w-full text-sm [&_button]:!h-9"
          container={selectContainer}
          placeholder={language === "th" ? "เลือกโมเดล AI" : "Select an AI model"}
          value={selectedModelId}
          onValueChange={(v) => onSelectedModelIdChange(v as string | undefined)}
          renderValue={(id) => availableModels.find((m) => m.id === id)?.name ?? id}
        >
          {availableModels.map(model => (
            <Select.Option key={model.id} value={model.id}>
              {model.name}
            </Select.Option>
          ))}
        </Select>
      </ConnectionConfigField>
    </section>
  )
}
