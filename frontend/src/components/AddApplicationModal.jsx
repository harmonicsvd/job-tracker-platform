import { useState } from 'react';

const statusOptions = ['Applied', 'Interviewing', 'Offer', 'Rejected', 'Withdrawn'];

export default function AddApplicationModal({ isOpen, onClose, onAdd }) {
  const [formData, setFormData] = useState({
    company: '',
    role: '',
    status: 'Applied',
    application_date: new Date().toISOString().split('T')[0],
  });

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onAdd(formData);
    onClose();
    // Reset form
    setFormData({
      company: '',
      role: '',
      status: 'Applied',
      application_date: new Date().toISOString().split('T')[0],
    });
  };

  const handleCancel = () => {
    onClose();
    // Reset form
    setFormData({
      company: '',
      role: '',
      status: 'Applied',
      application_date: new Date().toISOString().split('T')[0],
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div 
        className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#DDE2DA]">
          <h2 className="text-xl font-bold font-display text-text">Add Application</h2>
          <button 
            onClick={onClose}
            className="text-text-light hover:text-text transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-text mb-1">Company</label>
            <input
              type="text"
              required
              value={formData.company}
              onChange={(e) => setFormData({ ...formData, company: e.target.value })}
              className="w-full px-3 py-2 border border-[#DDE2DA] rounded-md focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-1"
              placeholder="e.g., Lio"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text mb-1">Role</label>
            <input
              type="text"
              required
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="w-full px-3 py-2 border border-[#DDE2DA] rounded-md focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-1"
              placeholder="e.g., Forward Deployed Engineer"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text mb-1">Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-3 py-2 border border-[#DDE2DA] rounded-md focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-1"
            >
              {statusOptions.map((status) => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-text mb-1">Application Date</label>
            <input
              type="date"
              required
              value={formData.application_date}
              onChange={(e) => setFormData({ ...formData, application_date: e.target.value })}
              className="w-full px-3 py-2 border border-[#DDE2DA] rounded-md focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-1"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2 text-sm font-medium text-text-light hover:text-text transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-accent text-white text-sm font-medium rounded-md hover:bg-accent/90 transition-colors"
            >
              Add Application
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}