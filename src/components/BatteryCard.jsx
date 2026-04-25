import { useEffect, useState } from 'react';
import { Pause, Play, TrendingDown, Eye, EyeOff, Trash2, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';
import {
  calculateHealthScore,
  getBatteryChargingStatus,
  getStatusFromInternalResistance,
  classifyHealthScore,
} from '../utils/batteryUtils.js';

const hasMeasurementValue = (value) =>
  value !== null && value !== undefined && value !== '' && Number.isFinite(Number(value));

const BatteryCard = ({
  battery,
  onTest,
  onStatusChange,
  statusOptions,
  onStartCharging,
  onPauseCharging,
  onResumeCharging,
  onStopCharging,
  currentTime,
  globalShowDetails,
  hasMounted,
  canDelete,
  onDelete,
}) => {
  const [showDetails, setShowDetails] = useState(true);
  useEffect(() => {
    if (typeof globalShowDetails === 'boolean') {
      setShowDetails(globalShowDetails);
    }
  }, [globalShowDetails]);
  const health = calculateHealthScore(battery.measurements || []);
  const healthClass = classifyHealthScore(health);
  const isDoNotUse = healthClass === 'DO_NOT_USE';
  
  const latest = battery.measurements?.[battery.measurements.length - 1];
  const hasOpenCircuitVoltage = latest ? hasMeasurementValue(latest.openCircuitVoltage) : false;
  const hasLoadVoltage = latest ? hasMeasurementValue(latest.loadVoltage) : false;
  const latestAutoStatus = latest
    ? getStatusFromInternalResistance(latest.internalResistance)
    : 'Unknown';

  const lastMeasurementTime = latest?.timestamp ? new Date(latest.timestamp).getTime() : 0;
  const lastUsedTime = battery.lastUsedTime ? new Date(battery.lastUsedTime).getTime() : 0;
  const isEnUso = battery.status === 'in_use';
  const isDevueltoSinMedir = battery.status === 'available' && lastUsedTime > lastMeasurementTime;

  let displayHealth = health;
  let showRealHealth = false;
  if (isEnUso || isDevueltoSinMedir) {
    displayHealth = 0;
    showRealHealth = true;
  }
  const statusLabel = statusOptions?.find((option) => option.value === battery.status)?.label || 'Desconocido';
  const showStatusBadge = statusLabel !== 'Desconocido';
  const chargingStatus = getBatteryChargingStatus(battery, currentTime || Date.now());

  const lastUpdateTime = latest?.timestamp ? new Date(latest.timestamp).getTime() : (typeof battery.id === 'number' && battery.id > 1000000000000 ? battery.id : null);
  const ageMinutes = lastUpdateTime ? (Number(currentTime || Date.now()) - lastUpdateTime) / 60000 : 0;
  const needsUpdateWarning = ageMinutes >= 30;

  const chargingStateLabel = battery.status === 'paused' || battery.status === 'pausado'
    ? 'Paused'
    : battery.isCharging
      ? 'Charging'
      : battery.status === 'resting' || battery.status === 'descansando'
        ? 'Resting'
        : battery.status === 'in_use' || battery.status === 'en_uso'
          ? 'In Use'
          : 'Ready';
  const showChargingRow = chargingStateLabel && chargingStateLabel !== statusLabel;

  const getChargingIndicator = () => {
    if (battery.status === 'paused' || battery.status === 'pausado') return 'bg-yellow-500/10 text-yellow-300 border-yellow-500/30';
    if (battery.isCharging) return 'bg-blue-500/10 text-blue-300 border-blue-500/30';
    if (battery.status === 'resting' || battery.status === 'descansando') return 'bg-red-500/10 text-red-300 border-red-500/30';
    return 'bg-green-500/10 text-green-300 border-green-500/30';
  };


  const getElapsedMinutes = (startTime) => {
    const accumulated = (battery.chargingAccumulatedMs || 0) / 60000;
    if (!startTime) return Math.floor(accumulated);
    const diff = (Number(currentTime || Date.now()) - new Date(startTime).getTime()) / 60000;
    return Math.max(0, Math.floor(diff + accumulated));
  };

  const getRestDisplay = () => {
    const restMinutes = (battery.status === 'resting' || battery.status === 'descansando') ? (chargingStatus.restTimeMinutes || 0) : 0;
    if (restMinutes < 15) {
      return `Resting -${Math.max(0, Math.ceil(15 - restMinutes))} min`;
    }
    return `Resting ${Math.floor(restMinutes)} min`;
  };

  const getStatusStyles = (status) => {
    switch (status) {
      case 'available':
      case 'disponible':
        return 'bg-green-500/10 text-green-300 border-green-500/30';
      case 'in_use':
      case 'en_uso':
        return 'bg-yellow-500/10 text-yellow-300 border-yellow-500/30';
      case 'charging':
      case 'cargando':
        return 'bg-blue-500/10 text-blue-300 border-blue-500/30';
      case 'disabled':
      case 'deshabilitada':
        return 'bg-red-500/10 text-red-300 border-red-500/30';
      default:
        return 'bg-gray-500/10 text-gray-300 border-gray-500/30';
    }
  };

  const getHealthColor = (score) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <motion.div
      data-masonry-item
      layout="position"
      transition={hasMounted ? { type: 'spring', stiffness: 400, damping: 40 } : undefined}
      whileHover={hasMounted ? { y: -2 } : undefined}
      style={{ willChange: 'transform' }}
      className="battery-card bg-[#1A1A22] border border-[#272732] rounded-lg p-6 glow-purple"
    >
      <div data-masonry-content>
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-xl font-bold">{battery.name || 'Battery'}</h3>
          </div>
          <div className="flex items-center gap-2">
            {canDelete && (
              <button
                type="button"
                onClick={() => onDelete?.(battery.id)}
                className="rounded p-2 text-red-200 bg-red-500/10 border border-red-500/30 hover:bg-red-500/20 transition"
                aria-label={`Delete ${battery.name || 'battery'}`}
                title="Delete battery"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button
              type="button"
              onClick={() => setShowDetails((prev) => !prev)}
              className="rounded p-2 text-white bg-[#252530] border border-[#3A3A42] hover:bg-[#2a2a32] transition"
              aria-label={showDetails ? 'Hide details' : 'Show details'}
            >
              {showDetails ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between mb-4">
          {showStatusBadge && (
            <span className={`text-xs px-2 py-1 rounded-full border ${getStatusStyles(battery.status)}`}>
              {statusLabel}
            </span>
          )}
          <select
            value={battery.status || 'available'}
            onChange={(e) => onStatusChange?.(battery.id, e.target.value)}
            className="ml-auto bg-[#252530] border border-[#3A3A42] rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-[#7C3AED]"
          >
            {(statusOptions || []).map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <motion.div
          layout={hasMounted}
          transition={hasMounted ? { duration: 0.35, ease: 'easeInOut' } : undefined}
          className="space-y-3"
        >
          {showChargingRow && (
            <div className="flex items-center justify-between">
              <span className={`text-xs px-2 py-1 rounded-full border ${getChargingIndicator()}`}>
                {chargingStateLabel}
              </span>
              <span className="text-xs text-[#9CA3AF]">
                {battery.isCharging
                  ? `Charging ${getElapsedMinutes(battery.chargingStartTime)} min`
                  : (battery.status === 'paused' || battery.status === 'pausado')
                    ? `Paused ${Math.floor((battery.chargingAccumulatedMs || 0) / 60000)} min`
                    : (battery.status === 'resting' || battery.status === 'descansando')
                      ? getRestDisplay()
                      : 'Ready'}
              </span>
            </div>
          )}
          <div className="flex justify-between items-center">
            <div className="flex items-end gap-2">
              <span className={`text-2xl font-bold ${getHealthColor(displayHealth)}`}>{displayHealth}</span>
              {showRealHealth && (
                <span className="text-sm text-[#9CA3AF] mb-1 line-through" title="Last known health">
                  {health}
                </span>
              )}
              {isDoNotUse && (
                <span className="ml-2 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
                  Practice
                </span>
              )}
            </div>
            <span className="text-sm text-[#9CA3AF]">Health Score</span>
          </div>
          <div className="h-2 w-full rounded-full bg-[#252530] overflow-hidden">
            <div
              className="h-full bg-[#7C3AED] transition-all health-bar-fill"
              style={{ width: `${Math.min(100, Math.max(0, displayHealth))}%` }}
            />
          </div>

          <motion.div
            layout
            initial={false}
            animate={
              showDetails && latest
                ? { height: 'auto', opacity: 1 }
                : { height: 0, opacity: 0 }
            }
            transition={hasMounted ? { duration: 0.35, ease: 'easeInOut' } : undefined}
            className="overflow-hidden"
          >
            {latest && (
              <div className="space-y-2">
                {hasOpenCircuitVoltage && (
                  <div className="flex justify-between text-sm">
                    <span className="text-[#9CA3AF]">V_oc:</span>
                    <span>{Number(latest.openCircuitVoltage).toFixed(2)} V</span>
                  </div>
                )}
                {hasLoadVoltage && (
                  <div className="flex justify-between text-sm">
                    <span className="text-[#9CA3AF]">V_load:</span>
                    <span>{Number(latest.loadVoltage).toFixed(2)} V</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-[#9CA3AF]">Resistencia interna:</span>
                  <span>{latest.internalResistance?.toFixed(2)} mΩ</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#9CA3AF]">SOC:</span>
                  <span>{latest.stateOfCharge?.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#9CA3AF]">Status:</span>
                  <span>{latestAutoStatus}</span>
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>

        {needsUpdateWarning && (
          <div className="mt-3 text-red-400 text-xs flex items-center gap-1 bg-red-400/10 p-2 rounded border border-red-400/20">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>Battery info outdated (&gt;30 min)</span>
          </div>
        )}

        <button 
          onClick={onTest}
          className="btn-primary btn-scale w-full mt-4 text-white py-2 rounded-lg transition flex items-center justify-center gap-2"
        >
          <TrendingDown className="w-4 h-4" />
          Battery Info
        </button>

        {(battery.status === 'in_use' || battery.status === 'en_uso') ? (
          <div className="mt-3 transition-all duration-300">
            <button
              onClick={() => onStatusChange?.(battery.id, 'available')}
              className="btn-primary w-full text-white py-2 rounded-lg transition"
            >
              Returned
            </button>
          </div>
        ) : (
          <div className="mt-3 transition-all duration-300">
          {battery.status !== 'charging' && battery.status !== 'cargando' && battery.status !== 'paused' && battery.status !== 'pausado' && (
            <button
              onClick={() => onStartCharging?.(battery.id)}
              className="btn-primary w-full text-white py-2 rounded-lg transition"
            >
              Start Charging
            </button>
          )}

          {(battery.status === 'charging' || battery.status === 'cargando') && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => onStopCharging?.(battery.id)}
                className="btn-primary flex-1 text-white py-2 rounded-lg transition"
                aria-label="Stop charging"
              >
                Stop Charging
              </button>
              <button
                onClick={() => onPauseCharging?.(battery.id)}
                className="w-10 h-10 flex items-center justify-center bg-[#252530] hover:bg-[#2a2a32] text-white rounded transition"
                aria-label="Pause charging"
              >
                <Pause className="w-4 h-4" />
              </button>
            </div>
          )}

          {(battery.status === 'paused' || battery.status === 'pausado') && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => onResumeCharging?.(battery.id)}
                className="btn-primary flex-1 text-white py-2 rounded-lg transition flex items-center justify-center gap-2"
              >
                <Play className="w-4 h-4" />
                Resume Charging
              </button>
              <button
                onClick={() => onStopCharging?.(battery.id)}
                className="w-10 h-10 flex items-center justify-center bg-[#252530] hover:bg-[#2a2a32] text-white rounded transition"
                aria-label="Stop charging"
              >
                ■
              </button>
            </div>
          )}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default BatteryCard;
