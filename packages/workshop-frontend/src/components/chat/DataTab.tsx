import { useI18n } from "../../i18n/I18nContext"
import { useState } from 'react'
import { Table } from '@cloudflare/kumo'
import { Badge } from '@cloudflare/kumo'
import { Button } from '@cloudflare/kumo'
import { sampleDataRows } from '../../data/chat'

export default function DataTab() {
  const { language } = useI18n();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  function toggleRow(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleAll() {
    if (selectedIds.size === sampleDataRows.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(sampleDataRows.map((r) => r.id)))
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-kumo-fill bg-kumo-elevated">
        <div className="flex items-center gap-3">
          <span className="font-mono text-sm text-kumo-default">channels</span>
          <Badge variant="secondary">{sampleDataRows.length} {language === "th" ? "แถว" : "rows"}</Badge>
        </div>
        <div className="flex items-center gap-2">
          {selectedIds.size > 0 && (
            <span className="text-xs text-kumo-subtle">
              {selectedIds.size} {language === "th" ? "ที่เลือก" : "selected"}
            </span>
          )}
          <Button variant="ghost" size="xs">{language === "th" ? "ตัวกรอง" : "Filter"}</Button>
          <Button variant="ghost" size="xs">{language === "th" ? "เรียงลำดับ" : "Sort"}</Button>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <Table layout="fixed">
          <Table.Header>
            <Table.Row>
              <Table.CheckHead
                checked={selectedIds.size === sampleDataRows.length}
                indeterminate={selectedIds.size > 0 && selectedIds.size < sampleDataRows.length}
                onValueChange={toggleAll}
                aria-label="Select all rows"
              />
              <Table.Head>{language === "th" ? "ช่องทาง" : "Channel"}</Table.Head>
              <Table.Head>{language === "th" ? "ข้อความ" : "Messages"}</Table.Head>
              <Table.Head>{language === "th" ? "ใช้งานล่าสุด" : "Last Active"}</Table.Head>
              <Table.Head>{language === "th" ? "สถานะ" : "Status"}</Table.Head>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {sampleDataRows.map((row) => (
              <Table.Row key={row.id} variant={selectedIds.has(row.id) ? 'selected' : 'default'}>
                <Table.CheckCell
                  checked={selectedIds.has(row.id)}
                  onValueChange={() => toggleRow(row.id)}
                  aria-label={`Select ${row.channel}`}
                />
                <Table.Cell>
                  <span className="font-mono text-sm text-kumo-default">{row.channel}</span>
                </Table.Cell>
                <Table.Cell>
                  <span className="text-sm text-kumo-subtle tabular-nums">
                    {row.messages.toLocaleString()}
                  </span>
                </Table.Cell>
                <Table.Cell>
                  <span className="text-xs text-kumo-subtle">{row.lastActive}</span>
                </Table.Cell>
                <Table.Cell>
                  {row.unread ? (
                    <Badge variant="primary">{language === "th" ? "ยังไม่อ่าน" : "Unread"}</Badge>
                  ) : (
                    <Badge variant="secondary">{language === "th" ? "อ่านแล้ว" : "Read"}</Badge>
                  )}
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
      </div>

      {/* Footer */}
      <div className="px-4 py-2 border-t border-kumo-fill bg-kumo-elevated flex items-center justify-between">
        <span className="font-mono text-xs text-kumo-subtle">
          {sampleDataRows.length} rows in channels
        </span>
        <span className="font-mono text-xs text-kumo-subtle">
          {sampleDataRows.reduce((sum, r) => sum + r.messages, 0).toLocaleString()} total messages
        </span>
      </div>
    </div>
  )
}
