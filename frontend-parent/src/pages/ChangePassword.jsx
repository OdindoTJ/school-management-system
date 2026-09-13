import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { parentAuthAPI, getCurrentParent } from '../api/auth';
import { useAuth } from '../context/AuthContext';

const ChangePassword = () => {
  const navigate = useNavigate();
  const { parent, updateParent, logout, isAuthenticated } = useAuth();

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    setLoading(true);

    try {
      await parentAuthAPI.changePassword(oldPassword, newPassword, confirmPassword);
      const updated = { ...getCurrentParent(), must_change_password: false };
      updateParent(updated);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      const data = err.response?.data;
      const msg =
        data?.error ||
        data?.old_password?.[0] ||
        data?.new_password?.[0] ||
        data?.confirm_password?.[0] ||
        'Failed to change password.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-6">
          <img src="/logo.png" alt="Arina School" className="h-20 mb-3" />
          <p className="text-xs tracking-widest text-primary-900 font-semibold uppercase">
            Parent Portal
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8">
          {parent?.must_change_password && (
            <div className="mb-6 flex items-start gap-3 bg-blue-50 border-l-4 border-blue-500 text-blue-800 px-4 py-3 rounded">
              <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="text-sm">
                <p className="font-semibold">Change Your Password</p>
                <p className="text-blue-700 mt-1">
                  You are using a temporary password. Please create a new password to continue.
                </p>
              </div>
            </div>
          )}

          <h1 className="text-2xl font-bold text-primary-900 mb-6">
            {parent?.must_change_password ? 'Set New Password' : 'Change Password'}
          </h1>

          {error && (
            <div className="mb-6 bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="label-field">Current Password</label>
              <input
                type={showPasswords ? 'text' : 'password'}
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                required
                className="input-field"
                placeholder="Enter current password"
                autoComplete="current-password"
              />
            </div>

            <div>
              <label className="label-field">New Password</label>
              <input
                type={showPasswords ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={8}
                className="input-field"
                placeholder="At least 8 characters"
                autoComplete="new-password"
              />
            </div>

            <div>
              <label className="label-field">Confirm New Password</label>
              <input
                type={showPasswords ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={8}
                className="input-field"
                placeholder="Re-enter new password"
                autoComplete="new-password"
              />
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showPasswords}
                onChange={(e) => setShowPasswords(e.target.checked)}
                className="w-4 h-4 text-primary-900 focus:ring-primary-900 border-gray-300 rounded"
              />
              <span className="text-sm text-gray-600">Show passwords</span>
            </label>

            <div className="text-xs text-gray-500 bg-gray-50 rounded p-3">
              <p className="font-medium text-gray-700 mb-1">Password must contain:</p>
              <ul className="space-y-0.5">
                <li>• At least 8 characters</li>
                <li>• A mix of letters, numbers, and symbols recommended</li>
              </ul>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  Updating...
                </span>
              ) : (
                'Update Password'
              )}
            </button>

            <button
              type="button"
              onClick={() => { logout(); navigate('/login', { replace: true }); }}
              className="w-full text-sm text-gray-500 hover:text-gray-700 font-medium py-2"
            >
              Logout
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ChangePassword;