import { useState, useRef } from 'react';
import { UploadCloud, X, Image as ImageIcon } from 'lucide-react';
import { cn } from './Button';
import { getImageUrl } from '../../utils/imageUtils';

export default function ImageUploader({
  value,
  onChange,
  onClear,
  label = 'Upload Image',
  error,
  className,
  accept = 'image/png, image/jpeg, image/webp',
}) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const previewUrl = value instanceof File ? URL.createObjectURL(value) : getImageUrl(value);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file) => {
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file');
      return;
    }
    onChange(file);
  };

  const handleRemove = (e) => {
    e.stopPropagation();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    if (onClear) onClear();
    else onChange(null);
  };

  return (
    <div className={className}>
      <label className="label">{label}</label>
      <div
        className={cn(
          "relative mt-1 flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition-colors",
          isDragging ? "border-primary-500 bg-primary-50" : "border-slate-300 bg-slate-50 hover:bg-slate-100",
          error ? "border-red-500 bg-red-50" : "",
          previewUrl ? "p-2" : ""
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !previewUrl && fileInputRef.current?.click()}
      >
        <input
          type="file"
          className="hidden"
          ref={fileInputRef}
          accept={accept}
          onChange={handleChange}
        />

        {previewUrl ? (
          <div className="relative h-48 w-full group overflow-hidden rounded-md bg-slate-100">
            <img 
              src={previewUrl} 
              alt="Preview" 
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 transition-opacity flex items-center justify-center group-hover:opacity-100">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="rounded-full bg-white p-2 text-slate-700 hover:bg-slate-100 shadow-sm"
                  title="Change Image"
                >
                  <ImageIcon className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={handleRemove}
                  className="rounded-full bg-red-600 p-2 text-white hover:bg-red-700 shadow-sm"
                  title="Remove Image"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center cursor-pointer">
            <UploadCloud className="mx-auto h-10 w-10 text-slate-400" />
            <div className="mt-4 flex text-sm leading-6 text-slate-600">
              <span className="relative cursor-pointer rounded-md font-semibold text-primary-600 focus-within:outline-none hover:text-primary-500">
                <span>Upload a file</span>
              </span>
              <p className="pl-1">or drag and drop</p>
            </div>
            <p className="text-xs leading-5 text-slate-500">PNG, JPG, WEBP up to 5MB</p>
          </div>
        )}
      </div>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}
