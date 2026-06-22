import { money, signedMoney } from '../lib/format'

interface MoneyProps {
  value: string | number | null | undefined
  currency: string
  /** Render with an explicit +/- sign (for P/L figures). */
  signed?: boolean
}

/**
 * A currency amount. Wrapped in `.money` so it can be hidden globally: when the
 * app shell carries `.hide-amounts` (privacy mode), every `.money` is blurred.
 * See {@link useHideAmounts} and the `.hide-amounts .money` rule in index.css.
 */
export function Money({ value, currency, signed = false }: MoneyProps) {
  return <span className="money">{signed ? signedMoney(value, currency) : money(value, currency)}</span>
}
