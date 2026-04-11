import { TRACKS, state } from '../state/store.js';
import { getPatIdx } from './helpers.js';

const MAX_UNDO = 50;
const undoStack = [];
const redoStack = [];

function snapshot() {
  return TRACKS.map(t => {
    const pat = t.patterns[getPatIdx(t)];
    return {
      acts: [...pat.acts],
      vels: [...pat.vels],
      probs: [...pat.probs],
    };
  });
}

export function pushUndo() {
  undoStack.push({ selectedTrack: state.selectedTrack, selectedPat: state.selectedPat, data: snapshot() });
  if (undoStack.length > MAX_UNDO) undoStack.shift();
  redoStack.length = 0;
}

export function undo(renderCb) {
  if (undoStack.length === 0) return;
  redoStack.push({ selectedTrack: state.selectedTrack, selectedPat: state.selectedPat, data: snapshot() });
  const entry = undoStack.pop();
  restore(entry);
  if (renderCb) renderCb();
}

export function redo(renderCb) {
  if (redoStack.length === 0) return;
  undoStack.push({ selectedTrack: state.selectedTrack, selectedPat: state.selectedPat, data: snapshot() });
  const entry = redoStack.pop();
  restore(entry);
  if (renderCb) renderCb();
}

function restore(entry) {
  entry.data.forEach((snap, ti) => {
    const t = TRACKS[ti];
    if (!t) return;
    const pat = t.patterns[getPatIdx(t)];
    pat.acts = [...snap.acts];
    pat.vels = [...snap.vels];
    pat.probs = [...snap.probs];
  });
}
