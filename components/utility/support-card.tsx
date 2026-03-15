import { Store } from 'lucide-react'
import React from 'react'
import { Button } from '../ui/button'

const SupportCard = () => {
  return (
    <div className='p-8 rounded-[32px] border-2 border-dashed flex flex-col items-center justify-center text-center gap-3 bg-card'>
      <div className='p-3 bg-background rounded-2xl border-2 shadow-sm mb-1'>
        <Store className='w-6 h-6 text-primary' />
      </div>
      <div>
        <p className='text-sm font-bold'>Hai bisogno di aiuto?</p>
        <p className='text-xs text-muted-foreground mt-1'>Il nostro team di supporto è disponibile 24/7 per assisterti nella configurazione.</p>
      </div>
      <Button className='text-xs font-bold' size='sm'>Contattaci ora</Button>
    </div>
  )
}

export default SupportCard