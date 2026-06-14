import React, { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { createEquipmentPage } from '../components/modules/EquipmentPageFactory';

const CounterweightForm = ({ initial, onSave, onClose, endpoint }) => {
  const [form, setForm] = useState({
    itemName: '', serialNo: '', assignedCrane: '', weightKg: '', capacity: '',
    location: '', condition: 'OK', status: 'Available', comments: ''
  });
  const [saving, setSaving] = useState(false);
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
      const { data } = await api.get('/cranes?limit=1000');
      setCranes(data.data || []);
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
    <form onSubmit={handleSubmit}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="label">Item Name</label>
          <input type="text" className="input-field" value={form.itemName || ''}
            onChange={e => handleChange('itemName', e.target.value)} />
        </div>
        <div>
          <label className="label">Serial No.</label>
          <input type="text" className="input-field" value={form.serialNo || ''}
            onChange={e => handleChange('serialNo', e.target.value)} />
        </div>
        <div>
          <label className="label">Weight (kg)</label>
          <input type="text" className="input-field" value={form.weightKg || ''}
            onChange={e => handleChange('weightKg', e.target.value)} />
        </div>
        <div>
          <label className="label">Capacity</label>
          <input type="text" className="input-field" value={form.capacity || ''}
            onChange={e => handleChange('capacity', e.target.value)} />
        </div>
        <div>
          <label className="label">Location</label>
          <input type="text" className="input-field" value={form.location || ''}
            onChange={e => handleChange('location', e.target.value)} />
        </div>
        <div style={{ position: 'relative' }}>
          <label className="label">Assigned Crane</label>
          <input
            type="text"
            className="input-field"
            placeholder="Leave blank for all cranes"
            value={form.assignedCrane || ''}
            onChange={e => {
              handleChange('assignedCrane', e.target.value);
              setCraneSearch(e.target.value);
              setShowCraneDropdown(true);
            }}
            onFocus={() => setShowCraneDropdown(true)}
            autoComplete="off"
          />
          <p style={{ margin: '5px 0 0', fontSize: '11px', color: 'var(--text-muted)' }}>
            Leave blank to make this counterweight available to all cranes.
          </p>
          {showCraneDropdown && (filteredCranes.length > 0 || craneSearch) && (
            <div style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              backgroundColor: 'white',
              border: '1px solid var(--border-color)',
              borderRadius: '4px',
              marginTop: '4px',
              maxHeight: '200px',
              overflowY: 'auto',
              zIndex: 10,
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}>
              {filteredCranes.length > 0 ? (
                filteredCranes.map(crane => (
                  <div
                    key={crane._id}
                    onClick={() => {
                      handleChange('assignedCrane', crane.equipmentNo);
                      setShowCraneDropdown(false);
                      setCraneSearch('');
                    }}
                    style={{
                      padding: '8px 12px',
                      cursor: 'pointer',
                      backgroundColor: form.assignedCrane === crane.equipmentNo ? '#f0f0f0' : 'white',
                      borderBottom: '1px solid var(--border-muted)',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseEnter={e => e.target.style.backgroundColor = '#f5f5f5'}
                    onMouseLeave={e => e.target.style.backgroundColor = form.assignedCrane === crane.equipmentNo ? '#f0f0f0' : 'white'
                    }
                  >
                    {crane.equipmentNo}
                  </div>
                ))
              ) : (
                <div style={{ padding: '8px 12px', color: 'var(--text-muted)', textAlign: 'center' }}>
                  No cranes found
                </div>
              )}
            </div>
          )}
        </div>
        <div>
          <label className="label">Condition</label>
          <select className="input-field" value={form.condition} onChange={e => handleChange('condition', e.target.value)}>
            {['OK', 'NOT OK', 'For Repair', 'Unknown'].map(o => <option key={o}>{o}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Status</label>
          <select className="input-field" value={form.status} onChange={e => handleChange('status', e.target.value)}>
            {['Available', 'In Use', 'Under Maintenance', 'Out of Yard'].map(o => <option key={o}>{o}</option>)}
          </select>
        </div>
      </div>
      <div className="mt-4">
        <label className="label">Comments</label>
        <textarea className="input-field" rows={2} value={form.comments || ''}
          onChange={e => handleChange('comments', e.target.value)} />
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "20px", paddingTop: "16px", borderTop: "1px solid var(--border-muted)" }}>
        <button type="button" onClick={() => { onClose(); setShowCraneDropdown(false); }} className="btn-secondary">Cancel</button>
        <button type="submit" disabled={saving} className="btn-primary">
          {saving ? 'Saving...' : (initial?._id ? 'Update' : 'Create')}
        </button>
      </div>
    </form>
  );
};

export default createEquipmentPage({
  title: 'Counterweights',
  endpoint: '/counterweights',
  templateUrl: '/templates/counterweights-import-template.xlsx',
  columns: [
    { key: 'itemName', label: 'Item Name' },
    { key: 'serialNo', label: 'Serial No.' },
    { key: 'assignedCrane', label: 'Assigned Crane' },
    { key: 'capacity', label: 'Capacity' },
    { key: 'weightKg', label: 'Weight (kg)', format: v => v ? `${v}kg` : '—' },
    { key: 'location', label: 'Location' },
    { key: 'condition', label: 'Condition', badge: true },
    { key: 'status', label: 'Status', badge: true },
  ],
  FormComponent: CounterweightForm,
});
