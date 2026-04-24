import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B"

  const units = ["B", "KB", "MB", "GB", "TB", "PB"]
  const k = 1024
  const i = Math.floor(Math.log(Math.abs(bytes)) / Math.log(k))
  const index = Math.min(i, units.length - 1)

  return `${parseFloat((bytes / k ** index).toFixed(2))} ${units[index]}`
}

const TIME_DIVISIONS: { amount: number; unit: Intl.RelativeTimeFormatUnit }[] =
  [
    { amount: 60, unit: "seconds" },
    { amount: 60, unit: "minutes" },
    { amount: 24, unit: "hours" },
    { amount: 7, unit: "days" },
    { amount: 4.345, unit: "weeks" },
    { amount: 12, unit: "months" },
    { amount: Infinity, unit: "years" },
  ]

export function formatRelativeTime(date: Date | string): string {
  const target = typeof date === "string" ? new Date(date) : date
  let diff = (target.getTime() - Date.now()) / 1000

  const formatter = new Intl.RelativeTimeFormat("en", { numeric: "auto" })

  for (const division of TIME_DIVISIONS) {
    if (Math.abs(diff) < division.amount) {
      return formatter.format(Math.round(diff), division.unit)
    }
    diff /= division.amount
  }

  return formatter.format(Math.round(diff), "years")
}
