export const TEST_TYPES = {
  HEIGHT_WEIGHT: 'height_weight',
  VERTICAL_JUMP: 'vertical_jump',
  SHUTTLE_RUN: 'shuttle_run',
  SITUPS: 'situps',
  ENDURANCE_RUN: 'endurance_run',
};

export const TEST_CONFIG = {
  [TEST_TYPES.HEIGHT_WEIGHT]: {
    name: 'Height & Weight Assessment',
    description: 'Measure your height and weight for baseline assessment',
    icon: 'human-male-height-variant',
    duration: 60, // seconds
    instructions: [
      'Stand straight against a wall for height measurement',
      'Use a calibrated scale for weight measurement',
      'Record measurements clearly in the video',
    ],
    equipment: ['Measuring tape', 'Digital scale'],
  },
  [TEST_TYPES.VERTICAL_JUMP]: {
    name: 'Vertical Jump Test',
    description: 'Test your explosive power and leg strength',
    icon: 'jump-rope',
    duration: 180, // seconds
    instructions: [
      'Stand with feet shoulder-width apart',
      'Jump as high as possible with arms extended',
      'Land softly and maintain balance',
      'Complete 3 attempts',
    ],
    equipment: ['Measuring tape', 'Wall or pole'],
  },
  [TEST_TYPES.SHUTTLE_RUN]: {
    name: 'Shuttle Run Test',
    description: 'Test your agility and speed with direction changes',
    icon: 'run-fast',
    duration: 300, // seconds
    instructions: [
      'Set up markers 10 meters apart',
      'Run back and forth between markers',
      'Touch each marker with your hand',
      'Complete the required distance',
    ],
    equipment: ['Cones or markers', 'Measuring tape'],
  },
  [TEST_TYPES.SITUPS]: {
    name: 'Sit-ups Test',
    description: 'Test your core strength and endurance',
    icon: 'weight-lifter',
    duration: 120, // seconds
    instructions: [
      'Lie on your back with knees bent',
      'Keep feet flat on the ground',
      'Perform sit-ups with proper form',
      'Count each complete repetition',
    ],
    equipment: ['Exercise mat'],
  },
  [TEST_TYPES.ENDURANCE_RUN]: {
    name: 'Endurance Run Test',
    description: 'Test your cardiovascular endurance',
    icon: 'run',
    duration: 900, // seconds (15 minutes max)
    instructions: [
      'Run at a steady pace for the required distance',
      'Maintain consistent breathing',
      'Track your time and distance',
      'Cool down properly after completion',
    ],
    equipment: ['Running track or measured path', 'Stopwatch'],
  },
};

export const ACHIEVEMENT_BADGES = {
  FIRST_TEST: { name: 'First Steps', icon: 'medal', color: '#Bronze' },
  SPEED_DEMON: { name: 'Speed Demon', icon: 'lightning-bolt', color: '#FFD700' },
  STRONG_CORE: { name: 'Strong Core', icon: 'dumbbell', color: '#Silver' },
  ENDURANCE_KING: { name: 'Endurance King', icon: 'crown', color: '#Gold' },
  PERFECT_FORM: { name: 'Perfect Form', icon: 'check-circle', color: '#Green' },
  CONSISTENT: { name: 'Consistent Performer', icon: 'calendar-check', color: '#Blue' },
};