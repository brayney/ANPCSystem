import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useReactToPrint } from 'react-to-print';
import toast from 'react-hot-toast';
import { PrinterIcon } from '@heroicons/react/24/outline';
import { StatusBadge, Spinner } from '../components/common';
import { QRCodeSVG } from 'qrcode.react';
import api from '../utils/api';
import { format } from 'date-fns';

const getTransactionCranes = (txn) => (
  txn.cranes?.length
    ? txn.cranes
    : [{
        equipmentNo: txn.crane,
        craneModel: txn.craneModel,
        capacity: txn.capacity,
        weightKg: txn.weightKg,
      }]
);

const AttachmentRows = ({ txn }) => (
  <>
    {txn.counterweights?.map((cw, i) => (
      <tr key={`cw-${cw._id || i}`} className="border-t border-gray-200">
        <td className="px-2 py-0.5 text-gray-500 text-xs">Counterweight</td>
        <td className="px-2 py-0.5 text-xs">{cw.itemName || '-'}</td>
        <td className="px-2 py-0.5 font-mono text-xs">{cw.serialNo || '-'}</td>
        <td className="px-2 py-0.5 text-xs">-</td>
        <td className="px-2 py-0.5 text-xs">{cw.weightKg || '-'}</td>
      </tr>
    ))}
    {txn.boomSections?.map((bs, i) => (
      <tr key={`bs-${bs._id || i}`} className="border-t border-gray-200">
        <td className="px-2 py-0.5 text-gray-500 text-xs">Boom Section</td>
        <td className="px-2 py-0.5 text-xs">{bs.itemName || '-'}</td>
        <td className="px-2 py-0.5 font-mono text-xs">{bs.boomCode || '-'}</td>
        <td className="px-2 py-0.5 text-xs">{bs.length || '-'}</td>
        <td className="px-2 py-0.5 text-xs">{bs.weightKg || '-'}</td>
      </tr>
    ))}
    {txn.hooks?.map((h, i) => (
      <tr key={`hook-${h._id || i}`} className="border-t border-gray-200">
        <td className="px-2 py-0.5 text-gray-500 text-xs">Hook</td>
        <td className="px-2 py-0.5 text-xs">{h.itemName || '-'}</td>
        <td className="px-2 py-0.5 font-mono text-xs">{h.hookSerialNo || '-'}</td>
        <td className="px-2 py-0.5 text-xs">-</td>
        <td className="px-2 py-0.5 text-xs">{h.weightKg || '-'}</td>
      </tr>
    ))}
  </>
);

const AttachmentsTable = ({ txn }) => {
  const hasAttachments = txn.counterweights?.length > 0 || txn.boomSections?.length > 0 || txn.hooks?.length > 0;
  if (!hasAttachments) return <p className="text-xs text-gray-500">No attachments</p>;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs border border-gray-300">
        <thead className="bg-gray-100">
          <tr>
            <th className="px-2 py-0.5 text-left text-xs">Type</th>
            <th className="px-2 py-0.5 text-left text-xs">Item Name</th>
            <th className="px-2 py-0.5 text-left text-xs">Code / Serial</th>
            <th className="px-2 py-0.5 text-left text-xs">Length</th>
            <th className="px-2 py-0.5 text-left text-xs">Weight (kg)</th>
          </tr>
        </thead>
        <tbody>
          <AttachmentRows txn={txn} />
        </tbody>
      </table>
    </div>
  );
};

// eslint-disable-next-line no-unused-vars
const RelatedTransactionsTable = ({ transactions = [], compact = false }) => {
  if (!transactions.length) return null;

  const fmt = (d) => d ? format(new Date(d), compact ? 'MMM d, yyyy' : 'MMMM d, yyyy') : '—';

  return (
    <div className={compact ? 'mb-2' : 'mt-6'}>
      <h3 className={`${compact ? 'font-bold text-gray-800 text-xs uppercase tracking-wide mb-1 border-b pb-0.5' : 'text-sm font-bold text-gray-900 mb-3'}`}>Added Transactions</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-xs border border-gray-300">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-2 py-1 text-left">TXN No.</th>
              <th className="px-2 py-1 text-left">Date</th>
              <th className="px-2 py-1 text-left">Driver / Vehicle</th>
              <th className="px-2 py-1 text-left">Location</th>
              <th className="px-2 py-1 text-left">Attachments</th>
              <th className="px-2 py-1 text-left">Status</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map(child => (
              <tr key={child._id} className="border-t border-gray-200">
                <td className="px-2 py-1 font-mono font-bold text-blue-700">{child.transactionNo}</td>
                <td className="px-2 py-1">{fmt(child.transactionDate)}</td>
                <td className="px-2 py-1">{[child.driverName, child.vehicleType, child.vehiclePlateNo].filter(Boolean).join(' / ') || '—'}</td>
                <td className="px-2 py-1">{child.pullOutLocation || child.deliveryLocation || '—'}</td>
                <td className="px-2 py-1">{child.counterweights?.length || 0} CW / {child.boomSections?.length || 0} Boom / {child.hooks?.length || 0} Hooks</td>
                <td className="px-2 py-1">{child.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const DetailedRelatedTransactionsTable = ({ transactions = [], compact = false }) => {
  if (!transactions.length) return null;

  const fmt = (d) => d ? format(new Date(d), compact ? 'MMM d, yyyy' : 'MMMM d, yyyy') : '-';

  return (
    <div className={compact ? 'mb-2' : 'mt-6'}>
      <h3 className={`${compact ? 'font-bold text-gray-800 text-xs uppercase tracking-wide mb-1 border-b pb-0.5' : 'text-sm font-bold text-gray-900 mb-3'}`}>Added Transactions</h3>
      <div className="space-y-3">
        {transactions.map(child => (
          <div key={child._id} className="border border-gray-300">
            <table className="w-full text-xs">
              <tbody>
                <tr className="bg-gray-100">
                  <td className="px-2 py-1 font-semibold text-gray-500">TXN No.</td>
                  <td className="px-2 py-1 font-mono font-bold text-blue-700">{child.transactionNo}</td>
                  <td className="px-2 py-1 font-semibold text-gray-500">Date</td>
                  <td className="px-2 py-1">{fmt(child.transactionDate)}</td>
                  <td className="px-2 py-1 font-semibold text-gray-500">Status</td>
                  <td className="px-2 py-1">{child.status || '-'}</td>
                </tr>
                <tr className="border-t border-gray-200">
                  <td className="px-2 py-1 font-semibold text-gray-500">Driver / Vehicle</td>
                  <td className="px-2 py-1" colSpan={2}>{[child.driverName, child.vehicleType, child.vehiclePlateNo].filter(Boolean).join(' / ') || '-'}</td>
                  <td className="px-2 py-1 font-semibold text-gray-500">Location</td>
                  <td className="px-2 py-1" colSpan={2}>{child.pullOutLocation || child.deliveryLocation || '-'}</td>
                </tr>
              </tbody>
            </table>
            <div className="p-2">
              <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Included Attachments</p>
              <AttachmentsTable txn={child} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const PrintView = React.forwardRef(({ txn }, ref) => {
  const [isSmallScreen, setIsSmallScreen] = useState(
    typeof window !== 'undefined' ? window.innerWidth < 640 : false
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(max-width: 639px)');
    const handler = (e) => setIsSmallScreen(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  if (!txn) return null;
  const cranes = getTransactionCranes(txn);
  const fmt = (d) => d ? format(new Date(d), 'MMMM d, yyyy') : '—';
  const publicUrl = `${window.location.origin}/public/transactions/${txn._id}`;
  const qrSize = isSmallScreen ? 56 : 72;
  const logoHeight = isSmallScreen ? 44 : 56;

  return (
    <div ref={ref} className="public-transaction-print p-4 sm:p-6 md:p-8 bg-white text-gray-900 font-sans max-w-full mx-auto overflow-x-hidden" style={{ width: '100%', maxWidth: '100%', margin: '0 auto' }}>
      <div>
        {/* Header */}
        <div className="public-transaction-print-header flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6 border-b-2 border-blue-900 pb-4 mb-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-shrink-0 sm:items-center">
            <QRCodeSVG value={publicUrl} size={qrSize} className="public-transaction-qr" />
            <div>
              <img src="/logo.png" alt="NASS Logo" className="public-transaction-logo" style={{ height: `${logoHeight}px`, objectFit: 'contain', marginBottom: '4px' }} />
              <p className="text-sm text-gray-500">EQUIPMENT PULL-OUT / RENTAL FORM</p>
            </div>
          </div>
          <div className="text-left sm:text-right text-sm whitespace-normal sm:whitespace-nowrap">
            <p className="font-bold text-blue-900">TXN No: {txn.transactionNo}</p>
            <p className="text-gray-600">{fmt(txn.transactionDate)}</p>
            {txn.transactionTime && <p className="text-gray-600">{txn.transactionTime}</p>}
            <p className="font-bold mt-1">Status: {txn.status}</p>
          </div>
        </div>

        <div className="public-transaction-print-grid grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-8 mb-4 sm:mb-8">
          <div>
            <h3 className="font-bold text-gray-800 text-xs uppercase tracking-wide mb-1 border-b pb-0.5">Transaction Information</h3>
            <table className="w-full text-sm">
              <tbody>
                {[
                  ['Type', txn.type],
                  ['Purpose', txn.purpose],
                  ['Expected Return', fmt(txn.expectedReturnDate)],
                ].map(([l, v]) => (
                  <tr key={l}><td className="text-gray-500 pr-2 py-1 text-sm">{l}:</td><td className="font-medium text-sm">{v || '—'}</td></tr>
                ))}
              </tbody>
            </table>
          </div>

          <div>
            <h3 className="font-bold text-gray-800 text-xs uppercase tracking-wide mb-1 border-b pb-0.5">Company Information</h3>
            <table className="w-full text-sm">
              <tbody>
                {[
                  ['Company', txn.companyName],
                  ['Address', txn.companyAddress],
                  ['Contact Person', txn.contactPerson],
                  ['Contact Number', txn.contactNumber],
                ].map(([l, v]) => (
                  <tr key={l}><td className="text-gray-500 pr-2 py-1 text-sm">{l}:</td><td className="font-medium text-sm">{v || '—'}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Vehicle & Driver */}
        <div className="public-transaction-print-grid grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-4 mb-4">
          <div>
            <h3 className="font-bold text-gray-800 text-xs uppercase tracking-wide mb-1 border-b pb-0.5">Vehicle & Driver</h3>
            <table className="w-full text-sm">
              <tbody>
                {[
                  ['Driver', txn.driverName],
                  ['Vehicle Type', txn.vehicleType],
                  ['Plate No.', txn.vehiclePlateNo],
                  ['Pull-Out Location', txn.pullOutLocation],
                  ['Delivery Location', txn.deliveryLocation],
                ].map(([l, v]) => (
                  <tr key={l}><td className="text-gray-500 pr-2 py-1 text-sm">{l}:</td><td className="font-medium text-sm">{v || '—'}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Crane */}
        <div className="mb-4">
          <h3 className="font-bold text-gray-800 text-xs uppercase tracking-wide mb-1 border-b pb-0.5">Crane Details</h3>
          <table className="w-full text-sm border border-gray-300">
            <thead className="bg-blue-900 text-white">
              <tr>
                <th className="px-3 py-1.5 text-left text-sm">Equipment No.</th>
                <th className="px-3 py-1.5 text-left text-sm">Model</th>
                <th className="px-3 py-1.5 text-left text-sm">Capacity</th>
                <th className="px-3 py-1.5 text-left text-sm">Weight (KG)</th>
                <th className="px-3 py-1.5 text-left text-sm">Expected Return</th>
              </tr>
            </thead>
            <tbody>
              {cranes.map((crane, index) => (
                <tr key={crane.craneId || crane.equipmentNo || index} className="border-t border-gray-300">
                  <td className="px-3 py-1 font-mono font-bold text-sm">{crane.equipmentNo}</td>
                  <td className="px-3 py-1 text-sm">{crane.craneModel || '—'}</td>
                  <td className="px-3 py-1 text-sm">{crane.capacity || '—'}</td>
                  <td className="px-3 py-1 text-sm">{crane.weightKg || '—'}</td>
                  <td className="px-3 py-1 text-sm">{fmt(txn.expectedReturnDate)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Attachments */}
        {(txn.counterweights?.length > 0 || txn.boomSections?.length > 0 || txn.hooks?.length > 0) && (
          <div className="mb-3">
            <h3 className="font-bold text-gray-800 text-xs uppercase tracking-wide mb-1 border-b pb-0.5">Included Attachments</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border border-gray-300">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-3 py-1 text-left text-sm">Type</th>
                    <th className="px-3 py-1 text-left text-sm">Item Name</th>
                    <th className="px-3 py-1 text-left text-sm">Code / Serial</th>
                    <th className="px-3 py-1 text-left text-sm">Length</th>
                    <th className="px-3 py-1 text-left text-sm">Weight (kg)</th>
                  </tr>
                </thead>
                <tbody>
                  {txn.counterweights?.map((cw, i) => (
                    <tr key={i} className="border-t border-gray-200">
                      <td className="px-3 py-1 text-gray-500 text-sm">Counterweight</td>
                      <td className="px-3 py-1 text-sm">{cw.itemName}</td>
                      <td className="px-3 py-1 font-mono text-sm">{cw.serialNo}</td>
                      <td className="px-3 py-1 text-sm">—</td>
                      <td className="px-3 py-1 text-sm">{cw.weightKg || '—'}</td>
                    </tr>
                  ))}
                  {txn.boomSections?.map((bs, i) => (
                    <tr key={i} className="border-t border-gray-200">
                      <td className="px-3 py-1 text-gray-500 text-sm">Boom Section</td>
                      <td className="px-3 py-1 text-sm">{bs.itemName}</td>
                      <td className="px-3 py-1 font-mono text-sm">{bs.boomCode}</td>
                      <td className="px-3 py-1 text-sm">{bs.length || '—'}</td>
                      <td className="px-3 py-1 text-sm">{bs.weightKg || '—'}</td>
                    </tr>
                  ))}
                  {txn.hooks?.map((h, i) => (
                    <tr key={i} className="border-t border-gray-200">
                      <td className="px-3 py-1 text-gray-500 text-sm">Hook</td>
                      <td className="px-3 py-1 text-sm">{h.itemName}</td>
                      <td className="px-3 py-1 font-mono text-sm">{h.hookSerialNo}</td>
                      <td className="px-3 py-1 text-sm">—</td>
                      <td className="px-3 py-1 text-sm">{h.weightKg || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {txn.remarks && (
          <div className="mb-3 p-3 bg-gray-50 border border-gray-200">
            <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Remarks</p>
            <p className="text-sm">{txn.remarks}</p>
          </div>
        )}

        {/* Signatures */}
        <div className="public-transaction-print-signatures mt-5 grid grid-cols-1 sm:grid-cols-3 gap-4">
          {['Released By', 'Received By', 'Authorized By'].map(label => (
            <div key={label} className="text-center">
              <div className="border-b border-gray-400 h-10 mb-2" />
              <p className="text-sm font-semibold text-gray-600 uppercase">{label}</p>
              <p className="text-sm text-gray-400 mt-1">Signature</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});

export default function PublicTransactionPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [txn, setTxn] = useState(null);
  const [loading, setLoading] = useState(true);
  const printRef = useRef();

  useEffect(() => {
    // Fetch from public endpoint
    api.get(`/transactions/public/${id}`)
      .then(r => setTxn(r.data.data))
      .catch(() => {
        toast.error('Transaction not found');
        setTimeout(() => navigate('/'), 2000);
      })
      .finally(() => setLoading(false));
  }, [id, navigate]);

  // Use default browser print dialog and rely on CSS @page for size
  const handlePrint = useReactToPrint({
    content: () => printRef.current,
  });

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <Spinner size="lg" />
    </div>
  );
  
  if (!txn) return null;
  const cranes = getTransactionCranes(txn);

  const fmt = (d) => d ? format(new Date(d), 'MMMM d, yyyy') : '—';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Bar - Simplified, No Back Button */}
      <div className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10 no-print">
        <div className="w-full px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex-1">
            <h1 className="text-lg md:text-xl font-bold text-gray-900 font-mono">{txn.transactionNo}</h1>
            <p className="text-xs md:text-sm text-gray-500">{txn.companyName}</p>
          </div>
          <div className="flex items-center gap-2 md:gap-4 flex-wrap">
            <StatusBadge status={txn.status} />
            <button onClick={handlePrint} className="btn-primary flex items-center gap-1 md:gap-2 text-xs md:text-sm px-2 md:px-4 py-2">
              <PrinterIcon className="w-4 h-4" /> Print
            </button>
            <div className="text-xs text-gray-500 hidden sm:inline-block">
              Tip: In the print dialog, uncheck "Headers and footers" for a clean printout.
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="w-full max-w-5xl mx-auto py-3 px-3 sm:px-4 sm:py-4 md:py-6 lg:px-6">
        {/* Print View */}
        <div className="bg-white rounded-lg shadow mb-4 sm:mb-6 md:mb-8">
          <PrintView ref={printRef} txn={txn} />
        </div>

        {/* Screen View Summary - Mobile Optimized */}
        <div className="no-print bg-white rounded-lg shadow p-3 sm:p-4 md:p-6">
          <h2 className="text-base md:text-lg font-bold text-gray-900 mb-4">Transaction Summary</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-xs sm:text-sm">
            <div>
              <p className="text-gray-500">Transaction Number</p>
              <p className="font-mono font-bold text-base md:text-lg text-blue-600">{txn.transactionNo}</p>
            </div>
            <div>
              <p className="text-gray-500">Status</p>
              <p className="font-medium"><StatusBadge status={txn.status} /></p>
            </div>
            <div>
              <p className="text-gray-500">Company</p>
              <p className="font-medium">{txn.companyName}</p>
            </div>
            <div>
              <p className="text-gray-500">Cranes</p>
              <p className="font-mono font-bold text-blue-600">{cranes.map(crane => crane.equipmentNo).join(', ')}</p>
            </div>
            <div>
              <p className="text-gray-500">Transaction Date</p>
              <p className="font-medium">{fmt(txn.transactionDate)}</p>
            </div>
            <div>
              <p className="text-gray-500">Expected Return</p>
              <p className="font-medium">{fmt(txn.expectedReturnDate)}</p>
            </div>
          </div>
          <DetailedRelatedTransactionsTable transactions={txn.childTransactions || []} />
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
            <p className="text-xs text-blue-900">
              ✓ <strong>Secure Transaction Review:</strong> This QR review includes the main transaction and added transactions connected to it.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
