import type { InputHTMLAttributes , ReactNode } from "react";
import {cn} from "@/lib/utils"
import {Input} from "@/components/atom"


type InputWithIconProps = InputHTMLAttributes<HTMLInputElement> & {
  icon: ReactNode
  rightElement?: ReactNode
}


function InputWithIcon({ icon, rightElement, className, ...props }: InputWithIconProps) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
        {icon}
      </span>
      <Input className={cn("pl-10", rightElement && "pr-11", className)} {...props} />
      {rightElement && (
        <span className="absolute inset-y-0 right-0 flex items-center pr-3.5">
          {rightElement}
        </span>
      )}
    </div>
  )
}

export { InputWithIcon }