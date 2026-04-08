import { PortableText, PortableTextComponents } from '@portabletext/react'

const calloutStyles: Record<string, { bg: string; border: string; icon: string; label: string }> = {
  tip:     { bg: 'bg-blue-50',   border: 'border-blue-200',  icon: '💡', label: 'Consiglio' },
  note:    { bg: 'bg-sky-50',    border: 'border-sky-200',   icon: 'ℹ️', label: 'Nota' },
  warning: { bg: 'bg-amber-50',  border: 'border-amber-200', icon: '⚠️', label: 'Attenzione' },
  danger:  { bg: 'bg-red-50',    border: 'border-red-200',   icon: '🚨', label: 'Importante' },
  example: { bg: 'bg-gray-50',   border: 'border-gray-200',  icon: '📌', label: 'Esempio' },
}

const components: PortableTextComponents = {
  block: {
    h2: ({ children }) => (
      <h2 className="text-xl font-bold text-gray-900 mt-10 mb-3 pb-2 border-b border-gray-100">
        {children}
      </h2>
    ),
    h3: ({ children }) => (
      <h3 className="text-lg font-semibold text-gray-900 mt-8 mb-2">{children}</h3>
    ),
    h4: ({ children }) => (
      <h4 className="text-base font-semibold text-gray-800 mt-6 mb-1.5">{children}</h4>
    ),
    normal: ({ children }) => (
      <p className="text-gray-600 leading-relaxed text-[0.975rem]">{children}</p>
    ),
    blockquote: ({ children }) => (
      <blockquote className="border-l-4 border-[#FF9710] pl-5 py-2 italic text-gray-500 bg-orange-50/60 rounded-r-xl my-6">
        {children}
      </blockquote>
    ),
  },
  list: {
    bullet: ({ children }) => (
      <ul className="list-disc pl-5 space-y-1.5 text-gray-600 text-[0.975rem]">{children}</ul>
    ),
    number: ({ children }) => (
      <ol className="list-decimal pl-5 space-y-1.5 text-gray-600 text-[0.975rem]">{children}</ol>
    ),
  },
  listItem: {
    bullet: ({ children }) => <li className="leading-relaxed">{children}</li>,
    number: ({ children }) => <li className="leading-relaxed">{children}</li>,
  },
  marks: {
    strong: ({ children }) => (
      <strong className="font-semibold text-gray-900">{children}</strong>
    ),
    em: ({ children }) => <em className="italic">{children}</em>,
    code: ({ children }) => (
      <code className="bg-gray-100 text-gray-800 text-[0.875em] px-1.5 py-0.5 rounded-md font-mono border border-gray-200">
        {children}
      </code>
    ),
    link: ({ children, value }) => (
      <a
        href={value?.href}
        target={value?.blank ? '_blank' : undefined}
        rel={value?.blank ? 'noopener noreferrer' : undefined}
        className="text-[#FF9710] underline underline-offset-2 hover:text-[#e4870e] transition-colors"
      >
        {children}
      </a>
    ),
  },
  types: {
    docImage: ({ value }) => {
      const sizeMap: Record<string, string> = { sm: 'max-w-xs', md: 'max-w-xl', full: 'w-full' }
      const sizeClass = sizeMap[value.size as string] ?? 'w-full'
      if (!value.image?.url) return null
      return (
        <figure className={`${sizeClass} mx-auto my-8`}>
          <div className="rounded-xl overflow-hidden border border-gray-200 shadow-sm">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={value.image.url} alt={value.alt ?? ''} className="w-full h-auto" />
          </div>
          {value.caption && (
            <figcaption className="text-sm text-gray-400 text-center mt-2">
              {value.caption}
            </figcaption>
          )}
        </figure>
      )
    },
    callout: ({ value }) => {
      const s = calloutStyles[value.type] ?? calloutStyles.note
      return (
        <div className={`${s.bg} ${s.border} border rounded-xl p-4 my-6`}>
          <div className="flex gap-3">
            <span className="text-lg shrink-0 mt-0.5">{s.icon}</span>
            <div className="min-w-0">
              {value.title ? (
                <p className="text-sm font-semibold text-gray-800 mb-1">{value.title}</p>
              ) : (
                <p className="text-sm font-semibold text-gray-500 mb-1">{s.label}</p>
              )}
              <p className="text-sm text-gray-700 leading-relaxed">{value.text}</p>
            </div>
          </div>
        </div>
      )
    },
    table: ({ value }) => {
      const rows: { _key: string; cells: string[] }[] = value.rows ?? []
      if (rows.length === 0) return null
      const [headerRow, ...bodyRows] = rows
      return (
        <div className="my-6 overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
          <table className="min-w-full text-sm text-gray-700">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {headerRow.cells.map((cell, i) => (
                  <th
                    key={i}
                    className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap"
                  >
                    {cell}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {bodyRows.map((row, ri) => (
                <tr key={row._key ?? ri} className="hover:bg-gray-50/60 transition-colors">
                  {row.cells.map((cell, ci) => (
                    <td key={ci} className="px-4 py-3 text-gray-600 leading-relaxed">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )
    },
    steps: ({ value }) => (
      <div className="my-8">
        {value.title && (
          <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
            {value.title}
          </p>
        )}
        <ol className="space-y-4">
          {value.steps?.map((step: { label: string; description?: string; image?: { url: string } }, i: number) => (
            <li key={i} className="flex gap-4">
              <span className="flex-shrink-0 w-7 h-7 rounded-full bg-[#FF9710] text-white text-sm font-bold flex items-center justify-center mt-0.5">
                {i + 1}
              </span>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 text-sm">{step.label}</p>
                {step.description && (
                  <p className="text-sm text-gray-500 mt-0.5 leading-relaxed">{step.description}</p>
                )}
                {step.image?.url && (
                  <div className="mt-3 rounded-xl overflow-hidden border border-gray-200 shadow-sm">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={step.image.url} alt={step.label} className="w-full h-auto" />
                  </div>
                )}
              </div>
            </li>
          ))}
        </ol>
      </div>
    ),
  },
}

export function DocsContent({ content }: { content: any[] }) {
  return (
    <div className="flex flex-col gap-4">
      <PortableText value={content} components={components} />
    </div>
  )
}
