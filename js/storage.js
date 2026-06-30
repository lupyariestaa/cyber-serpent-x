/* ══════════════════════════════════════════
   storage.js — LocalStorage helpers
   ══════════════════════════════════════════ */

'use strict';

const Storage = (() => {
  const KEY_HIGHSCORE = 'csx_highscore';
  const KEY_STATS     = 'csx_stats';
  const KEY_SETTINGS  = 'csx_settings';

  const defaultStats = {
    gamesPlayed:  0,
    totalScore:   0,
    coresEaten:   0,
    raresEaten:   0,
    bossesEaten:  0,
    powerUpsGot:  0,
    bestLevel:    1,
  };

  const defaultSettings = {
    sound: true,
    music: true,
  };

  function getHighScore() {
    return parseInt(localStorage.getItem(KEY_HIGHSCORE) || '0', 10);
  }

  function setHighScore(value) {
    localStorage.setItem(KEY_HIGHSCORE, String(value));
  }

  function getStats() {
    try {
      return Object.assign({}, defaultStats, JSON.parse(localStorage.getItem(KEY_STATS) || '{}'));
    } catch {
      return { ...defaultStats };
    }
  }

  function saveStats(stats) {
    localStorage.setItem(KEY_STATS, JSON.stringify(stats));
  }

  function updateStats(patch) {
    const stats = getStats();
    for (const [k, v] of Object.entries(patch)) {
      if (k in stats) stats[k] += v;
    }
    saveStats(stats);
  }

  function getSettings() {
    try {
      return Object.assign({}, defaultSettings, JSON.parse(localStorage.getItem(KEY_SETTINGS) || '{}'));
    } catch {
      return { ...defaultSettings };
    }
  }

  function saveSettings(settings) {
    localStorage.setItem(KEY_SETTINGS, JSON.stringify(settings));
  }

  return { getHighScore, setHighScore, getStats, updateStats, getSettings, saveSettings };
})();
