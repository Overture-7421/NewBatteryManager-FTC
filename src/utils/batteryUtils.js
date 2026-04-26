// Battery utility functions

const getAverageResistance = (measurements) => {
  if (!measurements.length) return 0;
  if (measurements.length === 1) return measurements[0].internalResistance || 0;

  const historical = measurements.slice(0, -1);
  const total = historical.reduce((sum, measurement) => {
    const value = Number(measurement.internalResistance || 0);
    return sum + value;
  }, 0);

  return historical.length ? total / historical.length : 0;
};

const getVoltageDropScore = (voltageDrop) => {
  if (voltageDrop <= 0.5) return 100;
  if (voltageDrop <= 1.0) return 80;
  if (voltageDrop <= 1.5) return 50;
  return 20;
};

//FRC 0.018 Para abajo
//FTC 0.01 Pendiente

const normalizeInternalResistanceMilliOhms = (internalResistance) => {
  const value = Number(internalResistance || 0);
  if (!Number.isFinite(value) || value <= 0) return Number.POSITIVE_INFINITY;
  return value > 0 && value <= 1 ? value * 1000 : value;
};

const getResistanceScore = (internalResistance) => {
  const resistanceMilliOhms = normalizeInternalResistanceMilliOhms(internalResistance);
  if (resistanceMilliOhms <= 100) return 100;
  if (resistanceMilliOhms <= 170) return 87;
  if (resistanceMilliOhms <= 200) return 60;
  return 15;
};

const getStabilityScore = (deltaResistance) => {
  if (deltaResistance <= 2) return 100;
  if (deltaResistance <= 5) return 60;
  return 30;
};

export const displayOhms = (internalResistance) => {
  const value = Number(internalResistance);
  if (!value || !Number.isFinite(value)) return null;
  const ohms = value > 1 ? value / 1000 : value;
  return ohms.toFixed(3);
};

export const getStatusFromInternalResistance = (internalResistance) => {
  const resistanceMilliOhms = normalizeInternalResistanceMilliOhms(internalResistance);
  if (resistanceMilliOhms < 100) return 'Excellent';
  if (resistanceMilliOhms <= 170) return 'Good';
  if (resistanceMilliOhms <= 200) return 'Caution';
  return 'Bad';
};

const getStatusScoreFromResistance = (internalResistance) => {
  const status = getStatusFromInternalResistance(internalResistance);
  const statusScoreMap = {
    Excellent: 100,
    Good: 100,
    Caution: 60,
    Bad: 20,
  };

  return statusScoreMap[status] ?? 20;
};

const clampScore = (score) => Math.max(0, Math.min(100, Number(score) || 0));

const getSocScore = (soc) => {
  if (soc >= 100) return 100;
  if (soc >= 90) return 80;
  if (soc >= 75) return 60;
  return 30;
};

export const calculateHealthScore = (measurements) => {
  if (measurements.length === 0) return 0;

  const latest = measurements[measurements.length - 1];
  // Reserved for future FTC tuning:
  // const openCircuitVoltage = Number(latest.openCircuitVoltage || 0);
  // const loadVoltage = Number(latest.loadVoltage || 0);
  const internalResistance = Number(latest.internalResistance || 0);
  const stateOfCharge = Number(latest.stateOfCharge || 0);
  // const avgResistance = Number(latest.avgResistance || getAverageResistance(measurements) || 0);

  // const voltageDrop = openCircuitVoltage - loadVoltage;
  // const voltageScore = getVoltageDropScore(voltageDrop);
  const resistanceScore = clampScore(getResistanceScore(internalResistance));
  // const stabilityScore = getStabilityScore(internalResistance - avgResistance);
  const statusScore = clampScore(getStatusScoreFromResistance(internalResistance));
  const socScore = clampScore(getSocScore(stateOfCharge));

  const healthScore =
    resistanceScore * 0.7 +
    socScore * 0.2 +
    statusScore * 0.1;

  // Hidden for future scoring:
  // const healthScore =
  //   voltageScore * 0.4 +
  //   resistanceScore * 0.3 +
  //   stabilityScore * 0.15 +
  //   statusScore * 0.1 +
  //   socScore * 0.05;

  return Math.round(Math.max(0, Math.min(100, healthScore)));
};

export const classifyHealthScore = (healthScore) => {
  if (healthScore >= 85) return 'MATCH_READY';
  if (healthScore >= 65) return 'PRACTICE';
  return 'DO_NOT_USE';
};

const normalizeStatus = (status) => {
  if (!status) return '';
  const value = status.toString().toLowerCase();
  if (value === 'available' || value === 'disponible') return 'available';
  if (value === 'in_use' || value === 'in use' || value === 'en_uso') return 'in_use';
  if (value === 'charging' || value === 'cargando') return 'charging';
  if (value === 'paused' || value === 'pausado') return 'charging';
  if (value === 'resting' || value === 'descansando') return 'available';
  if (value === 'disabled' || value === 'deshabilitada') return 'disabled';
  return value;
};

const getRestBonus = (restMinutes) => {
  if (restMinutes >= 15) return 100;
  if (restMinutes >= 5) return 70;
  return 40;
};

const getAvailabilityBonus = (restMinutes, status) => {
  if (status !== 'available') return 50;
  if (restMinutes !== null && restMinutes < 15) return 50;
  return 100;
};

const getRotationBonus = (lastUsedMatch, currentMatchNumber) => {
  if (lastUsedMatch == null || currentMatchNumber == null) return 100;
  const diff = currentMatchNumber - lastUsedMatch;
  if (diff >= 4) return 100;
  if (diff === 3) return 30;
  if (diff === 2) return 10;
  return 0; 
};

const canFinishCharging = (battery, nextMatchTime) => {
  if (!battery.chargingEndTime) return false;
  return new Date(battery.chargingEndTime).getTime() <= nextMatchTime;
};

export const recommendBattery = ({
  batteries,
  currentTime,
  nextMatchTime,
  currentMatchNumber,
  allowPractices = false,
}) => {
  if (!batteries || batteries.length === 0) {
    return {
      recommendedBatteryId: null,
      selectionScore: 0,
      reason: 'No batteries available.',
    };
  }

  const now = Number(currentTime);
  const nextMatch = Number(nextMatchTime);
  const candidates = batteries
    .map((battery) => {
      const status = normalizeStatus(battery.status);
      const isResting = battery.status === 'resting' || battery.status === 'descansando';
      const isCharging = Boolean(battery.isCharging || status === 'charging');
      const healthScore = Number(battery.healthScore ?? calculateHealthScore(battery.measurements || []));
      const lastChargedTime = battery.lastChargedTime ? new Date(battery.lastChargedTime).getTime() : null;
      const restMinutes = lastChargedTime ? (now - lastChargedTime) / 60000 : null;
      const lastUsedTime = battery.lastUsedTime ? new Date(battery.lastUsedTime).getTime() : null;
      const minutesSinceUse = lastUsedTime ? (now - lastUsedTime) / 60000 : null;

      return {
        battery,
        status,
        isCharging,
        healthScore,
        restMinutes,
        minutesSinceUse,
        isResting,
      };
    })
    .filter(({ status, isCharging, healthScore, restMinutes, minutesSinceUse, battery, isResting }) => {
      if (!allowPractices && (classifyHealthScore(healthScore) === 'DO_NOT_USE' || healthScore < 60)) return false;
      if (status === 'disabled' || status === 'in_use') return false;
      if (isCharging && !canFinishCharging(battery, nextMatch)) return false;
      if (isResting && restMinutes !== null && restMinutes < 2) return false;
      if (minutesSinceUse !== null && minutesSinceUse < 10) return false;
      return status === 'available' || status === 'charging';
    })
    .map(({ battery, status, isCharging, healthScore, restMinutes, minutesSinceUse }) => {
      const restBonus = getRestBonus(restMinutes ?? 9999);
      const availabilityBonus = getAvailabilityBonus(restMinutes, status);
      const rotationBonus = getRotationBonus(battery.lastUsedMatch, currentMatchNumber);
      const usagePenalty = minutesSinceUse !== null && minutesSinceUse < 120 ? 20 : 0;
      
      let rotationWarningPenalty = 0;
      if (battery.lastUsedMatch && currentMatchNumber) {
        const diff = currentMatchNumber - battery.lastUsedMatch;
        if (diff === 1) rotationWarningPenalty = 1000;
        else if (diff === 2) rotationWarningPenalty = 700;
        else if (diff === 3) rotationWarningPenalty = 400;
      }

      const selectionScore =
        healthScore * 0.6 +
        restBonus * 0.2 +
        availabilityBonus * 0.1 +
        rotationBonus * 0.1 -
        usagePenalty -
        rotationWarningPenalty;

      return {
        battery,
        selectionScore: Math.round(selectionScore),
        restMinutes,
        rotationBonus,
        availabilityBonus,
        healthScore,
        isCharging,
        minutesSinceUse,
      };
    });

  if (!candidates.length) {
    return {
      recommendedBatteryId: null,
      selectionScore: 0,
      reason: 'No batteries meet the current requirements.',
    };
  }

  candidates.sort((a, b) => b.selectionScore - a.selectionScore);
  const best = candidates[0];
  const name = best.battery.name || best.battery.id;
  const restText = best.restMinutes === null
    ? 'no charge history'
    : best.restMinutes >= 15
      ? 'sufficient rest'
      : 'short rest';
  const rotationText = best.rotationBonus === 100 ? 'not used in the last match' : 'used in the last match';
  const availabilityText = best.availabilityBonus === 100 ? 'available' : 'recently charged';

  return {
    recommendedBatteryId: best.battery.id,
    selectionScore: best.selectionScore,
    reason: `${name} has the best health, ${restText}, ${availabilityText} and ${rotationText}.`,
    battery: best.battery,
  };
};

export const getBatteryChargingStatus = (battery, currentTime) => {
  const now = Number(currentTime);
  const lastChargedTime = battery.lastChargedTime ? new Date(battery.lastChargedTime).getTime() : null;
  const restTimeMinutes = lastChargedTime ? (now - lastChargedTime) / 60000 : 0;

  let restStatus = 'READY';
  if (battery.status !== 'resting' && battery.status !== 'descansando') {
    restStatus = null;
  } else if (restTimeMinutes < 2) {
    restStatus = 'NOT_READY';
  } else if (restTimeMinutes < 15) {
    restStatus = 'STABILIZING';
  }

  const warnings = [];
  if (restStatus === 'NOT_READY') warnings.push('Needs more rest time.');
  if (battery.isCharging) warnings.push('Cannot be used while charging.');
  if (battery.chargeCycles > 50) warnings.push('Battery has many charge cycles.');
  if (battery.chargeCycles > 100) warnings.push('Battery degrading from cycle count.');
  if (battery.temperature && battery.temperature > 45) warnings.push('Battery hot — wait for it to cool down.');

  const latestMeasurement = battery.measurements?.[battery.measurements.length - 1];
  const ocv = Number(latestMeasurement?.openCircuitVoltage || 0);
  const soc = Number(latestMeasurement?.stateOfCharge || 0);
  if (ocv > 0 && ocv < 11.5) warnings.push('Low resting voltage (< 11.5V) — send to charger.');
  if (soc > 0 && soc < 80) warnings.push('Low SOC (< 80%) — send to charger.');

  return {
    restTimeMinutes: restTimeMinutes ?? 0,
    restStatus,
    isSafeToUse: !battery.isCharging && restStatus === 'READY',
    warnings,
  };
};

export const getChargingAlerts = (batteries, currentTime) => {
  const alerts = [];

  batteries.forEach((battery) => {
    const name = battery.name || battery.id;
    if (battery.chargingEndTime) {
      const endTime = new Date(battery.chargingEndTime).getTime();
      const justFinished = Number(currentTime) - endTime < 5 * 60000;
      if (justFinished) {
        alerts.push({
          type: 'info',
          message: `Battery ${name} finished charging`,
          batteryId: battery.id,
        });
      }
    }

    const status = getBatteryChargingStatus(battery, currentTime);
    if (status.restStatus === 'NOT_READY') {
      alerts.push({
        type: 'warning',
        message: `Battery ${name} needs more rest`,
        batteryId: battery.id,
      });
    }
    if (status.restStatus === 'READY' && (battery.status === 'available' || battery.status === 'disponible')) {
      alerts.push({
        type: 'success',
        message: `Battery ${name} ready to use`,
        batteryId: battery.id,
      });
    }
  });

  return alerts;
};

export const DEFAULT_CHARGE_DURATION_MINUTES = 90;

const getAvailabilityScore = (timeUntilReadyMinutes) => {
  if (timeUntilReadyMinutes >= 15) return 100;
  if (timeUntilReadyMinutes >= 0) return 70;
  if (timeUntilReadyMinutes >= -15) return 40;
  if (timeUntilReadyMinutes >= -30) return 10;
  return Math.max(-500, Math.round(timeUntilReadyMinutes * 2)); // Dynamic penalty for being unready
};

const getRotationPenalty = (lastUsedMatch, matchNumber) => {
  if (lastUsedMatch == null || matchNumber == null) return 0;
  const diff = matchNumber - lastUsedMatch;
  if (diff >= 4) return 0;
  if (diff === 3) return 400;
  if (diff === 2) return 700;
  return 1000;
};

export const recommendBatteriesForMatches = ({ batteries, matches, currentTime, allowPractices = false }) => {
  if (!batteries || !matches || matches.length === 0) return [];

  const now = Number(currentTime);
  const sortedMatches = matches
    .slice()
    .sort((a, b) => new Date(a.matchTime).getTime() - new Date(b.matchTime).getTime());

  // Instead of mapping batteries just once, we need to keep track of their simulated state
  // across matches sequentially.
  const simBatteries = batteries.map((battery) => {
    const chargeDuration = Number(battery.estimatedChargeDuration ?? DEFAULT_CHARGE_DURATION_MINUTES);
    const chargingStart = battery.chargingStartTime ? new Date(battery.chargingStartTime).getTime() : null;
    let estimatedChargeEnd = now;
    
    if ((battery.status === 'charging' || battery.status === 'cargando') && chargingStart) {
      estimatedChargeEnd = chargingStart + chargeDuration * 60000;
    } else if (battery.lastChargedTime) {
      estimatedChargeEnd = new Date(battery.lastChargedTime).getTime();
    } else if (battery.status === 'available' || battery.status === 'disponible') {
      estimatedChargeEnd = now - 15 * 60000; // Already rested
    }

    const restReadyTime = estimatedChargeEnd + 15 * 60000;

    return {
      ...battery,
      _chargeDuration: chargeDuration,
      _restReadyTime: restReadyTime,
      _lastUsedMatch: battery.lastUsedMatch ?? null,
      _nextAvailableTime: (battery.status === 'available' || battery.status === 'disponible') ? now : restReadyTime,
    };
  });

  return sortedMatches.map((match) => {
    const matchTime = new Date(match.matchTime).getTime();
    const matchNumber = Number(match.matchNumber || 0);

    let candidates = simBatteries.filter((battery) => {
      if (battery.status === 'disabled' || battery.status === 'deshabilitada') return false;
      const healthScore = Number(battery.healthScore ?? calculateHealthScore(battery.measurements || []));
      if (!allowPractices && (classifyHealthScore(healthScore) === 'DO_NOT_USE' || healthScore < 60)) return false;
      return battery._nextAvailableTime <= matchTime;
    });

    let usedPartial = false;
    if (!candidates.length) {
      usedPartial = true;
      candidates = simBatteries.filter((battery) => {
        if (battery.status === 'disabled' || battery.status === 'deshabilitada') return false;
        const healthScore = Number(battery.healthScore ?? calculateHealthScore(battery.measurements || []));
        if (!allowPractices && (classifyHealthScore(healthScore) === 'DO_NOT_USE' || healthScore < 60)) return false;
        return true;
      });
    }

    if (!candidates.length) {
      return {
        matchNumber,
        recommendedBatteryId: null,
        score: 0,
        reason: 'No batteries available for this match.',
      };
    }

    const scored = candidates.map((battery) => {
      const healthScore = Number(battery.healthScore ?? calculateHealthScore(battery.measurements || []));
      const timeUntilReadyMinutes = (matchTime - battery._restReadyTime) / 60000;
      const availabilityScore = getAvailabilityScore(timeUntilReadyMinutes);
      const rotationPenalty = getRotationPenalty(battery._lastUsedMatch, matchNumber);
      const chargingPenalty = battery._restReadyTime > matchTime ? 30 : 0;
      const rotationBonus = rotationPenalty === 0 ? 100 : 60;
      const finalScore =
        healthScore * 0.5 +
        availabilityScore * 0.3 +
        rotationBonus * 0.2 -
        rotationPenalty -
        chargingPenalty;

      return {
        battery,
        score: Math.round(finalScore),
        availabilityScore,
        rotationPenalty,
        chargingPenalty,
        timeUntilReadyMinutes,
        healthScore,
      };
    });

    scored.sort((a, b) => b.score - a.score);
    const best = scored[0];

    const reasonParts = [];
    if (usedPartial) reasonParts.push('No ready batteries — using best available option.');
    if (best.timeUntilReadyMinutes < 0) {
      reasonParts.push('Will arrive late to the ideal rest window.');
    } else if (best.timeUntilReadyMinutes < 15) {
      reasonParts.push('Ready just in time for the match.');
    } else {
      reasonParts.push('Ready with enough lead time.');
    }
    if (best.rotationPenalty >= 1000) {
      reasonParts.push('Used recently — let the battery rest.');
    } else if (best.rotationPenalty >= 400) {
      reasonParts.push('Recommended without 4-match rest due to scarcity — use with caution.');
    }
    if (simBatteries.length === 1) {
      reasonParts.push('Only one battery available.');
    }

    // After selecting this battery for the future match, update its simulation state!
    const indexOfBest = simBatteries.findIndex((b) => b.id === best.battery.id);
    if (indexOfBest !== -1) {
      simBatteries[indexOfBest]._lastUsedMatch = matchNumber;
      // It needs to charge for its duration and rest for 15 mins before being ready again
      simBatteries[indexOfBest]._nextAvailableTime = matchTime + simBatteries[indexOfBest]._chargeDuration * 60000 + 15 * 60000;
      simBatteries[indexOfBest]._restReadyTime = simBatteries[indexOfBest]._nextAvailableTime;
    }

    return {
      matchNumber,
      recommendedBatteryId: best.battery.id,
      score: best.score,
      reason: reasonParts.join(' '),
    };
  });
};  
