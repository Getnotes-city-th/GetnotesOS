import { useI18n } from "../../i18n/I18nContext"
// "Start with a format": one click per standard output the deployment offers. Renders nothing when
// it promotes none, which is the default.

import { FormatGlyph } from './FormatVisuals'
import { useOutputFormats } from './useOutputFormats'

export default function NewFormatRow({ label }: { label?: string }) {
  const { language } = useI18n();
  const defaultLabel = language === "th" ? "เริ่มต้นสร้าง" : "Start with";
  const displayLabel = label || defaultLabel;
  const { formats, creating, create } = useOutputFormats()

  if (formats.length === 0) return null

  return (
    <div className="flex flex-col items-center gap-2.5">
      <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-kumo-inactive">
        {displayLabel}
      </span>
      <div className="flex flex-wrap items-center justify-center gap-2">
        {formats.map((format) => (
          <button
            key={format.blueprintId}
            type="button"
            disabled={creating !== null}
            onClick={() => create(format)}
            title={format.description || undefined}
            className="press flex cursor-pointer items-center gap-2 rounded-full border border-kumo-line bg-kumo-base px-3.5 py-2 text-[13px] leading-[18px] tracking-[-0.25px] text-kumo-default transition-colors duration-150 ease-out hover:bg-kumo-tint disabled:cursor-default disabled:opacity-60"
          >
            <FormatGlyph
              output={format.output}
              size="md"
              className={creating === format.blueprintId ? 'animate-pulse' : 'text-kumo-subtle'}
            />
            {creating === format.blueprintId
      ? (language === "th" ? "กำลังสร้าง…" : "Creating…")
      : (language === "th"
          ? (format.output.id === "document" || format.output.icon === "fileText" ? "สร้างเอกสารใหม่"
            : format.output.id === "presentation" || format.output.icon === "presentation" ? "สร้างสไลด์ใหม่"
            : format.output.id === "spreadsheet" || format.output.icon === "table" ? "สร้างสเปรดชีตใหม่"
            : `สร้าง${format.output.noun}ใหม่`)
          : `New ${format.output.noun}`)}
          </button>
        ))}
      </div>
    </div>
  )
}
