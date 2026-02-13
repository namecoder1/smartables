'use client'

import { useMemo, useState } from 'react'
import { CheckIcon, EyeIcon, EyeOffIcon, XIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

export const requirements = [
  { regex: /.{12,}/, text: 'Almeno 12 caratteri' },
  { regex: /[a-z]/, text: 'Almeno 1 lettera minuscola' },
  { regex: /[A-Z]/, text: 'Almeno 1 lettera maiuscola' },
  { regex: /[0-9]/, text: 'Almeno 1 numero' },
  {
    regex: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?]/,
    text: 'Almeno 1 carattere speciale'
  }
]

export function isPasswordValid(password: string): boolean {
  return requirements.every(req => req.regex.test(password))
}

const PasswordStrength = ({
  id,
  name,
  required,
  value,
  onChange,
  placeholder
}: {
  id: string
  name: string
  required: boolean
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  placeholder?: string
}) => {
  const [isVisible, setIsVisible] = useState(false)

  const toggleVisibility = () => setIsVisible(prevState => !prevState)

  const strength = requirements.map(req => ({
    met: req.regex.test(value),
    text: req.text
  }))

  const strengthScore = useMemo(() => {
    return strength.filter(req => req.met).length
  }, [strength])

  const getColor = (score: number) => {
    if (score === 0) return 'bg-border'
    if (score <= 1) return 'bg-destructive'
    if (score <= 2) return 'bg-orange-500 '
    if (score <= 3) return 'bg-amber-500'
    if (score === 4) return 'bg-yellow-400'

    return 'bg-green-500'
  }

  const getText = (score: number) => {
    if (score === 0) return 'Inserisci una password'
    if (score <= 2) return 'Password debole'
    if (score <= 3) return 'Password accettabile'
    if (score === 4) return 'Password forte'

    return 'Password ottima'
  }

  return (
    <div className='w-full space-y-2'>
      <div className='relative mb-3'>
        <Input
          id={id}
          name={name}
          required={required}
          type={isVisible ? 'text' : 'password'}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          className='pr-9'
        />
        <Button
          variant='ghost'
          size='icon'
          type='button'
          onClick={toggleVisibility}
          className='text-muted-foreground focus-visible:ring-ring/50 absolute inset-y-0 right-0 rounded-l-none hover:bg-transparent'
        >
          {isVisible ? <EyeOffIcon /> : <EyeIcon />}
          <span className='sr-only'>{isVisible ? 'Hide password' : 'Show password'}</span>
        </Button>
      </div>

      <div className='mb-4 flex h-1 w-full gap-1'>
        {Array.from({ length: 5 }).map((_, index) => (
          <span
            key={index}
            className={cn(
              'h-full flex-1 rounded-full transition-all duration-500 ease-out',
              index < strengthScore ? getColor(strengthScore) : 'bg-border'
            )}
          />
        ))}
      </div>

      <p className='text-foreground text-sm font-medium'>{getText(strengthScore)}. Deve contenere:</p>

      <ul className='mb-4 space-y-1.5'>
        {strength.map((req, index) => (
          <li key={index} className='flex items-center gap-2'>
            {req.met ? (
              <CheckIcon className='size-4 text-green-600 dark:text-green-400' />
            ) : (
              <XIcon className='text-muted-foreground size-4' />
            )}
            <span className={cn('text-xs', req.met ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground')}>
              {req.text}
              <span className='sr-only'>{req.met ? ' - Requisiti soddisfatti' : ' - Requisito non soddisfatto'}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default PasswordStrength
