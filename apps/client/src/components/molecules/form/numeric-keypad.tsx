import { Delete } from "lucide-react"
import { Button } from "@/components/atom/common/button"

type NumericKeypadProps = {
  value: number
  onChange: (value: number) => void
  maxLength?: number
}

export function NumericKeypad({ value, onChange, maxLength = 6 }: NumericKeypadProps) {
  const handleDigit = (num: number) => {
    const next = parseInt(`${value === 0 ? "" : value}${num}`)
    if (next.toString().length <= maxLength) {
      onChange(next)
    }
  }

  const handleClear = () => onChange(0)

  const handleBackspace = () => {
    const str = value.toString()
    if (str.length <= 1) {
      onChange(0)
    } else {
      onChange(parseInt(str.slice(0, -1)))
    }
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-2.5 shadow-[0_2px_10px_rgba(0,0,0,0.02)] lg:p-4">
      <div className="grid grid-cols-3 gap-2 lg:gap-3">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
          <Button
            key={num}
            type="button"
            variant="ghost"
            className="flex h-13 items-center justify-center rounded-xl bg-[#eef4fa] py-3 text-[20px] font-bold text-slate-800 hover:bg-[#e2ecf7]"
            onClick={() => handleDigit(num)}
          >
            {num}
          </Button>
        ))}
        <Button
          type="button"
          variant="ghost"
          className="flex h-13 items-center justify-center rounded-xl bg-red-100/60 py-3 text-[18px] font-bold text-red-700 hover:bg-red-100"
          onClick={handleClear}
        >
          C
        </Button>
        <Button
          type="button"
          variant="ghost"
          className="flex h-13 items-center justify-center rounded-xl bg-[#eef4fa] py-3 text-[20px] font-bold text-slate-800 hover:bg-[#e2ecf7]"
          onClick={() => handleDigit(0)}
        >
          0
        </Button>
        <Button
          type="button"
          variant="ghost"
          className="flex h-13 items-center justify-center rounded-xl bg-[#e0ecf7] py-3 text-slate-800 hover:bg-[#d5e4f2]"
          onClick={handleBackspace}
          aria-label="Backspace"
        >
          <Delete className="h-5 w-5" />
        </Button>
      </div>
    </div>
  )
}
