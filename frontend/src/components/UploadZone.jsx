import React, { useState, useRef } from 'react';
import { Database, Image as ImageIcon, UploadCloud, CheckCircle2, FileText, AlertCircle, X } from 'lucide-react';
import { uploadDatabase, uploadWhiteboardImage } from '../services/api';

function resizeImageBase64(base64Str, maxWidth = 1024, maxHeight = 1024) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      let width = img.width;
      let height = img.height;
      if (width > maxWidth || height > maxHeight) {
        if (width > height) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        } else {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', 0.85));
    };
    img.onerror = () => resolve(base64Str);
    img.src = base64Str;
  });
}

export default function UploadZone({ onDbLoaded, onWhiteboardLoaded, currentFileName }) {
  const [activeTab, setActiveTab] = useState('db'); // 'db' | 'whiteboard'
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const [uploadedInfo, setUploadedInfo] = useState(null);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      await processFile(files[0]);
    }
  };

  const handleFileInput = async (e) => {
    if (e.target.files && e.target.files.length > 0) {
      await processFile(e.target.files[0]);
    }
  };

  const processFile = async (file) => {
    setError(null);
    setUploading(true);
    try {
      if (activeTab === 'db') {
        // SQLite Upload
        if (!file.name.match(/\.(db|sqlite|sqlite3)$/i)) {
          console.warn('File does not have a standard .db extension, proceeding for demo.');
        }
        const result = await uploadDatabase(file);
        setUploadedInfo({
          type: 'db',
          name: file.name,
          size: `${(file.size / 1024).toFixed(1)} KB`,
          tables: result.detectedTable || 'messy_orders',
          rows: result.rowCount || 450,
          issues: result.issuesDetected || [],
        });
        if (onDbLoaded) onDbLoaded(result);
        setUploading(false);
      } else {
        // Whiteboard Image Upload with automatic downscaling
        const reader = new FileReader();
        reader.onload = async () => {
          try {
            const rawBase64 = reader.result;
            // Downscale to max 1024px to ensure fast transmission and prevent payload timeouts
            const compressedBase64 = await resizeImageBase64(rawBase64, 1024, 1024);
            setPreviewImage(compressedBase64);
            const result = await uploadWhiteboardImage(compressedBase64);
            setUploadedInfo({
              type: 'whiteboard',
              name: file.name,
              extractedEntities: result.extractedEntities || [],
            });
            if (onWhiteboardLoaded) onWhiteboardLoaded(result, compressedBase64);
          } catch (err) {
            console.error('Whiteboard upload failed:', err);
            setError(err.message || 'Server connection timed out. Please check backend.');
          } finally {
            setUploading(false);
          }
        };
        reader.onerror = () => {
          setError('Failed to read image file.');
          setUploading(false);
        };
        reader.readAsDataURL(file);
      }
    } catch (err) {
      setError(err.message || 'Failed to process file');
      setUploading(false);
    }
  };

  const clearUpload = (e) => {
    e.stopPropagation();
    setUploadedInfo(null);
    setPreviewImage(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="glass-panel" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {/* Tab Switcher */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '10px' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => { setActiveTab('db'); setError(null); }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: 'var(--radius-sm)',
              border: activeTab === 'db' ? '1px solid var(--accent-cyan)' : '1px solid transparent',
              background: activeTab === 'db' ? 'var(--accent-cyan-bg)' : 'transparent',
              color: activeTab === 'db' ? 'var(--accent-cyan)' : 'var(--text-secondary)',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '12px',
              transition: 'var(--transition)',
            }}
          >
            <Database size={14} />
            SQLite .db Target
          </button>

          <button
            onClick={() => { setActiveTab('whiteboard'); setError(null); }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: 'var(--radius-sm)',
              border: activeTab === 'whiteboard' ? '1px solid var(--accent-purple)' : '1px solid transparent',
              background: activeTab === 'whiteboard' ? 'var(--accent-purple-bg)' : 'transparent',
              color: activeTab === 'whiteboard' ? 'var(--accent-purple)' : 'var(--text-secondary)',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '12px',
              transition: 'var(--transition)',
            }}
          >
            <ImageIcon size={14} />
            Whiteboard ER Ingest
          </button>
        </div>

        {uploadedInfo && (
          <button
            onClick={clearUpload}
            title="Clear and upload new file"
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              padding: '4px',
            }}
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Drop Zone Box */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        style={{
          border: `2px dashed ${isDragging ? 'var(--accent-cyan)' : uploadedInfo ? 'var(--cloud-gemini)' : 'var(--border-medium)'}`,
          borderRadius: 'var(--radius-md)',
          padding: '20px 16px',
          textAlign: 'center',
          cursor: 'pointer',
          background: isDragging
            ? 'rgba(6, 182, 212, 0.08)'
            : uploadedInfo
            ? 'rgba(16, 185, 129, 0.05)'
            : 'rgba(9, 13, 21, 0.6)',
          transition: 'var(--transition)',
          position: 'relative',
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={activeTab === 'db' ? '.db,.sqlite,.sqlite3' : 'image/*'}
          onChange={handleFileInput}
          style={{ display: 'none' }}
        />

        {uploading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
            <UploadCloud size={28} color="var(--accent-cyan)" className="pulse-indicator" />
            <span style={{ fontSize: '13px', color: 'var(--text-main)', fontWeight: 500 }}>
              {activeTab === 'db' ? 'Inspecting SQLite tables...' : 'Scanning ER diagram with Vision AI...'}
            </span>
          </div>
        ) : uploadedInfo ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--cloud-gemini)' }}>
              <CheckCircle2 size={18} />
              <span style={{ fontWeight: 600, fontSize: '13px' }}>
                {uploadedInfo.type === 'db' ? 'Target SQLite Attached' : 'ER Diagram Analyzed'}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontSize: '12px' }}>
              <span className="mono" style={{ color: 'var(--text-main)' }}>{uploadedInfo.name}</span>
              {uploadedInfo.size && <span>• {uploadedInfo.size}</span>}
            </div>

            {uploadedInfo.type === 'whiteboard' && previewImage && (
              <img
                src={previewImage}
                alt="Whiteboard ER"
                style={{
                  maxHeight: '70px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-subtle)',
                  marginTop: '6px',
                  objectFit: 'cover',
                }}
              />
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
            {activeTab === 'db' ? (
              <Database size={28} color="var(--accent-cyan)" />
            ) : (
              <ImageIcon size={28} color="var(--accent-purple)" />
            )}
            <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-main)' }}>
              {activeTab === 'db' ? (
                <>Drop your messy <span className="mono" style={{ color: 'var(--accent-cyan)' }}>.db</span> file here</>
              ) : (
                <>Drop whiteboard <span className="mono" style={{ color: 'var(--accent-purple)' }}>ER photo</span> here</>
              )}
            </div>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              {activeTab === 'db' ? 'SQLite 3 format • or click to browse' : 'JPEG/PNG sketch • Gemma 4 Vision extraction'}
            </span>
          </div>
        )}
      </div>

      {/* Error notification */}
      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--status-error)', fontSize: '12px' }}>
          <AlertCircle size={14} />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
