import React, { useState } from 'react';
import { studentsAPI } from '../../api/students';

const ResetPasswordModal = ({ isOpen, student, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [tempPassword, setTempPassword] = useState(null);
  const [error, setError] = useState('');

  if (!isOpen || !student) return null;

  const handleReset = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await studentsAPI.resetPassword(student.id);
      setTempPassword(res.data.temporary_password);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to reset password.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setTempPassword(null);
    setError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        {!tempPassword ? (
          <>
            <h2 className="text-lg font-bold text-gray-900 mb-2">Reset Password?</h2>
            <p className="text-sm text-gray-600 mb-4">
              This will generate a new temporary password for <strong>{student.full_name}</strong>.
              They will be required to change it on their next login.
            </p>

            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-3 rounded text-sm mb-4">
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={handleReset}
                disabled={loading}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-2.5 px-4 rounded-lg transition disabled:opacity-50"
              >
                {loading ? 'Resetting...' : 'Reset Password'}
              </button>
              <button
                onClick={handleClose}
                disabled={loading}
                className="flex-1 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium py-2.5 px-4 rounded-lg transition"
              >
                Cancel
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-lg font-bold text-gray-900 mb-2">Password Reset</h2>
            <p className="text-sm text-gray-600 mb-4">
              New temporary password for <strong>{student.full_name}</strong>:
            </p>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
              <div className="flex items-center gap-2">
                <code className="flex-1 text-lg font-mono text-gray-900 select-all">
                  {tempPassword}
                </code>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(tempPassword);
                    alert('Copied!');
                  }}
                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-medium rounded"
                >
                  Copy
                </button>
              </div>
            </div>

            <p className="text-xs text-gray-500 mb-4">
              ⚠️ This password won't be shown again. Share it with the student now.
            </p>

            <button
              onClick={handleClose}
              className="w-full bg-primary-900 hover:bg-primary-800 text-white font-semibold py-2.5 px-4 rounded-lg transition"
            >
              Done
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default ResetPasswordModal;