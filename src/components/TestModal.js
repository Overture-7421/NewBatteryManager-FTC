import { useState } from 'react';
import { X } from 'lucide-react';

const TestModal = ({ battery, onClose, onSave }) => {
  const [soc, setSoc] = useState('');
  const [resistance, setResistance] = useState('');
  const [batteryStatus, setBatteryStatus] = useState('Good');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!soc || !resistance) {
      setError('Todos los campos son requeridos');
      return;
    }

    const socNum = parseFloat(soc);
    const resistanceNum = parseFloat(resistance);

    if (isNaN(socNum) || isNaN(resistanceNum)) {
      setError('Los valores deben ser numéricos');
      return;
    }

    onSave(battery.id, {
      soc: socNum,
      resistance: resistanceNum,
      batteryStatus,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div 
        className="bg-[#1A1A22] border border-[#272732] rounded-2xl p-6 w-full max-w-md shadow-2xl relative fade-in"
        onClick={(e) => e.stopPropagation()}
        data-testid="test-modal"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#9CA3AF] hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-2xl font-bold text-white mb-2" style={{ fontFamily: 'Outfit, sans-serif' }}>
          Registrar Test - {battery.id}
        </h2>
        <p className="text-[#9CA3AF] text-sm mb-6">Battery Beak Measurement</p>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-[#9CA3AF] mb-2">
                SOC (%)
              </label>
              <input
                type="number"
                step="0.1"
                value={soc}
                onChange={(e) => {
                  setSoc(e.target.value);
                  setError('');
                }}
                placeholder="105"
                data-testid="soc-input"
                className="w-full bg-[#0F0F14] border border-[#272732] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#7C3AED] focus:ring-1 focus:ring-[#7C3AED] transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#9CA3AF] mb-2">
                Resistencia (mΩ)
              </label>
              <input
                type="number"
                step="0.1"
                value={resistance}
                onChange={(e) => {
                  setResistance(e.target.value);
                  setError('');
                }}
                placeholder="14"
                data-testid="resistance-input"
                className="w-full bg-[#0F0F14] border border-[#272732] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#7C3AED] focus:ring-1 focus:ring-[#7C3AED] transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#9CA3AF] mb-2">
                Status
              </label>
              <select
                value={batteryStatus}
                onChange={(e) => setBatteryStatus(e.target.value)}
                data-testid="status-select"
                className="w-full bg-[#0F0F14] border border-[#272732] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#7C3AED] focus:ring-1 focus:ring-[#7C3AED] transition-all"
              >
                <option value="Good">Good</option>
                <option value="Fair">Fair</option>
                <option value="Bad">Bad</option>
              </select>
            </div>
          </div>

          {error && (
            <p className="text-red-400 text-sm mb-4" data-testid="error-message">{error}</p>
          )}

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
              data-testid="save-test-btn"
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

export default TestModal;
