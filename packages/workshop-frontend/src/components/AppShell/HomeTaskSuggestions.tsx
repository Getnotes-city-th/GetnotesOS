import { useMemo } from "react"
import {
  AppWindow,
  ChartLineUp,
  FileText,
  Lightning,
  Presentation,
  type Icon,
} from "@phosphor-icons/react"
import { useI18n } from "../../i18n/I18nContext"

type TaskSuggestion = {
  id: string
  label_th: string
  label_en: string
  description_th: string
  description_en: string
  prompt_th: string
  prompt_en: string
  icon: Icon
}

const SUGGESTIONS: TaskSuggestion[] = [
  {
    id: "app",
    label_th: "สร้างแอปเครื่องมือด่วน",
    label_en: "Build a quick tool",
    description_th: "แอปขนาดเล็กสำหรับโต้ตอบ เครื่องคิดเลข หรือหน้า Dashboard",
    description_en: "A small interactive app, calculator, or dashboard",
    icon: AppWindow,
    prompt_th: "ช่วยสร้างเครื่องมือหรือเว็บแอปขนาดเล็กสำหรับโต้ตอบที่สามารถใช้งานได้ทันที (เช่น เครื่องคิดเลข, แดชบอร์ด หรือเครื่องมือค้นหาข้อมูล) รบกวนถามฉันก่อนว่าต้องการให้ทำอะไร แล้วลงมือสร้างให้เลย",
    prompt_en: "Build a small interactive tool I can use right here — a calculator, dashboard, or explorer. Ask me what it should do, then create it.",
  },
  {
    id: "team-meeting",
    label_th: "สร้างสไลด์นำเสนอประชุมทีม",
    label_en: "Build a team meeting deck",
    description_th: "สไลด์สรุปความคืบหน้า ความเสี่ยง และเรื่องที่ต้องตัดสินใจ",
    description_en: "Slides with progress, risks, and what needs a decision",
    icon: Presentation,
    prompt_th: "ช่วยสร้างสไลด์นำเสนอสำหรับการประชุมทีมครั้งต่อไป: สรุปสถานะงานล่าสุด, ผลงานที่ส่งมอบแล้ว, ความเสี่ยง/อุปสรรค และการตัดสินใจที่ต้องการจากที่ประชุม รบกวนถามฉันก่อนว่าทีมกำลังทำเรื่องอะไรอยู่",
    prompt_en: "Create a slide deck for my next team meeting: where things stand, what shipped, risks and blockers, and the decisions I need from the room. Ask me what the team is working on first.",
  },
  {
    id: "one-on-one",
    label_th: "เขียนเอกสารเตรียมประชุม 1:1",
    label_en: "Write a 1:1 pre-read",
    description_th: "เอกสารสรุปภาพรวม สิ่งที่ต้องตรวจสอบ และคำร้องขอสำคัญ",
    description_en: "A doc with a snapshot, things to inspect, and one ask",
    icon: FileText,
    prompt_th: "ช่วยสร้างเอกสารเตรียมพร้อมสำหรับการประชุม 1:1 กับทีมงาน: สรุปภาพรวมปัจจุบัน, กรอบการโค้ชชิ่ง, ประเด็นที่ต้องตรวจสอบ, งานที่ต่อเนื่องมาจากรอบที่แล้ว และข้อเสนอแนะที่ชัดเจน",
    prompt_en: "Create a document to prepare for my next 1:1 with a direct report: a current snapshot, a coaching frame, things to inspect, carryover items from last time, and one clear ask.",
  },
  {
    id: "insights",
    label_th: "ค้นหาข้อมูลเชิงลึกในชุดข้อมูล",
    label_en: "Find insights in my data",
    description_th: "แปลงสเปรดชีตหรือ CSV เป็นแนวโน้มและข้อเสนอแนะ",
    description_en: "Turn a spreadsheet or CSV into trends and recommendations",
    icon: ChartLineUp,
    prompt_th: "ช่วยวิเคราะห์ชุดข้อมูลที่ฉันจะแชร์ให้ (สเปรดชีต, CSV หรือตารางข้อความ) ออกมาเป็นการวิเคราะห์เชิงลึก: แนวโน้มสำคัญ, สิ่งผิดปกติ, ความหมายของข้อมูล และข้อเสนอแนะที่นำไปปฏิบัติได้จริง",
    prompt_en: "Turn a dataset I will share (a spreadsheet, CSV, or pasted table) into a narrative analysis: key trends, anomalies, the \"so what\", and concrete recommendations.",
  },
  {
    id: "workflow",
    label_th: "ตั้งค่าการทำงานอัตโนมัติ",
    label_en: "Automate a workflow",
    description_th: "สั่งให้ Agent ทำงานอัตโนมัติเมื่อมีอีเมลใหม่เข้ามา",
    description_en: "Trigger an agent when a new email arrives",
    icon: Lightning,
    prompt_th: "ช่วยสร้างระบบ Agent ทำงานอัตโนมัติเมื่อมีอีเมลใหม่เข้ามา: อ่านข้อความ, ตัดสินใจดำเนินการ และลงมือจัดการหรือร่างอีเมลตอบกลับ รบกวนถามฉันว่าต้องการให้ตรวจสอบกล่องข้อความไหนและต้องการให้จัดการเรื่องใดบ้าง",
    prompt_en: "Create an agent workflow that runs automatically when a new email arrives: read the message, decide what to do, and take action or draft a reply. Ask me which inbox to watch and what it should handle.",
  },
]

function SuggestionRow({
  icon,
  label,
  description,
  onClick,
}: {
  icon: React.ReactNode
  label: string
  description: string
  onClick: () => void
}) {
  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        className="press group flex w-full cursor-pointer items-center gap-3 rounded-xl px-2 py-2 text-left transition-colors hover:bg-kumo-tint"
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-kumo-fill text-kumo-subtle transition-colors group-hover:text-kumo-default">
          {icon}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[13px] leading-[18px] font-medium tracking-[-0.25px] text-kumo-default">
            {label}
          </span>
          <span className="block truncate text-[12px] leading-4 tracking-[-0.2px] text-kumo-subtle">
            {description}
          </span>
        </span>
      </button>
    </li>
  )
}

const VISIBLE_SUGGESTIONS = 3

function pickSuggestions(): TaskSuggestion[] {
  let shuffled = [...SUGGESTIONS]
  for (let i = shuffled.length - 1; i > 0; i--) {
    let j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled.slice(0, VISIBLE_SUGGESTIONS)
}

export default function HomeTaskSuggestions({
  onPick,
}: {
  onPick: (prompt: string) => void
}) {
  const { language, t } = useI18n()
  const visible = useMemo(pickSuggestions, [])

  return (
    <section aria-label="Example tasks" className="flex flex-col gap-1">
      <h3 className="px-1 pb-1 text-[12px] font-medium uppercase tracking-[0.06em] text-kumo-inactive">
        {t("getStarted")}
      </h3>
      <ul className="flex flex-col gap-0.5">
        {visible.map((suggestion) => (
          <SuggestionRow
            key={suggestion.id}
            icon={<suggestion.icon size={16} />}
            label={language === "th" ? suggestion.label_th : suggestion.label_en}
            description={language === "th" ? suggestion.description_th : suggestion.description_en}
            onClick={() => onPick(language === "th" ? suggestion.prompt_th : suggestion.prompt_en)}
          />
        ))}
      </ul>
    </section>
  )
}
