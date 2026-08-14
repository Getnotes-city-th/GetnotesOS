import { useI18n } from "./i18n/I18nContext"
import { useState, useEffect } from 'react'
import { Dialog, Button, Input, Select, SensitiveInput, Collapsible, useKumoToastManager } from '@cloudflare/kumo'
import { AiChatAuthorInfo, AiModelConfig, AiModelProvider, AiGatewayInfo, SUGGESTED_MODELS } from '@gadgets/workshop-shared/api'
import { RpcStub } from 'capnweb'
import { AuthenticatedApi } from '@gadgets/workshop-shared/api'

interface AddModelModalProps {
  visible: boolean
  onCancel: () => void
  onSuccess: () => void
  authenticatedApi: RpcStub<AuthenticatedApi>
  aiConfig: AiGatewayInfo | null
}

type SelectionType =
  | { type: 'suggested', provider: AiModelProvider, modelId: string, displayName: string }
  | { type: 'custom', provider: AiModelProvider }

const PROVIDER_LABELS: Record<AiModelProvider, string> = {
  anthropic: 'Anthropic',
  openai: 'OpenAI',
  google: 'Google',
  nous: 'Nous Research (Hermes)',
  cloudflare: 'Cloudflare Workers AI',
  ollama: 'Ollama',
}

// Placeholder hinting at the shape of each provider's API token.
const API_TOKEN_PLACEHOLDERS: Record<AiModelProvider, string> = {
  anthropic: 'sk-ant-...',
  openai: 'sk-...',
  google: 'AIza...',
  nous: 'Nous API Key (e.g. nous-...)',
  cloudflare: 'Cloudflare API token',
  ollama: '(optional)',
}

// Example used in the custom-model placeholders for providers that have no suggested models
// (currently Ollama, which serves whatever the user has pulled locally).
const FALLBACK_EXAMPLE_MODEL = { modelId: 'hermes-3-llama-3.1-70b', name: 'Hermes 3 Llama 3.1 70B' }

// Pick an example model to show in the custom-model placeholders for the given provider.
function exampleModel(provider: AiModelProvider): { modelId: string, name: string } {
  const first = Object.entries(SUGGESTED_MODELS[provider])[0]
  return first ? { modelId: first[0], name: first[1].name } : FALLBACK_EXAMPLE_MODEL
}

// Encode a selection into a string value for the Select component.
function encodeSelection(provider: AiModelProvider, modelId?: string): string {
  return modelId ? `${provider}:${modelId}` : `other-${provider}`
}

// Decode a Select value back into a SelectionType.
function decodeSelection(value: string): SelectionType {
  if (value.startsWith('other-')) {
    return { type: 'custom', provider: value.substring(6) as AiModelProvider }
  }
  const colonIndex = value.indexOf(':')
  const provider = value.substring(0, colonIndex) as AiModelProvider
  const modelId = value.substring(colonIndex + 1)
  const displayName = SUGGESTED_MODELS[provider][modelId].name
  return { type: 'suggested', provider, modelId, displayName }
}

// Build the flat list of options for the Select dropdown.
function buildOptions(gatewayMode: boolean, enabledProviders: Set<string> | null) {
  const options: { value: string; label: string; provider: string }[] = []
  const providerOrder = Object.keys(SUGGESTED_MODELS) as AiModelProvider[]

  for (const provider of providerOrder) {
    if (enabledProviders && !enabledProviders.has(provider)) continue

    // In gateway mode, suggested models are already built-in, so don't list them.
    if (!gatewayMode) {
      for (const [modelId, model] of Object.entries(SUGGESTED_MODELS[provider])) {
        options.push({
          value: encodeSelection(provider, modelId),
          label: model.name,
          provider,
        })
      }
    }

    options.push({
      value: encodeSelection(provider),
      label: `Other ${PROVIDER_LABELS[provider] || provider}...`,
      provider,
    })
  }

  return options
}

export default function AddModelModal({ visible, onCancel, onSuccess, authenticatedApi, aiConfig }: AddModelModalProps) {
  const { t, language } = useI18n()
  const toasts = useKumoToastManager()

  const [loading, setLoading] = useState(false)
  const [selection, setSelection] = useState<SelectionType | null>(null)
  const [selectValue, setSelectValue] = useState<string | undefined>(undefined)

  // Form fields (used for custom models)
  const [modelId, setModelId] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [apiToken, setApiToken] = useState('')
  const [accountId, setAccountId] = useState('')
  const [apiUrl, setApiUrl] = useState('')

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Advanced settings collapsible state
  const [advancedOpen, setAdvancedOpen] = useState(false)
  const [addAllFromProvider, setAddAllFromProvider] = useState(false)
  const [savedTokens, setSavedTokens] = useState<Record<string, string>>({})

  const gatewayMode = aiConfig?.enabled === true
  const enabledProviders: Set<string> | null = gatewayMode
    ? new Set(aiConfig.enabledProviders)
    : null

  // Reset all state when dialog closes
  useEffect(() => {
    if (!visible) {
      setSelection(null)
      setSelectValue(undefined)
      setModelId('')
      setDisplayName('')
      setApiToken('')
      setAccountId('')
      setApiUrl('')
      setErrors({})
      setAdvancedOpen(false)
      setAddAllFromProvider(false)
    } else {
      authenticatedApi.getSavedProviderTokens?.().then((toks) => {
        if (toks) setSavedTokens(toks)
      }).catch(() => {})
    }
  }, [visible, authenticatedApi])

  const handleModelSelect = (value: string) => {
    setSelectValue(value)
    setErrors({})
    const sel = decodeSelection(value)
    setSelection(sel)

    if (sel.type === 'custom') {
      setModelId('')
      setDisplayName('')
    } else {
      setModelId(sel.modelId)
      setDisplayName(sel.displayName)
    }
    const existingToken = savedTokens[sel.provider] || localStorage.getItem(`api_token_${sel.provider}`) || ''
    setApiToken(existingToken)
    setAccountId('')
    setApiUrl(sel.provider === 'ollama' ? 'http://localhost:11434' : '')
  }

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!selection) {
      newErrors.selection = gatewayMode ? 'Please select a provider' : 'Please select a model'
    }

    if (selection?.type === 'custom') {
      if (!modelId.trim()) newErrors.modelId = 'Please enter the model ID'
      if (!displayName.trim()) newErrors.displayName = 'Please enter a display name'
    }

    const isOllama = selection?.provider === 'ollama'
    const isCloudflare = selection?.provider === 'cloudflare'
    const showCredentials = !gatewayMode

    if (showCredentials && selection && !isOllama && !apiToken.trim()) {
      newErrors.apiToken = 'Please enter your API token'
    }

    if (showCredentials && isCloudflare && !accountId.trim()) {
      newErrors.accountId = 'Please enter your Cloudflare account ID'
    }

    if (showCredentials && isOllama && !apiUrl.trim()) {
      newErrors.apiUrl = 'Please enter the Ollama API URL'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) return

    setLoading(true)
    try {
      const isSuggested = selection!.type === 'suggested'
      const finalModelId = isSuggested ? selection!.modelId : modelId.trim()
      const finalDisplayName = isSuggested ? selection!.displayName : displayName.trim()

      if (addAllFromProvider && selection!.type === 'suggested') {
        const providerModels = SUGGESTED_MODELS[selection!.provider]
        if (providerModels) {
          for (const [mId, mInfo] of Object.entries(providerModels)) {
            const profile: AiChatAuthorInfo = {
              type: 'agent',
              id: mId,
              name: mInfo.name,
            }
            const config: AiModelConfig = {
              provider: selection!.provider,
              model: mId,
              apiToken: gatewayMode ? '' : apiToken.trim(),
              ...(!gatewayMode && accountId.trim() && { accountId: accountId.trim() }),
              ...(!gatewayMode && apiUrl.trim() && { apiUrl: apiUrl.trim() }),
            }
            await authenticatedApi.addModel(profile, config)
          }
          toasts.add({
            title: language === "th" ? `เพิ่มทุกโมเดลของ ${PROVIDER_LABELS[selection!.provider]} สำเร็จแล้ว` : `Added all models from ${PROVIDER_LABELS[selection!.provider]}`,
            variant: 'success'
          })
        }
      } else {
        const profile: AiChatAuthorInfo = {
          type: 'agent',
          id: finalModelId,
          name: finalDisplayName,
        }

        const config: AiModelConfig = {
          provider: selection!.provider,
          model: finalModelId,
          apiToken: gatewayMode ? '' : apiToken.trim(),
          ...(!gatewayMode && accountId.trim() && { accountId: accountId.trim() }),
          ...(!gatewayMode && apiUrl.trim() && { apiUrl: apiUrl.trim() }),
        }

        await authenticatedApi.addModel(profile, config)
        toasts.add({ title: language === "th" ? "เพิ่มโมเดล AI สำเร็จแล้ว" : "AI model added successfully", variant: "success" })
      }

      if (apiToken.trim()) {
        try {
          localStorage.setItem(`api_token_${selection!.provider}`, apiToken.trim())
        } catch {}
      }

      onSuccess()
    } catch (error: any) {
      console.error('Failed to add model:', error)
      toasts.add({ title: language === "th" ? "ไม่สามารถเพิ่มโมเดลได้" : "Failed to add model", variant: "error" })
    } finally {
      setLoading(false)
    }
  }

  const options = buildOptions(gatewayMode, enabledProviders)
  const showCustomFields = selection?.type === 'custom'
  const example = selection ? exampleModel(selection.provider) : null
  const isOllama = selection?.provider === 'ollama'
  const isCloudflare = selection?.provider === 'cloudflare'
  const showCredentials = !gatewayMode

  // Group options by provider for rendering with visual separators.
  const groupedOptions: { provider: string; items: typeof options }[] = []
  for (const opt of options) {
    const last = groupedOptions[groupedOptions.length - 1]
    if (last && last.provider === opt.provider) {
      last.items.push(opt)
    } else {
      groupedOptions.push({ provider: opt.provider, items: [opt] })
    }
  }

  return (
    <Dialog.Root open={visible} onOpenChange={(open) => { if (!open) onCancel() }}>
      <Dialog className="p-6" size="lg">
        <Dialog.Title className="text-lg font-semibold mb-4">
          {language === "th" ? "เพิ่มโมเดล AI" : "Add AI Model"}
        </Dialog.Title>

        <div className="space-y-4">
          {/* Model / Provider selection */}
          <Select
            label={gatewayMode ? (language === "th" ? "เลือกผู้ให้บริการ" : "Select Provider") : (language === "th" ? "เลือกโมเดล AI" : "Select Model")}
            className="w-full text-sm"
            placeholder={gatewayMode ? (language === "th" ? "เลือกผู้ให้บริการ..." : "Choose a provider...") : (language === "th" ? "เลือกโมเดล AI..." : "Choose an AI model...")}
            value={selectValue}
            onValueChange={(v) => handleModelSelect(v as string)}
            error={errors.selection}
            renderValue={(v) => {
              const opt = options.find(o => o.value === v)
              return opt?.label ?? String(v)
            }}
          >
            {groupedOptions.map((group, groupIndex) => (
              <div key={group.provider}>
                {groupIndex > 0 && (
                  <div className="h-px bg-kumo-line my-1 mx-2" />
                )}
                <div className="px-3 py-1.5 text-xs font-medium text-kumo-subtle select-none">
                  {PROVIDER_LABELS[group.provider as AiModelProvider] || group.provider}
                </div>
                {group.items.map(opt => (
                  <Select.Option key={opt.value} value={opt.value}>
                    {opt.label}
                  </Select.Option>
                ))}
              </div>
            ))}
          </Select>

          {/* Custom model fields */}
          {showCustomFields && (
            <>
              <Input
                label={language === "th" ? "รหัสโมเดล (Model ID)" : "Model ID"}
                placeholder={`e.g., ${example!.modelId}`}
                description={language === "th" ? `รหัสโมเดลตามที่ผู้ให้บริการกำหนด (เช่น '${example!.modelId}')` : `The model identifier as specified by the provider (e.g., '${example!.modelId}')`}
                value={modelId}
                onChange={(e) => { setModelId(e.target.value); setErrors(prev => ({ ...prev, modelId: '' })) }}
                error={errors.modelId}
                variant={errors.modelId ? 'error' : 'default'}
              />

              <Input
                label={language === "th" ? "ชื่อที่แสดง" : "Display Name"}
                placeholder={`e.g., ${example!.name}`}
                description={language === "th" ? "ชื่อสำหรับแสดงในอินเทอร์เฟซผู้ใช้" : "Human-readable name shown in the UI"}
                value={displayName}
                onChange={(e) => { setDisplayName(e.target.value); setErrors(prev => ({ ...prev, displayName: '' })) }}
                error={errors.displayName}
                variant={errors.displayName ? 'error' : 'default'}
              />
            </>
          )}

          {/* Cloudflare account ID (the Workers AI REST endpoint is account-scoped) */}
          {showCredentials && isCloudflare && (
            <Input
              label="Cloudflare Account ID"
              placeholder="e.g., 0123456789abcdef0123456789abcdef"
              description="The Cloudflare account to bill for Workers AI usage"
              value={accountId}
              onChange={(e) => { setAccountId(e.target.value); setErrors(prev => ({ ...prev, accountId: '' })) }}
              error={errors.accountId}
              variant={errors.accountId ? 'error' : 'default'}
            />
          )}

          {/* API Token */}
          {showCredentials && selection && (
            <>
              {savedTokens[selection.provider] && (
                <div className="flex items-center gap-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-3 py-2 text-[12px] text-emerald-700 dark:text-emerald-300">
                  <span className="font-medium">✓ {language === "th" ? `มี API Key ของ ${PROVIDER_LABELS[selection.provider]} ในระบบแล้ว (ระบบจะใช้คีย์เดิมให้อัตโนมัติ)` : `API Key for ${PROVIDER_LABELS[selection.provider]} is already saved and will be reused`}</span>
                </div>
              )}
              <SensitiveInput
              label={language === "th" ? "โทเค็น API (API Token)" : "API Token"}
              placeholder={API_TOKEN_PLACEHOLDERS[selection.provider]}
              description={
                language === "th"
                  ? (isOllama
                      ? "ไม่จำเป็นต้องใส่สำหรับการใช้งาน Ollama ภายในเครื่อง"
                      : isCloudflare
                      ? "API token ที่มีสิทธิ์ Workers AI Read + Edit"
                      : `API token ของ ${PROVIDER_LABELS[selection.provider]} สำหรับการเรียกเก็บค่าบริการ`)
                  : (isOllama
                      ? "Optional for local Ollama access"
                      : isCloudflare
                      ? "An API token with Workers AI Read + Edit permissions (in the dashboard: Workers AI > Use REST API > Create a Workers AI API Token)"
                      : `Your ${PROVIDER_LABELS[selection.provider]} API token for billing`)
              }
              value={apiToken}
              onValueChange={(v) => { setApiToken(v); setErrors(prev => ({ ...prev, apiToken: '' })) }}
              error={errors.apiToken}
              variant={errors.apiToken ? 'error' : 'default'}
            />
            </>
          )}

          {showCredentials && selection && selection.type === 'suggested' && (
            <label className="flex items-center gap-2 cursor-pointer pt-1 text-[13px] text-kumo-default select-none">
              <input
                type="checkbox"
                checked={addAllFromProvider}
                onChange={(e) => setAddAllFromProvider(e.target.checked)}
                className="h-4 w-4 rounded border-kumo-line text-kumo-brand focus:ring-kumo-ring"
              />
              <span>
                {language === "th"
                  ? `เพิ่มโมเดลทั้งหมดของผู้ให้บริการนี้ (${PROVIDER_LABELS[selection.provider]}) ด้วยคีย์นี้ในครั้งเดียว`
                  : `Add all models from ${PROVIDER_LABELS[selection.provider]} with this key`}
              </span>
            </label>
          )}

          {/* Ollama API URL (always visible for Ollama) */}
          {showCredentials && isOllama && (
            <Input
              label="API URL"
              placeholder="http://localhost:11434"
              description="URL of your Ollama server"
              value={apiUrl}
              onChange={(e) => { setApiUrl(e.target.value); setErrors(prev => ({ ...prev, apiUrl: '' })) }}
              error={errors.apiUrl}
              variant={errors.apiUrl ? 'error' : 'default'}
            />
          )}

          {/* Advanced Settings for non-Ollama, non-Cloudflare providers */}
          {showCredentials && selection && !isOllama && !isCloudflare && (
            <Collapsible.Root
              open={advancedOpen}
              onOpenChange={setAdvancedOpen}
            >
              <Collapsible.DefaultTrigger>{language === "th" ? "การตั้งค่าขั้นสูง" : "Advanced Settings"}</Collapsible.DefaultTrigger>
              <Collapsible.DefaultPanel>
                <Input
                  label="API URL"
                  placeholder="https://..."
                  description={language === "th" ? "กำหนด API endpoint เอง (เช่น สำหรับพร็อกซี หรือ OpenAI-compatible API)" : "Override the default API endpoint (useful for proxies like Cloudflare AI Gateway)"}
                  value={apiUrl}
                  onChange={(e) => setApiUrl(e.target.value)}
                />
              </Collapsible.DefaultPanel>
            </Collapsible.Root>
          )}
        </div>

        {/* Footer */}
        <div className="mt-6 flex justify-end gap-2">
          <Dialog.Close render={(props) => (
            <Button variant="secondary" {...props} disabled={loading}>
              {t("cancel")}
            </Button>
          )} />
          <Button
            variant="primary"
            onClick={handleSubmit}
            loading={loading}
            disabled={!selection}
          >
            {language === "th" ? "เพิ่มโมเดล" : "Add Model"}
          </Button>
        </div>
      </Dialog>
    </Dialog.Root>
  )
}
