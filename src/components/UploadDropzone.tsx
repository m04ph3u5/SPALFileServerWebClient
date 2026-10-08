import { useEffect, useRef, useState } from 'react'
import { Icon } from './Icon'

export function UploadDropzone({
  uploading,
  onUpload,
}: {
  uploading: boolean
  onUpload: (files: File[]) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)

  useEffect(() => {
    let dragDepth = 0
    const enter = (event: DragEvent) => {
      event.preventDefault()
      dragDepth += 1
      setDragging(true)
    }
    const leave = (event: DragEvent) => {
      event.preventDefault()
      dragDepth -= 1
      if (dragDepth <= 0) setDragging(false)
    }
    const over = (event: DragEvent) => event.preventDefault()
    const drop = (event: DragEvent) => {
      event.preventDefault()
      dragDepth = 0
      setDragging(false)
      if (!uploading && event.dataTransfer?.files.length) {
        onUpload(Array.from(event.dataTransfer.files))
      }
    }
    window.addEventListener('dragenter', enter)
    window.addEventListener('dragleave', leave)
    window.addEventListener('dragover', over)
    window.addEventListener('drop', drop)
    return () => {
      window.removeEventListener('dragenter', enter)
      window.removeEventListener('dragleave', leave)
      window.removeEventListener('dragover', over)
      window.removeEventListener('drop', drop)
    }
  }, [onUpload, uploading])

  return (
    <>
      <button
        className="primary-button"
        disabled={uploading}
        type="button"
        onClick={() => inputRef.current?.click()}
      >
        <Icon name="upload" size={18} />
        {uploading ? 'Uploading…' : 'Upload'}
      </button>
      <input
        ref={inputRef}
        className="sr-only"
        multiple
        type="file"
        onChange={(event) => {
          onUpload(Array.from(event.target.files ?? []))
          event.target.value = ''
        }}
      />
      <div className={`drop-overlay ${dragging ? 'visible' : ''}`}>
        {dragging && (
          <div>
            <Icon name="upload" size={30} />
            <strong>Drop files to upload</strong>
            <span>They’ll be added to this folder</span>
          </div>
        )}
      </div>
    </>
  )
}
