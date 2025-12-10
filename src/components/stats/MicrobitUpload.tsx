import { useState, useRef, type ChangeEvent } from 'react'
import { parseMicrobitCSV } from '../../utils/csvParser'
import type { ReleaseTimingEntry } from '../../utils/types'

interface MicrobitUploadProps {
  onUpload: (entries: ReleaseTimingEntry[]) => void
}

export const MicrobitUpload = ({ onUpload }: MicrobitUploadProps) => {
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Reset states
    setError(null)
    setSuccess(false)

    // Validate file type
    if (!file.name.endsWith('.csv')) {
      setError('Please upload a CSV file')
      return
    }

    setIsUploading(true)

    try {
      // Read file content
      const text = await file.text()
      
      // Parse CSV
      const entries = parseMicrobitCSV(text)
      
      // Upload to parent
      onUpload(entries)
      
      setSuccess(true)
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      console.error('CSV upload error:', err)
      setError(err instanceof Error ? err.message : 'Failed to upload CSV file')
    } finally {
      setIsUploading(false)
    }
  }

  const handleButtonClick = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className="microbit-upload">
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        onChange={handleFileSelect}
        className="microbit-upload__input"
        disabled={isUploading}
        aria-label="Upload Microbit CSV file"
      />
      
      <button
        type="button"
        className="microbit-upload__button"
        onClick={handleButtonClick}
        disabled={isUploading}
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="17 8 12 3 7 8" />
          <line x1="12" y1="3" x2="12" y2="15" />
        </svg>
        {isUploading ? 'Uploading...' : 'Upload Microbit CSV'}
      </button>

      {error && (
        <div className="microbit-upload__error">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          {error}
        </div>
      )}

      {success && (
        <div className="microbit-upload__success">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
          CSV uploaded successfully!
        </div>
      )}
    </div>
  )
}
