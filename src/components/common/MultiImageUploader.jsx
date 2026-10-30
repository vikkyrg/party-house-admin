import { useState, useRef } from 'react';
import { UploadCloud, X, ArrowLeft, ArrowRight, Image as ImageIcon } from 'lucide-react';
import { getImageUrl, handleImageError } from '../../utils/imageUtils';

export default function MultiImageUploader({
  images = [],
  onChange,
  maxImages = 3,
  maxSizeMB = 5,
  label = 'Images',
}) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

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
    if (e.dataTransfer.files) {
      addFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleChange = (e) => {
    if (e.target.files) {
      addFiles(Array.from(e.target.files));
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const addFiles = (files) => {
    const valid = [];
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];

    for (const file of files) {
      if (!validTypes.includes(file.type)) {
        alert(`${file.name} is not a supported format (PNG, JPG, JPEG, WEBP)`);
        continue;
      }
      if (file.size > maxSizeMB * 1024 * 1024) {
        alert(`${file.name} exceeds ${maxSizeMB}MB file size limit`);
        continue;
      }
      valid.push({
        id: 'file_' + Math.random().toString(36).substr(2, 9),
        file,
        previewUrl: URL.createObjectURL(file),
      });
    }

    if (!valid.length) return;

    const remainingSlots = maxImages - images.length;
    if (remainingSlots <= 0) {
      alert(`Maximum ${maxImages} images allowed.`);
      return;
    }

    const toAdd = valid.slice(0, remainingSlots);
    onChange([...images, ...toAdd]);
  };

  const removeImage = (index) => {
    const updated = [...images];
    const removed = updated.splice(index, 1)[0];
    if (removed.file && removed.previewUrl) {
      URL.revokeObjectURL(removed.previewUrl);
    }
    onChange(updated);
  };

  const moveImage = (index, direction) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= images.length) return;
    const updated = [...images];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;
    onChange(updated);
  };

  const replaceImage = (index, file) => {
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      alert('Please select a PNG, JPG, JPEG, or WEBP image');
      return;
    }
    if (file.size > maxSizeMB * 1024 * 1024) {
      alert(`Image exceeds ${maxSizeMB}MB limit`);
      return;
    }
    const updated = [...images];
    if (updated[index]?.file && updated[index]?.previewUrl) {
      URL.revokeObjectURL(updated[index].previewUrl);
    }
    updated[index] = {
      id: 'file_' + Math.random().toString(36).substr(2, 9),
      file,
      previewUrl: URL.createObjectURL(file),
    };
    onChange(updated);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="block text-sm font-medium text-slate-700">
          {label} <span className="text-xs font-normal text-slate-400">({images.length}/{maxImages})</span>
        </label>
        <span className="text-[11px] text-slate-400">Min 1, Max {maxImages} images</span>
      </div>

      {/* Thumbnails Display */}
      {images.length > 0 && (
        <div className="grid grid-cols-3 gap-3 mb-3">
          {images.map((item, idx) => {
            const url = item.previewUrl || getImageUrl(item.url || item);
            return (
              <div
                key={item.id || idx}
                className="relative group rounded-xl border border-slate-200 bg-slate-50 overflow-hidden shadow-sm aspect-video flex items-center justify-center"
              >
                <img
                  src={url}
                  alt={`Service ${idx + 1}`}
                  onError={handleImageError}
                  className="w-full h-full object-cover"
                />

                {/* Badge Number */}
                <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-full bg-black/60 text-white text-[10px] font-bold">
                  {idx + 1}
                </span>

                {/* Overlay actions */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
                  {idx > 0 && (
                    <button
                      type="button"
                      onClick={() => moveImage(idx, -1)}
                      className="p-1 rounded-full bg-white/90 text-slate-700 hover:bg-white"
                      title="Move Left"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {idx < images.length - 1 && (
                    <button
                      type="button"
                      onClick={() => moveImage(idx, 1)}
                      className="p-1 rounded-full bg-white/90 text-slate-700 hover:bg-white"
                      title="Move Right"
                    >
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => removeImage(idx)}
                    className="p-1 rounded-full bg-red-600 text-white hover:bg-red-700"
                    title="Remove"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Upload Dropzone */}
      {images.length < maxImages && (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-5 transition-colors cursor-pointer text-center ${
            isDragging ? 'border-primary-500 bg-primary-50' : 'border-slate-300 bg-slate-50 hover:bg-slate-100/80'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/png, image/jpeg, image/webp"
            className="hidden"
            onChange={handleChange}
          />
          <UploadCloud className="w-7 h-7 text-amber-600 mb-1.5" />
          <p className="text-xs font-semibold text-slate-700">
            <span className="text-amber-700">Upload {images.length > 0 ? 'more images' : 'images'}</span> or drag & drop
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            PNG, JPG, JPEG, WEBP up to {maxSizeMB}MB (up to {maxImages - images.length} remaining)
          </p>
        </div>
      )}
    </div>
  );
}

