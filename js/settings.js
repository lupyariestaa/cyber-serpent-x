/* ══════════════════════════════════════════
   settings.js — Game settings & difficulty
   ══════════════════════════════════════════ */

'use strict';

const Settings = (() => {
  // Difficulty configs: base speed (ms/tick) and speed reduction per level
  const DIFFICULTY = {
    casual:   { baseSpeed: 200, speedStep: 4,  scoreMulti: 1   },
    normal:   { baseSpeed: 150, speedStep: 5,  scoreMulti: 1.5 },
    hardcore: { baseSpeed: 90,  speedStep: 3,  scoreMulti: 2.5 },
  };

  let currentDifficulty = 'normal';
  let prefs = Storage.getSettings();

  function setDifficulty(diff) {
    if (DIFFICULTY[diff]) currentDifficulty = diff;
  }

  function getDifficulty() { return currentDifficulty; }

  function getDifficultyConfig() { return DIFFICULTY[currentDifficulty]; }

  function getSoundEnabled() { return prefs.sound; }

  function getMusicEnabled() { return prefs.music; }

  function toggleSound() {
    prefs.sound = !prefs.sound;
    Storage.saveSettings(prefs);
    return prefs.sound;
  }

  function toggleMusic() {
    prefs.music = !prefs.music;
    Storage.saveSettings(prefs);
    return prefs.music;
  }

  return { setDifficulty, getDifficulty, getDifficultyConfig, getSoundEnabled, getMusicEnabled, toggleSound, toggleMusic };
})();
