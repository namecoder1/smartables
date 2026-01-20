'use client'

import React, { useEffect, useRef, useState } from 'react'
import QRCodeStyling, {
  DrawType,
  TypeNumber,
  Mode,
  ErrorCorrectionLevel,
  DotType,
  CornerSquareType,
  CornerDotType,
  Options
} from 'qr-code-styling'

type FileExtension = 'png' | 'jpeg' | 'webp' | 'svg';

interface QRCodeProps {
  data: string
  width?: number
  height?: number
  image?: string
  dotsColor?: string
  backgroundColor?: string
  cornerSquareColor?: string
  cornerDotColor?: string
  type?: DrawType
  imageOptions?: {
    hideBackgroundDots?: boolean
    imageSize?: number
    margin?: number
    crossOrigin?: string
  }
}

const QRCode = ({
  data,
  width = 300,
  height = 300,
  image,
  dotsColor = '#000000',
  backgroundColor = '#ffffff',
  cornerSquareColor = '#000000',
  cornerDotColor = '#000000',
  type = 'svg',
  imageOptions = {
    crossOrigin: "anonymous",
    margin: 10
  }
}: QRCodeProps) => {
  const ref = useRef<HTMLDivElement>(null)
  const [qrCode] = useState<QRCodeStyling>(new QRCodeStyling({
      width,
      height,
      type,
      data,
      image,
      dotsOptions: {
          color: dotsColor,
          type: 'rounded'
      },
      backgroundOptions: {
          color: backgroundColor,
      },
      imageOptions,
      cornersSquareOptions: {
        color: cornerSquareColor,
        type: 'extra-rounded'
      },
      cornersDotOptions: {
        color: cornerDotColor,
        type: 'dot'
      }
  }))

  useEffect(() => {
    if (ref.current) {
      qrCode.append(ref.current)
    }
  }, [qrCode, ref])

  useEffect(() => {
    qrCode.update({
      data,
      width,
      height,
      type,
      image,
      dotsOptions: {
          color: dotsColor,
          type: 'rounded'
      },
      backgroundOptions: {
          color: backgroundColor,
      },
      imageOptions,
      cornersSquareOptions: {
        color: cornerSquareColor,
        type: 'extra-rounded'
      },
      cornersDotOptions: {
        color: cornerDotColor,
        type: 'dot'
      }
    })
  }, [data, width, height, image, dotsColor, backgroundColor, cornerSquareColor, cornerDotColor, type, imageOptions, qrCode])

  const onDownloadClick = (extension: FileExtension) => {
    qrCode.download({
      extension: extension
    })
  }

  return (
    <div className='flex flex-col items-center gap-4'>
      <div ref={ref} />
      <div className="flex gap-2">
         <button onClick={() => onDownloadClick('png')} className="text-xs border rounded-md px-2 py-1 hover:bg-zinc-100 dark:hover:bg-zinc-800">
           Download PNG
         </button>
         <button onClick={() => onDownloadClick('svg')} className="text-xs border rounded-md px-2 py-1 hover:bg-zinc-100 dark:hover:bg-zinc-800">
           Download SVG
         </button>
      </div>
    </div>
  )
}

export default QRCode
