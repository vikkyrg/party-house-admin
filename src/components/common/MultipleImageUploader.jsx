import { useState, useRef } from 'react';
import { UploadCloud, X, Image as ImageIcon } from 'lucide-react';
import { cn } from './Button';
import { getImageUrl, handleImageError } from '../../utils/imageUtils';

export default function MultipleImageUploader({
  value = [],
  onChange,
  onClear,
  label = 'Upload Images',
  error,
  className,
  accept = 'image/png, image/jpeg, image/webp',
}) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const getPreviewUrl = (val) => val instanceof File ? URL.createObjectURL(val) : getImageUrl(val);
  const previewUrls = (value || []).map(getPreviewUrl);

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
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(Array.from(e.target.files));
    }
  };

  const handleFiles = (files) => {
    const validFiles = files.filter(file => file.type.startsWith('image/'));
    if (validFiles.length !== files.length) {
      alert('Some files were rejected. Please upload image files only.');
    }
    if (validFiles.length > 0) {
      onChange([...(value || []), ...validFiles]);
    }
  };

  const handleRemove = (index, e) => {
    e.stopPropagation();
    const newValue = [...(value || [])];
    newValue.splice(index, 1);
    onChange(newValue);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className={className}>
      <label className="label">{label}</label>
      <div
        className={cn(
          "relative mt-1 flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition-colors",
          isDragging ? "border-primary-500 bg-primary-50" : "border-slate-300 bg-slate-50 hover:bg-slate-100",
          error ? "border-red-500 bg-red-50" : "",
          previewUrls.length > 0 ? "p-2" : ""
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          type="file"
          className="hidden"
          ref={fileInputRef}
          accept={accept}
          onChange={handleChange}
          multiple
        />

        <div className="w-full text-center cursor-pointer mb-4">
          <UploadCloud className="mx-auto h-10 w-10 text-slate-400" />
          <div className="mt-4 flex justify-center text-sm leading-6 text-slate-600">
            <span className="relative cursor-pointer rounded-md font-semibold text-primary-600 focus-within:outline-none hover:text-primary-500">
              <span>Upload files</span>
            </span>
            <p className="pl-1">or drag and drop</p>
          </div>
          <p className="text-xs leading-5 text-slate-500">PNG, JPG, WEBP up to 5MB</p>
        </div>

        {previewUrls.length > 0 && (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4 w-full">
            {previewUrls.map((url, idx) => (
              <div key={idx} className="relative h-24 w-full group overflow-hidden rounded-md bg-slate-100 border border-slate-200">
                <img 
                  src={url} 
                  alt={`Preview ${idx}`} 
                  onError={handleImageError}
                  className="h-full w-full object-contain p-1 transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 transition-opacity flex items-center justify-center group-hover:opacity-100">
                  <button
                    type="button"
                    onClick={(e) => handleRemove(idx, e)}
                    className="rounded-full bg-red-600 p-1.5 text-white hover:bg-red-700 shadow-sm"
                    title="Remove Image"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}
