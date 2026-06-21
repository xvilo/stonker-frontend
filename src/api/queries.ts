import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from './client'
import type {
  Account,
  BrokerConnection,
  Instrument,
  Invitation,
  PerformanceReport,
  PnlReport,
  PositionsReport,
  Transaction,
  TransactionType,
  BrokerType,
} from './types'

export const accountIri = (id: string) => `/api/accounts/${id}`
export const instrumentIri = (id: string) => `/api/instruments/${id}`

// ---- Queries ---------------------------------------------------------------

export function useAccounts() {
  return useQuery({
    queryKey: ['accounts'],
    queryFn: async () => (await api.get<Account[]>('/accounts')).data,
  })
}

export function usePositions(accountId: string | null) {
  return useQuery({
    queryKey: ['positions', accountId],
    enabled: !!accountId,
    queryFn: async () => (await api.get<PositionsReport>(`/accounts/${accountId}/positions`)).data,
  })
}

export function usePnl(accountId: string | null) {
  return useQuery({
    queryKey: ['pnl', accountId],
    enabled: !!accountId,
    queryFn: async () => (await api.get<PnlReport>(`/accounts/${accountId}/pnl`)).data,
  })
}

export function usePerformance(accountId: string | null, params: { from?: string; to?: string; currency?: string }) {
  return useQuery({
    queryKey: ['performance', accountId, params],
    enabled: !!accountId,
    queryFn: async () =>
      (await api.get<PerformanceReport>(`/accounts/${accountId}/performance`, { params })).data,
  })
}

export function useTransactions(accountId: string | null) {
  return useQuery({
    queryKey: ['transactions', accountId],
    enabled: !!accountId,
    queryFn: async () =>
      (
        await api.get<Transaction[]>('/transactions', {
          params: { account: accountIri(accountId!), 'order[tradeDate]': 'desc' },
        })
      ).data,
  })
}

export function useInstruments(search: string) {
  return useQuery({
    queryKey: ['instruments', search],
    queryFn: async () =>
      (await api.get<Instrument[]>('/instruments', { params: search ? { symbol: search } : {} })).data,
  })
}

export function useInvitations(accountId: string | null) {
  return useQuery({
    queryKey: ['invitations', accountId],
    enabled: !!accountId,
    queryFn: async () =>
      (await api.get<Invitation[]>('/invitations', { params: { account: accountIri(accountId!) } })).data,
  })
}

export function useBrokerConnections(accountId: string | null) {
  return useQuery({
    queryKey: ['brokerConnections', accountId],
    enabled: !!accountId,
    queryFn: async () =>
      (await api.get<BrokerConnection[]>('/broker_connections', { params: { account: accountIri(accountId!) } }))
        .data,
  })
}

// ---- Mutations -------------------------------------------------------------

function useAccountInvalidator(accountId: string | null) {
  const qc = useQueryClient()
  return () => {
    for (const key of ['positions', 'pnl', 'performance', 'transactions']) {
      qc.invalidateQueries({ queryKey: [key, accountId] })
    }
  }
}

export interface TransactionInput {
  account: string
  instrument: string
  brokerType: BrokerType
  type: TransactionType
  tradeDate: string
  quantity: string
  pricePerShare: string
  fee?: string
  notes?: string | null
}

export function useCreateTransaction(accountId: string | null) {
  const qc = useQueryClient()
  const invalidate = useAccountInvalidator(accountId)
  return useMutation({
    mutationFn: async (input: TransactionInput) => (await api.post<Transaction>('/transactions', input)).data,
    onSuccess: () => {
      invalidate()
      qc.invalidateQueries({ queryKey: ['transactions', accountId] })
    },
  })
}

export function useDeleteTransaction(accountId: string | null) {
  const invalidate = useAccountInvalidator(accountId)
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/transactions/${id}`)
    },
    onSuccess: invalidate,
  })
}

export function useCreateInstrument() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: Partial<Instrument>) => (await api.post<Instrument>('/instruments', input)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['instruments'] }),
  })
}

export function useCreateAccount() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (name: string) => (await api.post<Account>('/accounts', { name })).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['accounts'] }),
  })
}

export function useCreateInvitation(accountId: string | null) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: { email: string; role: string }) =>
      (await api.post<Invitation>('/invitations', { ...input, account: accountIri(accountId!) })).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['invitations', accountId] }),
  })
}

export function useAcceptInvitation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (token: string) => (await api.post(`/invitations/${token}/accept`, {})).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['accounts'] })
    },
  })
}

export function useCreateBrokerConnection(accountId: string | null) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: { label: string; brokerType: BrokerType; credentials: Record<string, string> }) =>
      (await api.post<BrokerConnection>('/broker_connections', { ...input, account: accountIri(accountId!) })).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['brokerConnections', accountId] }),
  })
}

export function useUploadCsv(accountId: string | null) {
  const invalidate = useAccountInvalidator(accountId)
  return useMutation({
    mutationFn: async ({ file, broker }: { file: File; broker: BrokerType }) => {
      const form = new FormData()
      form.append('file', file)
      form.append('broker', broker)
      const { data } = await api.post(`/accounts/${accountId}/imports`, form, {
        headers: { 'Content-Type': null },
      })
      return data as { rowsImported: number; rowsSkipped: number; status: string; errors: string[] }
    },
    onSuccess: invalidate,
  })
}

export function useAddManualPrice() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: { instrument: string; date: string; close: string }) =>
      (await api.post('/price_snapshots', input)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['positions'] })
      qc.invalidateQueries({ queryKey: ['pnl'] })
      qc.invalidateQueries({ queryKey: ['performance'] })
    },
  })
}
