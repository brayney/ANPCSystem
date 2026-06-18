import React, { useState, useRef } from 'react';
import toast from 'react-hot-toast';
import { ArrowUpTrayIcon, DocumentArrowDownIcon } from '@heroicons/react/24/outline';
import api from '../../utils/api';

const CSVImport = ({ endpoint, templateUrl, onImportSuccess }) => {
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv') && !file.name.endsWith('.xlsx')) {
      toast.error('Please select a CSV or Excel file (.csv, .xlsx)');
      return;
    }

    setImporting(true);
    setProgress(1); // Start at 1%
    
    // Auto-increment progress to simulate activity
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev < 90) {
          // Increase more slowly as we go higher
          const increment = Math.random() * (5 - 1) + 1;
          return Math.min(prev + increment, 90);
        }
        return prev;
      });
    }, 300);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const url = api.defaults.baseURL + endpoint;
      const token = localStorage.getItem('token');
      
      const data = await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            // Update progress based on upload
            const percentComplete = Math.round((e.loaded / e.total) * 90);
            setProgress(prev => Math.max(prev, percentComplete));
          }
        });
        
        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            clearInterval(progressInterval);
            setProgress(99); // Move to 99% during server processing
            setIsProcessing(true);
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
        setProgress(100); // Set to 100% on completion
        const message = result.totalRows 
          ? `Import complete: Total rows in file: ${result.totalRows}, Added: ${result.success}, Failed: ${result.failed}`
          : `Import complete: ${result.success} succeeded, ${result.failed} failed`;
        toast.success(message, { duration: 5000 });
        
        // Log detailed information for debugging
        console.log('📊 Import Details:', {
          totalRows: result.totalRows,
          success: result.success,
          failed: result.failed,
          failureBreakdown: result.failureBreakdown,
          errorCount: result.errors?.length || 0
        });
        
        if (result.errors && result.errors.length > 0) {
          result.errors.slice(0, 5).forEach(err => {
            toast.error(err, { duration: 3000 });
          });
        }
        
        // Show failure breakdown if there are failures
        if (result.failureBreakdown && Object.keys(result.failureBreakdown).length > 0) {
          const breakdown = Object.entries(result.failureBreakdown)
            .map(([reason, count]) => `${count}x ${reason}`)
            .join(', ');
          toast.error(`Failed rows breakdown: ${breakdown}`, { duration: 4000 });
        }
        
        onImportSuccess?.();
      } else {
        throw new Error(data.message || 'Import failed');
      }
    } catch (err) {
      clearInterval(progressInterval);
      toast.error(err.message || 'Import failed');
    } finally {
      clearInterval(progressInterval);
      setTimeout(() => {
        setImporting(false);
        setIsProcessing(false);
        setProgress(0);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }, 1000); // Wait 1 second to show 100% completion
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
          {importing ? (isProcessing ? 'Processing...' : `Uploading... ${progress}%`) : 'Import File'}
        </button>
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
