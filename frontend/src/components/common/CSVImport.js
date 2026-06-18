import React, { useState, useRef } from 'react';
import toast from 'react-hot-toast';
import { ArrowUpTrayIcon, DocumentArrowDownIcon } from '@heroicons/react/24/outline';
import api from '../../utils/api';

const CSVImport = ({ endpoint, templateUrl, onImportSuccess }) => {
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef(null);

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv') && !file.name.endsWith('.xlsx')) {
      toast.error('Please select a CSV or Excel file (.csv, .xlsx)');
      return;
    }

    setImporting(true);
    setProgress(0);
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const url = api.defaults.baseURL + endpoint;
      const token = localStorage.getItem('token');
      
      const data = await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            const percentComplete = Math.round((e.loaded / e.total) * 100);
            setProgress(percentComplete);
          }
        });
        
        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            setProgress(100);
            try {
              resolve(JSON.parse(xhr.responseText));
            } catch (err) {
              reject(new Error('Invalid response format'));
            }
          } else {
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        });
        
        xhr.addEventListener('error', () => reject(new Error('Upload failed')));
        xhr.addEventListener('abort', () => reject(new Error('Upload aborted')));
        
        xhr.open('POST', url);
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        xhr.send(formData);
      });

      if (data.success) {
        const result = data.data;
        const message = result.totalRows 
          ? `Import complete: Total rows in file: ${result.totalRows}, Added: ${result.success}, Failed: ${result.failed}`
          : `Import complete: ${result.success} succeeded, ${result.failed} failed`;
        toast.success(message, { duration: 5000 });
        if (result.errors && result.errors.length > 0) {
          result.errors.slice(0, 5).forEach(err => {
            toast.error(err, { duration: 3000 });
          });
        }
        onImportSuccess?.();
      } else {
        throw new Error(data.message || 'Import failed');
      }
    } catch (err) {
      toast.error(err.message || 'Import failed');
    } finally {
      setImporting(false);
      setProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept=".csv,.xlsx"
        style={{ display: 'none' }}
      />
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', width: '100%' }}>
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={importing}
          className="btn-secondary"
          style={{ display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}
        >
          <ArrowUpTrayIcon style={{ width: '14px', height: '14px' }} />
          {importing ? `Importing... ${progress}%` : 'Import File'}
        </button>
        
        {importing && progress > 0 && (
          <div style={{
            flex: 1,
            height: '24px',
            backgroundColor: 'var(--surface-2)',
            borderRadius: '4px',
            overflow: 'hidden',
            border: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center'
          }}>
            <div style={{
              height: '100%',
              width: `${progress}%`,
              backgroundColor: 'var(--accent)',
              transition: 'width 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {progress > 10 && (
                <span style={{
                  fontSize: '11px',
                  fontWeight: '600',
                  color: 'white',
                  textShadow: '0 1px 2px rgba(0,0,0,0.2)'
                }}>
                  {progress}%
                </span>
              )}
            </div>
            {progress <= 10 && (
              <span style={{
                fontSize: '11px',
                fontWeight: '600',
                color: 'var(--text-secondary)',
                marginLeft: '8px'
              }}>
                {progress}%
              </span>
            )}
          </div>
        )}
      </div>
      
      <a
        href={templateUrl}
        download
        className="btn-secondary"
        style={{ display: 'flex', alignItems: 'center', gap: '6px', textDecoration: 'none', whiteSpace: 'nowrap' }}
      >
        <DocumentArrowDownIcon style={{ width: '14px', height: '14px' }} />
        Download Template
      </a>
    </div>
  );
};

export default CSVImport;
