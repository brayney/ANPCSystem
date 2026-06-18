import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeftIcon, MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { Spinner, StatusBadge } from '../components/common';
import api from '../utils/api';

const renderDetailRow = (detail) => {
  if (!detail) return null;
  if (Array.isArray(detail)) {
    return (
      <div className="mt-1 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-gray-500">
        {detail.map(([label, value]) => (
          <div key={label} className="flex items-center gap-1">
            <span className="font-semibold text-gray-600">{label}:</span>
            <span className="truncate">{value || '—'}</span>
          </div>
        ))}
      </div>
    );
  }
  return <p className="text-xs text-gray-500 truncate mt-1">{detail}</p>;
};

const CheckboxList = ({ items, selected, onToggle, labelFn, subFn }) => {
  const allSelected = items.length > 0 && items.every(item => selected.includes(item._id));
  const toggleSelectAll = () => {
    if (allSelected) {
      items.forEach(item => {
        if (selected.includes(item._id)) onToggle(item._id);
      });
    } else {
      items.forEach(item => {
        if (!selected.includes(item._id)) onToggle(item._id);
      });
    }
  };

  return (
    <div>
      {items.length > 0 && (
        <div className="flex gap-2 mb-2">
          <button type="button" onClick={toggleSelectAll} 
            className="text-xs px-2 py-1 rounded border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
            {allSelected ? 'Deselect All' : 'Select All'}
          </button>
        </div>
      )}
      <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
        {items.length === 0 ? (
          <p className="text-sm text-gray-400 italic py-2">No items available for this crane</p>
        ) : items.map(item => (
          <label key={item._id}
            className="flex items-start gap-3 p-2.5 border dark:border-gray-600 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
            <input type="checkbox" className="mt-0.5 accent-blue-600"
              checked={selected.includes(item._id)}
              onChange={() => onToggle(item._id)} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-800 dark:text-gray-200 break-words">{labelFn(item)}</p>
              {subFn && renderDetailRow(subFn(item))}
            </div>
            <StatusBadge status={item.status || item.condition} />
          </label>
        ))}
      </div>
    </div>
  );
};

const FormField = ({ label, name, type = 'text', required, span, value, onChange }) => (
  <div className={span ? 'sm:col-span-2' : ''}>
    <label className="label">{label}{required && ' *'}</label>
    <input type={type} required={required} className="input-field"
      value={value || ''} onChange={onChange} />
  </div>
);

export default function CreateTransactionPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const prefillCrane = location.state?.crane || '';
  const prefillCraneId = location.state?.craneId || '';

  const [craneSearch, setCraneSearch] = useState(prefillCrane);
  const [craneResults, setCraneResults] = useState([]);
  const [selectedCranes, setSelectedCranes] = useState([]);
  const [attachments, setAttachments] = useState({ counterweights: [], boomSections: [], hooks: [] });
  const [loadingCrane, setLoadingCrane] = useState(false);
  const [selectedCW, setSelectedCW] = useState([]);
  const [selectedBS, setSelectedBS] = useState([]);
  const [selectedHooks, setSelectedHooks] = useState([]);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    companyName: '', companyAddress: '', contactPerson: '', contactNumber: '',
    driverName: '', vehicleType: '', vehiclePlateNo: '',
    pullOutLocation: '', deliveryLocation: '',
    transactionDate: new Date().toISOString().split('T')[0],
    transactionTime: new Date().toTimeString().slice(0, 5),
    expectedReturnDate: '', purpose: '', remarks: '', type: 'Rental'
  });

  // Auto-search when prefill crane exists
  useEffect(() => {
    if (prefillCrane) {
      handleCraneSelect({ _id: prefillCraneId, equipmentNo: prefillCrane });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const searchCranes = async (q) => {
    if (!q || q.length < 2) { setCraneResults([]); return; }
    try {
      const { data } = await api.get('/cranes', { params: { search: q, limit: 10 } });
      const restrictedStatuses = ['Out of Yard', 'Under Maintenance', 'On Hire'];
      const availableCranes = data.data.filter(c => !restrictedStatuses.includes(c.status));
      setCraneResults(availableCranes);
    } catch {}
  };

  const mergeById = (current, incoming) => {
    const map = new Map(current.map(item => [item._id, item]));
    incoming.forEach(item => map.set(item._id, item));
    return Array.from(map.values());
  };

  const loadCraneWithAttachments = async (crane) => {
    const { data } = await api.get(
      crane._id ? `/cranes/${crane._id}?includeShared=true` : `/cranes/by-equipment/${crane.equipmentNo}`
    );
    return data.data;
  };

  const reloadAttachmentsForCranes = async (cranes) => {
    if (cranes.length === 0) {
      setAttachments({ counterweights: [], boomSections: [], hooks: [] });
      return;
    }

    const restrictedStatuses = ['Out of Yard', 'Under Maintenance', 'On Hire'];
    const filterAvailable = (items) => items.filter(item => !restrictedStatuses.includes(item.status));
    const loaded = await Promise.all(cranes.map(loadCraneWithAttachments));

    setAttachments({
      counterweights: loaded.reduce((items, craneData) => mergeById(items, filterAvailable(craneData.counterweights || [])), []),
      boomSections: loaded.reduce((items, craneData) => mergeById(items, filterAvailable(craneData.boomSections || [])), []),
      hooks: loaded.reduce((items, craneData) => mergeById(items, filterAvailable(craneData.hooks || [])), []),
    });
  };

  const handleCraneSelect = async (crane) => {
    setLoadingCrane(true);
    setCraneResults([]);
    try {
      const craneData = await loadCraneWithAttachments(crane);
      // Only allow one crane per transaction
      setSelectedCranes([craneData]);
      setCraneSearch('');
      
      // Filter and set attachments from loaded crane data
      const restrictedStatuses = ['Out of Yard', 'Under Maintenance', 'On Hire'];
      const filterAvailable = (items) => items.filter(item => !restrictedStatuses.includes(item.status));
      
      setAttachments({
        counterweights: filterAvailable(craneData.counterweights || []),
        boomSections: filterAvailable(craneData.boomSections || []),
        hooks: filterAvailable(craneData.hooks || []),
      });
    } catch { toast.error('Failed to load crane attachments'); }
    finally { setLoadingCrane(false); }
  };

  const removeSelectedCrane = async (craneId) => {
    const nextCranes = selectedCranes.filter(crane => crane._id !== craneId);
    setSelectedCranes(nextCranes);
    setSelectedCW([]); setSelectedBS([]); setSelectedHooks([]);
    setLoadingCrane(true);
    try {
      await reloadAttachmentsForCranes(nextCranes);
    } catch {
      toast.error('Failed to refresh attachments');
    } finally {
      setLoadingCrane(false);
    }
  };

  const toggle = (setter, list, id) => {
    setter(list.includes(id) ? list.filter(x => x !== id) : [...list, id]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (selectedCranes.length === 0) { toast.error('Please select at least one crane'); return; }
    setSaving(true);
    try {
      const payload = {
        ...form,
        craneId: selectedCranes[0]._id,
        crane: selectedCranes[0].equipmentNo,
        craneModel: selectedCranes[0].craneModel,
        cranes: selectedCranes.map(crane => ({
          craneId: crane._id,
          equipmentNo: crane.equipmentNo,
          craneModel: crane.craneModel,
          capacity: crane.capacity,
          weightKg: crane.weightKg,
        })),
        counterweights: selectedCW,
        boomSections: selectedBS,
        hooks: selectedHooks,
      };
      const { data } = await api.post('/transactions', payload);
      toast.success(`Transaction ${data.data.transactionNo} created!`);
      navigate(`/transactions/${data.data._id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create transaction');
    } finally { setSaving(false); }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => navigate('/transactions')} className="btn-secondary flex items-center gap-2">
          <ArrowLeftIcon className="w-4 h-4" /> Back
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">New Transaction</h1>
          <p className="text-sm text-gray-500">Create a pull-out / rental transaction</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* Step 1: Select Crane */}
        <div className="card">
          <h2 className="font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
            <span className="w-6 h-6 bg-blue-600 text-white text-xs flex items-center justify-center font-bold">1</span>
            Select Cranes
          </h2>
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
            <input className="input-field pl-9" placeholder="Search by equipment number..."
              value={craneSearch}
              onChange={e => { setCraneSearch(e.target.value); searchCranes(e.target.value); }}
              disabled={selectedCranes.length > 0}
              style={selectedCranes.length > 0 ? { backgroundColor: 'var(--bg-muted)', cursor: 'not-allowed', opacity: 0.6 } : {}} />
          </div>
          {craneResults.length > 0 && (
            <div className="mt-2 border dark:border-gray-600 overflow-hidden shadow-lg z-10">
              {craneResults.map(c => (
                <button key={c._id} type="button" onClick={() => handleCraneSelect(c)}
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 border-b last:border-0 dark:border-gray-600 text-left transition-colors">
                  <div>
                    <span className="font-mono font-semibold text-blue-700 dark:text-blue-400">{c.equipmentNo}</span>
                    <span className="text-gray-500 text-sm ml-2">{c.craneModel} — {c.capacity}</span>
                  </div>
                  <StatusBadge status={c.status} />
                </button>
              ))}
            </div>
          )}
          {loadingCrane && <div className="flex items-center gap-2 mt-3 text-sm text-gray-500"><Spinner size="sm" /> Loading attachments...</div>}
          {selectedCranes.length > 0 && !loadingCrane && (
            <div className="mt-4 space-y-2">
              {selectedCranes.map(crane => (
                <div key={crane._id} className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-blue-800 dark:text-blue-300 font-mono">{crane.equipmentNo}</p>
                    <p className="text-sm text-blue-600 dark:text-blue-400">{crane.equipmentType} — {crane.craneModel} — {crane.capacity}</p>
                    <p className="text-xs text-blue-500 mt-1">Location: {crane.location || '—'}</p>
                  </div>
                  <button type="button" onClick={() => removeSelectedCrane(crane._id)} className="btn-secondary" style={{ padding: '5px' }} title="Remove crane">
                    <XMarkIcon style={{ width: '14px', height: '14px' }} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Step 2: Select Attachments */}
        {selectedCranes.length > 0 && !loadingCrane && (
          <div className="card">
            <h2 className="font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-6 h-6 bg-blue-600 text-white text-xs flex items-center justify-center font-bold">2</span>
              Select Attachments (Optional)
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Counterweights ({selectedCW.length} selected)
                </h3>
                <CheckboxList items={attachments.counterweights} selected={selectedCW}
                  onToggle={id => toggle(setSelectedCW, selectedCW, id)}
                  labelFn={i => i.itemName || 'Counterweight'}
                  subFn={i => [
                    ['Weight', i.weightKg ? `${i.weightKg} kg` : '—'],
                    ['Location', i.location || '—']
                  ]} />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Boom Sections ({selectedBS.length} selected)
                </h3>
                <CheckboxList items={attachments.boomSections} selected={selectedBS}
                  onToggle={id => toggle(setSelectedBS, selectedBS, id)}
                  labelFn={i => i.itemName || 'Boom Section'}
                  subFn={i => [
                    ['Boom Code', i.boomCode || '—'],
                    ['Length', i.length || '—']
                  ]} />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Hooks ({selectedHooks.length} selected)
                </h3>
                <CheckboxList items={attachments.hooks} selected={selectedHooks}
                  onToggle={id => toggle(setSelectedHooks, selectedHooks, id)}
                  labelFn={i => i.itemName || 'Hook'}
                  subFn={i => [
                    ['Weight', i.weightKg ? `${i.weightKg} kg` : '—'],
                    ['Location', i.location || '—']
                  ]} />
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Company Info */}
        <div className="card">
          <h2 className="font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
            <span className="w-6 h-6 bg-blue-600 text-white text-xs flex items-center justify-center font-bold">3</span>
            Company Information
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Company Name" name="companyName" required span
              value={form.companyName} onChange={e => setForm({ ...form, companyName: e.target.value })} />
            <FormField label="Company Address" name="companyAddress" span
              value={form.companyAddress} onChange={e => setForm({ ...form, companyAddress: e.target.value })} />
            <FormField label="Contact Person" name="contactPerson"
              value={form.contactPerson} onChange={e => setForm({ ...form, contactPerson: e.target.value })} />
            <FormField label="Contact Number" name="contactNumber"
              value={form.contactNumber} onChange={e => setForm({ ...form, contactNumber: e.target.value })} />
          </div>
        </div>

        {/* Step 4: Vehicle & Driver */}
        <div className="card">
          <h2 className="font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
            <span className="w-6 h-6 bg-blue-600 text-white text-xs flex items-center justify-center font-bold">4</span>
            Driver & Vehicle
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <FormField label="Driver Name" name="driverName"
              value={form.driverName} onChange={e => setForm({ ...form, driverName: e.target.value })} />
            <FormField label="Vehicle Type" name="vehicleType"
              value={form.vehicleType} onChange={e => setForm({ ...form, vehicleType: e.target.value })} />
            <FormField label="Plate Number" name="vehiclePlateNo"
              value={form.vehiclePlateNo} onChange={e => setForm({ ...form, vehiclePlateNo: e.target.value })} />
          </div>
        </div>

        {/* Step 5: Logistics */}
        <div className="card">
          <h2 className="font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
            <span className="w-6 h-6 bg-blue-600 text-white text-xs flex items-center justify-center font-bold">5</span>
            Logistics & Schedule
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Pull-Out Location" name="pullOutLocation"
              value={form.pullOutLocation} onChange={e => setForm({ ...form, pullOutLocation: e.target.value })} />
            <FormField label="Delivery Location" name="deliveryLocation"
              value={form.deliveryLocation} onChange={e => setForm({ ...form, deliveryLocation: e.target.value })} />
            <FormField label="Transaction Date" name="transactionDate" type="date" required
              value={form.transactionDate} onChange={e => setForm({ ...form, transactionDate: e.target.value })} />
            <FormField label="Transaction Time" name="transactionTime" type="time"
              value={form.transactionTime} onChange={e => setForm({ ...form, transactionTime: e.target.value })} />
            <FormField label="Expected Return Date" name="expectedReturnDate" type="date"
              value={form.expectedReturnDate} onChange={e => setForm({ ...form, expectedReturnDate: e.target.value })} />
            <div>
              <label className="label">Transaction Type</label>
              <select className="input-field" value={form.type}
                onChange={e => setForm({ ...form, type: e.target.value })}>
                {['Rental', 'Transfer', 'Return', 'Maintenance'].map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="label">Purpose</label>
              <input type="text" className="input-field" value={form.purpose}
                onChange={e => setForm({ ...form, purpose: e.target.value })} />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Remarks</label>
              <textarea className="input-field" rows={2} value={form.remarks}
                onChange={e => setForm({ ...form, remarks: e.target.value })} />
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end gap-3">
          <button type="button" onClick={() => navigate('/transactions')} className="btn-secondary">Cancel</button>
          <button type="submit" disabled={saving || selectedCranes.length === 0} className="btn-primary px-8 flex items-center gap-2">
            {saving ? <><Spinner size="sm" /> Creating...</> : 'Create Transaction'}
          </button>
        </div>
      </form>
    </div>
  );
}
