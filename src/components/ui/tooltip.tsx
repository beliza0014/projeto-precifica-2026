import * as React from "react"
import * as TooltipPrimitive from "@radix-ui/react-tooltip"
import { useIsMobile } from "@/hooks/use-mobile"
import { cn } from "@/lib/utils"

const TooltipProvider = TooltipPrimitive.Provider

const Tooltip = TooltipPrimitive.Root

const TooltipTrigger = TooltipPrimitive.Trigger

const TooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(({ className, sideOffset = 4, ...props }, ref) => {
  const isMobile = useIsMobile()
  
  return (
    <TooltipPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      className={cn(
        "z-50 overflow-hidden rounded-md border bg-popover shadow-lg animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 transition-all duration-200",
        // Mobile-specific styles
        isMobile 
          ? "px-4 py-3 text-base max-w-[280px] leading-relaxed"
          : "px-3 py-1.5 text-sm max-w-[320px]",
        "text-popover-foreground",
        className
      )}
      {...props}
    />
  )
})
TooltipContent.displayName = TooltipPrimitive.Content.displayName

// Enhanced Interactive Tooltip Component
interface InteractiveTooltipProps {
  content: React.ReactNode
  children: React.ReactNode
  side?: "top" | "right" | "bottom" | "left"
  align?: "start" | "center" | "end"
  className?: string
  delayDuration?: number
  skipDelayDuration?: number
  disableHoverableContent?: boolean
  autoHideDuration?: number // Auto-hide timeout for mobile (in ms)
}

const InteractiveTooltip = React.forwardRef<
  HTMLDivElement,
  InteractiveTooltipProps
>(({ 
  content, 
  children, 
  side = "top", 
  align = "center",
  className,
  delayDuration = 400,
  skipDelayDuration = 300,
  disableHoverableContent = false,
  autoHideDuration = 3000,
  ...props 
}, ref) => {
  const isMobile = useIsMobile()
  const [open, setOpen] = React.useState(false)
  const timeoutRef = React.useRef<NodeJS.Timeout>()
  const triggerRef = React.useRef<HTMLButtonElement>(null)

  // Auto-hide functionality for mobile
  React.useEffect(() => {
    if (isMobile && open && autoHideDuration > 0) {
      timeoutRef.current = setTimeout(() => {
        setOpen(false)
      }, autoHideDuration)
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [open, isMobile, autoHideDuration])

  // Handle outside clicks for mobile
  React.useEffect(() => {
    if (!isMobile) return

    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (triggerRef.current && !triggerRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    if (open) {
      document.addEventListener('click', handleClickOutside)
      document.addEventListener('touchstart', handleClickOutside)
    }

    return () => {
      document.removeEventListener('click', handleClickOutside)
      document.removeEventListener('touchstart', handleClickOutside)
    }
  }, [open, isMobile])

  const handleTriggerClick = React.useCallback((e: React.MouseEvent) => {
    if (isMobile) {
      e.preventDefault()
      setOpen(prev => !prev)
    }
  }, [isMobile])

  const handleKeyDown = React.useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setOpen(false)
    }
  }, [])

  return (
    <TooltipProvider delayDuration={isMobile ? 0 : delayDuration} skipDelayDuration={skipDelayDuration}>
      <Tooltip 
        open={open} 
        onOpenChange={isMobile ? setOpen : undefined}
        delayDuration={isMobile ? 0 : delayDuration}
      >
        <TooltipTrigger
          ref={triggerRef}
          asChild={!isMobile}
          onClick={handleTriggerClick}
          onKeyDown={handleKeyDown}
          aria-describedby={open ? "tooltip-content" : undefined}
          className={isMobile ? "touch-manipulation" : undefined}
        >
          {children}
        </TooltipTrigger>
        <TooltipContent
          id="tooltip-content"
          ref={ref}
          side={side}
          align={align}
          className={className}
          avoidCollisions={true}
          collisionPadding={8}
          sticky="always"
          {...props}
        >
          {content}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
})

InteractiveTooltip.displayName = "InteractiveTooltip"

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider, InteractiveTooltip }
