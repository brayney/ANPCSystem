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
      toast.error('Please select a CSV file');
      return;
    }

    setImporting(true);
    try {
      const text = await file.text();
      const { data } = await api.post(endpoint, { data: text });

      if (data.success) {
        const result = data.data;
        toast.success(
          `Import complete: ${result.success} succeeded, ${result.failed} failed`,
          { duration: 4000 }
        );
        if (result.errors.length > 0) {
          console.log('Import errors:', result.errors);
        }
        onImportSuccess?.();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Import failed');
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div style={{ display: 'flex', gap: '8px' }}>
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
        Template
      </a>
    </div>
  );
};

export default CSVImport;
