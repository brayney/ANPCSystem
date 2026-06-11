import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useReactToPrint } from 'react-to-print';
import toast from 'react-hot-toast';
import { ArrowLeftIcon, PrinterIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { StatusBadge, Spinner } from '../components/common';
import { QRCodeSVG } from 'qrcode.react';
import api from '../utils/api';
import { format } from 'date-fns';

const InfoRow = ({ label, value }) => (
  <div className="flex justify-between py-1.5 border-b dark:border-gray-700 last:border-0">
    <span className="text-sm text-gray-500 dark:text-gray-400">{label}</span>
    <span className="text-sm font-medium text-gray-800 dark:text-gray-200 text-right max-w-xs">{value || '—'}</span>
  </div>
);

const PrintView = React.forwardRef(({ txn }, ref) => {
  if (!txn) return null;
  const fmt = (d) => d ? format(new Date(d), 'MMMM d, yyyy') : '—';

  return (
    <div ref={ref} className="p-8 bg-white text-gray-900 font-sans max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between border-b-2 border-blue-900 pb-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-blue-900">ANPC YARD</h1>
          <p className="text-sm text-gray-600">Internal Tracking System</p>
          <p className="text-xs text-gray-500 mt-1">EQUIPMENT PULL-OUT / RENTAL FORM</p>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold text-blue-900">{txn.transactionNo}</p>
          <p className="text-sm text-gray-600">{fmt(txn.transactionDate)}</p>
          {txn.transactionTime && <p className="text-sm text-gray-600">{txn.transactionTime}</p>}
          <QRCodeSVG value={txn.transactionNo} size={60} className="mt-2 ml-auto" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-8 mb-6">
        <div>
          <h3 className="font-bold text-gray-800 text-sm uppercase tracking-wide mb-2 border-b pb-1">Transaction Information</h3>
          <table className="w-full text-sm">
            <tbody>
              {[
                ['Transaction No.', txn.transactionNo],
                ['Status', txn.status],
                ['Type', txn.type],
                ['Purpose', txn.purpose],
                ['Expected Return', fmt(txn.expectedReturnDate)],
              ].map(([l, v]) => (
                <tr key={l}><td className="text-gray-500 pr-2 py-0.5">{l}:</td><td className="font-medium">{v || '—'}</td></tr>
              ))}
            </tbody>
          </table>
        </div>

        <div>
          <h3 className="font-bold text-gray-800 text-sm uppercase tracking-wide mb-2 border-b pb-1">Company Information</h3>
          <table className="w-full text-sm">
            <tbody>
              {[
                ['Company', txn.companyName],
                ['Address', txn.companyAddress],
                ['Contact Person', txn.contactPerson],
                ['Contact Number', txn.contactNumber],
              ].map(([l, v]) => (
                <tr key={l}><td className="text-gray-500 pr-2 py-0.5">{l}:</td><td className="font-medium">{v || '—'}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Vehicle & Driver */}
      <div className="grid grid-cols-2 gap-8 mb-6">
        <div>
          <h3 className="font-bold text-gray-800 text-sm uppercase tracking-wide mb-2 border-b pb-1">Company Information</h3>
          <table className="w-full text-sm">
            <tbody>
              {[
                ['Company', txn.companyName],
                ['Address', txn.companyAddress],
                ['Contact Person', txn.contactPerson],
                ['Contact Number', txn.contactNumber],
              ].map(([l, v]) => (
                <tr key={l}><td className="text-gray-500 pr-2 py-0.5">{l}:</td><td className="font-medium">{v || '—'}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
        <div>
          <h3 className="font-bold text-gray-800 text-sm uppercase tracking-wide mb-2 border-b pb-1">Vehicle & Driver</h3>
          <table className="w-full text-sm">
            <tbody>
              {[
                ['Driver', txn.driverName],
                ['Vehicle Type', txn.vehicleType],
                ['Plate No.', txn.vehiclePlateNo],
                ['Pull-Out Location', txn.pullOutLocation],
                ['Delivery Location', txn.deliveryLocation],
              ].map(([l, v]) => (
                <tr key={l}><td className="text-gray-500 pr-2 py-0.5">{l}:</td><td className="font-medium">{v || '—'}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Crane */}
      <div className="mb-6">
        <h3 className="font-bold text-gray-800 text-sm uppercase tracking-wide mb-2 border-b pb-1">Crane Details</h3>
        <table className="w-full text-sm border border-gray-300">
          <thead className="bg-blue-900 text-white">
            <tr>
              <th className="px-3 py-2 text-left">Equipment No.</th>
              <th className="px-3 py-2 text-left">Model</th>
              <th className="px-3 py-2 text-left">Purpose</th>
              <th className="px-3 py-2 text-left">Expected Return</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-t border-gray-300">
              <td className="px-3 py-2 font-mono font-bold">{txn.crane}</td>
              <td className="px-3 py-2">{txn.craneModel || '—'}</td>
              <td className="px-3 py-2">{txn.purpose || '—'}</td>
              <td className="px-3 py-2">{fmt(txn.expectedReturnDate)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Attachments */}
      {(txn.counterweights?.length > 0 || txn.boomSections?.length > 0 || txn.hooks?.length > 0) && (
        <div className="mb-6">
          <h3 className="font-bold text-gray-800 text-sm uppercase tracking-wide mb-2 border-b pb-1">Included Attachments</h3>
          <table className="w-full text-sm border border-gray-300">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-3 py-2 text-left">Type</th>
                <th className="px-3 py-2 text-left">Item Name</th>
                <th className="px-3 py-2 text-left">Code / Serial</th>
                <th className="px-3 py-2 text-left">Length</th>
                <th className="px-3 py-2 text-left">Weight (kg)</th>
              </tr>
            </thead>
            <tbody>
              {txn.counterweights?.map((cw, i) => (
                <tr key={i} className="border-t border-gray-200">
                  <td className="px-3 py-1.5 text-gray-500">Counterweight</td>
                  <td className="px-3 py-1.5">{cw.itemName}</td>
                  <td className="px-3 py-1.5 font-mono text-xs">{cw.serialNo}</td>
                  <td className="px-3 py-1.5">—</td>
                  <td className="px-3 py-1.5">{cw.weightKg || '—'}</td>
                </tr>
              ))}
              {txn.boomSections?.map((bs, i) => (
                <tr key={i} className="border-t border-gray-200">
                  <td className="px-3 py-1.5 text-gray-500">Boom Section</td>
                  <td className="px-3 py-1.5">{bs.itemName}</td>
                  <td className="px-3 py-1.5 font-mono text-xs">{bs.boomCode}</td>
                  <td className="px-3 py-1.5">{bs.length || '—'}</td>
                  <td className="px-3 py-1.5">{bs.weightKg || '—'}</td>
                </tr>
              ))}
              {txn.hooks?.map((h, i) => (
                <tr key={i} className="border-t border-gray-200">
                  <td className="px-3 py-1.5 text-gray-500">Hook</td>
                  <td className="px-3 py-1.5">{h.itemName}</td>
                  <td className="px-3 py-1.5 font-mono text-xs">{h.hookSerialNo}</td>
                  <td className="px-3 py-1.5">—</td>
                  <td className="px-3 py-1.5">{h.weightKg || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {txn.remarks && (
        <div className="mb-6 p-3 bg-gray-50 border border-gray-200">
          <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Remarks</p>
          <p className="text-sm">{txn.remarks}</p>
        </div>
      )}

      {/* Signatures */}
      <div className="mt-10 grid grid-cols-3 gap-8">
        {['Released By', 'Received By', 'Authorized By'].map(label => (
          <div key={label} className="text-center">
            <div className="border-b-2 border-gray-400 h-12 mb-2" />
            <p className="text-xs font-semibold text-gray-600 uppercase">{label}</p>
            <p className="text-xs text-gray-400 mt-1">Signature over printed name</p>
          </div>
        ))}
      </div>
    </div>
  );
});

export default function TransactionDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [txn, setTxn] = useState(null);
  const [loading, setLoading] = useState(true);
  const printRef = useRef();

  useEffect(() => {
    api.get(`/transactions/${id}`)
      .then(r => setTxn(r.data.data))
      .catch(() => { toast.error('Transaction not found'); navigate('/transactions'); })
      .finally(() => setLoading(false));
  }, [id, navigate]);

  const handlePrint = useReactToPrint({ content: () => printRef.current });

  const handleReturn = async () => {
    if (!window.confirm('Mark this transaction as returned?')) return;
    try {
      await api.put(`/transactions/${id}/return`);
      toast.success('Marked as returned');
      const { data } = await api.get(`/transactions/${id}`);
      setTxn(data.data);
    } catch { toast.error('Failed'); }
  };

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;
  if (!txn) return null;

  const fmt = (d) => d ? format(new Date(d), 'MMMM d, yyyy') : '—';

  return (
    <div>
      {/* Top Bar */}
      <div className="flex items-center gap-4 mb-6 no-print flex-wrap">
        <button onClick={() => navigate('/transactions')} className="btn-secondary flex items-center gap-2">
          <ArrowLeftIcon className="w-4 h-4" /> Back
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white font-mono">{txn.transactionNo}</h1>
            <StatusBadge status={txn.status} />
          </div>
          <p className="text-sm text-gray-500 mt-0.5">{txn.companyName} — {fmt(txn.transactionDate)}</p>
        </div>
        <div className="flex items-center gap-2">
          {txn.status === 'Active' && (
            <button onClick={handleReturn} className="btn-success flex items-center gap-2">
              <CheckCircleIcon className="w-4 h-4" /> Mark Returned
            </button>
          )}
          <button onClick={handlePrint} className="btn-secondary flex items-center gap-2">
            <PrinterIcon className="w-4 h-4" /> Print
          </button>
        </div>
      </div>

      {/* Screen view */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 no-print mb-6">
        {/* Left */}
        <div className="card">
          <h3 className="font-semibold text-gray-800 dark:text-white mb-3">Transaction Details</h3>
          <InfoRow label="Transaction No." value={txn.transactionNo} />
          <InfoRow label="Type" value={txn.type} />
          <InfoRow label="Status" value={<StatusBadge status={txn.status} />} />
          <InfoRow label="Date" value={fmt(txn.transactionDate)} />
          <InfoRow label="Time" value={txn.transactionTime} />
          <InfoRow label="Expected Return" value={fmt(txn.expectedReturnDate)} />
          <InfoRow label="Actual Return" value={fmt(txn.actualReturnDate)} />
          <InfoRow label="Purpose" value={txn.purpose} />
          <InfoRow label="Remarks" value={txn.remarks} />
        </div>

        {/* Right */}
        <div className="space-y-4">
          <div className="card">
            <h3 className="font-semibold text-gray-800 dark:text-white mb-3">Company & Logistics</h3>
            <InfoRow label="Company" value={txn.companyName} />
            <InfoRow label="Address" value={txn.companyAddress} />
            <InfoRow label="Contact Person" value={txn.contactPerson} />
            <InfoRow label="Contact Number" value={txn.contactNumber} />
            <InfoRow label="Pull-Out Location" value={txn.pullOutLocation} />
            <InfoRow label="Delivery Location" value={txn.deliveryLocation} />
            <InfoRow label="Driver" value={txn.driverName} />
            <InfoRow label="Vehicle" value={txn.vehicleType} />
            <InfoRow label="Plate No." value={txn.vehiclePlateNo} />
          </div>
        </div>
      </div>

      {/* Crane & Attachments */}
      <div className="card no-print mb-6">
        <h3 className="font-semibold text-gray-800 dark:text-white mb-4">Equipment</h3>
        <div className="mb-4">
          <p className="text-xs font-semibold text-gray-400 uppercase mb-1">Crane</p>
          <Link to={`/cranes`} className="font-mono text-blue-700 dark:text-blue-400 font-bold hover:underline">{txn.crane}</Link>
          <span className="text-gray-500 text-sm ml-2">{txn.craneModel}</span>
        </div>
        {txn.counterweights?.length > 0 && (
          <div className="mb-3">
            <p className="text-xs font-semibold text-gray-400 uppercase mb-2">Counterweights ({txn.counterweights.length})</p>
            <div className="flex flex-wrap gap-2">
              {txn.counterweights.map(cw => (
                <span key={cw._id} className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-xs">{cw.itemName}</span>
              ))}
            </div>
          </div>
        )}
        {txn.boomSections?.length > 0 && (
          <div className="mb-3">
            <p className="text-xs font-semibold text-gray-400 uppercase mb-2">Boom Sections ({txn.boomSections.length})</p>
            <div className="flex flex-wrap gap-2">
              {txn.boomSections.map(bs => (
                <span key={bs._id} className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-xs">{bs.itemName}</span>
              ))}
            </div>
          </div>
        )}
        {txn.hooks?.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase mb-2">Hooks ({txn.hooks.length})</p>
            <div className="flex flex-wrap gap-2">
              {txn.hooks.map(h => (
                <span key={h._id} className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-xs">{h.itemName}</span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Hidden Print View */}
      <div className="hidden print-only">
        <PrintView ref={printRef} txn={txn} />
      </div>
    </div>
  );
}
