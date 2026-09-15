import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { studentsAPI } from '../../api/students';

const Form = ({ mode }) => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = mode === 'edit';

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    admission_number: '',
    date_of_birth: '',
    gender: 'male',
    school_class: '',
    address: '',
    enrollment_date: new Date().toISOString().split('T')[0],
  });

  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [generalError, setGeneralError] = useState('');
  const [tempPassword, setTempPassword] = useState(null);
  const [createdStudent, setCreatedStudent] = useState(null);

  // Fetch classes for dropdown
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const res = await studentsAPI.getClasses();
        const data = Array.isArray(res.data) ? res.data : res.data.results || [];
        setClasses(data);
      } catch (err) {
        console.error('Failed to load classes:', err);
      }
    };
    fetchClasses();
  }, []);

  // Load student if editing
  useEffect(() => {
    if (!isEdit) return;
    const fetchStudent = async () => {
      try {
        const res = await studentsAPI.get(id);
        const s = res.data;
        setFormData({
          first_name: s.first_name || '',
          last_name: s.last_name || '',
          admission_number: s.admission_number || '',
          date_of_birth: s.date_of_birth || '',
          gender: s.gender || 'male',
          school_class: s.school_class || '',
          address: s.address || '',
          enrollment_date: s.enrollment_date || '',
        });
      } catch (err) {
        setGeneralError('Failed to load student.');
      } finally {
        setLoading(false);
      }
    };
    fetchStudent();
  }, [id, isEdit]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setGeneralError('');
    setSubmitting(true);

    try {
      const payload = { ...formData };
      if (!payload.school_class) payload.school_class = null;
      if (!payload.address) payload.address = '';

      if (isEdit) {
        await studentsAPI.update(id, payload);
        navigate(`/students/${id}`);
      } else {
        const res = await studentsAPI.create(payload);
        setCreatedStudent(res.data);
        setTempPassword(res.data.temporary_password);
      }
    } catch (err) {
      const data = err.response?.data;
      if (typeof data === 'object' && !data.error) {
        setErrors(data);
      } else {
        setGeneralError(data?.error || 'Failed to save student.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Success screen after creating
  if (tempPassword) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Student Created</h1>
          <p className="text-gray-600 mb-6">
            <strong>{createdStudent?.full_name}</strong> has been added successfully.
          </p>

          <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded text-left mb-6">
            <p className="text-sm font-semibold text-amber-800 mb-2">
              ⚠️ Save this temporary password now — it won't be shown again
            </p>
            <div className="flex items-center gap-3 bg-white border border-amber-200 rounded-lg p-3">
              <code className="flex-1 text-lg font-mono text-gray-900 select-all">
                {tempPassword}
              </code>
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
              Share this with the student. They will be required to change it on their first login.
            </p>
          </div>

          <div className="flex gap-3 justify-center">
            <Link
              to={`/students/${createdStudent?.id}`}
              className="bg-primary-900 hover:bg-primary-800 text-white font-semibold py-2.5 px-6 rounded-lg transition"
            >
              View Student →
            </Link>
            <button
              onClick={() => {
                setTempPassword(null);
                setCreatedStudent(null);
                setFormData({
                  first_name: '',
                  last_name: '',
                  admission_number: '',
                  date_of_birth: '',
                  gender: 'male',
                  school_class: '',
                  address: '',
                  enrollment_date: new Date().toISOString().split('T')[0],
                });
              }}
              className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium py-2.5 px-6 rounded-lg transition"
            >
              Add Another
            </button>
            <Link
              to="/students"
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
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link to="/students" className="hover:text-primary-900">Students</Link>
        <span>/</span>
        <span className="text-gray-900 font-medium">{isEdit ? 'Edit' : 'Add New'}</span>
      </div>

      <h1 className="text-2xl font-bold text-gray-900">
        {isEdit ? 'Edit Student' : 'Add New Student'}
      </h1>

      {generalError && (
        <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded text-sm">
          {generalError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label-field">First Name *</label>
            <input
              type="text"
              name="first_name"
              value={formData.first_name}
              onChange={handleChange}
              required
              className="input-field"
            />
            {errors.first_name && <p className="text-red-600 text-xs mt-1">{errors.first_name}</p>}
          </div>

          <div>
            <label className="label-field">Last Name *</label>
            <input
              type="text"
              name="last_name"
              value={formData.last_name}
              onChange={handleChange}
              required
              className="input-field"
            />
            {errors.last_name && <p className="text-red-600 text-xs mt-1">{errors.last_name}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label-field">Admission Number *</label>
            <input
              type="text"
              name="admission_number"
              value={formData.admission_number}
              onChange={handleChange}
              required
              disabled={isEdit}
              className="input-field disabled:bg-gray-50 disabled:cursor-not-allowed"
              placeholder="e.g. AR-2026-002"
            />
            {isEdit && (
              <p className="text-xs text-gray-500 mt-1">Admission number cannot be changed.</p>
            )}
            {errors.admission_number && <p className="text-red-600 text-xs mt-1">{errors.admission_number}</p>}
          </div>

          <div>
            <label className="label-field">Date of Birth *</label>
            <input
              type="date"
              name="date_of_birth"
              value={formData.date_of_birth}
              onChange={handleChange}
              required
              className="input-field"
            />
            {errors.date_of_birth && <p className="text-red-600 text-xs mt-1">{errors.date_of_birth}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label-field">Gender *</label>
            <select
              name="gender"
              value={formData.gender}
              onChange={handleChange}
              required
              className="input-field"
            >
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="label-field">Class</label>
            <select
              name="school_class"
              value={formData.school_class}
              onChange={handleChange}
              className="input-field"
            >
              <option value="">Not assigned yet</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.academic_year})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="label-field">Address</label>
          <textarea
            name="address"
            value={formData.address}
            onChange={handleChange}
            rows={2}
            className="input-field"
            placeholder="Optional"
          />
        </div>

        <div>
          <label className="label-field">Enrollment Date</label>
          <input
            type="date"
            name="enrollment_date"
            value={formData.enrollment_date}
            onChange={handleChange}
            className="input-field"
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={submitting}
            className="btn-primary"
          >
            {submitting ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Student'}
          </button>
          <Link
            to={isEdit ? `/students/${id}` : '/students'}
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