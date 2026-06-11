import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeftIcon, PlusIcon } from '@heroicons/react/24/outline';
import { StatusBadge, Spinner, EmptyState } from '../components/common';
import api from '../utils/api';
import { format } from 'date-fns';

const AttachmentTable = ({ title, items, columns, emptyIcon }) => (
  <div className="card mb-4">
    <h3 className="font-semibold text-gray-800 dark:text-white mb-4">{title} ({items.length})</h3>
    {items.length === 0 ? (
      <EmptyState message={`No ${title.toLowerCase()} assigned`} icon={emptyIcon} />
    ) : (
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b dark:border-gray-700">
              {columns.map(c => <th key={c.key} className="table-header">{c.label}</th>)}
            </tr>
          </thead>
          <tbody>
            {items.map((item, i) => (
              <tr key={item._id || i} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/30">
                {columns.map(c => (
                  <td key={c.key} className="table-cell">
                    {c.badge ? <StatusBadge status={item[c.key]} /> : (item[c.key] || '—')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )}
  </div>
);

export default function CraneDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [crane, setCrane] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/cranes/${id}`)
      .then(r => setCrane(r.data.data))
      .catch(() => { toast.error('Crane not found'); navigate('/cranes'); })
      .finally(() => setLoading(false));
  }, [id, navigate]);

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;
  if (!crane) return null;

  const infoFields = [
    { label: 'Equipment No.', value: crane.equipmentNo },
    { label: 'Sarens No.', value: crane.sarensNo },
    { label: 'Equipment Type', value: crane.equipmentType },
    { label: 'Model', value: crane.craneModel },
    { label: 'Year', value: crane.yearModel },
    { label: 'Weight', value: crane.capacity },
    { label: 'Plate No.', value: crane.plateNo },
    { label: 'Serial No.', value: crane.serialNumber },
    { label: 'Manufacturer', value: crane.manufacturer },
    { label: 'Location', value: crane.location },
    { label: 'Client', value: crane.client },
    { label: 'Division', value: crane.division },
    { label: 'Supervisor', value: crane.supervisor },
    { label: 'Max Config', value: crane.maxConfiguration },
    { label: 'Working Config', value: crane.workingConfiguration },
    { label: 'Starting Date', value: crane.startingDate ? format(new Date(crane.startingDate), 'MMM d, yyyy') : null },
    { label: 'Release Date', value: crane.releaseDate ? format(new Date(crane.releaseDate), 'MMM d, yyyy') : null },
  ];

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => navigate('/cranes')} className="btn-secondary flex items-center gap-2">
          <ArrowLeftIcon className="w-4 h-4" /> Back
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white font-mono">{crane.equipmentNo}</h1>
            <StatusBadge status={crane.status} />
          </div>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{crane.equipmentType} — {crane.craneModel}</p>
        </div>
        <Link to="/transactions/create" state={{ crane: crane.equipmentNo }}
          className="btn-primary flex items-center gap-2">
          <PlusIcon className="w-4 h-4" /> Create Transaction
        </Link>
      </div>

      {/* Crane Info */}
      <div className="card mb-4">
        <h2 className="font-semibold text-gray-800 dark:text-white mb-4">Crane Information</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {infoFields.filter(f => f.value).map(f => (
            <div key={f.label}>
              <p className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide">{f.label}</p>
              <p className="text-sm font-medium text-gray-800 dark:text-gray-200 mt-0.5">{f.value}</p>
            </div>
          ))}
        </div>
        {crane.comments && (
          <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700">
            <p className="text-xs font-medium text-gray-400 uppercase">Comments</p>
            <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">{crane.comments}</p>
          </div>
        )}
      </div>

      {/* Counterweights */}
      <AttachmentTable title="Counterweights" emptyIcon="⚖️"
        items={crane.counterweights || []}
        columns={[
          { key: 'itemName', label: 'Item Name' },
          { key: 'serialNo', label: 'Serial No.' },
          { key: 'capacity', label: 'Weight' },
          { key: 'weightKg', label: 'Weight (kg)' },
          { key: 'location', label: 'Location' },
          { key: 'condition', label: 'Condition', badge: true },
          { key: 'status', label: 'Status', badge: true },
        ]}
      />

      {/* Boom Sections */}
      <AttachmentTable title="Boom Sections" emptyIcon="📏"
        items={crane.boomSections || []}
        columns={[
          { key: 'itemName', label: 'Item Name' },
          { key: 'boomCode', label: 'Boom Code' },
          { key: 'length', label: 'Length' },
          { key: 'weightKg', label: 'Weight (kg)' },
          { key: 'location', label: 'Location' },
          { key: 'condition', label: 'Condition', badge: true },
          { key: 'status', label: 'Status', badge: true },
        ]}
      />

      {/* Hooks */}
      <AttachmentTable title="Hooks" emptyIcon="🪝"
        items={crane.hooks || []}
        columns={[
          { key: 'itemName', label: 'Item Name' },
          { key: 'hookSerialNo', label: 'Serial No.' },
          { key: 'capacity', label: 'Weight' },
          { key: 'ropeDia', label: 'Rope Dia.' },
          { key: 'weightKg', label: 'Weight (kg)' },
          { key: 'location', label: 'Location' },
          { key: 'status', label: 'Status', badge: true },
        ]}
      />
    </div>
  );
}
