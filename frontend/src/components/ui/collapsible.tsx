"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { ChevronDown } from "lucide-react"

interface CollapsibleSectionProps {
  title: string
  children: React.ReactNode
  defaultOpen?: boolean
  open?: boolean
  onOpenChange?: (open: boolean) => void
  className?: string
  headerClassName?: string
  icon?: React.ReactNode
  rightContent?: React.ReactNode
}

function CollapsibleSection({
  title,
  children,
  defaultOpen = false,
  open: controlledOpen,
  onOpenChange,
  className,
  headerClassName,
  icon,
  rightContent,
}: CollapsibleSectionProps) {
  const [internalOpen, setInternalOpen] = React.useState(defaultOpen)
  const isControlled = controlledOpen !== undefined
  const isOpen = isControlled ? controlledOpen : internalOpen

  const handleToggle = () => {
    const next = !isOpen
    if (!isControlled) {
      setInternalOpen(next)
    }
    onOpenChange?.(next)
  }

  const id = React.useId()

  return (
    <div className={cn("border border-border rounded-xl overflow-hidden", className)}>
      <button
        type="button"
        onClick={handleToggle}
        aria-expanded={isOpen}
        aria-controls={`${id}-content`}
        id={`${id}-trigger`}
        className={cn(
          "w-full flex items-center justify-between gap-2 px-4 py-3 min-h-[44px] text-sm font-medium text-foreground hover:bg-accent/50 transition-colors",
          headerClassName
        )}
      >
        <span className="flex items-center gap-2 min-w-0">
          {icon}
          <span className="truncate">{title}</span>
        </span>
        <span className="flex items-center gap-2 shrink-0">
          {rightContent}
          <ChevronDown
            size={16}
            className={cn("text-muted-foreground transition-transform duration-200 shrink-0", isOpen && "rotate-180")}
            aria-hidden="true"
          />
        </span>
      </button>
      <div
        id={`${id}-content`}
        role="region"
        aria-labelledby={`${id}-trigger`}
        className={cn(
          "grid transition-[grid-template-rows] duration-200 ease-in-out",
          isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        )}
      >
        <div className="overflow-hidden">
          <div className="px-4 pb-4">{children}</div>
        </div>
      </div>
    </div>
  )
}

interface AccordionItem {
  title: string
  content: React.ReactNode
}

interface AccordionProps {
  items: AccordionItem[]
  defaultIndex?: number
  className?: string
}

function Accordion({ items, defaultIndex, className }: AccordionProps) {
  const [openIndex, setOpenIndex] = React.useState<number | null>(
    defaultIndex !== undefined ? defaultIndex : null
  )

  return (
    <div className={cn("space-y-1", className)}>
      {items.map((item, index) => (
        <CollapsibleSection
          key={index}
          title={item.title}
          open={openIndex === index}
          onOpenChange={(open) => setOpenIndex(open ? index : null)}
        >
          {item.content}
        </CollapsibleSection>
      ))}
    </div>
  )
}

export { CollapsibleSection, Accordion }
export type { CollapsibleSectionProps, AccordionItem, AccordionProps }
