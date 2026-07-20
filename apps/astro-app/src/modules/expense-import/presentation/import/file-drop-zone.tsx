"use client";

import { useCallback, useRef, useState } from "react";
import { Upload, Download, AlertCircle } from "lucide-react";

interface FileDropZoneProps {
  onFileSelect: (file: File) => void;
  isProcessing: boolean;
  errors: string[];
}

export function FileDropZone({
  onFileSelect,
  isProcessing,
  errors,
}: FileDropZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) onFileSelect(file);
    },
    [onFileSelect],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files?.[0];
      if (file) onFileSelect(file);
    },
    [onFileSelect],
  );

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <p className="text-muted-foreground">
          Upload a CSV or Excel file containing your historical expense data.
        </p>
        <a
          href="/templates/expenses-import-template.csv"
          download
          className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
        >
          <Download className="h-4 w-4" />
          Download template file
        </a>
      </div>

      <div
        data-e2e="expense-import.dropzone"
        className={`
          relative border-2 border-dashed rounded-lg p-12 text-center transition-colors
          ${isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50"}
          ${isProcessing ? "pointer-events-none opacity-50" : "cursor-pointer"}
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.xls,.xlsx"
          onChange={handleFileSelect}
          className="hidden"
        />

        <div className="space-y-4">
          <div className="flex justify-center">
            {isProcessing ? (
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
            ) : (
              <Upload className="h-12 w-12 text-muted-foreground" />
            )}
          </div>

          <div>
            <p
              data-e2e={
                isProcessing ? "expense-import.dropzone.processing" : undefined
              }
              className="font-medium"
            >
              {isProcessing
                ? "Processing file..."
                : "Drag and drop your file here"}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              or click to browse
            </p>
          </div>

          <p className="text-xs text-muted-foreground">
            Supports CSV, XLS, and XLSX files up to 10 MB
          </p>
        </div>
      </div>

      {errors.length > 0 && (
        <div
          data-e2e="expense-import.dropzone.errors"
          className="rounded-md bg-destructive/10 border border-destructive/20 p-4"
        >
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
            <div className="space-y-1">
              {errors.map((error, idx) => (
                <p key={idx} className="text-sm text-destructive">
                  {error}
                </p>
              ))}
              <a
                href="/templates/expenses-import-template.csv"
                download
                className="inline-flex items-center gap-1 text-sm text-destructive hover:underline mt-2"
              >
                <Download className="h-3 w-3" />
                Download template
              </a>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-3 text-sm text-muted-foreground">
        <p className="font-medium text-foreground">Expected file format:</p>
        <div className="rounded-md border p-3 bg-muted/50">
          <code className="text-xs">
            amount, date, provider, description (optional)
            <br />
            125.50, 2024-01-15, Electric Company, Monthly expense
          </code>
        </div>
      </div>
    </div>
  );
}
