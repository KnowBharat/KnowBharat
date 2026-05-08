// Hooks/useMapLevel.js
import { useState } from 'react';

// ── Level definitions ─────────────────────────────────────────────────────────
export const LEVELS = [
  {
    id: 1,
    label: 'Level 1',
    title: 'State Names',
    emoji: '🗺️',
    color: '#00b4d8',
    description: 'Learn the names of all Indian states',
    fields:      ['name'],
    views:       ['basic'],
    basicFields: ['name'],
  },
  {
    id: 2,
    label: 'Level 2',
    title: 'Capitals',
    emoji: '🏛️',
    color: '#f77f00',
    description: 'Learn state capitals & their stories',
    fields:      ['name', 'capital'],
    views:       ['basic'],
    basicFields: ['name', 'capital', 'aboutCapital'],
  },
  {
    id: 3,
    label: 'Level 3',
    title: 'People & Language',
    emoji: '🗣️',
    color: '#8338ec',
    description: 'Discover languages & populations',
    fields:      ['name', 'capital', 'population', 'language'],
    views:       ['basic'],
    basicFields: ['name', 'capital', 'aboutCapital', 'population', 'language'],
  },
  {
    id: 4,
    label: 'Level 4',
    title: 'Geography',
    emoji: '📐',
    color: '#138808',
    description: 'Explore area & establishment dates',
    fields:      ['name', 'capital', 'population', 'language', 'area', 'established'],
    views:       ['basic'],
    basicFields: ['name', 'capital', 'aboutCapital', 'population', 'language', 'area', 'established'],
  },
  {
    id: 5,
    label: 'Level 5',
    title: 'Culture & Heritage',
    emoji: '🎭',
    color: '#FF6B35',
    description: 'Explore food, festivals, wear & tourism',
    fields:      ['name', 'capital', 'population', 'language', 'area', 'established'],
    views:       ['basic', 'food', 'festival', 'wear', 'tourist'],
    basicFields: ['name', 'capital', 'aboutCapital', 'population', 'language', 'area', 'established', 'about'],
  },
];

// Human-readable labels for sidebar display and quiz
export const FIELD_META = {
  name:         { label: 'State Name',    emoji: '🗺️' },
  capital:      { label: 'Capital',       emoji: '🏛️' },
  aboutCapital: { label: 'About Capital', emoji: '📝' },
  population:   { label: 'Population',   emoji: '👨‍👩‍👧' },
  language:     { label: 'Language',     emoji: '🗣️' },
  area:         { label: 'Area',         emoji: '📐' },
  established:  { label: 'Established',  emoji: '📅' },
  about:        { label: 'About',        emoji: '📖' },
};

// ── Hook ──────────────────────────────────────────────────────────────────────
export default function useMapLevel() {
  // null means the level-picker screen is showing
  const [currentLevel, setCurrentLevel] = useState(null);

  const level = LEVELS.find(l => l.id === currentLevel) ?? null;

  /** Is a sidebar tab unlocked at this level? */
  const canViewTab  = (view)  => level?.views.includes(view)       ?? false;
  /** Should a basic-info field be displayed? */
  const isFieldShow = (field) => level?.basicFields.includes(field) ?? false;
  /** Fields used in quiz "Try Yourself" mode */
  const quizFields  = level?.fields ?? [];

  return {
    currentLevel,
    setCurrentLevel,
    level,          // full level object (or null)
    canViewTab,
    isFieldShow,
    quizFields,
  };
}