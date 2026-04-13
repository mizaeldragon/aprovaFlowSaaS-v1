const STATUS_STYLES = {
  pending: 'border border-amber-200 bg-amber-50 text-amber-800',
  approved: 'border border-emerald-200 bg-emerald-50 text-emerald-700',
  changes_requested: 'border border-rose-200 bg-rose-50 text-rose-700',
}

const STATUS_LABELS = {
  pending: 'Pendente de aprovacao',
  approved: 'Aprovado',
  changes_requested: 'Ajustes solicitados',
}

function StatusBadge({ status }) {
  const label = STATUS_LABELS[status] ?? status
  const style = STATUS_STYLES[status] ?? 'border border-slate-200 bg-slate-100 text-slate-700'

  return (
    <span
      className={`inline-flex min-h-7 items-center whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold leading-none ${style}`}
    >
      {label}
    </span>
  )
}

export default StatusBadge
