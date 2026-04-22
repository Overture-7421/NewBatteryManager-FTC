import { useState, useEffect } from 'react';
import { Plus, AlertTriangle, CheckCircle, AlertCircle, Battery } from 'lucide-react';
import BatteryCard from './BatteryCard';
import AddBatteryModal from './AddBatteryModal';
import TestModal from './TestModal';
import { calculateHealthScore, getAlerts, playAlertSound } from '../utils/batteryUtils';

const BatteriesView = () => {
  const [batteries, setBatteries] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showTestModal, setShowTestModal] = useState(false);
  const [selectedBattery, setSelectedBattery] = useState(null);
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    loadBatteries();
  }, []);

  useEffect(() => {
    const newAlerts = getAlerts(batteries);
    setAlerts(newAlerts);
    
    // Play sound if there are critical alerts
    const hasCritical = newAlerts.some(a => a.type === 'critical');
    if (hasCritical) {
      playAlertSound('critical');
    }
  }, [batteries]);

  const loadBatteries = () => {
    const stored = localStorage.getItem('ftc_batteries');
    if (stored) {
      setBatteries(JSON.parse(stored));
    }
  };

  const saveBatteries = (data) => {
    localStorage.setItem('ftc_batteries', JSON.stringify(data));
    setBatteries(data);
  };

  const addBattery = (id) => {
    const newBattery = {
      id,
      status: 'disponible',
      measurements: [],
      healthScore: 100,
      lastUsedInMatch: null,
      chargeHistory: [],
      createdAt: new Date().toISOString(),
    };
    saveBatteries([...batteries, newBattery]);
    setShowAddModal(false);
  };

  const updateBatteryStatus = (id, status) => {
    const updated = batteries.map(b => {
      if (b.id === id) {
        const updatedBattery = { ...b, status };
        if (status === 'cargando') {
          updatedBattery.chargeHistory = [
            ...b.chargeHistory,
            { startTime: new Date().toISOString(), endTime: null }
          ];
        }
        return updatedBattery;
      }
      return b;
    });
    saveBatteries(updated);
  };

  const addMeasurement = (batteryId, measurement) => {
    const updated = batteries.map(b => {
      if (b.id === batteryId) {
        const newMeasurements = [
          ...b.measurements,
          { ...measurement, date: new Date().toISOString() }
        ];
        const healthScore = calculateHealthScore(newMeasurements);
        return {
          ...b,
          measurements: newMeasurements,
          healthScore,
        };
      }
      return b;
    });
    saveBatteries(updated);
    setShowTestModal(false);
    setSelectedBattery(null);
  };

  const openTestModal = (battery) => {
    setSelectedBattery(battery);
    setShowTestModal(true);
  };

  const getAlertIcon = (type) => {
    if (type === 'critical') return <AlertTriangle className="w-4 h-4" />;
    if (type === 'success') return <CheckCircle className="w-4 h-4" />;
    return <AlertCircle className="w-4 h-4" />;
  };

  const getAlertClass = (type) => {
    if (type === 'critical') return 'bg-red-500/10 border-red-500/20 text-red-400';
    if (type === 'success') return 'bg-green-500/10 border-green-500/20 text-green-400';
    return 'bg-[#7C3AED]/10 border-[#7C3AED]/20 text-[#A78BFA]';
  };

  return (
    <div className="fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-white" style={{ fontFamily: 'Outfit, sans-serif' }}>
            Overture 23619
          </h1>
          <p className="text-[#9CA3AF] mt-1">Gestión inteligente de baterías Overture</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          data-testid="add-battery-btn"
          className="flex items-center gap-2 bg-[#7C3AED] hover:bg-[#6D28D9] text-white px-4 py-3 rounded-xl btn-scale glow-purple font-medium"
        >
          <Plus className="w-5 h-5" />
          <span className="hidden md:inline">Agregar Batería</span>
        </button>
      </div>

      {alerts.length > 0 && (
        <div className="flex flex-wrap gap-3 mb-6" data-testid="alerts-container">
          {alerts.map((alert, idx) => (
            <div
              key={idx}
              className={`flex items-center gap-2 px-4 py-2 border rounded-xl ${getAlertClass(alert.type)} fade-in`}
              data-testid={`alert-${alert.type}`}
            >
              {getAlertIcon(alert.type)}
              <span className="font-medium">{alert.message}</span>
            </div>
          ))}
        </div>
      )}

      {batteries.length === 0 ? (
        <div className="text-center py-20">
          <Battery className="w-16 h-16 text-[#7C3AED] mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-[#9CA3AF] mb-2">No hay baterías registradas</h2>
          <p className="text-[#6B7280] mb-6">Comienza agregando tu primera batería</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-[#7C3AED] hover:bg-[#6D28D9] text-white px-6 py-3 rounded-xl btn-scale glow-purple"
          >
            Agregar Primera Batería
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {batteries.map(battery => (
            <BatteryCard
              key={battery.id}
              battery={battery}
              onStatusChange={updateBatteryStatus}
              onTest={openTestModal}
            />
          ))}
        </div>
      )}

      {showAddModal && (
        <AddBatteryModal
          onClose={() => setShowAddModal(false)}
          onAdd={addBattery}
          existingIds={batteries.map(b => b.id)}
        />
      )}

      {showTestModal && selectedBattery && (
        <TestModal
          battery={selectedBattery}
          onClose={() => {
            setShowTestModal(false);
            setSelectedBattery(null);
          }}
          onSave={addMeasurement}
        />
      )}
    </div>
  );
};

export default BatteriesView;
