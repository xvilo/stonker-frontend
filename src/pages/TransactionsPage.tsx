import { useRef, useState, type FormEvent } from 'react'
import { useAuth } from '../auth/AuthContext'
import {
  accountIri,
  instrumentIri,
  useCreateInstrument,
  useCreateTransaction,
  useDeleteTransaction,
  useInstruments,
  useTransactions,
  useUploadCsv,
} from '../api/queries'
import { apiErrorMessage } from '../api/client'
import type { BrokerType, InstrumentType, TransactionType } from '../api/types'
import { Money } from '../components/Money'
import { number, shortDate } from '../lib/format'

export function TransactionsPage() {
  const { selectedAccountId } = useAuth()
  const { data: transactions, isLoading } = useTransactions(selectedAccountId)
  const del = useDeleteTransaction(selectedAccountId)
  const [showAdd, setShowAdd] = useState(false)

  return (
    <>
      <div className="page-head">
        <h1>Transactions</h1>
        <button className="btn-primary" onClick={() => setShowAdd(true)}>+ Add transaction</button>
      </div>

      <ImportCard accountId={selectedAccountId} />

      <div className="card">
        <div className="card-head"><h2>History</h2><span className="faint">{transactions?.length ?? 0} entries</span></div>
        <div className="table-scroll">
          <table className="data">
            <thead>
              <tr>
                <th>Date</th><th>Instrument</th><th>Type</th>
                <th className="right">Qty</th><th className="right">Price</th><th className="right">Fee</th>
                <th>Broker</th><th>Source</th><th></th>
              </tr>
            </thead>
            <tbody>
              {(transactions ?? []).map((t) => (
                <tr key={t.id}>
                  <td className="nowrap">{shortDate(t.tradeDate)}</td>
                  <td><span className="sym">{t.instrument.symbol}<small>{t.instrument.name}</small></span></td>
                  <td><span className={`badge ${t.type === 'BUY' ? 'buy' : 'sell'}`}>{t.type}</span></td>
                  <td className="right mono">{number(t.quantity, 4)}</td>
                  <td className="right mono"><Money value={t.pricePerShare} currency={t.currency} /></td>
                  <td className="right mono"><Money value={t.fee} currency={t.feeCurrency} /></td>
                  <td>{t.brokerType}</td>
                  <td><span className="badge muted">{t.source}</span></td>
                  <td className="right">
                    <button
                      className="btn-danger btn-sm"
                      onClick={() => { if (confirm('Delete this transaction?')) del.mutate(t.id) }}
                    >Delete</button>
                  </td>
                </tr>
              ))}
              {!isLoading && (transactions?.length ?? 0) === 0 && (
                <tr><td colSpan={9} className="empty">No transactions yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showAdd && <AddTransactionDialog accountId={selectedAccountId} onClose={() => setShowAdd(false)} />}
    </>
  )
}

function ImportCard({ accountId }: { accountId: string | null }) {
  const upload = useUploadCsv(accountId)
  const [broker, setBroker] = useState<BrokerType>('DEGIRO')
  const fileRef = useRef<HTMLInputElement>(null)

  function submit(e: FormEvent) {
    e.preventDefault()
    const file = fileRef.current?.files?.[0]
    if (file) upload.mutate({ file, broker })
  }

  return (
    <div className="card card-pad" style={{ marginBottom: 18 }}>
      <div className="flex between" style={{ marginBottom: 10 }}>
        <h2>Import broker CSV</h2>
        <span className="faint">DeGiro transactions · IBKR activity/flex export</span>
      </div>
      <form className="flex" style={{ gap: 12, flexWrap: 'wrap' }} onSubmit={submit}>
        <select value={broker} onChange={(e) => setBroker(e.target.value as BrokerType)} style={{ width: 'auto' }}>
          <option value="DEGIRO">DeGiro</option>
          <option value="IBKR">IBKR</option>
        </select>
        <input ref={fileRef} type="file" accept=".csv,text/csv" style={{ width: 'auto' }} required />
        <button className="btn-primary" disabled={upload.isPending}>{upload.isPending ? 'Importing…' : 'Import'}</button>
      </form>
      {upload.isError && <div className="alert error" style={{ marginTop: 12 }}>{apiErrorMessage(upload.error)}</div>}
      {upload.isSuccess && (
        <div className="alert success" style={{ marginTop: 12 }}>
          Imported {upload.data.rowsImported}, skipped {upload.data.rowsSkipped} (duplicates).
          {upload.data.errors.length > 0 && <> {upload.data.errors.length} row error(s).</>}
        </div>
      )}
    </div>
  )
}

function AddTransactionDialog({ accountId, onClose }: { accountId: string | null; onClose: () => void }) {
  const { data: instruments } = useInstruments('')
  const create = useCreateTransaction(accountId)
  const createInstrument = useCreateInstrument()

  const [instrumentId, setInstrumentId] = useState('')
  const [broker, setBroker] = useState<BrokerType>('DEGIRO')
  const [type, setType] = useState<TransactionType>('BUY')
  const [tradeDate, setTradeDate] = useState(new Date().toISOString().slice(0, 10))
  const [quantity, setQuantity] = useState('')
  const [price, setPrice] = useState('')
  const [fee, setFee] = useState('0')
  const [error, setError] = useState<string | null>(null)
  const [showNew, setShowNew] = useState(false)

  // New-instrument fields
  const [ni, setNi] = useState({ symbol: '', name: '', isin: '', type: 'ETF' as InstrumentType, currency: 'EUR' })

  async function addInstrument() {
    setError(null)
    try {
      const created = await createInstrument.mutateAsync({
        symbol: ni.symbol, name: ni.name, type: ni.type, currency: ni.currency, isin: ni.isin || null,
      })
      setInstrumentId(created.id)
      setShowNew(false)
    } catch (err) {
      setError(apiErrorMessage(err))
    }
  }

  async function submit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    if (!instrumentId) { setError('Pick an instrument.'); return }
    try {
      await create.mutateAsync({
        account: accountIri(accountId!),
        instrument: instrumentIri(instrumentId),
        brokerType: broker,
        type,
        tradeDate,
        quantity,
        pricePerShare: price,
        fee: fee || '0',
      })
      onClose()
    } catch (err) {
      setError(apiErrorMessage(err))
    }
  }

  return (
    <div className="dialog-backdrop" onClick={onClose}>
      <div className="card card-pad dialog" onClick={(e) => e.stopPropagation()}>
        <div className="flex between" style={{ marginBottom: 14 }}>
          <h2>Add transaction</h2>
          <button className="btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>
        {error && <div className="alert error">{error}</div>}
        <form onSubmit={submit}>
          <div className="field">
            <label>Instrument</label>
            <div className="flex" style={{ gap: 8 }}>
              <select value={instrumentId} onChange={(e) => setInstrumentId(e.target.value)}>
                <option value="">Select…</option>
                {(instruments ?? []).map((i) => (
                  <option key={i.id} value={i.id}>{i.symbol} — {i.name} ({i.currency})</option>
                ))}
              </select>
              <button type="button" className="btn-sm" onClick={() => setShowNew((s) => !s)}>+ New</button>
            </div>
          </div>

          {showNew && (
            <div className="card-pad" style={{ background: 'var(--surface-2)', borderRadius: 8, marginBottom: 14 }}>
              <div className="form-row">
                <div><label>Symbol</label><input value={ni.symbol} onChange={(e) => setNi({ ...ni, symbol: e.target.value })} /></div>
                <div><label>Currency</label><input value={ni.currency} onChange={(e) => setNi({ ...ni, currency: e.target.value.toUpperCase() })} maxLength={3} /></div>
              </div>
              <div className="field"><label>Name</label><input value={ni.name} onChange={(e) => setNi({ ...ni, name: e.target.value })} /></div>
              <div className="form-row">
                <div><label>ISIN (optional)</label><input value={ni.isin} onChange={(e) => setNi({ ...ni, isin: e.target.value.toUpperCase() })} /></div>
                <div>
                  <label>Type</label>
                  <select value={ni.type} onChange={(e) => setNi({ ...ni, type: e.target.value as InstrumentType })}>
                    <option value="ETF">ETF</option><option value="STOCK">Stock</option>
                  </select>
                </div>
              </div>
              <button type="button" className="btn-primary btn-sm" onClick={addInstrument} disabled={createInstrument.isPending}>Create instrument</button>
            </div>
          )}

          <div className="form-row">
            <div><label>Broker</label>
              <select value={broker} onChange={(e) => setBroker(e.target.value as BrokerType)}>
                <option value="DEGIRO">DeGiro</option><option value="IBKR">IBKR</option><option value="OTHER">Other</option>
              </select>
            </div>
            <div><label>Type</label>
              <select value={type} onChange={(e) => setType(e.target.value as TransactionType)}>
                <option value="BUY">Buy</option><option value="SELL">Sell</option>
              </select>
            </div>
          </div>
          <div className="form-row">
            <div><label>Trade date</label><input type="date" value={tradeDate} onChange={(e) => setTradeDate(e.target.value)} required /></div>
            <div><label>Quantity</label><input value={quantity} onChange={(e) => setQuantity(e.target.value)} required inputMode="decimal" placeholder="10" /></div>
          </div>
          <div className="form-row">
            <div><label>Price / share</label><input value={price} onChange={(e) => setPrice(e.target.value)} required inputMode="decimal" placeholder="100.00" /></div>
            <div><label>Fee</label><input value={fee} onChange={(e) => setFee(e.target.value)} inputMode="decimal" placeholder="0" /></div>
          </div>
          <div className="row-actions" style={{ marginTop: 8 }}>
            <button type="button" className="btn" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={create.isPending}>{create.isPending ? 'Saving…' : 'Save'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}
