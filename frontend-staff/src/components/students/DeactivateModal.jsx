import React, { useState } from 'react';
import { studentsAPI } from '../../api/students';

const DeactivateModal = ({ isOpen, student, onClose, onSuccess }) => {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !student) return null;

  const handleDeactivate = async () => {
    if (reason.trim().length < 5) {
      setError('Reason must be at least 5 characters.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await studentsAPI.deactivate(student.id, reason.trim());
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to deactivate.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setReason('');
    setError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-2">Deactivate Student?</h2>
        <p className="text-sm text-gray-600 mb-4">
          <strong>{student.full_name}</strong> will be deactivated. Their login will be
          disabled, and they will no longer appear in active student lists.
        </p>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-3 rounded text-sm mb-4">
            {error}
          </div>
        )}

        <div className="mb-4">
          <label className="label-field">Reason (required)</label>
          <textarea
            value={reason}
            onChange={(e) => {
              setReason(e.target.value);
              setError('');
            }}
            rows={3}
            className="input-field"
            placeholder="e.g. Transferred to another school"
          />
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleDeactivate}
            disabled={loading || reason.trim().length < 5}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-2.5 px-4 rounded-lg transition disabled:opacity-50"
          >
            {loading ? 'Deactivating...' : 'Deactivate'}
          </button>
          <button
            onClick={handleClose}
            disabled={loading}
            className="flex-1 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium py-2.5 px-4 rounded-lg transition"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeactivateModal;