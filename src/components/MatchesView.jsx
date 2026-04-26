import { useEffect, useMemo, useState } from 'react';
import { recommendBattery, recommendBatteriesForMatches } from '../utils/batteryUtils.js';

const findBatteryById = (list, id) =>
  id != null ? list.find((b) => String(b.id) === String(id)) : undefined;

const BatteryLabel = ({ battery, fallback }) => {
  if (!battery) return <span>{fallback ?? '—'}</span>;
  return (
    <span>
      {battery.name || 'Unnamed'}
      <span className="text-xs text-[#6B7280] ml-1 font-normal">#{String(battery.id).slice(-5)}</span>
    </span>
  );
};

const MatchesView = () => {
  const [mode, setMode] = useState('auto');
  const [matches, setMatches] = useState([]);
  const [batteries, setBatteries] = useState([]);
  const [minutesToMatch, setMinutesToMatch] = useState('30');
  const [matchTime, setMatchTime] = useState('');
  const [matchNumber, setMatchNumber] = useState('1');
  const [matchType, setMatchType] = useState('qualification');
  const [timeMode, setTimeMode] = useState('live');
  const [manualBaseTime, setManualBaseTime] = useState('');
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [matchesLoaded, setMatchesLoaded] = useState(false);
  const [currentMatchId, setCurrentMatchId] = useState(null);
  const [selectedBatteryId, setSelectedBatteryId] = useState('');

  useEffect(() => {
    const savedMatches = localStorage.getItem('matches');
    const savedMode = localStorage.getItem('matchMode');
    const savedBatteries = localStorage.getItem('batteries');

    if (savedMatches) {
      try {
        setMatches(JSON.parse(savedMatches));
      } catch (error) {
        setMatches([]);
      }
    }
    if (savedMode) setMode(savedMode);
    if (savedBatteries) setBatteries(JSON.parse(savedBatteries));
    setMatchesLoaded(true);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const savedBatteries = localStorage.getItem('batteries');
      if (savedBatteries) setBatteries(JSON.parse(savedBatteries));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!matchesLoaded) return;
    localStorage.setItem('matches', JSON.stringify(matches));
  }, [matches, matchesLoaded]);

  useEffect(() => {
    localStorage.setItem('matchMode', mode);
  }, [mode]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const nextMatch = useMemo(() => {
    const now = Date.now();
    const upcoming = matches
      .filter((match) => match.status !== 'completed')
      .filter((match) => new Date(match.scheduledTime).getTime() > now)
      .sort((a, b) => new Date(a.scheduledTime) - new Date(b.scheduledTime));

    if (upcoming.length) return { match: upcoming[0], label: 'Next Match' };

    const latest = matches
      .filter((match) => match.status !== 'completed')
      .slice()
      .sort((a, b) => new Date(b.scheduledTime) - new Date(a.scheduledTime));

    if (latest.length) return { match: latest[0], label: 'Current Match' };
    return null;
  }, [matches]);

  const matchPlans = useMemo(() =>
    recommendBatteriesForMatches({
      batteries,
      allowPractices: mode === 'practice',
      currentTime: Date.now(),
      matches: matches.map((match) => ({
        matchNumber: match.matchNumber,
        matchTime: match.scheduledTime,
        matchId: match.id,
      })),
    }),
  [batteries, matches]);

  const recommendation = useMemo(() => {
    if (!nextMatch) return null;
    // Use the match plan so the top panel always agrees with the match list.
    const plan = matchPlans.find((item) => item.matchNumber === nextMatch.match.matchNumber);
    if (plan?.recommendedBatteryId) {
      return {
        recommendedBatteryId: plan.recommendedBatteryId,
        selectionScore: plan.score ?? 0,
        reason: plan.reason,
        battery: findBatteryById(batteries, plan.recommendedBatteryId),
      };
    }
    // Fallback to the single-match algorithm when no plan entry exists.
    return recommendBattery({
      batteries,
      allowPractices: mode === 'practice',
      currentTime: Date.now(),
      nextMatchTime: new Date(nextMatch.match.scheduledTime).getTime(),
      currentMatchNumber: Number(nextMatch.match.matchNumber || 0),
    });
  }, [batteries, matchPlans, mode, nextMatch]);

  const handleMarkInUse = () => {
    const selectedBattery = findBatteryById(batteries, selectedBatteryId);
    const batteryToUse = selectedBattery || recommendation?.battery;
    if (!batteryToUse) return;
    if (nextMatch?.match?.id) {
      setCurrentMatchId(nextMatch.match.id);
      setMatches((prev) =>
        prev.map((match) =>
          match.id === nextMatch.match.id
            ? {
                ...match,
                status: 'in_progress',
                batteryIdUsed: batteryToUse.id,
              }
            : match
        )
      );
    }
    const now = new Date().toISOString();
    const updated = batteries.map((battery) =>
      battery.id === batteryToUse.id
        ? {
            ...battery,
            status: 'in_use',
            lastUsedTime: now,
            lastUsedMatch: Number(nextMatch?.match?.matchNumber || 0) || battery.lastUsedMatch,
          }
        : battery
    );

    setBatteries(updated);
    localStorage.setItem('batteries', JSON.stringify(updated));
  };

  const handleAddMatch = (event) => {
    event.preventDefault();
    const baseTime =
      timeMode === 'manual' && manualBaseTime
        ? new Date(manualBaseTime).getTime()
        : currentTime;
    const scheduledTimestamp = matchTime
      ? new Date(matchTime).getTime()
      : baseTime + Math.max(1, Number(minutesToMatch)) * 60000;
    const scheduledTime = new Date(scheduledTimestamp).toISOString();

    const newMatch = {
      id: Date.now(),
      matchNumber: Number(matchNumber),
      matchType,
      scheduledTime,
      status: 'scheduled',
      batteryIdUsed: null,
    };

    setMatches((prev) => {
      const updated = [...prev, newMatch];
      if (matchesLoaded) {
        localStorage.setItem('matches', JSON.stringify(updated));
      }
      return updated;
    });
    setMatchNumber(String(Number(matchNumber) + 1));
  };

  const handleTerminateMatch = () => {
    if (!nextMatch?.match?.id) return;
    setMatches((prev) =>
      prev.map((match) =>
        match.id === nextMatch.match.id
          ? {
              ...match,
              status: 'completed',
            }
          : match
      )
    );
    if (currentMatchId === nextMatch.match.id) {
      setCurrentMatchId(null);
    }
  };

  const handleBatteryChange = (event) => {
    const nextValue = event.target.value;
    setSelectedBatteryId(nextValue);
    if (!nextMatch?.match?.id) return;
    setMatches((prev) =>
      prev.map((match) =>
        match.id === nextMatch.match.id
          ? {
              ...match,
              batteryIdUsed: nextValue || match.batteryIdUsed,
            }
          : match
      )
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <h1 className="text-3xl font-bold">Matches</h1>
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-[#9CA3AF]">Practice Mode</span>
          <button
            onClick={() => setMode(mode === 'practice' ? 'auto' : 'practice')}
            className={`w-12 h-6 rounded-full transition-colors relative ${mode === 'practice' ? 'bg-[#7C3AED]' : 'bg-[#3A3A42]'}`}
          >
            <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${mode === 'practice' ? 'translate-x-6' : 'translate-x-0'}`} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-[#1A1A22] border border-[#272732] rounded-lg p-6 space-y-4 lg:col-span-1">
          <h2 className="text-xl font-semibold">Schedule Match</h2>
          <form onSubmit={handleAddMatch} className="space-y-3">
            <div className="flex gap-2">
              <input
                type="number"
                min="1"
                value={matchNumber}
                onChange={(event) => setMatchNumber(event.target.value)}
                className="w-1/2 bg-[#252530] border border-[#3A3A42] rounded px-3 py-2 text-white focus:outline-none focus:border-[#7C3AED]"
                placeholder="Match #"
              />
              <select
                value={matchType}
                onChange={(event) => setMatchType(event.target.value)}
                className="w-1/2 bg-[#252530] border border-[#3A3A42] rounded px-3 py-2 text-white focus:outline-none focus:border-[#7C3AED]"
              >
                <option value="qualification">Qualification</option>
                <option value="playoffs">Playoffs</option>
              </select>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm text-[#9CA3AF]">
                Base time: {new Date(currentTime).toLocaleTimeString()}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className={`px-2 py-1 rounded text-sm ${timeMode === 'live' ? 'bg-[#7C3AED] text-white' : 'text-[#9CA3AF]'}`}
                  onClick={() => setTimeMode('live')}
                >
                  Now
                </button>
                <button
                  type="button"
                  className={`px-2 py-1 rounded text-sm ${timeMode === 'manual' ? 'bg-[#7C3AED] text-white' : 'text-[#9CA3AF]'}`}
                  onClick={() => setTimeMode('manual')}
                >
                  Manual
                </button>
              </div>
            </div>
            {timeMode === 'manual' && (
              <input
                type="datetime-local"
                value={manualBaseTime}
                onChange={(event) => setManualBaseTime(event.target.value)}
                className="w-full bg-[#252530] border border-[#3A3A42] rounded px-3 py-2 text-white focus:outline-none focus:border-[#7C3AED]"
              />
            )}
            <div className="space-y-2">
              <input
                type="number"
                min="1"
                value={minutesToMatch}
                onChange={(event) => {
                  setMinutesToMatch(event.target.value);
                  if (event.target.value) setMatchTime('');
                }}
                className="w-full bg-[#252530] border border-[#3A3A42] rounded px-3 py-2 text-white focus:outline-none focus:border-[#7C3AED]"
                placeholder="Minutes until match"
              />
              <input
                type="datetime-local"
                value={matchTime}
                onChange={(event) => {
                  setMatchTime(event.target.value);
                  if (event.target.value) setMinutesToMatch('');
                }}
                className="w-full bg-[#252530] border border-[#3A3A42] rounded px-3 py-2 text-white focus:outline-none focus:border-[#7C3AED]"
                placeholder="Match time"
              />
              <p className="text-xs text-[#9CA3AF]">
                Use minutes or select the exact match time.
              </p>
            </div>
            <button
              type="submit"
              className="btn-primary w-full text-white py-2 rounded-lg transition"
            >
              Add Match
            </button>
          </form>
        </div>

        <div className="bg-[#1A1A22] border border-[#272732] rounded-lg p-6 space-y-4 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">{nextMatch?.label || 'Next Match'}</h2>
            {nextMatch && (
              <button
                type="button"
                onClick={handleTerminateMatch}
                className="btn-primary text-white px-3 py-2 rounded-lg transition"
              >
                End Match
              </button>
            )}
          </div>
          {nextMatch ? (
            <div className="space-y-2">
              <p className="text-[#E5E7EB] font-medium">
                Match {nextMatch.match.matchNumber} ({nextMatch.match.matchType})
              </p>
              <p className="text-sm text-[#9CA3AF]">
                {new Date(nextMatch.match.scheduledTime).toLocaleString()}
              </p>
            </div>
          ) : (
            <p className="text-[#9CA3AF]">No matches scheduled.</p>
          )}

          <div className="bg-[#252530] border border-[#3A3A42] rounded-lg p-4 space-y-2">
            <h3 className="text-lg font-semibold">Battery Recommendation</h3>
            {nextMatch?.match?.batteryIdUsed || nextMatch?.match?.status === 'in_progress' ? (
              <div className="space-y-2">
                <p className="text-sm text-[#9CA3AF]">Battery assigned / in use:</p>
                <p className="text-[#E5E7EB] font-bold text-lg">
                  <BatteryLabel
                    battery={findBatteryById(batteries, nextMatch.match.batteryIdUsed)}
                    fallback={nextMatch.match.batteryIdUsed}
                  />
                </p>
                <button
                  type="button"
                  className="btn-primary mt-2 text-white px-3 py-2 rounded-lg transition opacity-50 cursor-not-allowed"
                  disabled
                >
                  In Progress
                </button>
              </div>
            ) : recommendation?.recommendedBatteryId ? (
              <>
                <label className="text-xs text-[#9CA3AF]">Battery for this match</label>
                <select
                  value={selectedBatteryId}
                  onChange={handleBatteryChange}
                  className="w-full bg-[#1F1F28] border border-[#3A3A42] rounded px-3 py-2 text-white focus:outline-none focus:border-[#7C3AED]"
                >
                  <option value="">Use recommended</option>
                  {batteries.map((battery) => (
                    <option key={battery.id} value={battery.id}>
                      {battery.name || battery.id}
                    </option>
                  ))}
                </select>
                <div className="bg-[#7C3AED]/10 border border-[#7C3AED]/40 rounded-lg px-4 py-3 flex items-center justify-between">
                  <span className="text-[#C4B5FD] font-bold text-lg">
                    <BatteryLabel
                      battery={
                        selectedBatteryId
                          ? findBatteryById(batteries, selectedBatteryId)
                          : recommendation.battery
                      }
                      fallback={recommendation.recommendedBatteryId}
                    />
                  </span>
                  <span className="text-xs bg-[#7C3AED]/30 text-[#A78BFA] px-2 py-0.5 rounded-full border border-[#7C3AED]/40">
                    Score {recommendation.selectionScore}
                  </span>
                </div>
                <p className="text-sm text-[#9CA3AF]">{recommendation.reason}</p>
                <button
                  type="button"
                  onClick={handleMarkInUse}
                  className="btn-primary mt-2 text-white px-3 py-2 rounded-lg transition"
                >
                  Mark In Use
                </button>
              </>
            ) : (
              <p className="text-sm text-[#9CA3AF]">{recommendation?.reason || 'No recommendation available.'}</p>
            )}
          </div>
        </div>
      </div>

      <div className="bg-[#1A1A22] border border-[#272732] rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Match List</h2>
        {matches.length === 0 ? (
          <p className="text-[#9CA3AF]">No matches yet.</p>
        ) : (
          <div className="space-y-3">
            {matches
              .slice()
              .sort((a, b) => new Date(a.scheduledTime) - new Date(b.scheduledTime))
              .map((match) => {
                const plan = matchPlans.find((item) => item.matchNumber === match.matchNumber);
                const usedBattery = findBatteryById(batteries, match.batteryIdUsed);
                const recommendedBattery = findBatteryById(batteries, plan?.recommendedBatteryId);

                return (
                  <div
                    key={match.id}
                    className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 border border-[#272732] rounded-lg p-3"
                  >
                    <div>
                      <p className="font-medium">Match {match.matchNumber}</p>
                      <p className="text-sm text-[#9CA3AF]">
                        {match.matchType} · {new Date(match.scheduledTime).toLocaleString()}
                      </p>
                      {(usedBattery || match.batteryIdUsed) && (
                        <p className="text-xs text-[#A78BFA] font-medium">
                          Battery used: <BatteryLabel battery={usedBattery} fallback={match.batteryIdUsed} />
                        </p>
                      )}
                      {!match.batteryIdUsed && (
                        <>
                          {recommendedBattery ? (
                            <p className="text-xs font-semibold text-[#A78BFA] inline-flex items-center gap-1 mt-0.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#7C3AED] inline-block" />
                              <BatteryLabel battery={recommendedBattery} />
                            </p>
                          ) : (
                            <p className="text-xs text-[#6B7280]">No recommendation</p>
                          )}
                          {plan?.reason && (
                            <p className="text-xs text-[#6B7280]">{plan.reason}</p>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </div>
    </div>
  );
};

export default MatchesView;
