'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Image as ImageIcon, X, Upload } from 'lucide-react'
import Image from 'next/image'
import { toast } from 'sonner'
import { Label } from '../ui/label'

interface ImageUploadProps {
  value?: string | null
  onChange: (url: string | null, file?: File | null) => void
  disabled?: boolean
  className?: string
}

export function ImageUpload({
  value,
  onChange,
  disabled,
  className
}: ImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(value || null)

  useEffect(() => {
    setPreviewUrl(value || null)
  }, [value])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Simple validation
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file')
      return
    }

    // Max 5MB
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB')
      return
    }

    const objectUrl = URL.createObjectURL(file)
    setPreviewUrl(objectUrl)
    onChange(objectUrl, file)

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleRemove = () => {
    setPreviewUrl(null)
    onChange(null, null)
  }

  return (
    <div className={`w-full ${className}`}>
      <div className='flex items-center justify-between'>
        <Label className="mb-2 block">Immagine</Label>
      </div>
      <div className="flex flex-col-reverse items-end gap-1">
        {previewUrl ? (
          <div className="relative aspect-video w-full h-40 rounded-md overflow-hidden border bg-muted">
            <Image
              src={previewUrl}
              alt="Upload"
              height={200}
              width={200}
              className="object-cover aspect-video h-40 w-full"
            />
            <Button
              type="button"
              onClick={handleRemove}
              variant="destructive"
              size="icon"
              className="absolute z-50 right-2 top-2 h-6 w-6"
              disabled={disabled}
            >
              <X className="w-3 h-3" />
            </Button>
          </div>
        ) : (
          <div
            onClick={() => !disabled && fileInputRef.current?.click()}
            className={`flex flex-col items-center justify-center aspect-video w-full py-4 h-40 rounded-2xl border border-dashed bg-muted/50 transition-colors ${!disabled ? 'hover:bg-muted cursor-pointer' : 'opacity-50 cursor-not-allowed'}`}
          >
            <ImageIcon className="w-6 h-6 text-muted-foreground mb-1" />
            <span className="text-xs text-muted-foreground">Clicca e carica</span>
          </div>
        )}

        <div className="flex flex-col gap-2">
          <input
            type="file"
            accept="image/*"
            className="hidden"
            ref={fileInputRef}
            onChange={handleFileSelect}
            disabled={disabled}
          />
        </div>
      </div>
    </div>
  )
}
