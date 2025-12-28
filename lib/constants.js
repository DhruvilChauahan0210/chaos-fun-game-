// Game constants and configuration

export const CANVAS = {
  WIDTH: 1200,
  HEIGHT: 800,
  BACKGROUND: '#0a0a1a',
};

export const PHYSICS = {
  GRAVITY: { x: 0, y: 1 },
  TIME_SCALE: 1,
};

export const COLORS = {
  // Object colors
  BOX: '#ff6b6b',
  CIRCLE: '#4ecdc4',
  TRIANGLE: '#ffe66d',
  PLANK: '#95afc0',
  BALLOON: '#ff9ff3',
  EXPLOSIVE: '#ff4757',
  JELLY: '#7bed9f',
  ANVIL: '#57606f',
  
  // UI colors
  PRIMARY: '#6c5ce7',
  SECONDARY: '#a29bfe',
  ACCENT: '#00cec9',
  DANGER: '#ff6b6b',
  WARNING: '#ffeaa7',
  
  // Tool colors
  TOOL_SPAWN: '#00cec9',
  TOOL_PUSH: '#6c5ce7',
  TOOL_EXPLODE: '#ff4757',
  TOOL_GRAVITY: '#ffeaa7',
  TOOL_SCALE: '#ff9ff3',
};

export const OBJECTS = {
  BOX: {
    type: 'box',
    label: 'Box',
    width: 50,
    height: 50,
    color: COLORS.BOX,
    friction: 0.5,
    restitution: 0.3,
    density: 0.001,
  },
  CIRCLE: {
    type: 'circle',
    label: 'Circle',
    radius: 25,
    color: COLORS.CIRCLE,
    friction: 0.1,
    restitution: 0.6,
    density: 0.001,
  },
  TRIANGLE: {
    type: 'triangle',
    label: 'Triangle',
    size: 50,
    color: COLORS.TRIANGLE,
    friction: 0.4,
    restitution: 0.2,
    density: 0.001,
  },
  PLANK: {
    type: 'plank',
    label: 'Plank',
    width: 150,
    height: 20,
    color: COLORS.PLANK,
    friction: 0.8,
    restitution: 0.1,
    density: 0.002,
  },
  BALLOON: {
    type: 'balloon',
    label: 'Balloon',
    radius: 30,
    color: COLORS.BALLOON,
    friction: 0.1,
    restitution: 0.8,
    density: 0.0001, // Very light
    floaty: true,
  },
  EXPLOSIVE: {
    type: 'explosive',
    label: 'Explosive Barrel',
    width: 40,
    height: 60,
    color: COLORS.EXPLOSIVE,
    friction: 0.6,
    restitution: 0.2,
    density: 0.002,
    explosive: true,
    explosionForce: 0.5,
    explosionRadius: 200,
  },
  JELLY: {
    type: 'jelly',
    label: 'Jelly Block',
    width: 60,
    height: 60,
    color: COLORS.JELLY,
    friction: 0.2,
    restitution: 0.9, // Very bouncy
    density: 0.0008,
  },
  ANVIL: {
    type: 'anvil',
    label: 'Anvil',
    width: 70,
    height: 50,
    color: COLORS.ANVIL,
    friction: 0.9,
    restitution: 0.05,
    density: 0.01, // Very heavy
  },
};

export const TOOLS = {
  SPAWN: {
    id: 'spawn',
    label: 'Spawn',
    icon: '📦',
    color: COLORS.TOOL_SPAWN,
    shortcut: '1',
  },
  PUSH: {
    id: 'push',
    label: 'Push',
    icon: '💨',
    color: COLORS.TOOL_PUSH,
    shortcut: '2',
    force: 0.05,
  },
  EXPLODE: {
    id: 'explode',
    label: 'Explode',
    icon: '💥',
    color: COLORS.TOOL_EXPLODE,
    shortcut: '3',
    force: 0.3,
    radius: 150,
  },
  GRAVITY: {
    id: 'gravity',
    label: 'Flip Gravity',
    icon: '🔄',
    color: COLORS.TOOL_GRAVITY,
    shortcut: '4',
  },
  SCALE: {
    id: 'scale',
    label: 'Grow/Shrink',
    icon: '🔍',
    color: COLORS.TOOL_SCALE,
    shortcut: '5',
    scaleFactor: 1.5,
  },
};

export const SYNC_EVENTS = {
  SPAWN: 'spawn',
  FORCE: 'force',
  TOOL: 'tool',
  GRAVITY: 'gravity',
  CURSOR: 'cursor',
};

export const ROOM = {
  ID_LENGTH: 6,
  MAX_PLAYERS: 8,
};
