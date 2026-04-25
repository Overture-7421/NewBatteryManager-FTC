import { useState } from 'react';
import { Plus, Trash2, Upload, X, Copy, Download } from 'lucide-react';
import { toast } from 'sonner';

const PRECONFIGURED_BATTERIES_KEY = 'preconfiguredBatteries';

const parseJsonArray = (value, fallback = []) => {
  if (!value) return fallback;

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
};

const parsePreconfiguredNames = (value) =>
  parseJsonArray(value)
    .map((item) => String(item ?? '').trim())
    .filter(Boolean)
    .filter((name, index, list) =>
      list.findIndex((candidate) => candidate.toLowerCase() === name.toLowerCase()) === index
    );

const buildBatteryId = () => Date.now() + Math.floor(Math.random() * 1000000);

const getStorageSnapshot = () => ({
  batteriesCount: parseJsonArray(localStorage.getItem('batteries')).length,
  matchesCount: parseJsonArray(localStorage.getItem('matches')).length,
  matchMode: localStorage.getItem('matchMode') || 'auto',
  preconfiguredNames: parsePreconfiguredNames(localStorage.getItem(PRECONFIGURED_BATTERIES_KEY)),
});

const buildPreconfiguredBattery = (name) => ({
  id: buildBatteryId(),
  name,
  status: 'available',
  isPreconfigured: true,
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

const RESETTABLE_STORAGE_KEYS = [
  'batteries',
  'matches',
  'matchMode',
  'borrowedItems',
  'ftc_batteries',
  'ftc_borrowed_items',
];

const normalizeScheduledTime = (value, index) => {
  if (!value) {
    return new Date(Date.now() + (index + 1) * 600000).toISOString();
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid date at match ${index + 1}.`);
  }

  return date.toISOString();
};

const normalizeMatch = (entry, index) => {
  if (!entry || typeof entry !== 'object') {
    throw new Error(`Invalid match entry at position ${index + 1}.`);
  }

  const matchNumberRaw = entry.matchNumber ?? entry.number ?? entry.match ?? index + 1;
  const matchNumber = Number(matchNumberRaw);
  if (!Number.isFinite(matchNumber) || matchNumber <= 0) {
    throw new Error(`Invalid matchNumber at entry ${index + 1}.`);
  }

  const typeValue = String(entry.matchType ?? entry.type ?? 'qualification').toLowerCase();
  const matchType = typeValue === 'playoffs' ? 'playoffs' : 'qualification';

  const statusValue = String(entry.status ?? 'scheduled').toLowerCase();
  const status = statusValue === 'completed'
    ? 'completed'
    : statusValue === 'in_progress'
      ? 'in_progress'
      : 'scheduled';

  return {
    id: entry.id ?? Date.now() + index,
    matchNumber,
    matchType,
    scheduledTime: normalizeScheduledTime(entry.scheduledTime ?? entry.time ?? entry.date, index),
    status,
    batteryIdUsed: entry.batteryIdUsed ?? null,
  };
};

const parseMatchesConfig = (jsonData) => {
  if (Array.isArray(jsonData)) {
    return {
      matches: jsonData.map((entry, index) => normalizeMatch(entry, index)),
      mode: null,
    };
  }

  if (jsonData && typeof jsonData === 'object' && Array.isArray(jsonData.matches)) {
    const mode = jsonData.matchMode ?? jsonData.mode ?? null;
    return {
      matches: jsonData.matches.map((entry, index) => normalizeMatch(entry, index)),
      mode,
    };
  }

  throw new Error('JSON must be an array or an object with a matches array.');
};

const SettingsView = () => {
  const [batteryName, setBatteryName] = useState('');
  const [snapshot, setSnapshot] = useState(() => getStorageSnapshot());
  const [isImportingMatches, setIsImportingMatches] = useState(false);

  // Maker states
  const [makerCount, setMakerCount] = useState(5);
  const [makerStartTime, setMakerStartTime] = useState('');
  const [makerInterval, setMakerInterval] = useState(10);
  const [generatedJson, setGeneratedJson] = useState('');

  const refreshSnapshot = () => {
    setSnapshot(getStorageSnapshot());
  };

  const handleAddPreconfiguredBattery = (event) => {
    event.preventDefault();

    const trimmedName = batteryName.trim();
    if (!trimmedName) return;

    const preconfiguredNames = parsePreconfiguredNames(
      localStorage.getItem(PRECONFIGURED_BATTERIES_KEY)
    );
    const alreadyPreconfigured = preconfiguredNames.some(
      (name) => name.toLowerCase() === trimmedName.toLowerCase()
    );

    if (alreadyPreconfigured) {
      toast.error('That battery is already in the preconfigured list.');
      return;
    }

    const updatedPreconfiguredNames = [...preconfiguredNames, trimmedName];
    localStorage.setItem(PRECONFIGURED_BATTERIES_KEY, JSON.stringify(updatedPreconfiguredNames));

    const currentBatteries = parseJsonArray(localStorage.getItem('batteries'));
    const alreadyExistsInActiveBatteries = currentBatteries.some(
      (battery) => String(battery?.name || '').trim().toLowerCase() === trimmedName.toLowerCase()
    );

    if (!alreadyExistsInActiveBatteries) {
      const updated = [...currentBatteries, buildPreconfiguredBattery(trimmedName)];
      localStorage.setItem('batteries', JSON.stringify(updated));
    }

    setBatteryName('');
    refreshSnapshot();
    toast.success('Preconfigured battery saved.');
  };

  const handleDeletePreconfiguredBattery = (nameToDelete) => {
    const normalizedName = String(nameToDelete ?? '').trim().toLowerCase();
    if (!normalizedName) return;

    const preconfiguredNames = parsePreconfiguredNames(
      localStorage.getItem(PRECONFIGURED_BATTERIES_KEY)
    );
    const updatedPreconfigured = preconfiguredNames.filter(
      (name) => name.toLowerCase() !== normalizedName
    );
    localStorage.setItem(PRECONFIGURED_BATTERIES_KEY, JSON.stringify(updatedPreconfigured));

    const currentBatteries = parseJsonArray(localStorage.getItem('batteries'));
    const updatedBatteries = currentBatteries.filter(
      (battery) => String(battery?.name || '').trim().toLowerCase() !== normalizedName
    );
    localStorage.setItem('batteries', JSON.stringify(updatedBatteries));

    refreshSnapshot();
    toast.success('Preconfigured battery deleted.');
  };

  const handleImportMatches = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImportingMatches(true);

    try {
      const rawText = await file.text();
      const parsedJson = JSON.parse(rawText);
      const { matches, mode } = parseMatchesConfig(parsedJson);

      if (!matches.length) {
        throw new Error('The uploaded file has no matches.');
      }

      localStorage.setItem('matches', JSON.stringify(matches));

      if (mode === 'simple' || mode === 'auto') {
        localStorage.setItem('matchMode', mode);
      }

      refreshSnapshot();
      toast.success(`${matches.length} matches imported successfully.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not import JSON file.';
      toast.error(message);
    } finally {
      setIsImportingMatches(false);
      event.target.value = '';
    }
  };

  const handleClearDataKeepPreconfigured = () => {
    const confirmed = window.confirm(
      'This will delete batteries data, matches, and borrowed info. Preconfigured batteries will be kept. Continue?'
    );
    if (!confirmed) return;

    const preconfiguredNames = parsePreconfiguredNames(
      localStorage.getItem(PRECONFIGURED_BATTERIES_KEY)
    );

    RESETTABLE_STORAGE_KEYS.forEach((key) => localStorage.removeItem(key));

    const restoredBatteries = preconfiguredNames.map((name) =>
      buildPreconfiguredBattery(name)
    );
    localStorage.setItem('batteries', JSON.stringify(restoredBatteries));

    refreshSnapshot();
    toast.success('Runtime data cleared. Preconfigured batteries were preserved.');
  };

  const handleGenerateJson = () => {
    const count = parseInt(makerCount, 10);
    const intervalMs = parseInt(makerInterval, 10) * 60000;
    const startMs = makerStartTime ? new Date(makerStartTime).getTime() : Date.now();
    
    if (isNaN(count) || count < 1) {
      toast.error("Invalid match count");
      return;
    }
    if (isNaN(intervalMs) || intervalMs < 1) {
      toast.error("Invalid interval");
      return;
    }

    const matches = Array.from({ length: count }).map((_, i) => ({
      matchNumber: i + 1,
      matchType: "qualification",
      scheduledTime: new Date(startMs + i * intervalMs).toISOString()
    }));

    const result = {
      matchMode: "auto",
      matches
    };

    setGeneratedJson(JSON.stringify(result, null, 2));
    toast.success("JSON generated successfully.");
  };

  const handleCopyJson = () => {
    if (!generatedJson) return;
    navigator.clipboard.writeText(generatedJson);
    toast.success("JSON copied to clipboard.");
  };

  const handleDownloadJson = () => {
    if (!generatedJson) return;
    const blob = new Blob([generatedJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'matches_config.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("JSON downloaded.");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-sm text-[#9CA3AF] mt-1">
          Configure preloaded batteries and import matches from JSON.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <section className="bg-[#1A1A22] border border-[#272732] rounded-lg p-6 space-y-4">
          <h2 className="text-xl font-semibold">Preconfigured Batteries</h2>
          <p className="text-sm text-[#9CA3AF]">
            Add only the battery name. Status defaults to Available and this list persists across resets.
          </p>

          <form onSubmit={handleAddPreconfiguredBattery} className="flex flex-col md:flex-row gap-3">
            <input
              type="text"
              value={batteryName}
              onChange={(event) => setBatteryName(event.target.value)}
              placeholder="Battery name"
              className="flex-1 bg-[#252530] border border-[#3A3A42] rounded px-3 py-2 text-white placeholder-[#9CA3AF] focus:outline-none focus:border-[#7C3AED]"
              required
            />
            <button
              type="submit"
              className="btn-primary text-white px-4 py-2 rounded-lg transition flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Battery
            </button>
          </form>

          <div className="text-xs text-[#9CA3AF] space-y-1">
            <p>
              Preconfigured list count: <span className="text-white font-medium">{snapshot.preconfiguredNames.length}</span>
            </p>
            <p>
              Active batteries stored: <span className="text-white font-medium">{snapshot.batteriesCount}</span>
            </p>
          </div>

          {snapshot.preconfiguredNames.length > 0 ? (
            <div className="flex flex-wrap gap-2 pt-1">
              {snapshot.preconfiguredNames.map((name) => (
                <div
                  key={name}
                  className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full border border-[#7C3AED]/40 bg-[#7C3AED]/10 text-[#DDD6FE]"
                >
                  <span>{name}</span>
                  <button
                    type="button"
                    onClick={() => handleDeletePreconfiguredBattery(name)}
                    className="rounded-full p-0.5 text-[#DDD6FE] hover:bg-[#7C3AED]/30 transition"
                    aria-label={`Delete ${name}`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-[#9CA3AF]">No preconfigured batteries yet.</p>
          )}

          <p className="text-xs text-[#9CA3AF]">
            Deleting from this list also removes that battery from active batteries.
          </p>
        </section>

        <section className="bg-[#1A1A22] border border-[#272732] rounded-lg p-6 space-y-4">
          <h2 className="text-xl font-semibold">Matches Configuration</h2>
          <p className="text-sm text-[#9CA3AF]">
            Upload a JSON file with an array of matches, or use the Maker below to generate one.
          </p>

          <label className="block">
            <span className="sr-only">Choose matches JSON</span>
            <input
              type="file"
              accept=".json,application/json"
              onChange={handleImportMatches}
              disabled={isImportingMatches}
              className="block w-full text-sm text-[#9CA3AF] file:mr-4 file:rounded file:border-0 file:bg-[#7C3AED] file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-[#6D28D9]"
            />
          </label>

          <div className="text-xs text-[#9CA3AF] space-y-1">
            <p>Current matches stored: <span className="text-white font-medium">{snapshot.matchesCount}</span></p>
            <p>Current mode: <span className="text-white font-medium">{snapshot.matchMode}</span></p>
          </div>

          <div className="mt-4 pt-4 border-t border-[#272732] space-y-3">
            <h3 className="text-sm font-semibold">Matches Configuration Maker</h3>
            <div className="flex flex-col md:flex-row gap-2">
              <input
                type="number"
                min="1"
                placeholder="Match Count"
                title="Number of matches"
                value={makerCount}
                onChange={(e) => setMakerCount(e.target.value)}
                className="bg-[#252530] border border-[#3A3A42] focus:border-[#7C3AED] rounded px-3 py-2 text-sm text-white flex-1"
              />
              <input
                type="datetime-local"
                title="Start Time"
                value={makerStartTime}
                onChange={(e) => setMakerStartTime(e.target.value)}
                className="bg-[#252530] border border-[#3A3A42] focus:border-[#7C3AED] rounded px-3 py-2 text-sm text-white flex-1"
              />
              <input
                type="number"
                min="1"
                placeholder="Interval (min)"
                title="Interval in minutes"
                value={makerInterval}
                onChange={(e) => setMakerInterval(e.target.value)}
                className="bg-[#252530] border border-[#3A3A42] focus:border-[#7C3AED] rounded px-3 py-2 text-sm text-white flex-1"
              />
            </div>
            
            <button
              type="button"
              onClick={handleGenerateJson}
              className="w-full md:w-auto bg-[#7C3AED]/20 hover:bg-[#7C3AED]/30 text-[#C4B5FD] border border-[#7C3AED]/50 px-4 py-2 rounded-lg transition text-sm"
            >
              Generate JSON Match Config
            </button>

            {generatedJson && (
              <div className="mt-2 space-y-2">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopyJson}
                    className="flex items-center gap-1 text-xs bg-[#4C1D95] hover:bg-[#5B21B6] text-white px-2 py-1 rounded transition"
                  >
                    <Copy className="w-3 h-3" /> Copy
                  </button>
                  <button
                    type="button"
                    onClick={handleDownloadJson}
                    className="flex items-center gap-1 text-xs bg-[#4C1D95] hover:bg-[#5B21B6] text-white px-2 py-1 rounded transition"
                  >
                    <Download className="w-3 h-3" /> Download
                  </button>
                </div>
                <div className="bg-[#252530] border border-[#3A3A42] rounded-lg p-3 text-xs text-[#C4B5FD] max-h-48 overflow-y-auto">
                  <pre className="whitespace-pre-wrap break-words text-[#DDD6FE]">
                    {generatedJson}
                  </pre>
                </div>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-[#272732]">
            <p className="text-xs text-[#9CA3AF] mb-2">
              Clear all runtime data but keep preconfigured batteries.
            </p>
            <button
              type="button"
              onClick={handleClearDataKeepPreconfigured}
              className="w-full md:w-auto inline-flex items-center justify-center gap-2 bg-red-500/10 border border-red-500/30 hover:bg-red-500/20 text-red-200 px-4 py-2 rounded-lg transition text-sm"
            >
              <Trash2 className="w-4 h-4" />
              Reset Data (Keep Preconfigured)
            </button>
          </div>
        </section>
      </div>
    </div>
  );
};

export default SettingsView;

