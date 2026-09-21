import { Button } from "@/components/atom/common/button"

type QuickAddRowProps = {
  options?: number[]
  onAdd: (value: number) => void
}

export function QuickAddRow({ options = [10, 50, 100, 500], onAdd }: QuickAddRowProps) {
  return (
    <div className="grid grid-cols-4 gap-2 lg:gap-3">
      {options.map((val) => (
        <Button
          key={val}
          type="button"
          variant="outline"
          className="h-10 rounded-xl bg-white text-[13px] font-bold text-primary shadow-[0_1px_3px_rgba(0,0,0,0.02)] hover:bg-slate-50 lg:h-12"
          onClick={() => onAdd(val)}
        >
          +{val}
        </Button>
      ))}
    </div>
  )
}
