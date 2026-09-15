import React, { useState, useEffect } from 'react';
import { staffAPI } from '../../api/staffMembers';

const AssignRoleModal = ({ isOpen, staff, onClose, onSuccess }) => {
  const [roles, setRoles] = useState([]);
  const [selectedRoleId, setSelectedRoleId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    const fetchRoles = async () => {
      try {
        const res = await staffAPI.getRoles();
        const data = Array.isArray(res.data) ? res.data : res.data.results || [];
        setRoles(data);
      } catch (err) {
        console.error('Failed to load roles:', err);
      }
    };
    fetchRoles();
  }, [isOpen]);

  if (!isOpen || !staff) return null;

  const currentRoleIds = staff.roles?.map((r) => r.id) || [];
  const availableRoles = roles.filter((r) => !currentRoleIds.includes(r.id));

  const handleAssign = async () => {
    if (!selectedRoleId) {
      setError('Please select a role.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await staffAPI.assignRole(staff.id, selectedRoleId);
      onSuccess(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to assign role.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedRoleId('');
    setError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-2">Assign Role</h2>
        <p className="text-sm text-gray-600 mb-4">
          Assign a new role to <strong>{staff.full_name}</strong>.
        </p>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-3 rounded text-sm mb-4">
            {error}
          </div>
        )}

        {availableRoles.length === 0 ? (
          <p className="text-sm text-gray-500 mb-4">
            This staff member already has all available roles.
          </p>
        ) : (
          <div className="mb-4">
            <label className="label-field">Select Role</label>
            <select
              value={selectedRoleId}
              onChange={(e) => setSelectedRoleId(e.target.value)}
              className="input-field"
            >
              <option value="">Choose a role...</option>
              {availableRoles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name} (Level {r.level}){r.requires_mfa ? ' · MFA required' : ''}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={handleAssign}
            disabled={loading || !selectedRoleId}
            className="flex-1 bg-primary-900 hover:bg-primary-800 text-white font-semibold py-2.5 px-4 rounded-lg transition disabled:opacity-50"
          >
            {loading ? 'Assigning...' : 'Assign Role'}
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

export default AssignRoleModal;