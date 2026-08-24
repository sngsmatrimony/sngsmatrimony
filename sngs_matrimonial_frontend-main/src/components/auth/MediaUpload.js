'use client';

import { useState, useRef } from 'react';
import { Upload, X, Image, Film, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

export function MediaUpload({
  type = 'photo',
  maxFiles = 10,
  maxDuration = null,
  currentCount = 0,
  onFilesSelected,
  files = [],
  onRemove,
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const fileInputRef = useRef(null);

  const isPhoto = type === 'photo';
  const accept = isPhoto ? 'image/*' : 'video/*';
  const maxSizeInMB = isPhoto ? 5 : 50;
  const maxSizeInBytes = maxSizeInMB * 1024 * 1024;

  const validateFiles = (filesToValidate) => {
    const validFiles = [];
    setUploadError('');

    for (const file of filesToValidate) {
      // Check file size
      if (file.size > maxSizeInBytes) {
        setUploadError(`File "${file.name}" is too large (max ${maxSizeInMB}MB)`);
        continue;
      }

      // Check file type
      const isValidType = isPhoto ? file.type.startsWith('image/') : file.type.startsWith('video/');
      if (!isValidType) {
        setUploadError(`Invalid ${isPhoto ? 'image' : 'video'} file: "${file.name}"`);
        continue;
      }

      // Check total count
      if (files.length + validFiles.length >= maxFiles) {
        setUploadError(`Maximum ${maxFiles} ${isPhoto ? 'photos' : 'videos'} allowed`);
        break;
      }

      validFiles.push(file);
    }

    return validFiles;
  };

  const handleFileSelect = (e) => {
    const selectedFiles = Array.from(e.target.files || []);
    const validFiles = validateFiles(selectedFiles);

    if (validFiles.length > 0) {
      onFilesSelected(validFiles);
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

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

    const droppedFiles = Array.from(e.dataTransfer.files || []);
    const validFiles = validateFiles(droppedFiles);

    if (validFiles.length > 0) {
      onFilesSelected(validFiles);
    }
  };

  const remainingSlots = maxFiles - files.length;

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-all ${
          isDragging
            ? 'border-primary bg-primary/5 scale-105'
            : 'border-gray-300 hover:border-primary/50 hover:bg-accent/2'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={accept}
          onChange={handleFileSelect}
          className="hidden"
          disabled={remainingSlots === 0}
        />

        <div className="inline-block p-3 bg-primary/10 rounded-full mb-3">
          {isPhoto ? (
            <Image className="w-8 h-8 text-primary" />
          ) : (
            <Film className="w-8 h-8 text-primary" />
          )}
        </div>

        <p className="font-telex text-sm font-semibold text-secondary mb-1">
          {isDragging
            ? `Drop your ${isPhoto ? 'photos' : 'videos'} here`
            : `Drag and drop your ${isPhoto ? 'photos' : 'videos'} here`}
        </p>

        <p className="font-telex text-xs text-secondary/60 mb-4">
          or click to select from your computer
        </p>

        <Button
          type="button"
          className="font-telex bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-md hover:shadow-lg transition-all duration-200"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={remainingSlots === 0}
        >
          <Upload className="w-4 h-4 mr-2" />
          Choose {isPhoto ? 'Photos' : 'Videos'}
        </Button>

        <p className="font-telex text-xs text-secondary/50 mt-3">
          {isPhoto ? (
            <>Max 5MB per photo</>
          ) : (
            <>Max 50MB per video, 2 minutes duration</>
          )}
        </p>

        <p className="font-telex text-xs text-secondary/60 mt-1 font-medium">
          {remainingSlots} slot{remainingSlots !== 1 ? 's' : ''} remaining
        </p>
      </div>

      {/* Error Message */}
      {uploadError && (
        <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3 flex gap-3">
          <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
          <p className="font-telex text-sm text-destructive font-medium">{uploadError}</p>
        </div>
      )}

      {/* File Previews */}
      {files.length > 0 && (
        <div className="space-y-3">
          <p className="font-telex text-sm font-semibold text-secondary">
            {files.length} {isPhoto ? 'photo' : 'video'}{files.length !== 1 ? 's' : ''} selected
          </p>

          <div className={`grid gap-3 ${isPhoto ? 'grid-cols-3' : 'grid-cols-2'}`}>
            {files.map((fileObj, index) => (
              <div
                key={fileObj.preview || `file-${index}`}
                className="relative group rounded-lg overflow-hidden bg-gradient-warm-subtle border-2 border-primary/20"
              >
                {isPhoto ? (
                  <img
                    src={fileObj.preview}
                    alt={`Preview ${index + 1}`}
                    className="w-full h-24 object-cover"
                  />
                ) : (
                  <video
                    src={fileObj.preview}
                    className="w-full h-24 object-cover"
                  />
                )}

                <button
                  type="button"
                  onClick={() => onRemove(index)}
                  className="absolute top-1 right-1 bg-destructive hover:bg-destructive/90 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                >
                  <X className="w-4 h-4" />
                </button>

                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
