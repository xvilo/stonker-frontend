// Mirrors the Stonker API resources. Monetary values are decimal strings.

export type MembershipRole = 'OWNER' | 'EDITOR' | 'VIEWER'
export type BrokerType = 'DEGIRO' | 'IBKR' | 'OTHER'
export type InstrumentType = 'STOCK' | 'ETF'
export type TransactionType = 'BUY' | 'SELL'
export type TransactionSource = 'MANUAL' | 'CSV' | 'FLEX'

export interface AccountRef {
  id: string
  name: string
}

export interface Membership {
  id: string
  role: MembershipRole
  joinedAt: string
  account?: AccountRef
  user?: { id: string; name: string; email: string }
}

export interface User {
  id: string
  email: string
  name: string
  memberships: Membership[]
}

export interface Account {
  id: string
  name: string
  createdAt: string
  memberships?: Membership[]
}

export interface Instrument {
  id: string
  symbol: string
  isin: string | null
  name: string
  type: InstrumentType
  currency: string
  exchange?: string | null
}

export interface Transaction {
  id: string
  account: string
  instrument: Instrument
  brokerType: BrokerType
  type: TransactionType
  tradeDate: string
  quantity: string
  pricePerShare: string
  currency: string
  fee: string
  feeCurrency: string
  notes: string | null
  source: TransactionSource
  createdAt: string
}

export interface Position {
  instrumentId: string
  symbol: string
  isin: string | null
  name: string
  type: InstrumentType
  currency: string
  quantity: string
  averageCost: string
  costBasis: string
  marketPrice: string | null
  marketValue: string | null
  unrealizedPnl: string | null
  unrealizedPnlPct: string | null
  realizedPnl: string
  priceAsOf: string | null
}

export interface PositionsReport {
  accountId: string
  asOf: string
  positions: Position[]
}

export interface CurrencyBucket {
  currency: string
  costBasis: string
  marketValue: string
  unrealizedPnl: string
  unrealizedPnlPct: string | null
  realizedPnl: string
  totalPnl: string
}

export interface PnlReport {
  accountId: string
  asOf: string
  buckets: CurrencyBucket[]
}

export interface PerformancePoint {
  date: string
  costBasis: string
  marketValue: string
  pnl: string
  pnlPct: string | null
}

export interface CurrencySeries {
  currency: string
  points: PerformancePoint[]
}

export interface PerformanceReport {
  accountId: string
  from: string
  to: string
  series: CurrencySeries[]
}

export interface Invitation {
  id: string
  account: AccountRef
  email: string
  role: MembershipRole
  token: string
  status: 'PENDING' | 'ACCEPTED' | 'REVOKED' | 'EXPIRED'
  createdAt: string
  expiresAt: string
}

export interface PriceSnapshot {
  id: string
  instrument: string
  date: string
  close: string
  currency: string
  source: 'API' | 'MANUAL'
}

export interface BrokerConnection {
  id: string
  account: string
  brokerType: BrokerType
  label: string
  active: boolean
  lastSyncAt: string | null
  createdAt: string
}

export interface BrokerSyncRun {
  id: string
  brokerConnection: string
  account: string
  fetched: boolean
  imported: number
  skipped: number
  note: string | null
  createdAt: string
}
