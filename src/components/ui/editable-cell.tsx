"use client"

import * as React from "react"
import { Input } from "./input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select"
import { cn } from "~/lib/utils"

interface EditableCellProps {
  value: string
  onSave: (value: string) => Promise<void>
  className?: string
}

export function EditableCell({ value, onSave, className }: EditableCellProps) {
  const [isEditing, setIsEditing] = React.useState(false)
  const [editValue, setEditValue] = React.useState(value)
  const [isSaving, setIsSaving] = React.useState(false)
  const inputRef = React.useRef<HTMLInputElement>(null)

  React.useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  const handleSave = async () => {
    if (editValue !== value && editValue.trim()) {
      setIsSaving(true)
      try {
        await onSave(editValue)
        setIsEditing(false)
      } catch (error) {
        console.error("Failed to save cell value:", {
          operation: "updateCell",
          originalValue: value,
          newValue: editValue,
          error: error instanceof Error ? error.message : String(error)
        })
        setEditValue(value) // Revert on error
      } finally {
        setIsSaving(false)
      }
    } else {
      setIsEditing(false)
      setEditValue(value) // Revert if unchanged or empty
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault()
      void handleSave()
    } else if (e.key === "Escape") {
      setEditValue(value)
      setIsEditing(false)
    }
  }

  if (isEditing) {
    return (
      <Input
        ref={inputRef}
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={() => void handleSave()}
        onKeyDown={handleKeyDown}
        disabled={isSaving}
        className={cn("h-8 min-w-[150px]", className)}
      />
    )
  }

  return (
    <div
      onClick={() => setIsEditing(true)}
      className={cn(
        "cursor-pointer rounded px-2 py-1 hover:bg-accent/50 min-h-[32px] flex items-center",
        className
      )}
    >
      {value || <span className="text-muted-foreground">點擊編輯</span>}
    </div>
  )
}

interface EditableSelectCellProps {
  value: number
  options: { value: number; label: string }[]
  onSave: (value: number) => Promise<void>
  className?: string
  displayValue?: string
}

export function EditableSelectCell({ 
  value, 
  options, 
  onSave, 
  className,
  displayValue 
}: EditableSelectCellProps) {
  const [isEditing, setIsEditing] = React.useState(false)
  const [isSaving, setIsSaving] = React.useState(false)

  const handleValueChange = async (newValue: string) => {
    const numValue = parseInt(newValue)
    if (numValue !== value) {
      setIsSaving(true)
      try {
        await onSave(numValue)
        setIsEditing(false)
      } catch (error) {
        console.error("Failed to save select value:", {
          operation: "updateSelectCell",
          originalValue: value,
          newValue: numValue,
          error: error instanceof Error ? error.message : String(error)
        })
      } finally {
        setIsSaving(false)
      }
    } else {
      setIsEditing(false)
    }
  }

  if (isEditing) {
    return (
      <Select
        value={value.toString()}
        onValueChange={(val) => void handleValueChange(val)}
        onOpenChange={(open) => {
          if (!open && !isSaving) {
            setIsEditing(false)
          }
        }}
        disabled={isSaving}
        defaultOpen
      >
        <SelectTrigger className={cn("h-8 min-w-[150px]", className)}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value.toString()}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    )
  }

  return (
    <div
      onClick={() => setIsEditing(true)}
      className={cn(
        "cursor-pointer rounded px-2 py-1 hover:bg-accent/50 min-h-[32px] flex items-center",
        className
      )}
    >
      {displayValue ?? options.find(o => o.value === value)?.label ?? value}
    </div>
  )
}
