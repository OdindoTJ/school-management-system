import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { staffAPI } from '../../api/staffMembers';

const Form = ({ mode }) => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = mode === 'edit';

  const [formData, setFormData] = useState({
    full_name: '',
    staff_id: '',
    email: '',
    phone: '',
    national_id: '',
    date_of_birth: '',
    date_hired: new Date().toISOString().split('T')[0],
    employment_type: 'permanent',
    contract_end_date: '',
    access_review_date: '',
  });

  const [roles, setRoles] = useState([]);
  const [selectedRoles, setSelectedRoles] = useState([]);
  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [generalError, setGeneralError] = useState('');
  const [tempPassword, setTempPassword] = useState(null);
  const [createdStaff, setCreatedStaff] = useState(null);

  useEffect(() => {
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
  }, []);

  useEffect(() => {
    if (!isEdit) return;
    const fetchStaff = async () => {
      try {
        const res = await staffAPI.getStaffMember(id);
        const s = res.data;
        setFormData({
          full_name: s.full_name || '',
          staff_id: s.staff_id || '',
          email: s.email || '',
          phone: s.phone || '',
          national_id: s.national_id || '',
          date_of_birth: s.date_of_birth || '',
          date_hired: s.date_hired || '',
          employment_type: s.employment_type || 'permanent',
          contract_end_date: s.contract_end_date || '',
          access_review_date: s.access_review_date || '',
        });
      } catch (err) {
        setGeneralError('Failed to load staff member.');
      } finally {
        setLoading(false);
      }
    };
    fetchStaff();
  }, [id, isEdit]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: '' });
  };

  const handleRoleToggle = (roleId) => {
    setSelectedRoles((prev) =>
      prev.includes(roleId) ? prev.filter((x) => x !== roleId) : [...prev, roleId]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setGeneralError('');
    setSubmitting(true);

    try {
      if (isEdit) {
        const payload = { ...formData };
        if (!payload.contract_end_date) payload.contract_end_date = null;
        if (!payload.access_review_date) payload.access_review_date = null;
        if (!payload.date_of_birth) payload.date_of_birth = null;
        delete payload.email;
        delete payload.staff_id;

        await staffAPI.updateStaffMember(id, payload);
        navigate(`/staff/${id}`);
      } else {
        const payload = {
          ...formData,
          role_ids: selectedRoles,
        };
        if (!payload.contract_end_date) delete payload.contract_end_date;
        if (!payload.access_review_date) delete payload.access_review_date;
        if (!payload.date_of_birth) delete payload.date_of_birth;

        const res = await staffAPI.createStaffMember(payload);
        setCreatedStaff(res.data);
        setTempPassword(res.data.temporary_password);
      }
    } catch (err) {
      const data = err.response?.data;
      if (typeof data === 'object' && !data.error) {
        setErrors(data);
      } else {
        setGeneralError(data?.error || 'Failed to save staff member.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Success screen
  if (tempPassword) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Staff Member Created</h1>
          <p className="text-gray-600 mb-6">
            <strong>{createdStaff?.full_name}</strong> has been added successfully.
          </p>

          <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded text-left mb-6">
            <p className="text-sm font-semibold text-amber-800 mb-2">
              ⚠️ Save this temporary password now — it won't be shown again
            </p>
            <div className="flex items-center gap-3 bg-white border border-amber-200 rounded-lg p-3">
              <code className="flex-1 text-lg font-mono text-gray-900 select-all">{tempPassword}</code>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(tempPassword);
                  alert('Copied!');
                }}
                className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium rounded"
              >
                Copy
              </button>
            </div>
            <p className="text-xs text-amber-700 mt-3">
              Share this with the staff member. They will be required to change it on their first login.
            </p>
          </div>

          <div className="flex gap-3 justify-center">
            <Link
              to={`/staff/${createdStaff?.id}`}
              className="bg-primary-900 hover:bg-primary-800 text-white font-semibold py-2.5 px-6 rounded-lg transition"
            >
              View Staff Member →
            </Link>
            <Link
              to="/staff"
              className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium py-2.5 px-6 rounded-lg transition"
            >
              Back to List
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-10 h-10 border-4 border-primary-900 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link to="/staff" className="hover:text-primary-900">Staff</Link>
        <span>/</span>
        <span className="text-gray-900 font-medium">{isEdit ? 'Edit' : 'Add New'}</span>
      </div>

      <h1 className="text-2xl font-bold text-gray-900">
        {isEdit ? 'Edit Staff Member' : 'Add New Staff Member'}
      </h1>

      {generalError && (
        <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded text-sm">
          {generalError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label-field">Full Name *</label>
            <input
              type="text"
              name="full_name"
              value={formData.full_name}
              onChange={handleChange}
              required
              className="input-field"
            />
            {errors.full_name && <p className="text-red-600 text-xs mt-1">{errors.full_name}</p>}
          </div>

          <div>
            <label className="label-field">Staff ID *</label>
            <input
              type="text"
              name="staff_id"
              value={formData.staff_id}
              onChange={handleChange}
              required
              disabled={isEdit}
              className="input-field disabled:bg-gray-50 disabled:cursor-not-allowed"
              placeholder="e.g. STAFF-2026-005"
            />
            {isEdit && <p className="text-xs text-gray-500 mt-1">Staff ID cannot be changed.</p>}
            {errors.staff_id && <p className="text-red-600 text-xs mt-1">{errors.staff_id}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label-field">Email *</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              disabled={isEdit}
              className="input-field disabled:bg-gray-50 disabled:cursor-not-allowed"
              placeholder="staff@arinaschool.com"
            />
            {isEdit && <p className="text-xs text-gray-500 mt-1">Email is the login identifier and cannot be changed.</p>}
            {errors.email && <p className="text-red-600 text-xs mt-1">{errors.email}</p>}
          </div>

          <div>
            <label className="label-field">Phone</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="input-field"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label-field">National ID</label>
            <input
              type="text"
              name="national_id"
              value={formData.national_id}
              onChange={handleChange}
              className="input-field"
            />
          </div>

          <div>
            <label className="label-field">Date of Birth</label>
            <input
              type="date"
              name="date_of_birth"
              value={formData.date_of_birth}
              onChange={handleChange}
              className="input-field"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label-field">Date Hired *</label>
            <input
              type="date"
              name="date_hired"
              value={formData.date_hired}
              onChange={handleChange}
              required
              className="input-field"
            />
          </div>

          <div>
            <label className="label-field">Employment Type *</label>
            <select
              name="employment_type"
              value={formData.employment_type}
              onChange={handleChange}
              required
              className="input-field"
            >
              <option value="permanent">Permanent</option>
              <option value="contract">Contract</option>
              <option value="intern">Intern</option>
              <option value="part_time">Part-Time</option>
              <option value="volunteer">Volunteer</option>
            </select>
          </div>
        </div>

        {formData.employment_type === 'contract' && (
          <div>
            <label className="label-field">Contract End Date *</label>
            <input
              type="date"
              name="contract_end_date"
              value={formData.contract_end_date}
              onChange={handleChange}
              required
              className="input-field"
            />
            {errors.contract_end_date && <p className="text-red-600 text-xs mt-1">{errors.contract_end_date}</p>}
          </div>
        )}

        <div>
          <label className="label-field">Access Review Date (optional)</label>
          <input
            type="date"
            name="access_review_date"
            value={formData.access_review_date}
            onChange={handleChange}
            className="input-field"
          />
        </div>

        {!isEdit && (
          <div>
            <label className="label-field">Initial Roles (optional)</label>
            <p className="text-xs text-gray-500 mb-3">
              Assign roles now, or leave empty and assign later. New staff with no roles cannot access the portal.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {roles.map((r) => (
                <label
                  key={r.id}
                  className={`flex items-center gap-2 p-3 border rounded-lg cursor-pointer transition ${
                    selectedRoles.includes(r.id)
                      ? 'border-primary-900 bg-primary-50'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedRoles.includes(r.id)}
                    onChange={() => handleRoleToggle(r.id)}
                    className="w-4 h-4 text-primary-900 focus:ring-primary-900 border-gray-300 rounded"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{r.name}</p>
                    {r.requires_mfa && (
                      <p className="text-xs text-purple-600">MFA required</p>
                    )}
                  </div>
                </label>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={submitting} className="btn-primary">
            {submitting ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Staff Member'}
          </button>
          <Link
            to={isEdit ? `/staff/${id}` : '/staff'}
            className="px-6 py-3 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition font-medium"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
};

export default Form;