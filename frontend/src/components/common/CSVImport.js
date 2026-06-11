import React, { useState, useRef } from 'react';
import toast from 'react-hot-toast';
import { ArrowUpTrayIcon, DocumentArrowDownIcon } from '@heroicons/react/24/outline';
import api from '../../utils/api';

const CSVImport = ({ endpoint, templateUrl, onImportSuccess }) => {
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      toast.error('Please select a CSV file (.csv)');
      return;
    }

    setImporting(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const url = api.defaults.baseURL + endpoint;
      
      const response = await fetch(url, {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        throw new Error(errorData.message || `Upload failed with status ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        const result = data.data;
        toast.success(
          `Import complete: ${result.success} succeeded, ${result.failed} failed`,
          { duration: 4000 }
        );
        if (result.errors && result.errors.length > 0) {
          // Show first few errors
          result.errors.slice(0, 3).forEach(err => {
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
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept=".csv"
        style={{ display: 'none' }}
      />
      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={importing}
        className="btn-secondary"
        style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
      >
        <ArrowUpTrayIcon style={{ width: '14px', height: '14px' }} />
        {importing ? 'Importing...' : 'Import CSV'}
      </button>
      
      <a
        href={templateUrl}
        download
        className="btn-secondary"
        style={{ display: 'flex', alignItems: 'center', gap: '6px', textDecoration: 'none' }}
      >
        <DocumentArrowDownIcon style={{ width: '14px', height: '14px' }} />
        Download Template
      </a>
    </div>
  );
};

export default CSVImport;
