import React from 'react'

const TrialPage = () => {
  return (
    <div>
      <h1 className='text-2xl font-bold mb-4'>Benvenuto nella Trial di Smartables</h1>
      <p className='text-muted-foreground mb-6'>
        Esplora le funzionalità della piattaforma prima di attivare il tuo abbonamento.
      </p>

      {/* Demo content to test scrolling */}
      <div className='space-y-4'>
        {Array.from({ length: 30 }).map((_, i) => (
          <div key={i} className='p-4 border rounded-lg bg-card'>
            <h3 className='font-medium'>Sezione Demo {i + 1}</h3>
            <p className='text-sm text-muted-foreground'>
              Questo è un contenuto di esempio per testare lo scrolling dell&apos;area principale.
              La sidebar e la navbar dovrebbero rimanere fisse mentre questo contenuto scorre.
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}

export default TrialPage