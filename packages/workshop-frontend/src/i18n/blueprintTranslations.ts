export function getLocalizedBlueprint(
  id: string,
  originalTitle: string,
  originalDescription: string,
  language: "th" | "en"
): { title: string; description: string } {
  if (language !== "th") {
    return { title: originalTitle, description: originalDescription }
  }
  const lowId = (id || "").toLowerCase()
  const lowTitle = (originalTitle || "").toLowerCase()

  if (lowId.includes("document") || lowId.includes("doc") || lowTitle.includes("workspace docs")) {
    return {
      title: "เอกสารพื้นที่ทำงาน (Docs)",
      description: "ใช้สำหรับเขียน จัดรูปแบบ และแก้ไขเอกสารข้อความแบบสมบูรณ์ด้วยภาษาธรรมชาติหรือสั่งงาน AI",
    }
  }
  if (lowId.includes("slide") || lowTitle.includes("workspace slides")) {
    return {
      title: "สไลด์นำเสนอ (Slides)",
      description: "ใช้สำหรับสร้างชุดสไลด์นำเสนอตามสไตล์ของคุณ พร้อมเชื่อมต่อข้อมูลจริงเพื่อสร้างแผนภูมิและกราฟิก",
    }
  }
  if (lowId.includes("sheet") || lowId.includes("spreadsheet") || lowTitle.includes("workspace sheets")) {
    return {
      title: "สเปรดชีตตาราง (Sheets)",
      description: "ใช้สำหรับสร้าง จัดการสูตร และแก้ไขตารางสเปรดชีตอย่างง่ายดายด้วยภาษาธรรมชาติ",
    }
  }
  return { title: originalTitle, description: originalDescription }
}
