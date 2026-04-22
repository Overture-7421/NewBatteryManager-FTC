import { useState } from 'react';
import { X } from 'lucide-react';

const AddBatteryModal = ({ onClose, onAdd, existingIds }) => {
  const [batteryId, setBatteryId] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!batteryId.trim()) {
      setError('El ID es requerido');
      return;
    }

    if (existingIds.includes(batteryId.trim())) {
      setError('Este ID ya existe');
      return;
    }

    onAdd(batteryId.trim());
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div 
        className="bg-[#1A1A22] border border-[#272732] rounded-2xl p-6 w-full max-w-md shadow-2xl relative fade-in"
        onClick={(e) => e.stopPropagation()}
        data-testid="add-battery-modal"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#9CA3AF] hover:text-white transition-colors"
          data-testid="close-modal-btn"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-2xl font-bold text-white mb-6" style={{ fontFamily: 'Outfit, sans-serif' }}>
          Agregar Batería
        </h2>

        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label className="block text-sm font-medium text-[#9CA3AF] mb-2">
              ID de Batería (ej: B1, B2...)
            </label>
            <input
              type="text"
              value={batteryId}
              onChange={(e) => {
                setBatteryId(e.target.value);
                setError('');
              }}
              placeholder="B1"
              data-testid="battery-id-input"
              className="w-full bg-[#0F0F14] border border-[#272732] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#7C3AED] focus:ring-1 focus:ring-[#7C3AED] transition-all"
            />
            {error && (
              <p className="text-red-400 text-sm mt-2" data-testid="error-message">{error}</p>
            )}
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-[#272732] text-[#9CA3AF] hover:bg-[#252530] px-4 py-3 rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              data-testid="save-battery-btn"
              className="flex-1 bg-[#7C3AED] hover:bg-[#6D28D9] text-white px-4 py-3 rounded-xl btn-scale glow-purple font-medium"
            >
              Guardar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddBatteryModal;
