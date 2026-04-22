import { Battery, BatteryCharging, FlaskConical } from 'lucide-react';

const BatteryCard = ({ battery, onStatusChange, onTest }) => {
  const latestMeasurement = battery.measurements[battery.measurements.length - 1];

  const getStatusColor = () => {
    switch (battery.status) {
      case 'disponible': return 'text-[#7C3AED]';
      case 'en_uso': return 'text-yellow-400';
      case 'cargando': return 'text-[#3B82F6]';
      case 'deshabilitada': return 'text-[#6B7280]';
      default: return 'text-[#9CA3AF]';
    }
  };

  const getStatusDot = () => {
    switch (battery.status) {
      case 'disponible': return 'bg-[#7C3AED]';
      case 'en_uso': return 'bg-yellow-400';
      case 'cargando': return 'bg-[#3B82F6]';
      case 'deshabilitada': return 'bg-[#6B7280]';
      default: return 'bg-[#9CA3AF]';
    }
  };

  const getStatusLabel = () => {
    switch (battery.status) {
      case 'disponible': return 'Disponible';
      case 'en_uso': return 'En uso';
      case 'cargando': return 'Cargando';
      case 'deshabilitada': return 'Deshabilitada';
      default: return 'Desconocido';
    }
  };

  const getBadgeClass = (status) => {
    switch (status) {
      case 'Good': return 'bg-[#7C3AED]/20 text-[#A78BFA] border border-[#7C3AED]/30';
      case 'Fair': return 'bg-[#A78BFA]/20 text-[#A78BFA] border border-[#A78BFA]/30';
      case 'Bad': return 'bg-red-500/20 text-red-400 border border-red-500/30';
      default: return 'bg-[#6B7280]/20 text-[#9CA3AF] border border-[#6B7280]/30';
    }
  };

  const getHealthBarColor = () => {
    if (battery.healthScore >= 70) return 'bg-gradient-to-r from-[#A78BFA] to-[#7C3AED]';
    if (battery.healthScore >= 40) return 'bg-gradient-to-r from-yellow-400 to-orange-400';
    return 'bg-gradient-to-r from-red-500 to-red-600';
  };

  return (
    <div 
      className="bg-[#1A1A22] border border-[#272732] rounded-2xl p-6 battery-card relative overflow-hidden"
      data-testid={`battery-card-${battery.id}`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-[#7C3AED]/10 flex items-center justify-center">
            {battery.status === 'cargando' ? (
              <BatteryCharging className="w-6 h-6 text-[#3B82F6]" />
            ) : (
              <Battery className="w-6 h-6 text-[#7C3AED]" />
            )}
          </div>
          <h3 className="text-2xl font-bold text-white" style={{ fontFamily: 'Outfit, sans-serif' }}>
            {battery.id}
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${getStatusDot()}`}></div>
          <span className={`text-sm font-medium ${getStatusColor()}`}>{getStatusLabel()}</span>
        </div>
      </div>

      {latestMeasurement ? (
        <div className="space-y-3 mb-4">
          <div>
            <div className="text-4xl md:text-5xl font-bold text-white mb-1" style={{ fontFamily: 'Outfit, sans-serif' }}>
              {latestMeasurement.soc}%
            </div>
            <div className="text-xs text-[#9CA3AF] uppercase tracking-wider">State of Charge</div>
          </div>
          
          <div className="flex items-center justify-between text-sm">
            <span className="text-[#9CA3AF]">Resistencia:</span>
            <span className="text-white font-semibold">{latestMeasurement.resistance} mΩ</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-[#9CA3AF]">Status:</span>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getBadgeClass(latestMeasurement.batteryStatus)}`}>
              {latestMeasurement.batteryStatus}
            </span>
          </div>
        </div>
      ) : (
        <div className="mb-4 py-8 text-center">
          <p className="text-[#6B7280] text-sm">Sin mediciones</p>
        </div>
      )}

      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-[#9CA3AF]">Health Score</span>
          <span className="text-lg font-bold text-white">{battery.healthScore}/100</span>
        </div>
        <div className="w-full h-3 bg-[#272732] rounded-full overflow-hidden">
          <div 
            className={`h-full ${getHealthBarColor()} health-bar-fill rounded-full`}
            style={{ width: `${battery.healthScore}%` }}
          ></div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <button
          onClick={() => onStatusChange(battery.id, 'en_uso')}
          disabled={battery.status === 'deshabilitada'}
          data-testid={`use-btn-${battery.id}`}
          className="bg-[#7C3AED] hover:bg-[#6D28D9] disabled:bg-[#374151] disabled:cursor-not-allowed text-white px-3 py-2 rounded-xl btn-scale text-sm font-medium"
        >
          Usar
        </button>
        <button
          onClick={() => onStatusChange(battery.id, 'cargando')}
          disabled={battery.status === 'deshabilitada'}
          data-testid={`charge-btn-${battery.id}`}
          className="border border-[#7C3AED] text-[#A78BFA] hover:bg-[#7C3AED]/10 disabled:border-[#374151] disabled:text-[#6B7280] disabled:cursor-not-allowed px-3 py-2 rounded-xl btn-scale text-sm font-medium"
        >
          Cargar
        </button>
        <button
          onClick={() => onTest(battery)}
          data-testid={`test-btn-${battery.id}`}
          className="bg-[#0F0F14] border border-[#272732] hover:border-[#7C3AED]/50 text-gray-300 px-3 py-2 rounded-xl btn-scale text-sm font-medium flex items-center justify-center gap-1"
        >
          <FlaskConical className="w-4 h-4" />
          <span>Test</span>
        </button>
      </div>
    </div>
  );
};

export default BatteryCard;
