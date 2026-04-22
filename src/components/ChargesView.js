import { useState, useEffect } from 'react';
import { BatteryCharging, Clock, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

const ChargesView = () => {
  const [batteries, setBatteries] = useState([]);

  useEffect(() => {
    loadBatteries();
    const interval = setInterval(loadBatteries, 30000); // Update every 30s
    return () => clearInterval(interval);
  }, []);

  const loadBatteries = () => {
    const stored = localStorage.getItem('ftc_batteries');
    if (stored) {
      setBatteries(JSON.parse(stored));
    }
  };

  const getTimeSince = (timestamp) => {
    const minutes = Math.floor((Date.now() - new Date(timestamp).getTime()) / 60000);
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}min`;
  };

  const finishCharging = (batteryId) => {
    const updated = batteries.map(b => {
      if (b.id === batteryId) {
        const updatedChargeHistory = b.chargeHistory.map((charge, idx) => {
          if (idx === b.chargeHistory.length - 1 && !charge.endTime) {
            return { ...charge, endTime: new Date().toISOString() };
          }
          return charge;
        });
        return { ...b, status: 'disponible', chargeHistory: updatedChargeHistory };
      }
      return b;
    });
    localStorage.setItem('ftc_batteries', JSON.stringify(updated));
    setBatteries(updated);
    toast.success(`${batteryId} carga completada`);
  };

  const chargingBatteries = batteries.filter(b => b.status === 'cargando');
  const restingBatteries = batteries.filter(b => {
    if (b.chargeHistory.length === 0) return false;
    const lastCharge = b.chargeHistory[b.chargeHistory.length - 1];
    if (!lastCharge.endTime) return false;
    const timeSince = (Date.now() - new Date(lastCharge.endTime).getTime()) / 60000;
    return timeSince < 15 && b.status === 'disponible';
  });
  const needsChargeBatteries = batteries.filter(b => {
    if (b.measurements.length === 0) return false;
    const lastMeasurement = b.measurements[b.measurements.length - 1];
    return lastMeasurement.soc < 90 && b.status !== 'cargando' && b.healthScore >= 40;
  });

  return (
    <div className="fade-in">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <BatteryCharging className="w-8 h-8 text-[#3B82F6]" />
          <h1 className="text-3xl md:text-4xl font-bold text-white" style={{ fontFamily: 'Outfit, sans-serif' }}>
            Cargas
          </h1>
        </div>
        <p className="text-[#9CA3AF]">Gestión de carga y reposo de baterías</p>
      </div>

      <div className="space-y-6">
        {chargingBatteries.length > 0 && (
          <div className="bg-[#1A1A22] border border-[#272732] rounded-2xl p-6">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <BatteryCharging className="w-5 h-5 text-[#3B82F6]" />
              Cargando
            </h2>
            <div className="space-y-3">
              {chargingBatteries.map(battery => {
                const lastCharge = battery.chargeHistory[battery.chargeHistory.length - 1];
                return (
                  <div 
                    key={battery.id}
                    className="flex items-center justify-between p-4 bg-[#0F0F14] border-l-4 border-[#3B82F6] rounded-xl"
                    data-testid={`charging-${battery.id}`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-[#3B82F6]/10 flex items-center justify-center">
                        <BatteryCharging className="w-6 h-6 text-[#3B82F6]" />
                      </div>
                      <div>
                        <div className="text-lg font-bold text-white">{battery.id}</div>
                        <div className="text-sm text-[#9CA3AF] flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          {getTimeSince(lastCharge.startTime)}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => finishCharging(battery.id)}
                      data-testid={`finish-charging-${battery.id}`}
                      className="bg-[#7C3AED] hover:bg-[#6D28D9] text-white px-4 py-2 rounded-xl btn-scale font-medium"
                    >
                      Finalizar Carga
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {restingBatteries.length > 0 && (
          <div className="bg-[#1A1A22] border border-[#272732] rounded-2xl p-6">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-[#A78BFA]" />
              Reposando
            </h2>
            <div className="space-y-3">
              {restingBatteries.map(battery => {
                const lastCharge = battery.chargeHistory[battery.chargeHistory.length - 1];
                const timeSince = Math.floor((Date.now() - new Date(lastCharge.endTime).getTime()) / 60000);
                const timeRemaining = 15 - timeSince;
                return (
                  <div 
                    key={battery.id}
                    className="flex items-center justify-between p-4 bg-[#0F0F14] border-l-4 border-[#A78BFA] rounded-xl"
                    data-testid={`resting-${battery.id}`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-[#A78BFA]/10 flex items-center justify-center">
                        <Clock className="w-6 h-6 text-[#A78BFA]" />
                      </div>
                      <div>
                        <div className="text-lg font-bold text-white">{battery.id}</div>
                        <div className="text-sm text-[#9CA3AF]">
                          {timeSince} / 15 min recomendados
                        </div>
                      </div>
                    </div>
                    <div className="text-[#A78BFA] font-medium">
                      ~{timeRemaining} min restantes
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {needsChargeBatteries.length > 0 && (
          <div className="bg-[#1A1A22] border border-[#272732] rounded-2xl p-6">
            <h2 className="text-xl font-bold text-white mb-4">Necesitan carga</h2>
            <div className="space-y-3">
              {needsChargeBatteries.map(battery => {
                const lastMeasurement = battery.measurements[battery.measurements.length - 1];
                return (
                  <div 
                    key={battery.id}
                    className="flex items-center justify-between p-4 bg-[#0F0F14] border border-[#272732] rounded-xl"
                    data-testid={`needs-charge-${battery.id}`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-yellow-500/10 flex items-center justify-center">
                        <BatteryCharging className="w-6 h-6 text-yellow-400" />
                      </div>
                      <div>
                        <div className="text-lg font-bold text-white">{battery.id}</div>
                        <div className="text-sm text-[#9CA3AF]">
                          SOC: {lastMeasurement.soc}%
                        </div>
                      </div>
                    </div>
                    <span className="text-yellow-400 text-sm font-medium">Baja carga</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {chargingBatteries.length === 0 && restingBatteries.length === 0 && needsChargeBatteries.length === 0 && (
          <div className="text-center py-20">
            <CheckCircle className="w-16 h-16 text-[#7C3AED] mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-[#9CA3AF] mb-2">Todas las baterías en orden</h2>
            <p className="text-[#6B7280]">No hay baterías cargando o que requieran atención</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChargesView;
