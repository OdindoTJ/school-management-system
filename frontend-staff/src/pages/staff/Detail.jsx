import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { staffAPI } from '../../api/staffMembers';
import ResetPasswordModal from '../../components/staff/ResetPasswordModal';
import DeactivateModal from '../../components/staff/DeactivateModal';
import AssignRoleModal from '../../components/staff/AssignRoleModal';

const Detail = () => {
  const { id } = useParams();

  const [staff, setStaff] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showResetModal, setShowResetModal] = useState(false);
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [showAssignRoleModal, setShowAssignRoleModal] = useState(false);

  const fetchStaff = async () => {
    setLoading(true);
    try {
      const res = await staffAPI.getStaffMember(id);
      setStaff(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load staff member.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleReactivate = async () => {
    try {
      await staffAPI.reactivateStaff(id);
      await fetchStaff();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to reactivate.');
    }
  };

  const handleForceLogout = async () => {
    if (!confirm('Force logout this staff member from all sessions?')) return;
    try {
      const res = await staffAPI.forceLogoutStaffMember(id);
      alert(res.data.message);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to force logout.');
    }
  };

  const handleRemoveRole = async (roleId, roleName) => {
    if (!confirm(`Remove the ${roleName} role from this staff member?`)) return;
    try {
      const res = await staffAPI.removeRole(id, roleId);
      setStaff(res.data);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to remove role.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-10 h-10 border-4 border-primary-900 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !staff) {
    return <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded">{error || 'Staff not found.'}</div>;
  }

  const initials = staff.full_name
    ? staff.full_name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
    : '?';

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link to="/staff" className="hover:text-primary-900">Staff</Link>
        <span>/</span>
        <span className="text-gray-900 font-medium">{staff.full_name}</span>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          {staff.photo_url ? (
            <img src={staff.photo_url} alt={staff.full_name} className="w-16 h-16 rounded-xl object-cover" />
          ) : (
            <div className="w-16 h-16 rounded-xl bg-primary-900 text-white flex items-center justify-center text-xl font-bold">
              {initials}
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{staff.full_name}</h1>
            <p className="text-sm text-gray-500">
              {staff.staff_id} · {staff.email}
            </p>
            <div className="mt-1 flex flex-wrap gap-2">
              {staff.is_active ? (
                <span className="inline-block px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs font-medium">Active</span>
              ) : (
                <span className="inline-block px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs font-medium">Inactive</span>
              )}
              {staff.must_change_password && (
                <span className="inline-block px-2 py-0.5 bg-amber-100 text-amber-700 rounded text-xs font-medium">Must change password</span>
              )}
              {staff.mfa_required && !staff.mfa_enabled && (
                <span className="inline-block px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs font-medium">MFA required</span>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            to={`/staff/${staff.id}/edit`}
            className="inline-flex items-center gap-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium py-2 px-4 rounded-lg transition text-sm"
          >
            Edit
          </Link>

          <button
            onClick={() => setShowResetModal(true)}
            className="inline-flex items-center gap-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium py-2 px-4 rounded-lg transition text-sm"
          >
            Reset Password
          </button>

          <button
            onClick={handleForceLogout}
            className="inline-flex items-center gap-2 bg-white border border-amber-300 hover:bg-amber-50 text-amber-700 font-medium py-2 px-4 rounded-lg transition text-sm"
          >
            Force Logout
          </button>

          {staff.is_active ? (
            <button
              onClick={() => setShowDeactivateModal(true)}
              className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition text-sm"
            >
              Deactivate
            </button>
          ) : (
            <button
              onClick={handleReactivate}
              className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition text-sm"
            >
              Reactivate
            </button>
          )}
        </div>
      </div>

      {/* Roles section */}
      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-gray-900">Assigned Roles</h2>
          <button
            onClick={() => setShowAssignRoleModal(true)}
            className="text-sm text-primary-900 font-medium hover:text-primary-700"
          >
            + Assign Role
          </button>
        </div>

        {staff.roles && staff.roles.length > 0 ? (
          <div className="space-y-2">
            {staff.roles.map((r) => (
              <div key={r.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-sm text-gray-900">{r.name}</p>
                  <p className="text-xs text-gray-500">
                    Level {r.level}
                    {r.requires_mfa && ' · MFA required'}
                  </p>
                </div>
                <button
                  onClick={() => handleRemoveRole(r.id, r.name)}
                  className="text-xs text-red-600 hover:text-red-700 font-medium"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500">No roles assigned. This staff has no system access.</p>
        )}
      </div>

      {/* Info cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
          <h2 className="font-bold text-gray-900 mb-4">Personal Information</h2>
          <dl className="space-y-3">
            <Row label="Full Name" value={staff.full_name} />
            <Row label="Email" value={staff.email} />
            <Row label="Phone" value={staff.phone || '—'} />
            <Row label="National ID" value={staff.national_id || '—'} />
            <Row label="Date of Birth" value={staff.date_of_birth || '—'} />
          </dl>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
          <h2 className="font-bold text-gray-900 mb-4">Employment Information</h2>
          <dl className="space-y-3">
            <Row label="Staff ID" value={staff.staff_id} />
            <Row label="Employment Type" value={capitalize(staff.employment_type)} />
            <Row label="Date Hired" value={staff.date_hired} />
            <Row label="Contract End" value={staff.contract_end_date || '—'} />
            <Row label="Access Review" value={staff.access_review_date || '—'} />
          </dl>
        </div>
      </div>

      {!staff.is_active && staff.deactivation_reason && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
          <p className="text-sm font-semibold text-red-800 mb-1">Deactivation Reason</p>
          <p className="text-sm text-red-700">{staff.deactivation_reason}</p>
          {staff.deactivated_at && (
            <p className="text-xs text-red-600 mt-2">
              Deactivated on {new Date(staff.deactivated_at).toLocaleString()}
            </p>
          )}
        </div>
      )}

      {/* Modals */}
      <ResetPasswordModal
        isOpen={showResetModal}
        staff={staff}
        onClose={() => setShowResetModal(false)}
      />
      <DeactivateModal
        isOpen={showDeactivateModal}
        staff={staff}
        onClose={() => setShowDeactivateModal(false)}
        onSuccess={() => {
          setShowDeactivateModal(false);
          fetchStaff();
        }}
      />
      <AssignRoleModal
        isOpen={showAssignRoleModal}
        staff={staff}
        onClose={() => setShowAssignRoleModal(false)}
        onSuccess={(updatedStaff) => {
          setStaff(updatedStaff);
          setShowAssignRoleModal(false);
        }}
      />
    </div>
  );
};

const Row = ({ label, value }) => (
  <div className="flex justify-between gap-4 py-2 border-b border-gray-100 last:border-0">
    <dt className="text-sm text-gray-500">{label}</dt>
    <dd className="text-sm font-medium text-gray-900 text-right">{value || '—'}</dd>
  </div>
);

const capitalize = (s) => (s ? s.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase()) : '');

export default Detail;