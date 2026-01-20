'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { FileText, X, Upload } from 'lucide-react'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'

interface PdfUploadProps {
  value?: string | null
  onChange: (url: string | null, file?: File | null) => void
  disabled?: boolean
  className?: string
}

export function PdfUpload({
  value,
  onChange,
  disabled,
  className
}: PdfUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [fileName, setFileName] = useState<string | null>(value ? 'PDF File' : null)

  useEffect(() => {
    if (value) {
      // Try to extract filename from URL if possible, otherwise generic
      setFileName(value.split('/').pop() || 'PDF File')
    } else {
      setFileName(null)
    }
  }, [value])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.type !== 'application/pdf') {
      toast.error('Please upload a PDF file')
      return
    }

    // Max 10MB
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File must be less than 10MB')
      return
    }

    setFileName(file.name)
    // Create temporary object URL for preview/consistency if needed, but for PDF just pass null or stub as URL until uploaded
    // Actually the parent expects a URL string for "value". 
    // We pass null for URL because it's not uploaded yet. The parent handles the file.
    onChange(null, file)

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleRemove = () => {
    setFileName(null)
    onChange(null, null)
  }

  return (
    <div className={`space-y-2 w-full ${className}`}>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled}
          className='w-full'
        >
          <Upload className="w-4 h-4 mr-2" />
          {fileName ? 'Cambia File' : 'Carica PDF'}
        </Button>
        <input
          type="file"
          accept="application/pdf"
          className="hidden"
          ref={fileInputRef}
          onChange={handleFileSelect}
          disabled={disabled}
        />
      </div>
      {fileName && (
        <div className="flex items-center justify-between p-2 border rounded-md bg-muted/50 text-sm">
          <div className="flex items-center gap-2 truncate">
            <FileText className="w-4 h-4 text-red-500 shrink-0" />
            <span className="truncate">{fileName}</span>
          </div>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleRemove}>
            <X className="w-3 h-3" />
          </Button>
        </div>
      )}
    </div>
  )
}
