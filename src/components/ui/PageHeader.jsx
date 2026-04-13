function PageHeader({ title, description }) {
  return (
    <header className="mb-6 sm:mb-8">
      <h2 className="text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">{title}</h2>
      {description && <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">{description}</p>}
    </header>
  )
}

export default PageHeader
