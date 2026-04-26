import { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { Eye, EyeOff, Plus, X, AlertTriangle } from 'lucide-react';
import { LayoutGroup, motion } from 'framer-motion';
import BatteryCard from './BatteryCard.jsx';
import AddBatteryModal from './AddBatteryModal.jsx';
import TestModal from './TestModal.jsx';

const PRECONFIGURED_BATTERIES_KEY = 'preconfiguredBatteries';
let didApplyStartupBatteryReset = false;

const parseJsonArray = (value, fallback = []) => {
  if (!value) return fallback;

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
};

const normalizeName = (value) => String(value ?? '').trim();

const parsePreconfiguredNames = (value) =>
  parseJsonArray(value)
    .map((item) => normalizeName(item))
    .filter(Boolean)
    .filter((name, index, list) =>
      list.findIndex((candidate) => candidate.toLowerCase() === name.toLowerCase()) === index
    );

const createBatteryRecord = (name, status = 'available', isPreconfigured = false) => ({
  id: Date.now() + Math.floor(Math.random() * 1000000),
  name,
  status,
  isPreconfigured,
  measurements: [],
  chargingStartTime: null,
  chargingEndTime: null,
  lastChargedTime: null,
  lastUsedTime: null,
  chargeCycles: 0,
  isCharging: false,
  chargingAccumulatedMs: 0,
  chargingPauseTime: null,
  estimatedChargeDuration: 90,
});

const batteryStatuses = [
  { value: 'available', label: 'Available' },
  { value: 'in_use', label: 'In Use' },
  { value: 'disabled', label: 'Disabled' },
];

const BatteriesView = () => {
  const [batteries, setBatteries] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showTestModal, setShowTestModal] = useState(false);
  const [selectedBattery, setSelectedBattery] = useState(null);
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [showAllDetails, setShowAllDetails] = useState(true);
  const [hasMounted, setHasMounted] = useState(false);
  const gridRef = useRef(null);
  const [alertedBatteries, setAlertedBatteries] = useState(new Set());
  const [popoutAlerts, setPopoutAlerts] = useState([]);

  useEffect(() => {
    const storedBatteries = parseJsonArray(localStorage.getItem('batteries'));

    if (didApplyStartupBatteryReset) {
      setBatteries(storedBatteries);
      return;
    }

    didApplyStartupBatteryReset = true;

    const preconfiguredNames = parsePreconfiguredNames(
      localStorage.getItem(PRECONFIGURED_BATTERIES_KEY)
    );
    const preconfiguredNameSet = new Set(
      preconfiguredNames.map((name) => name.toLowerCase())
    );

    const preconfiguredStoredBatteries = storedBatteries
      .filter((battery) => preconfiguredNameSet.has(normalizeName(battery?.name).toLowerCase()))
      .map((battery) => {
        if (battery?.isPreconfigured) return battery;
        return {
          ...battery,
          isPreconfigured: true,
        };
      });

    const existingNames = new Set(
      preconfiguredStoredBatteries
        .map((battery) => normalizeName(battery?.name).toLowerCase())
        .filter(Boolean)
    );

    const missingPreconfigured = preconfiguredNames.filter(
      (name) => !existingNames.has(name.toLowerCase())
    );

    const restoredBatteries = [
      ...preconfiguredStoredBatteries,
      ...missingPreconfigured.map((name) => createBatteryRecord(name, 'available', true)),
    ];

    setBatteries(restoredBatteries);
    localStorage.setItem('batteries', JSON.stringify(restoredBatteries));
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  useLayoutEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;

    let frameId = null;
    const resizeAll = () => {
      if (frameId) cancelAnimationFrame(frameId);
      frameId = requestAnimationFrame(() => {
        const rowHeight = Number.parseFloat(
          window.getComputedStyle(grid).getPropertyValue('grid-auto-rows')
        );
        const rowGap = Number.parseFloat(
          window.getComputedStyle(grid).getPropertyValue('row-gap')
        );
        if (!rowHeight || Number.isNaN(rowHeight)) return;
        const items = grid.querySelectorAll('[data-masonry-item]');
        items.forEach((item) => {
          const height = item.getBoundingClientRect().height;
          const safeRowGap = Number.isNaN(rowGap) ? 0 : rowGap;
          const rowSpan = Math.max(1, Math.ceil((height + safeRowGap) / (rowHeight + safeRowGap)));
          const currentSpan = item.dataset.masonrySpan;
          if (currentSpan !== String(rowSpan)) {
            item.style.gridRowEnd = `span ${rowSpan}`;
            item.dataset.masonrySpan = String(rowSpan);
          }
        });
      });
    };

    const resizeObserver = new ResizeObserver(resizeAll);
    const items = grid.querySelectorAll('[data-masonry-item]');
    items.forEach((item) => resizeObserver.observe(item));

    resizeAll();
    window.addEventListener('resize', resizeAll);

    return () => {
      if (frameId) cancelAnimationFrame(frameId);
      resizeObserver.disconnect();
      window.removeEventListener('resize', resizeAll);
    };
  }, [batteries]);

  useEffect(() => {
    const nowMs = Number(currentTime);
    let updatedAny = false;
    const updated = batteries.map((battery) => {
      if (battery.status !== 'resting' && battery.status !== 'descansando') return battery;
      if (!battery.lastChargedTime) return battery;
      const restMinutes = (nowMs - new Date(battery.lastChargedTime).getTime()) / 60000;
      if (restMinutes < 15) return battery;
      updatedAny = true;
      return {
        ...battery,
        status: 'available',
      };
    });

    if (updatedAny) {
      setBatteries(updated);
      localStorage.setItem('batteries', JSON.stringify(updated));
    }
  }, [currentTime, batteries]);

  useEffect(() => {
    if (batteries.length === 0) return;
    const now = Number(currentTime);
    const needingAlert = batteries.filter(b => {
      const lastUpdate = b.measurements?.length > 0
        ? new Date(b.measurements[b.measurements.length - 1].timestamp).getTime()
        : (typeof b.id === 'number' && b.id > 1000000000000 ? b.id : null);
      if (!lastUpdate) return false;
      const ageMinutes = (now - lastUpdate) / 60000;
      return ageMinutes >= 60;
    });

    const newAlerts = needingAlert.filter(b => !alertedBatteries.has(b.id));

    if (newAlerts.length > 0) {
      const messages = newAlerts.map(b => `Battery "${b.name || 'Unnamed'}" has not been updated in over 1 hour.`);
      setPopoutAlerts(prev => [...prev, ...messages]);
      setAlertedBatteries(prev => new Set([...prev, ...newAlerts.map(b => b.id)]));
    }
  }, [currentTime, batteries, alertedBatteries]);

  const handleAddBattery = (newBattery) => {
    const updated = [...batteries, createBatteryRecord(newBattery.name, newBattery.status || 'available')];
    setBatteries(updated);
    localStorage.setItem('batteries', JSON.stringify(updated));
  };

  const handleDeleteBattery = (batteryId) => {
    const batteryToDelete = batteries.find((battery) => battery.id === batteryId);
    if (!batteryToDelete || batteryToDelete.isPreconfigured) return;

    const batteryName = batteryToDelete.name || 'this battery';
    if (!window.confirm(`Delete ${batteryName}?`)) return;

    const updated = batteries.filter((battery) => battery.id !== batteryId);
    setBatteries(updated);
    localStorage.setItem('batteries', JSON.stringify(updated));

    if (selectedBattery?.id === batteryId) {
      setSelectedBattery(null);
      setShowTestModal(false);
    }
  };

  const handleStartCharging = (batteryId) => {
    const now = new Date().toISOString();
    console.log('Charging started:', now);
    const updated = batteries.map((battery) =>
      battery.id === batteryId
        ? {
            ...battery,
            status: 'charging',
            isCharging: true,
            chargingStartTime: now,
            chargingEndTime: null,
            lastChargedTime: null,
            chargingPauseTime: null,
            chargingAccumulatedMs: 0,
            lastUsedTime: null,
          }
        : battery
    );
    setBatteries(updated);
    localStorage.setItem('batteries', JSON.stringify(updated));
  };

  const handlePauseCharging = (batteryId) => {
    const now = Date.now();
    const updated = batteries.map((battery) => {
      if (battery.id !== batteryId) return battery;
      const startTime = battery.chargingStartTime ? new Date(battery.chargingStartTime).getTime() : now;
      const accumulated = (battery.chargingAccumulatedMs || 0) + (now - startTime);
      return {
        ...battery,
        status: 'paused',
        isCharging: false,
        chargingAccumulatedMs: accumulated,
        chargingPauseTime: new Date(now).toISOString(),
        chargingStartTime: null,
      };
    });
    setBatteries(updated);
    localStorage.setItem('batteries', JSON.stringify(updated));
  };

  const handleResumeCharging = (batteryId) => {
    const now = new Date().toISOString();
    const updated = batteries.map((battery) =>
      battery.id === batteryId
        ? {
            ...battery,
            status: 'charging',
            isCharging: true,
            chargingStartTime: now,
            chargingPauseTime: null,
            lastChargedTime: null,
            chargingEndTime: null,
          }
        : battery
    );
    setBatteries(updated);
    localStorage.setItem('batteries', JSON.stringify(updated));
  };

  const handleStopCharging = (batteryId) => {
    const now = new Date().toISOString();
    console.log('Charging stopped:', now);
    const updated = batteries.map((battery) =>
      battery.id === batteryId
        ? (() => {
            const stopTimeMs = new Date(now).getTime();
            const startTimeMs = battery.chargingStartTime
              ? new Date(battery.chargingStartTime).getTime()
              : stopTimeMs;
            const totalChargeMs = (battery.chargingAccumulatedMs || 0) + (stopTimeMs - startTimeMs);
            const shouldRest = totalChargeMs >= 5 * 60000;

            return {
              ...battery,
              status: shouldRest ? 'resting' : 'available',
              isCharging: false,
              chargingEndTime: shouldRest ? now : null,
              lastChargedTime: shouldRest ? now : null,
              chargeCycles: shouldRest ? (battery.chargeCycles || 0) + 1 : battery.chargeCycles || 0,
              chargingAccumulatedMs: 0,
              chargingPauseTime: null,
              chargingStartTime: null,
            };
          })()
        : battery
    );
    setBatteries(updated);
    localStorage.setItem('batteries', JSON.stringify(updated));
  };

  const handleStatusChange = (batteryId, nextStatus) => {
    const now = new Date().toISOString();
    const updated = batteries.map((battery) =>
      battery.id === batteryId
        ? (() => {
            const lastUsedMs = battery.lastUsedTime
              ? new Date(battery.lastUsedTime).getTime()
              : null;
            const usedMinutes = lastUsedMs ? (new Date(now).getTime() - lastUsedMs) / 60000 : 0;
            const shouldRestAfterUse = nextStatus === 'available' && usedMinutes >= 5;

            return {
              ...battery,
              status: shouldRestAfterUse ? 'resting' : nextStatus,
              lastUsedTime: nextStatus === 'in_use' ? now : battery.lastUsedTime,
              lastChargedTime: shouldRestAfterUse ? now : battery.lastChargedTime,
            };
          })()
        : battery
    );
    setBatteries(updated);
    localStorage.setItem('batteries', JSON.stringify(updated));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Batteries</h1>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setShowAllDetails((prev) => !prev)}
            className="rounded p-2 text-white bg-[#252530] border border-[#3A3A42] hover:bg-[#2a2a32] transition"
            aria-label={showAllDetails ? 'Hide details' : 'Show details'}
          >
            {showAllDetails ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
          <button 
            onClick={() => setShowAddModal(true)}
            className="btn-primary flex items-center gap-2 text-white px-4 py-2 rounded-lg transition"
          >
            <Plus className="w-5 h-5" />
            Add Battery
          </button>
        </div>
      </div>

      <LayoutGroup>
        <motion.div
          ref={gridRef}
          className="grid items-start grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          style={{ gridAutoRows: '8px', gridAutoFlow: 'dense' }}
        >
          {batteries.map(battery => (
            <BatteryCard 
              key={battery.id} 
              battery={battery}
              statusOptions={batteryStatuses}
              onStatusChange={handleStatusChange}
              onStartCharging={handleStartCharging}
              onPauseCharging={handlePauseCharging}
              onResumeCharging={handleResumeCharging}
              onStopCharging={handleStopCharging}
              currentTime={currentTime}
              globalShowDetails={showAllDetails}
              hasMounted={hasMounted}
              canDelete={!battery.isPreconfigured}
              onDelete={handleDeleteBattery}
              onTest={() => {
                setSelectedBattery(battery);
                setShowTestModal(true);
              }}
            />
          ))}
        </motion.div>
      </LayoutGroup>

      <AddBatteryModal 
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={handleAddBattery}
        statusOptions={batteryStatuses}
      />

      <TestModal
        isOpen={showTestModal}
        battery={selectedBattery}
        onClose={() => setShowTestModal(false)}
        onSave={(updatedBattery) => {
          setBatteries(prev => prev.map(b => b.id === updatedBattery.id ? updatedBattery : b));
          setAlertedBatteries(prev => {
            const next = new Set(prev);
            next.delete(updatedBattery.id);
            return next;
          });
          setPopoutAlerts(prev =>
            prev.filter(msg => !msg.includes(`"${updatedBattery.name || 'Unnamed'}"`))
          );
        }}
        currentTime={currentTime}
      />

      {popoutAlerts.length > 0 && (
        <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
          {popoutAlerts.map((msg, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="bg-red-500 text-white p-4 rounded-lg shadow-xl flex items-start gap-3 max-w-sm border border-red-700/50"
            >
              <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div className="flex-1 text-sm font-medium">{msg}</div>
              <button 
                onClick={() => {
                  if (window.confirm('Dismiss this alert?')) {
                    setPopoutAlerts(prev => prev.filter((_, i) => i !== idx));
                  }
                }}
                className="text-white/80 hover:text-white transition p-1 -mr-2 -mt-2 rounded-full hover:bg-white/10"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BatteriesView;
