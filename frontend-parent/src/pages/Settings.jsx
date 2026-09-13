import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { parentAPI } from '../api/parent';
import { useAuth } from '../context/AuthContext';
import { useChild } from '../context/ChildContext';

const Settings = () => {
  const { parent } = useAuth();
  const { children } = useChild();

  // Self-link form
  const [showSelfLink, setShowSelfLink] = useState(false);
  const [selfLinkData, setSelfLinkData] = useState({
    admission_number: '',
    phone: '',
    national_id: '',
  });
  const [selfLinkLoading, setSelfLinkLoading] = useState(false);
  const [selfLinkResult, setSelfLinkResult] = useState(null);

  // Coparent invite form
  const [showCoparentForm, setShowCoparentForm] = useState(false);
  const [coparentData, setCoparentData] = useState({ student_id: '', email: '' });
  const [coparentLoading, setCoparentLoading] = useState(false);
  const [coparentResult, setCoparentResult] = useState(null);

  const handleSelfLink = async (e) => {
    e.preventDefault();
    setSelfLinkLoading(true);
    setSelfLinkResult(null);
    try {
      const res = await parentAPI.selfLinkChild(selfLinkData);
      setSelfLinkResult({ success: true, message: res.data.message });
      setSelfLinkData({ admission_number: '', phone: '', national_id: '' });
    } catch (err) {
      setSelfLinkResult({
        success: false,
        message: err.response?.data?.error || 'Failed to link child.',
      });
    } finally {
      setSelfLinkLoading(false);
    }
  };

  const handleCoparentInvite = async (e) => {
    e.preventDefault();
    setCoparentLoading(true);
    setCoparentResult(null);
    try {
      const res = await parentAPI.inviteCoparent(coparentData);
      setCoparentResult({ success: true, message: res.data.message });
      setCoparentData({ student_id: '', email: '' });
    } catch (err) {
      setCoparentResult({
        success: false,
        message: err.response?.data?.error || 'Failed to send invitation.',
      });
    } finally {
      setCoparentLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500 text-sm mt-1">Manage your account and linked children</p>
      </div>

      {/* Account info */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h2 className="font-bold text-gray-900 mb-4">Account Information</h2>
        <dl className="space-y-3">
          <Row label="Full Name" value={parent?.full_name} />
          <Row label="Email" value={parent?.email} />
          <Row label="Phone" value={parent?.phone} />
          <Row label="Relationship" value={parent?.relationship} />
        </dl>
        <div className="mt-4 flex gap-3">
          <Link to="/change-password" className="text-sm text-primary-900 font-medium hover:text-primary-700">
            Change Password →
          </Link>
        </div>
      </div>

      {/* Linked children */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-gray-900">Linked Children</h2>
          <button
            onClick={() => setShowSelfLink(!showSelfLink)}
            className="text-sm text-primary-900 font-medium hover:text-primary-700"
          >
            {showSelfLink ? 'Cancel' : '+ Link Another Child'}
          </button>
        </div>

        <div className="space-y-3 mb-4">
          {children.map((c) => (
            <div key={c.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
              <div>
                <p className="font-medium text-sm text-gray-900">{c.full_name}</p>
                <p className="text-xs text-gray-500">
                  {c.admission_number} · {c.relationship}
                  {c.is_primary_contact && ' · Primary contact'}
                </p>
              </div>
              <div className="flex gap-2">
                {c.can_view_academic && (
                  <span className="text-xs text-green-600" title="Can view academic">
                    ✓ Academic
                  </span>
                )}
                {c.can_view_financials && (
                  <span className="text-xs text-green-600" title="Can view financials">
                    ✓ Financials
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        {showSelfLink && (
          <form onSubmit={handleSelfLink} className="border-t border-gray-100 pt-4 space-y-4">
            <p className="text-sm text-gray-600">
              Enter the admission number and details as they appear on the child's admission record.
            </p>

            {selfLinkResult && (
              <div className={`p-3 rounded text-sm ${
                selfLinkResult.success
                  ? 'bg-green-50 text-green-700 border-l-4 border-green-500'
                  : 'bg-red-50 text-red-700 border-l-4 border-red-500'
              }`}>
                {selfLinkResult.message}
              </div>
            )}

            <div>
              <label className="label-field">Admission Number</label>
              <input
                type="text"
                value={selfLinkData.admission_number}
                onChange={(e) => setSelfLinkData({ ...selfLinkData, admission_number: e.target.value })}
                required
                className="input-field"
                placeholder="e.g. AR12026001"
              />
            </div>

            <div>
              <label className="label-field">Guardian Phone (on record)</label>
              <input
                type="tel"
                value={selfLinkData.phone}
                onChange={(e) => setSelfLinkData({ ...selfLinkData, phone: e.target.value })}
                required
                className="input-field"
              />
            </div>

            <div>
              <label className="label-field">Guardian National ID (on record)</label>
              <input
                type="text"
                value={selfLinkData.national_id}
                onChange={(e) => setSelfLinkData({ ...selfLinkData, national_id: e.target.value })}
                required
                className="input-field"
              />
            </div>

            <button type="submit" disabled={selfLinkLoading} className="btn-primary w-full">
              {selfLinkLoading ? 'Linking...' : 'Link Child'}
            </button>
          </form>
        )}
      </div>

      {/* Invite coparent */}
      {children.length > 0 && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-bold text-gray-900">Invite Co-Parent</h2>
              <p className="text-xs text-gray-500 mt-1">
                The email must already be on the admission record.
              </p>
            </div>
            <button
              onClick={() => setShowCoparentForm(!showCoparentForm)}
              className="text-sm text-primary-900 font-medium hover:text-primary-700"
            >
              {showCoparentForm ? 'Cancel' : '+ Invite'}
            </button>
          </div>

          {showCoparentForm && (
            <form onSubmit={handleCoparentInvite} className="space-y-4 border-t border-gray-100 pt-4">
              {coparentResult && (
                <div className={`p-3 rounded text-sm ${
                  coparentResult.success
                    ? 'bg-green-50 text-green-700 border-l-4 border-green-500'
                    : 'bg-red-50 text-red-700 border-l-4 border-red-500'
                }`}>
                  {coparentResult.message}
                </div>
              )}

              <div>
                <label className="label-field">For Which Child?</label>
                <select
                  value={coparentData.student_id}
                  onChange={(e) => setCoparentData({ ...coparentData, student_id: e.target.value })}
                  required
                  className="input-field"
                >
                  <option value="">Select child</option>
                  {children.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.full_name} ({c.admission_number})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label-field">Co-Parent's Email</label>
                <input
                  type="email"
                  value={coparentData.email}
                  onChange={(e) => setCoparentData({ ...coparentData, email: e.target.value })}
                  required
                  className="input-field"
                  placeholder="coparent@example.com"
                />
              </div>

              <button type="submit" disabled={coparentLoading} className="btn-primary w-full">
                {coparentLoading ? 'Sending...' : 'Send Invitation'}
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
};

const Row = ({ label, value }) => (
  <div className="flex justify-between gap-4 py-2 border-b border-gray-100 last:border-0">
    <dt className="text-sm text-gray-500">{label}</dt>
    <dd className="text-sm font-medium text-gray-900 text-right">{value || '—'}</dd>
  </div>
);

export default Settings;