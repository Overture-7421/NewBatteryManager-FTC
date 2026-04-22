import { useState } from 'react';
import { X } from 'lucide-react';
import { getStatusFromInternalResistance } from '../utils/batteryUtils.js';

const TestModal = ({ isOpen, battery, onClose }) => {
  const [testData, setTestData] = useState({
    openCircuitVoltage: '',
    loadVoltage: '',
    internalResistance: '',
    stateOfCharge: '',
  });

  const hasResistanceValue = String(testData.internalResistance).trim() !== '';
  const derivedStatus = hasResistanceValue
    ? getStatusFromInternalResistance(testData.internalResistance)
    : 'Pending';

  const handleSubmit = (e) => {
    e.preventDefault();
    if (battery) {
      const measurements = battery.measurements || [];
      measurements.push({
        ...testData,
        openCircuitVoltage:
          testData.openCircuitVoltage === '' ? null : parseFloat(testData.openCircuitVoltage),
        loadVoltage:
          testData.loadVoltage === '' ? null : parseFloat(testData.loadVoltage),
        internalResistance: parseFloat(testData.internalResistance),
        stateOfCharge: parseFloat(testData.stateOfCharge),
        status: getStatusFromInternalResistance(testData.internalResistance),
        timestamp: new Date().toISOString(),
      });
      const updated = { ...battery, measurements };
      localStorage.setItem('batteries', JSON.stringify(
        JSON.parse(localStorage.getItem('batteries') || '[]').map(b => 
          b.id === battery.id ? updated : b
        )
      ));
      onClose();
    }
  };

  if (!isOpen || !battery) return null;
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-[#1A1A22] border border-[#272732] rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Battery Info</h2>
          <button onClick={onClose} className="text-[#9CA3AF] hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="number"
            step="0.01"
            placeholder="Open-circuit voltage (V_oc)"
            value={testData.openCircuitVoltage}
            onChange={(e) => setTestData({ ...testData, openCircuitVoltage: e.target.value })}
            className="w-full bg-[#252530] border border-[#3A3A42] rounded px-3 py-2 text-white placeholder-[#9CA3AF] focus:outline-none focus:border-[#7C3AED]"
          />
          <input
            type="number"
            step="0.01"
            placeholder="Load voltage (V_load)"
            value={testData.loadVoltage}
            onChange={(e) => setTestData({ ...testData, loadVoltage: e.target.value })}
            className="w-full bg-[#252530] border border-[#3A3A42] rounded px-3 py-2 text-white placeholder-[#9CA3AF] focus:outline-none focus:border-[#7C3AED]"
          />
          <input
            type="number"
            step="0.01"
            placeholder="Resistencia interna (mΩ u Ω, ej: 15 o 0.015)"
            value={testData.internalResistance}
            onChange={(e) => setTestData({ ...testData, internalResistance: e.target.value })}
            className="w-full bg-[#252530] border border-[#3A3A42] rounded px-3 py-2 text-white placeholder-[#9CA3AF] focus:outline-none focus:border-[#7C3AED]"
            required
          />
          <div>
            <label className="block text-sm text-[#9CA3AF] mb-1">Status (auto por resistencia)</label>
            <input
              type="text"
              value={derivedStatus}
              readOnly
              className="w-full bg-[#1F1F28] border border-[#3A3A42] rounded px-3 py-2 text-white"
            />
          </div>
          <input
            type="number"
            step="0.1"
            placeholder="State of Charge (SOC %)"
            value={testData.stateOfCharge}
            onChange={(e) => setTestData({ ...testData, stateOfCharge: e.target.value })}
            className="w-full bg-[#252530] border border-[#3A3A42] rounded px-3 py-2 text-white placeholder-[#9CA3AF] focus:outline-none focus:border-[#7C3AED]"
            required
          />
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
              Guardar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TestModal;
