import { useState } from 'react';
import { X } from 'lucide-react';

const AddBatteryModal = ({ isOpen, onClose, onAdd, statusOptions }) => {
  const [formData, setFormData] = useState({
    name: '',
    status: 'disponible',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onAdd(formData);
    setFormData({
      name: '',
      status: 'disponible',
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-[#1A1A22] border border-[#272732] rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Add Battery</h2>
          <button onClick={onClose} className="text-[#9CA3AF] hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Battery Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full bg-[#252530] border border-[#3A3A42] rounded px-3 py-2 text-white placeholder-[#9CA3AF] focus:outline-none focus:border-[#7C3AED]"
            required
          />
          <select
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            className="w-full bg-[#252530] border border-[#3A3A42] rounded px-3 py-2 text-white focus:outline-none focus:border-[#7C3AED]"
          >
            {(statusOptions || []).map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <div className="flex gap-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-[#252530] hover:bg-[#2a2a32] text-white py-2 rounded transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary flex-1 text-white py-2 rounded transition"
            >
              Add
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddBatteryModal;
