/**
 * Archie Character & Classroom Environments Data Manifest
 * 
 * Provides metadata, categories, and direct paths for:
 * - 15 distinct high-definition vector environments
 * - 43 distinct Archie puppet poses, lip-sync frames, and gestures
 */

export interface ClassroomEnvironment {
  id: string;
  name: string;
  category: 'Technology' | 'Space & Physics' | 'Earth Science' | 'Humanities' | 'Engineering' | 'Creator Studio';
  desc: string;
  props: string[];
  lighting: string;
  svgPath: string;
  imageUrl?: string;
  integratedSeatedUrl?: string;
  integratedExplainingUrl?: string;
  isCinematic?: boolean;
  recommendedPoseId: string;
  recommendedTopic: string;
}

export interface PuppetPose {
  id: string;
  name: string;
  category: 'Explaining' | 'Thinking' | 'Neutral' | 'Surprised' | 'Seated' | 'Walking' | 'Lip-Sync';
  gesture: string;
  framing: 'Full Body' | 'Medium' | 'Close-Up';
  svgPath: string;
  pngPath: string;
  imageUrl?: string;
  isTalking: boolean;
  isBlinking: boolean;
  isPhotorealistic?: boolean;
}

export const CLASSROOM_ENVIRONMENTS: ClassroomEnvironment[] = [
  {
    id: 'creator_studio_warm',
    name: 'Warm Creator Studio & Desk',
    category: 'Creator Studio',
    desc: 'Cinematic YouTube creator studio with walnut desk, ergonomic mesh chair, boom arm microphone, and warm backlit bookshelves with science curiosities.',
    props: ['Mahogany Studio Desk', 'Ergonomic Mesh Chair', 'Broadcast Boom Mic', 'Backlit Bookshelf', 'Warm Desk Lamp'],
    lighting: 'Warm Amber Tungsten & Soft Bokeh Shelf Lighting',
    svgPath: '/src/assets/images/studio_env_desk_chair_1790754334372.jpg',
    imageUrl: '/src/assets/images/studio_env_desk_chair_1790754334372.jpg',
    integratedSeatedUrl: '/src/assets/images/studio_archie_seated_1790754305287.jpg',
    integratedExplainingUrl: '/src/assets/images/studio_archie_explaining_1790754317454.jpg',
    isCinematic: true,
    recommendedPoseId: 'archie_studio_seated_natural',
    recommendedTopic: 'Why Does Your Phone Get Hot While Fast Charging?'
  },
  {
    id: 'bio_quantum_lab',
    name: 'High-Tech Research Workbench',
    category: 'Creator Studio',
    desc: 'State-of-the-art laboratory with illuminated workbench, holographic scientific telemetry, glassware, and dual cyan/tungsten volumetric lighting.',
    props: ['Illuminated Workbench', 'Holographic Telemetry', 'Glassware Flasks', 'Modern Glass Partitions'],
    lighting: 'Volumetric Cyan & Warm Tungsten Ambient Glow',
    svgPath: '/src/assets/images/lab_env_high_tech_1790754347089.jpg',
    imageUrl: '/src/assets/images/lab_env_high_tech_1790754347089.jpg',
    isCinematic: true,
    recommendedPoseId: 'archie_studio_explaining_gesture',
    recommendedTopic: 'How Quantum Superconductors Float Without Touching Anything'
  },
  {
    id: 'cinematic_panorama_studio',
    name: 'Cinematic Wide Educator Studio (16:9)',
    category: 'Creator Studio',
    desc: 'Expansive horizontal educator suite with polished studio desk, broadcast audio gear, and warm ambient library background.',
    props: ['Expansive Studio Desk', 'Broadcast Audio Mic', 'Amber Reading Lamp', 'Floor-to-Ceiling Shelving'],
    lighting: 'Atmospheric Cinematic Amber & Soft Key Lighting',
    svgPath: '/src/assets/images/studio_env_horizontal_1790754359608.jpg',
    imageUrl: '/src/assets/images/studio_env_horizontal_1790754359608.jpg',
    isCinematic: true,
    recommendedPoseId: 'archie_studio_seated_natural',
    recommendedTopic: 'The Untold Physics of Everyday Technology'
  },
  {
    id: 'cyber_stem',
    name: 'Cyber Innovation Lab',
    category: 'Technology',
    desc: 'Futuristic digital lab with a glowing cyan smartboard, holographic ceiling HUD rings, and a robotic manipulator arm.',
    props: ['Cyan Smartboard', 'Holographic Rings', 'Robotic Arm', 'Circuit Traces'],
    lighting: 'Dark Navy with Neon Cyan & Violet Accents',
    svgPath: '/classrooms/cyber_stem.svg',
    recommendedPoseId: 'puppet_standing_point_board',
    recommendedTopic: 'Why Does Your Phone Get Hot While Charging?'
  },
  {
    id: 'ivy_hall',
    name: 'Ivy League Lecture Hall',
    category: 'Humanities',
    desc: 'Steep mahogany lecture amphitheater featuring vintage green slate chalkboard, chalk formulas, and brass banker lamps.',
    props: ['Green Chalkboard', 'Mahogany Tiers', 'Brass Banker Lamps', 'Chalk Diagrams'],
    lighting: 'Warm Amber & Deep Mahogany Wood',
    svgPath: '/classrooms/ivy_hall.svg',
    recommendedPoseId: 'puppet_point_up_right',
    recommendedTopic: 'The Mathematical Paradoxes of Ancient Architecture'
  },
  {
    id: 'scandi_science',
    name: 'Scandinavian Science Studio',
    category: 'Earth Science',
    desc: 'Bright sunlit loft studio with arched skylights, light birch workbenches, cascading botanical vines, and clean magnetic whiteboards.',
    props: ['Arched Loft Windows', 'Birch Wood Table', 'Botanical Ivy', 'Magnetic Board'],
    lighting: 'Natural Morning Daylight & Soft Birch Warmth',
    svgPath: '/classrooms/scandi_science.svg',
    recommendedPoseId: 'puppet_explain_both',
    recommendedTopic: 'How Plants Convert Sunlight into Clean Bio-Energy'
  },
  {
    id: 'planetarium',
    name: 'Cosmic Astrophysics Planetarium',
    category: 'Space & Physics',
    desc: 'Curved planetarium dome projection displaying orbiting planetary rings, celestial star fields, and violet pod workstations.',
    props: ['Orbiting Hologram', 'Constellation Dome', 'Curved Display', 'Violet Pods'],
    lighting: 'Deep Ultraviolet & Starfield Glow',
    svgPath: '/classrooms/planetarium.svg',
    recommendedPoseId: 'puppet_point_up_left',
    recommendedTopic: 'Why Do Neutron Stars Spin 700 Times a Second?'
  },
  {
    id: 'chem_lab',
    name: 'Discovery Chemistry Lab',
    category: 'Space & Physics',
    desc: 'Industrial subway-tile laboratory equipped with brass condenser coils, bubbling liquid flasks, reagent racks, and compound microscopes.',
    props: ['Bubbling Flasks', 'Brass Condenser', 'Microscope', 'Reagent Racks'],
    lighting: 'Crisp White Fluorescent with Amber Chemical Glow',
    svgPath: '/classrooms/chem_lab.svg',
    recommendedPoseId: 'puppet_thinking',
    recommendedTopic: 'What Happens When Water Drops on Liquid Nitrogen?'
  },
  {
    id: 'robotics_garage',
    name: 'Robotics & AI Garage',
    category: 'Technology',
    desc: 'High-tech fabrication garage with a 6-axis industrial robotic arm, active 3D printer beds, and overhead blueprint screens.',
    props: ['6-Axis Robot Arm', '3D Printer Glow', 'Blueprint Display', 'Tool Rack'],
    lighting: 'Industrial Steel & Hazard Striped Yellow Glow',
    svgPath: '/classrooms/robotics_garage.svg',
    recommendedPoseId: 'puppet_explain_both_talk',
    recommendedTopic: 'How Modern Bipedal Robots Balance in Real-Time'
  },
  {
    id: 'particle_collider',
    name: 'Particle Collider Tunnel',
    category: 'Space & Physics',
    desc: 'Subterranean synchrotron beamline with massive circular quadrupole magnets, vacuum conduit pipes, and luminosity sensors.',
    props: ['Circular Beamline', 'Vacuum Conduits', 'Luminosity Monitor', 'Cryostat Lines'],
    lighting: 'Electric Blue Ionization with Tunnel Perspective',
    svgPath: '/classrooms/particle_collider.svg',
    recommendedPoseId: 'puppet_point_right',
    recommendedTopic: 'How the Large Hadron Collider Discovers New Particles'
  },
  {
    id: 'forensic_csi',
    name: 'Forensic CSI Studio',
    category: 'Technology',
    desc: 'Cleanroom crime investigation suite with an illuminated light table, DNA spectrometer holographic displays, and chemical reagents.',
    props: ['Illuminated Light Table', 'DNA Spectrometer', 'Fingerprint Projector', 'Evidence Trays'],
    lighting: 'Ultraviolet CSI Blacklight & Cold Quartz White',
    svgPath: '/classrooms/forensic_csi.svg',
    recommendedPoseId: 'puppet_confused',
    recommendedTopic: 'How Digital Forensics Recovers Deleted Data from Flash Drives'
  },
  {
    id: 'zero_g_station',
    name: 'Zero-G Orbital Station',
    category: 'Space & Physics',
    desc: 'Orbital spacecraft module overlooking the curved blue curve of Earth through panoramic cupola windows with floating telemetry panels.',
    props: ['Earth Cupola Viewport', 'Ceiling Handrails', 'Floating Tablet', 'Telemetry Displays'],
    lighting: 'Solar Reflected Earth Horizon Blue',
    svgPath: '/classrooms/zero_g_station.svg',
    recommendedPoseId: 'puppet_explain_both',
    recommendedTopic: 'Why Objects Float in Space (The Truth About Freefall)'
  },
  {
    id: 'quantum_vault',
    name: 'Quantum Supercomputing Vault',
    category: 'Technology',
    desc: 'Sub-Kelvin cryostat chamber showcasing a suspended gold chandelier quantum processor, coaxial microwave lines, and qubit matrix readouts.',
    props: ['Gold Dilution Chandelier', 'Coaxial Cables', 'Qubit Readout Screen', 'Cryo Shield'],
    lighting: 'Golden Metallic Specular with Cyan Laser Traces',
    svgPath: '/classrooms/quantum_vault.svg',
    recommendedPoseId: 'puppet_surprised',
    recommendedTopic: 'Quantum Superposition: Can a Bit Be 0 and 1 at Once?'
  },
  {
    id: 'marine_ocean',
    name: 'Deep Ocean Marine Observatory',
    category: 'Earth Science',
    desc: 'Sub-surface abyssal viewing lounge with reinforced curved acrylic portals looking out into the deep sea with glowing bioluminescent life.',
    props: ['Reinforced Portal Window', 'Bioluminescent Marine Life', 'Sonar Console', 'Depth Gauge'],
    lighting: 'Abyssal Midnight Blue with Bioluminescent Teal Glow',
    svgPath: '/classrooms/marine_ocean.svg',
    recommendedPoseId: 'puppet_point_up_left',
    recommendedTopic: 'How Deep Ocean Animals Survive 1,000 Atmospheres of Pressure'
  },
  {
    id: 'geothermal_hub',
    name: 'Geothermal Volcanology Hub',
    category: 'Earth Science',
    desc: 'Subterranean volcanic monitoring observatory overlooking molten magma flows with real-time digital seismographs and thermal sensors.',
    props: ['Basalt Observation Bay', 'Magma Conduits', 'Seismograph Graph', 'Thermal Scanners'],
    lighting: 'Incandescent Volcanic Orange & Charcoal Basalt',
    svgPath: '/classrooms/geothermal_hub.svg',
    recommendedPoseId: 'puppet_standing_point_board',
    recommendedTopic: 'Why Earth Has a Magnetic Shield (The Liquid Iron Dynamo)'
  },
  {
    id: 'mythology_hall',
    name: 'Classical History & Philosophy Hall',
    category: 'Humanities',
    desc: 'Open-air Mediterranean terrace surrounded by fluted Corinthian columns, classical philosopher marble busts, and illuminated papyrus scrolls.',
    props: ['Fluted Marble Columns', 'Philosopher Bust Statues', 'Papyrus Scrolls', 'Arched Terrace'],
    lighting: 'Aegean Golden Hour Sunlight & Pure White Marble',
    svgPath: '/classrooms/mythology_hall.svg',
    recommendedPoseId: 'puppet_thinking',
    recommendedTopic: 'The Lost Inventions of Archimedes and Ancient Engineers'
  },
  {
    id: 'spatial_ar_vr',
    name: 'Spatial AR/VR Holodeck',
    category: 'Technology',
    desc: 'Futuristic holographic sandbox with a glowing hexagonal coordinate floor, floating volumetric 3D wireframe models, and neural interfaces.',
    props: ['Hexagonal Floor Grid', 'Volumetric Wireframe Model', 'Neural Visor', 'Coordinate HUD'],
    lighting: 'Deep Violet & Neon Magenta Hologram Glow',
    svgPath: '/classrooms/spatial_ar_vr.svg',
    recommendedPoseId: 'puppet_point_right_talk',
    recommendedTopic: 'How Spatial Audio Tricks Your Brain into Locating Sounds'
  },
  {
    id: 'aero_wind_tunnel',
    name: 'Supersonic Wind Tunnel',
    category: 'Engineering',
    desc: 'Aeronautics test tunnel featuring laminar smoke streamlines flowing over a test airfoil model, pitot tubes, and air velocity gauges.',
    props: ['Streamline Smoke Generator', 'Airfoil Sting Mount', 'Pitot Pressure Tubes', 'Velocity Readout'],
    lighting: 'Aerospace Charcoal Gray & Aerodynamic Smoke White',
    svgPath: '/classrooms/aero_wind_tunnel.svg',
    recommendedPoseId: 'puppet_explain_both',
    recommendedTopic: 'Why Airplane Windows Have Tiny Bleed Holes'
  }
];

export const ARCHIE_PUPPET_POSES: PuppetPose[] = [
  {
    id: 'archie_podcast_sitting_sprite',
    name: 'Podcast Seated Desk Sprite (Transparent)',
    category: 'Seated',
    gesture: 'Archie sitting naturally at podcast desk with forearms resting forward, smiling warmly at camera',
    framing: 'Medium',
    svgPath: '/sprites/archie_sitting_transparent.png',
    pngPath: '/sprites/archie_sitting_transparent.png',
    imageUrl: '/sprites/archie_sitting_transparent.png',
    isTalking: false,
    isBlinking: false,
    isPhotorealistic: true
  },
  {
    id: 'archie_podcast_explaining_sprite',
    name: 'Podcast Explaining Gesture Sprite (Transparent)',
    category: 'Explaining',
    gesture: 'Archie seated gesturing with hands explaining complex science concepts into the mic',
    framing: 'Medium',
    svgPath: '/sprites/archie_explaining_transparent.png',
    pngPath: '/sprites/archie_explaining_transparent.png',
    imageUrl: '/sprites/archie_explaining_transparent.png',
    isTalking: true,
    isBlinking: false,
    isPhotorealistic: true
  },
  {
    id: 'archie_podcast_thinking_sprite',
    name: 'Podcast Contemplation Sprite (Transparent)',
    category: 'Thinking',
    gesture: 'Archie seated with hand on chin in deep scientific contemplation',
    framing: 'Medium',
    svgPath: '/sprites/archie_thinking_transparent.png',
    pngPath: '/sprites/archie_thinking_transparent.png',
    imageUrl: '/sprites/archie_thinking_transparent.png',
    isTalking: false,
    isBlinking: false,
    isPhotorealistic: true
  },
  {
    id: 'archie_studio_seated_natural',
    name: 'Studio Desk Seated (Natural)',
    category: 'Seated',
    gesture: 'Naturally seated in ergonomic creator chair at mahogany desk, relaxed hands on surface with podcast mic',
    framing: 'Medium',
    svgPath: '/src/assets/images/studio_archie_seated_1790754305287.jpg',
    pngPath: '/src/assets/images/studio_archie_seated_1790754305287.jpg',
    imageUrl: '/src/assets/images/studio_archie_seated_1790754305287.jpg',
    isTalking: false,
    isBlinking: false,
    isPhotorealistic: true
  },
  {
    id: 'archie_studio_explaining_gesture',
    name: 'Studio Desk Explaining (Dynamic Gesture)',
    category: 'Explaining',
    gesture: 'Seated at creator desk actively gesturing with hands to explain scientific discovery',
    framing: 'Medium',
    svgPath: '/src/assets/images/studio_archie_explaining_1790754317454.jpg',
    pngPath: '/src/assets/images/studio_archie_explaining_1790754317454.jpg',
    imageUrl: '/src/assets/images/studio_archie_explaining_1790754317454.jpg',
    isTalking: true,
    isBlinking: false,
    isPhotorealistic: true
  },
  {
    id: 'puppet_idle',
    name: 'Confident Idle',
    category: 'Neutral',
    gesture: 'Relaxed posture, hands resting naturally, engaging direct eye contact',
    framing: 'Full Body',
    svgPath: '/cartoon_character_assets/exact_puppet/puppet_idle.svg',
    pngPath: '/cartoon_character_assets/exact_puppet/puppet_idle.png',
    isTalking: false,
    isBlinking: false
  },
  {
    id: 'puppet_talking',
    name: 'Active Speaker',
    category: 'Explaining',
    gesture: 'Open mouth delivery with hand gesture guiding viewer attention',
    framing: 'Full Body',
    svgPath: '/cartoon_character_assets/exact_puppet/puppet_talking.svg',
    pngPath: '/cartoon_character_assets/exact_puppet/puppet_talking.png',
    isTalking: true,
    isBlinking: false
  },
  {
    id: 'puppet_blink',
    name: 'Natural Blink',
    category: 'Neutral',
    gesture: 'Micro-expression blink cycle for lifelike character motion',
    framing: 'Full Body',
    svgPath: '/cartoon_character_assets/exact_puppet/puppet_blink.svg',
    pngPath: '/cartoon_character_assets/exact_puppet/puppet_blink.png',
    isTalking: false,
    isBlinking: true
  },
  {
    id: 'puppet_explain_both',
    name: 'Open Palms Explainer',
    category: 'Explaining',
    gesture: 'Both hands extended in open-palm welcoming explainer stance',
    framing: 'Full Body',
    svgPath: '/cartoon_character_assets/exact_puppet/puppet_explain_both.svg',
    pngPath: '/cartoon_character_assets/exact_puppet/puppet_explain_both.png',
    isTalking: false,
    isBlinking: false
  },
  {
    id: 'puppet_explain_both_talk',
    name: 'Open Palms Delivering',
    category: 'Explaining',
    gesture: 'Speaking actively while gesturing with both palms open to audience',
    framing: 'Full Body',
    svgPath: '/cartoon_character_assets/exact_puppet/puppet_explain_both_talk.svg',
    pngPath: '/cartoon_character_assets/exact_puppet/puppet_explain_both_talk.png',
    isTalking: true,
    isBlinking: false
  },
  {
    id: 'puppet_thinking',
    name: 'Deep In Thought',
    category: 'Thinking',
    gesture: 'Hand to chin, contemplative eyebrow tilt, considering the puzzle',
    framing: 'Full Body',
    svgPath: '/cartoon_character_assets/exact_puppet/puppet_thinking.svg',
    pngPath: '/cartoon_character_assets/exact_puppet/puppet_thinking.png',
    isTalking: false,
    isBlinking: false
  },
  {
    id: 'puppet_thinking_talk',
    name: 'Thinking & Speculating',
    category: 'Thinking',
    gesture: 'Hand to chin while speaking aloud a hypothesis',
    framing: 'Full Body',
    svgPath: '/cartoon_character_assets/exact_puppet/puppet_thinking_talk.svg',
    pngPath: '/cartoon_character_assets/exact_puppet/puppet_thinking_talk.png',
    isTalking: true,
    isBlinking: false
  },
  {
    id: 'puppet_surprised',
    name: 'Mind-Blown Discovery',
    category: 'Surprised',
    gesture: 'Wide expressive eyes and raised hands reacting to a surprising science fact',
    framing: 'Full Body',
    svgPath: '/cartoon_character_assets/exact_puppet/puppet_surprised.svg',
    pngPath: '/cartoon_character_assets/exact_puppet/puppet_surprised.png',
    isTalking: false,
    isBlinking: false
  },
  {
    id: 'puppet_surprised_talk',
    name: 'Shocked Explanation',
    category: 'Surprised',
    gesture: 'Speaking with dramatic emphasis on a counter-intuitive truth',
    framing: 'Full Body',
    svgPath: '/cartoon_character_assets/exact_puppet/puppet_surprised_talk.svg',
    pngPath: '/cartoon_character_assets/exact_puppet/puppet_surprised_talk.png',
    isTalking: true,
    isBlinking: false
  },
  {
    id: 'puppet_standing_point_board',
    name: 'Smartboard Presenter',
    category: 'Explaining',
    gesture: 'Standing tall and directing audience focus directly to the smartboard display',
    framing: 'Full Body',
    svgPath: '/cartoon_character_assets/exact_puppet/puppet_standing_point_board.svg',
    pngPath: '/cartoon_character_assets/exact_puppet/puppet_standing_point_board.png',
    isTalking: false,
    isBlinking: false
  },
  {
    id: 'puppet_standing_point_board_talk',
    name: 'Board Presenter Speaking',
    category: 'Explaining',
    gesture: 'Pointing to the formula or diagram while actively explaining the principle',
    framing: 'Full Body',
    svgPath: '/cartoon_character_assets/exact_puppet/puppet_standing_point_board_talk.svg',
    pngPath: '/cartoon_character_assets/exact_puppet/puppet_standing_point_board_talk.png',
    isTalking: true,
    isBlinking: false
  },
  {
    id: 'puppet_point_right',
    name: 'Point Right',
    category: 'Explaining',
    gesture: 'Arm extended pointing to key UI data or diagram on the right',
    framing: 'Full Body',
    svgPath: '/cartoon_character_assets/exact_puppet/puppet_point_right.svg',
    pngPath: '/cartoon_character_assets/exact_puppet/puppet_point_right.png',
    isTalking: false,
    isBlinking: false
  },
  {
    id: 'puppet_point_right_talk',
    name: 'Point Right Speaking',
    category: 'Explaining',
    gesture: 'Directing attention rightward while narrating the explanation',
    framing: 'Full Body',
    svgPath: '/cartoon_character_assets/exact_puppet/puppet_point_right_talk.svg',
    pngPath: '/cartoon_character_assets/exact_puppet/puppet_point_right_talk.png',
    isTalking: true,
    isBlinking: false
  },
  {
    id: 'puppet_point_left',
    name: 'Point Left',
    category: 'Explaining',
    gesture: 'Arm extended pointing left to comparison props or text card',
    framing: 'Full Body',
    svgPath: '/cartoon_character_assets/exact_puppet/puppet_point_left.svg',
    pngPath: '/cartoon_character_assets/exact_puppet/puppet_point_left.png',
    isTalking: false,
    isBlinking: false
  },
  {
    id: 'puppet_point_up_right',
    name: 'Point Up-Right (Key Hook)',
    category: 'Explaining',
    gesture: 'Pointing upward toward overhead floating title or hook text',
    framing: 'Full Body',
    svgPath: '/cartoon_character_assets/exact_puppet/puppet_point_up_right.svg',
    pngPath: '/cartoon_character_assets/exact_puppet/puppet_point_up_right.png',
    isTalking: false,
    isBlinking: false
  },
  {
    id: 'puppet_point_up_left',
    name: 'Point Up-Left (Infographic)',
    category: 'Explaining',
    gesture: 'Pointing upward toward overhead metric or diagram banner',
    framing: 'Full Body',
    svgPath: '/cartoon_character_assets/exact_puppet/puppet_point_up_left.svg',
    pngPath: '/cartoon_character_assets/exact_puppet/puppet_point_up_left.png',
    isTalking: false,
    isBlinking: false
  },
  {
    id: 'puppet_confused',
    name: 'Challenged / Puzzled',
    category: 'Thinking',
    gesture: 'Head tilted, hands raised asking "How is that even possible?"',
    framing: 'Full Body',
    svgPath: '/cartoon_character_assets/exact_puppet/puppet_confused.svg',
    pngPath: '/cartoon_character_assets/exact_puppet/puppet_confused.png',
    isTalking: false,
    isBlinking: false
  },
  {
    id: 'puppet_questioning_users',
    name: 'Viewer Callout / Question',
    category: 'Thinking',
    gesture: 'Directly addressing the audience: "Which option would you choose?"',
    framing: 'Full Body',
    svgPath: '/cartoon_character_assets/exact_puppet/puppet_questioning_users.svg',
    pngPath: '/cartoon_character_assets/exact_puppet/puppet_questioning_users.png',
    isTalking: false,
    isBlinking: false
  },
  {
    id: 'puppet_desk_seated',
    name: 'Seated at Lab Desk',
    category: 'Seated',
    gesture: 'Seated comfortably behind the lab bench ready to inspect instruments',
    framing: 'Medium',
    svgPath: '/cartoon_character_assets/exact_puppet/puppet_desk_seated.svg',
    pngPath: '/cartoon_character_assets/exact_puppet/puppet_desk_seated.png',
    isTalking: false,
    isBlinking: false
  },
  {
    id: 'puppet_desk_seated_talk',
    name: 'Seated Desk Speaker',
    category: 'Seated',
    gesture: 'Speaking from behind the research bench in conversational tone',
    framing: 'Medium',
    svgPath: '/cartoon_character_assets/exact_puppet/puppet_desk_seated_talk.svg',
    pngPath: '/cartoon_character_assets/exact_puppet/puppet_desk_seated_talk.png',
    isTalking: true,
    isBlinking: false
  },
  {
    id: 'puppet_walking',
    name: 'Walk Cycle In-Transit',
    category: 'Walking',
    gesture: 'Natural stride walking across the laboratory floor',
    framing: 'Full Body',
    svgPath: '/cartoon_character_assets/exact_puppet/puppet_walking.svg',
    pngPath: '/cartoon_character_assets/exact_puppet/puppet_walking.png',
    isTalking: false,
    isBlinking: false
  },
  {
    id: 'puppet_walk_stride1',
    name: 'Walk Cycle Stride 1',
    category: 'Walking',
    gesture: 'Dynamic forward movement pacing across the lecture stage',
    framing: 'Full Body',
    svgPath: '/cartoon_character_assets/exact_puppet/puppet_walk_stride1.svg',
    pngPath: '/cartoon_character_assets/exact_puppet/puppet_walk_stride1.png',
    isTalking: false,
    isBlinking: false
  },
  {
    id: 'puppet_akimbo_jaw',
    name: 'Akimbo Stance',
    category: 'Neutral',
    gesture: 'Hands on hips confident stance commanding stage presence',
    framing: 'Full Body',
    svgPath: '/cartoon_character_assets/exact_puppet/puppet_akimbo_jaw.svg',
    pngPath: '/cartoon_character_assets/exact_puppet/puppet_akimbo_jaw.png',
    isTalking: false,
    isBlinking: false
  }
];
