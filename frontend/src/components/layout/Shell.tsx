import * as React from "react"
import { cn } from "@/lib/utils"

const Shell = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "flex min-h-screen flex-col",
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)
Shell.displayName = "Shell"

export { Shell }
