'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Image as ImageIcon, X, Upload } from 'lucide-react'
import Image from 'next/image'
import { toast } from 'sonner'
import { Label } from '../ui/label'
import { cn } from '@/lib/utils'

interface ImageUploadProps {
  value?: string | null
  onChange: (url: string | null, file?: File | null) => void
  disabled?: boolean
  className?: string
  aspect?: 'video' | 'square' | '4:3' | '16:9'
  title: string
}

export function ImageUpload({
  value,
  onChange,
  disabled,
  className,
  aspect = 'video',
  title
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
        <Label htmlFor='image-upload' className="mb-2 flex items-center gap-2">
          <ImageIcon className="w-4 h-4" />
          {title}
        </Label>
      </div>
      <div className="flex flex-col-reverse items-end gap-1">
        {previewUrl ? (
          <div className={`relative aspect-${aspect} w-full h-40 overflow-hidden rounded-xl border bg-muted/60`}>
            <Image
              src={previewUrl}
              alt="Upload"
              height={200}
              width={200}
              className={cn(
                aspect === 'video' ?
                  'object-cover aspect-video h-40 w-full' :
                  'object-scale-down aspect-square h-40 w-full'
              )}
            />
            <Button
              type="button"
              onClick={handleRemove}
              variant="destructive"
              size="icon"
              className="absolute z-50 right-2 top-2 h-4 w-4"
              disabled={disabled}
            >
              <X className="w-3 h-3" />
            </Button>
          </div>
        ) : (
          <div
            onClick={() => !disabled && fileInputRef.current?.click()}
            className={`flex flex-col rounded-xl items-center justify-center aspect-video w-full py-4 h-40 border border-dashed bg-muted/50 transition-colors ${!disabled ? 'hover:bg-muted cursor-pointer' : 'opacity-50 cursor-not-allowed'}`}
          >
            <ImageIcon className="w-6 h-6 text-muted-foreground mb-1" />
            <span className="text-xs text-muted-foreground">Clicca e carica</span>
          </div>
        )}

        <div className="flex flex-col gap-2">
          <input
            type="file"
            id='image-upload'
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
