import React, { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { fetchWithCache } from '../utils/dataCache';
import api from '../utils/api';
import { createEquipmentPage } from '../components/modules/EquipmentPageFactory';

const STATUS_OPTIONS = ['Available', 'Allocated', 'In Use', 'Under Maintenance', 'Out of Yard'];
const CONDITION_OPTIONS = ['OK', 'NOT OK', 'For Repair', 'Unknown'];

const HookForm = ({ initial, onSave, onClose, endpoint }) => {
  const [form, setForm] = useState({
    itemName: '', hookSerialNo: '', capacity: '', assignedCrane: '', location: '',
    status: 'Available', weightKg: '', condition: 'OK', comments: ''
  });
  const [saving, setSaving] = useState(false);
  const [step, setStep] = useState(1);
  const steps = [
    { title: 'Basic details', description: 'Capture the hook identity and capacity.' },
    { title: 'Assignment', description: 'Link it to a crane and set status.' },
    { title: 'Review', description: 'Confirm the entry before saving.' }
  ];
  const [cranes, setCranes] = useState([]);
  const [craneSearch, setCraneSearch] = useState('');
  const [showCraneDropdown, setShowCraneDropdown] = useState(false);

  useEffect(() => {
    if (initial) {
      setForm(initial);
    }
  }, [initial]);

  useEffect(() => {
    fetchCranes();
  }, []);

  const fetchCranes = async () => {
    try {
      const data = await fetchWithCache('/cranes', { limit: 1000 }, { ttl: 0 });
      setCranes(Array.isArray(data) ? data : (data?.data || []));
    } catch (err) {
      console.error('Failed to fetch cranes', err);
    }
  };

  const filteredCranes = cranes.filter(crane =>
    crane.equipmentNo.toLowerCase().includes(craneSearch.toLowerCase())
  );

  const handleChange = useCallback((name, value) => {
    setForm(prev => ({ ...prev, [name]: value }));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (initial?._id) {
        await api.put(`${endpoint}/${initial._id}`, form);
        toast.success('Updated');
      } else {
        await api.post(endpoint, form);
        toast.success('Created');
      }
      onSave();
    } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
    finally { setSaving(false); }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '14px' }}>
      <div className="wizard-shell" style={{ marginBottom: '0px' }}>
        <div className="wizard-header">
          <div className="wizard-title-block">
            <div className="wizard-kicker">Step {step} of {steps.length}</div>
            <div className="wizard-title">{steps[step - 1].title}</div>
          </div>
          <div className="wizard-description">{steps[step - 1].description}</div>
        </div>
        <div className="wizard-progress-track">
          <div className="wizard-progress-fill" style={{ width: `${(step / steps.length) * 100}%` }} />
        </div>
      </div>

      <div className="wizard-form-body">
      {step === 1 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Item Name</label>
            <input type="text" className="input-field" value={form.itemName || ''} onChange={e => handleChange('itemName', e.target.value)} />
          </div>
          <div>
            <label className="label">Hook Serial No.</label>
            <input type="text" className="input-field" value={form.hookSerialNo || ''} onChange={e => handleChange('hookSerialNo', e.target.value)} />
          </div>
          <div>
            <label className="label">Capacity</label>
            <input type="text" className="input-field" value={form.capacity || ''} onChange={e => handleChange('capacity', e.target.value)} />
          </div>
          <div>
            <label className="label">Weight (KG)</label>
            <input type="text" className="input-field" value={form.weightKg || ''} onChange={e => handleChange('weightKg', e.target.value)} />
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Location</label>
            <input type="text" className="input-field" value={form.location || ''} onChange={e => handleChange('location', e.target.value)} />
          </div>
          <div style={{ position: 'relative' }}>
            <label className="label">Assigned Crane</label>
            <input type="text" className="input-field" placeholder="Leave blank for all cranes" value={form.assignedCrane || ''} onChange={e => { handleChange('assignedCrane', e.target.value); setCraneSearch(e.target.value); setShowCraneDropdown(true); }} onFocus={() => setShowCraneDropdown(true)} autoComplete="off" />
            <p style={{ margin: '5px 0 0', fontSize: '11px', color: 'var(--text-muted)' }}>Leave blank to make this hook available to all cranes.</p>
            {showCraneDropdown && (filteredCranes.length > 0 || craneSearch) && (
              <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, backgroundColor: 'white', border: '1px solid var(--border-color)', borderRadius: '4px', marginTop: '4px', maxHeight: '200px', overflowY: 'auto', zIndex: 10, boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                {filteredCranes.length > 0 ? (
                  filteredCranes.map(crane => (
                    <div key={crane._id} onClick={() => { handleChange('assignedCrane', crane.equipmentNo); setShowCraneDropdown(false); setCraneSearch(''); }} style={{ padding: '8px 12px', cursor: 'pointer', backgroundColor: form.assignedCrane === crane.equipmentNo ? '#f0f0f0' : 'white', borderBottom: '1px solid var(--border-muted)', transition: 'background-color 0.2s' }} onMouseEnter={e => e.target.style.backgroundColor = '#f5f5f5'} onMouseLeave={e => e.target.style.backgroundColor = form.assignedCrane === crane.equipmentNo ? '#f0f0f0' : 'white'}>
                      {crane.equipmentNo}
                    </div>
                  ))
                ) : (
                  <div style={{ padding: '8px 12px', color: 'var(--text-muted)', textAlign: 'center' }}>No cranes found</div>
                )}
              </div>
            )}
          </div>
          <div>
            <label className="label">Condition</label>
            <select className="input-field" value={form.condition} onChange={e => handleChange('condition', e.target.value)}>
              {CONDITION_OPTIONS.map(o => <option key={o}>{o}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Status</label>
            <select className="input-field" value={form.status} onChange={e => handleChange('status', e.target.value)}>
              {STATUS_OPTIONS.map(o => <option key={o}>{o}</option>)}
            </select>
          </div>
        </div>
      )}

      {step === 3 && (
        <div style={{ display: 'grid', gap: '12px' }}>
          <div>
            <label className="label">Comments</label>
            <textarea className="input-field" rows={3} value={form.comments || ''} onChange={e => handleChange('comments', e.target.value)} />
          </div>
          <div className="wizard-section-card wizard-summary-card">
            <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Quick review</div>
            <div style={{ display: 'grid', gap: '6px', fontSize: '13px', color: 'var(--text-primary)' }}>
              <div><strong>Item:</strong> {form.itemName || '—'}</div>
              <div><strong>Assigned crane:</strong> {form.assignedCrane || '—'}</div>
              <div><strong>Status:</strong> {form.status || '—'}</div>
              <div><strong>Condition:</strong> {form.condition || '—'}</div>
            </div>
          </div>
        </div>
      )}

      </div>
      <div className="wizard-actions">
        <button type="button" onClick={() => { onClose(); setShowCraneDropdown(false); }} className="btn-secondary">Cancel</button>
        {step > 1 && (
          <button type="button" onClick={() => setStep(prev => Math.max(prev - 1, 1))} className="btn-secondary">Back</button>
        )}
        {step < steps.length ? (
          <button type="button" onClick={() => setStep(prev => Math.min(prev + 1, steps.length))} className="btn-primary">Next</button>
        ) : (
          <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Saving...' : (initial?._id ? 'Update' : 'Create')}</button>
        )}
      </div>
    </form>
  );
};

export default createEquipmentPage({
  title: 'Hooks',
  endpoint: '/hooks',
  templateUrl: '/templates/hooks-import-template.xlsx',
  filters: [
    { key: 'status', label: 'Status', allLabel: 'All Status', options: STATUS_OPTIONS },
    { key: 'condition', label: 'Condition', allLabel: 'All Condition', options: CONDITION_OPTIONS },
  ],
  columns: [
    { key: 'itemName', label: 'Item Name' },
    { key: 'hookSerialNo', label: 'Serial No.' },
    { key: 'assignedCrane', label: 'Assigned Crane' },
    { key: 'capacity', label: 'Capacity', format: v => v || '—' },
    { key: 'weightKg', label: 'Weight (KG)', format: v => v ? `${v}kg` : '—' },
    { key: 'ropeDia', label: 'Rope Dia.' },
    { key: 'location', label: 'Location' },
    { key: 'condition', label: 'Condition', badge: true },
    { key: 'status', label: 'Status', badge: true },
  ],
  FormComponent: HookForm,
});
