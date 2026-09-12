export interface StudentScienceFact {
  id: string;
  subject: 'Physics' | 'Biology' | 'Chemistry' | 'Space' | 'Neuroscience' | 'Earth Science' | 'Everyday Science';
  hook: string;
  fact: string;
  examRelevance: string;
  whyStudentsNeedIt: string;
  citation: string;
  tags: string[];
}

export const STUDENT_SCIENCE_FACTS: StudentScienceFact[] = [
  {
    id: 'microwave_water_dipole_mug',
    subject: 'Everyday Science',
    hook: 'Why does the microwave heat your soup to boiling, but leaves the ceramic mug cool?',
    fact: 'Microwaves emit 2.45 GHz radiation tuned to rotate the electric dipoles of polar water, sugar, and fat molecules 2.45 billion times per second. Solid non-polar ceramic crystal lattices have no dipole moments, so microwave waves pass straight through without heating them.',
    examRelevance: 'AP Physics & Chemistry / Molecular Polarity & Dielectric Heating',
    whyStudentsNeedIt: 'Everyday breakfast puzzle that perfectly demystifies polar vs. non-polar molecular bonds.',
    citation: 'Metaxas, A. C., Industrial Microwave Heating / Journal of Chemical Physics',
    tags: ['#EverydayScience', '#Microwave', '#Physics', '#Chemistry', '#ArchieExplains', '#Shorts']
  },
  {
    id: 'onions_crying_sulfuric_gas',
    subject: 'Everyday Science',
    hook: 'Why does chopping an onion make your eyes sting with tears?',
    fact: 'Cutting onion cells crushes vacuoles, mixing the enzyme alliinase with sulfoxide amino acids to form volatile syn-propanethial-S-oxide gas. When this gas hits the watery cornea of your eye, it reacts to form microscopic trace sulfuric acid, triggering the lachrymal glands to flush it away with tears.',
    examRelevance: 'AP Biology & Organic Chemistry / Enzymatic Cleavage & Sensory Reflexes',
    whyStudentsNeedIt: 'Explains why chilling onions or using a sharp knife prevents tears by slowing the volatility of the gas.',
    citation: 'Block, E., Garlic and Other Alliums: The Lore and the Science / Royal Society of Chemistry',
    tags: ['#EverydayScience', '#CookingScience', '#Onions', '#Chemistry', '#Shorts']
  },
  {
    id: 'mirrors_flip_left_right_not_up_down',
    subject: 'Everyday Science',
    hook: 'Why do bathroom mirrors flip you left-to-right, but never upside down?',
    fact: 'Mirrors do not actually flip horizontally or vertically at all — they invert along the 3D Z-axis (front-to-back), like turning a glove inside out. When our human brain tries to imagine facing our own reflection, it psychologically imagines a 180° horizontal turn, misattributing the depth reversal to a left-right swap.',
    examRelevance: 'Optics & Cognitive Neuroscience / Geometric Ray Optics & Spatial Perception',
    whyStudentsNeedIt: 'A classic perceptual paradox that forces students to master true 3D coordinate frame transformation.',
    citation: 'Gardner, M., The Ambidextrous Universe / American Journal of Physics',
    tags: ['#Optics', '#MindBlown', '#BrainScience', '#EverydayScience', '#Shorts']
  },
  {
    id: 'wrinkly_fingers_nervous_drainage',
    subject: 'Everyday Science',
    hook: 'Why do your fingers wrinkle in the bath, but your arms and legs don’t?',
    fact: 'Wrinkled bath fingers are not caused by water absorption or skin osmosis. When nerves detect immersion, the sympathetic nervous system actively constricts subcutaneous blood vessels, pulling the skin down into microscopic drainage channels like tire treads to give our hands 12% better grip on wet rocks and tools.',
    examRelevance: 'Anatomy & Evolutionary Biology / Sympathetic Vasoconstriction & Adaptive Traits',
    whyStudentsNeedIt: 'Shatters the myth of skin water absorption: if nerves to the fingers are cut, they never wrinkle in water.',
    citation: 'Changizi, M. et al., Are Wet-Induced Wrinkled Fingers Primate Rain Treads? / Brain, Behavior and Evolution (2011)',
    tags: ['#HumanBody', '#Biology', '#Evolution', '#EverydayStuff', '#Shorts']
  },
  {
    id: 'caffeine_adenosine_blockade_crash',
    subject: 'Everyday Science',
    hook: 'Why doesn’t coffee actually give you any real energy?',
    fact: 'Caffeine has a nearly identical molecular structure to adenosine (the chemical that causes sleepiness). It docks inside adenosine receptors like a key jammed in a lock, blocking the fatigue signal while adenosine continues accumulating in your brain. Once the caffeine metabolizes, all stored adenosine floods the receptors at once, causing the afternoon crash.',
    examRelevance: 'Neuroscience & Pharmacology / Competitive Receptor Antagonism',
    whyStudentsNeedIt: 'Critical intuition for studying students: caffeine borrows tomorrow’s energy today by masking sleep pressure.',
    citation: 'Fredholm, B. B. et al., Actions of Caffeine in the Brain / Pharmacological Reviews',
    tags: ['#Neuroscience', '#Coffee', '#Caffeine', '#StudyHacks', '#EverydayScience']
  },
  {
    id: 'potato_chip_bag_boyle_law',
    subject: 'Everyday Science',
    hook: 'Why do chip bags puff up like balloons when driving up a mountain?',
    fact: 'Chip bags are sealed at sea level where atmospheric pressure is 101.3 kPa. As you ascend a mountain or cruise at altitude, external air pressure drops significantly. By Boyle’s Law (P1V1 = P2V2), the gas trapped inside the sealed bag must expand in volume until the plastic bag bulges near popping point.',
    examRelevance: 'AP Physics & Chemistry / Gas Laws & Fluid Mechanics',
    whyStudentsNeedIt: 'Turns a fun road trip snack observation into an instant intuitive proof of Boyle’s and Dalton’s gas laws.',
    citation: 'Halliday, Resnick, & Walker, Fundamentals of Physics / Gas Thermodynamics',
    tags: ['#GasLaws', '#Physics', '#BoyleLaw', '#RoadTrip', '#EverydayScience']
  },
  {
    id: 'ice_density_marine_life',
    subject: 'Chemistry',
    hook: 'Why do ice cubes float in your drink while solid rocks sink?',
    fact: 'Water reaches its maximum density at 4°C. As it freezes at 0°C, hydrogen bonds lock into an open hexagonal crystalline geometry with 9% empty space inside. Because solid ice is less dense than liquid water, it floats on top, forming an insulating lid that keeps lake bottoms liquid and marine life alive all winter.',
    examRelevance: 'AP Chemistry / Thermodynamics & Intermolecular Forces',
    whyStudentsNeedIt: 'Vital exam question explaining why hydrogen bonding creates anomalous density behavior compared to nearly all other substances.',
    citation: 'IUPAC Water Anomaly Review / Physical Chemistry (Atkins, 11th Ed.)',
    tags: ['#ScienceFacts', '#Chemistry', '#WaterAnomaly', '#ArchieExplains', '#StudyTok']
  },
  {
    id: 'cold_water_sweet_trpm5',
    subject: 'Everyday Science',
    hook: 'Why does ice-cold water taste so refreshing, but warm tap water tastes stale?',
    fact: 'Your tongue’s TRPM5 ion channels transmit sweet, bitter, and savory taste signals much more intensely at warm temperatures (15°C–35°C). When water is ice-cold, TRPM5 activity drops drastically, masking the taste of dissolved minerals while simultaneously triggering pleasant cold thermoreceptors (TRPM8) in your mouth.',
    examRelevance: 'Cellular Physiology & Sensory Biology / TRP Ion Channels & Gustatory Sensation',
    whyStudentsNeedIt: 'Explains why melted ice cream tastes sickeningly sweet compared to when it was frozen.',
    citation: 'Talavera, K. et al., Heat activation of TRPM5 underlies thermal sensitivity of sweet taste / Nature (2005)',
    tags: ['#TasteScience', '#EverydayScience', '#ColdWater', '#Biology', '#Shorts']
  },
  {
    id: 'static_shock_doorknob_winter',
    subject: 'Everyday Science',
    hook: 'Why does touching a metal doorknob in the winter zap your fingers with a spark?',
    fact: 'Cold winter air holds very little water vapor. Without a thin layer of ambient moisture on indoor surfaces to bleed static charges into the ground, friction from walking across carpet strips electrons onto your body, charging you up to 15,000 Volts. Touching conductive metal causes instantaneous dielectric arc breakdown.',
    examRelevance: 'Electrostatics & Coulomb’s Law / Triboelectric Charging & Dielectric Breakdown',
    whyStudentsNeedIt: 'Connects indoor winter friction to electrical potential difference and sparks of miniature lightning.',
    citation: 'Feynman Lectures on Physics, Vol. II: Electromagnetism / Triboelectric Series',
    tags: ['#Electrostatics', '#WinterScience', '#Physics', '#StaticElectricity', '#Shorts']
  },
  {
    id: 'maillard_reaction_toast_flavor',
    subject: 'Everyday Science',
    hook: 'Why does toasted bread smell so amazing while raw dough doesn’t?',
    fact: 'Above 140°C (284°F), the heat of your toaster drives the Maillard reaction, condensing reducing sugars with amino acids. This biochemical cascade forms hundreds of new aromatic ring molecules — like pyrazines and furans — that produce the rich, nutty, caramelized flavor of toast, coffee beans, and seared crust.',
    examRelevance: 'Biochemistry & Food Science / Non-Enzymatic Browning & Carbonyl-Amine Condensation',
    whyStudentsNeedIt: 'Differentiates caramelization (pure sugar pyrolysis) from the protein-sugar Maillard reaction found in everyday cooking.',
    citation: 'McGee, H., On Food and Cooking: The Science and Lore of the Kitchen / Scribner',
    tags: ['#FoodScience', '#CookingScience', '#Chemistry', '#MaillardReaction', '#Shorts']
  },
  {
    id: 'spicy_food_capsaicin_dairy',
    subject: 'Everyday Science',
    hook: 'Why does drinking ice water fail to stop spicy food burning your mouth?',
    fact: 'Capsaicin is a non-polar hydrophobic oil that binds tightly to TRPV1 pain receptors in your tongue (the exact same receptors that detect 43°C scalding burns). Because water is polar, drinking it just smears the capsaicin oil across more taste buds. Only dairy products containing non-polar casein protein can dissolve and rinse the oil away.',
    examRelevance: 'Molecular Polarity & Neurobiology / Hydrophobic Interactions & Nociceptors',
    whyStudentsNeedIt: 'High-yield chemistry intuition: "like dissolves like". Non-polar fats dissolve non-polar oils; polar water cannot.',
    citation: 'Caterina, M. J. et al., The capsaicin receptor: a heat-activated ion channel in the pain pathway / Nature (1997)',
    tags: ['#SpicyFood', '#Chemistry', '#TRPV1', '#EverydayScience', '#Shorts']
  },
  {
    id: 'fresh_cut_grass_glv_signals',
    subject: 'Everyday Science',
    hook: 'What is that iconic smell right after someone mows the lawn?',
    fact: 'The sweet, sharp summer smell of fresh cut grass is actually a chemical distress signal. Damaged grass blades immediately synthesize Green Leaf Volatiles (GLVs) like cis-3-hexenal to activate plant immune defenses and summon predatory insects to come attack hypothetical plant-eating caterpillars.',
    examRelevance: 'Plant Physiology & Chemical Ecology / Jasmonate Signaling & VOC Defense',
    whyStudentsNeedIt: 'Reveals that familiar smells in nature are complex chemical communication networks between plants and insects.',
    citation: 'Dudareva, N. et al., Plant volatiles: recent advances and future perspectives / New Phytologist',
    tags: ['#GrassSmell', '#PlantBiology', '#EverydayScience', '#Chemistry', '#Shorts']
  },
  {
    id: 'soap_virus_membrane_dissolution',
    subject: 'Everyday Science',
    hook: 'Why is plain soap more effective at removing grease and germs than hot water?',
    fact: 'Cooking grease and viral membranes are made of hydrophobic non-polar lipids that repel water. Soap molecules are amphiphilic hybrids: their hydrophobic hydrocarbon tails wedge into grease droplets, surrounding them into microscopic spherical micelles with hydrophilic heads pointing out, which rinse away freely in running water.',
    examRelevance: 'Biochemistry / Surfactants, Micelles & Lipid Bilayers',
    whyStudentsNeedIt: 'Essential conceptual bridge connecting nonpolar polarity, London dispersion forces, and hygiene science.',
    citation: 'World Health Organization (WHO) Guidelines & Journal of Chemical Education (2020)',
    tags: ['#Biochemistry', '#SoapScience', '#ChemistryFact', '#EverydayScience', '#Shorts']
  },
  {
    id: 'phone_touchscreen_capacitive',
    subject: 'Everyday Science',
    hook: 'Why do smartphone touchscreens ignore fingernails and normal gloves?',
    fact: 'Modern phone screens use projected capacitive sensing: a microscopic grid of transparent indium tin oxide electrodes stores an electrostatic field. Because your body is 60% salty conductive water, touching the glass absorbs a fraction of the electric charge, altering the local capacitance so the chip can pinpoint your fingertip.',
    examRelevance: 'AP Physics / Capacitance & Conductive Charge Carriers',
    whyStudentsNeedIt: 'Turns the phone screen into a direct daily demonstration of parallel-plate capacitors and dielectric constants.',
    citation: 'Downes, L. et al., Operating Principles of Projected Capacitive Touchscreens / IEEE Micro',
    tags: ['#Touchscreen', '#Capacitance', '#SmartphoneTech', '#Physics', '#Shorts']
  },
  {
    id: 'salt_melts_ice_freezing_depression',
    subject: 'Everyday Science',
    hook: 'Why does tossing rock salt on an icy driveway melt the ice in freezing weather?',
    fact: 'Dissolving salt in liquid water introduces sodium (Na+) and chloride (Cl-) ions that physically get in the way of water molecules attempting to lock into a rigid ice lattice. This colligative property lowers the freezing point of water from 0°C down to as cold as -9°C (15°F), forcing existing ice to melt.',
    examRelevance: 'AP Chemistry / Colligative Properties & Freezing Point Depression (ΔTf = i·Kf·m)',
    whyStudentsNeedIt: 'A quintessential chemistry formula (colligative molality) seen in action on winter roads and homemade ice cream makers.',
    citation: 'Tro, N. J., Chemistry: Structure and Properties / Pearson Colligative Review',
    tags: ['#Chemistry', '#WinterScience', '#ColligativeProperties', '#EverydayScience', '#Shorts']
  },
  {
    id: 'soda_explosion_warm_henry_law',
    subject: 'Everyday Science',
    hook: 'Why does shaking a warm soda bottle make it explode, but cold soda doesn’t?',
    fact: 'By Henry’s Law, the solubility of carbon dioxide gas in liquid water drops sharply as temperature rises. Warm soda has much higher internal gas pressure. When you shake it, you trap millions of microscopic gas seeds; opening the cap causes instant explosive nucleation, whereas cold soda holds the dissolved CO2 stably.',
    examRelevance: 'Thermodynamics & Solution Chemistry / Henry’s Law & Gas Solubility vs Temperature',
    whyStudentsNeedIt: 'Intuitive proof that unlike solid solutes (which dissolve better in hot water), gas solubility is inversely proportional to temperature.',
    citation: 'Atkins, P., Physical Chemistry: Thermodynamics of Binary Solutions',
    tags: ['#SodaScience', '#GasSolubility', '#HenryLaw', '#Chemistry', '#Shorts']
  },
  {
    id: 'recorded_voice_bone_conduction',
    subject: 'Everyday Science',
    hook: 'Why does your voice sound so weird and deeper when you hear it on a recording?',
    fact: 'When you speak, you hear your voice through two channels simultaneously: air conduction through your ear canal, and bone conduction through your skull bones directly to your cochlea. Dense facial bones enhance lower resonant frequencies, making your voice sound richer and deeper to you than it actually sounds to the outside world.',
    examRelevance: 'Acoustics & Sensory Physiology / Acoustic Resonance & Bone Conduction Audiometry',
    whyStudentsNeedIt: 'Comforts students about why everyone dislikes their recorded voice: it’s pure anatomical acoustic filtering.',
    citation: 'Békésy, G. von, Experiments in Hearing / Acoustical Society of America',
    tags: ['#AudioScience', '#HumanBody', '#Voice', '#Psychology', '#Shorts']
  },
  {
    id: 'contagious_yawning_mirror_neurons',
    subject: 'Everyday Science',
    hook: 'Why is yawning contagious even if you just read or think about yawning?',
    fact: 'Catching a yawn is an empathetic motor contagion driven by mirror neuron networks in your premotor cortex and amygdala. When you see, hear, or read about someone yawning, mirror neurons automatically simulate the physical sensation in your own brain, triggering spontaneous respiratory motor resonance.',
    examRelevance: 'Cognitive Neuroscience & AP Psychology / Mirror Neurons & Social Empathy',
    whyStudentsNeedIt: 'Direct proof that social empathy and imitation are hardwired into our primate neurological circuitry.',
    citation: 'Platek, S. M. et al., Contagious yawning and the brain / Cognitive Brain Research (2005)',
    tags: ['#Neuroscience', '#Yawning', '#BrainFacts', '#EverydayStuff', '#Shorts']
  },
  {
    id: 'dna_replication_fidelity_proofreading',
    subject: 'Biology',
    hook: 'How does your body copy 3 billion genetic letters with fewer errors than a computer?',
    fact: 'DNA Polymerase makes one mistake every 100,000 base pairs, but its built-in 3′ to 5′ exonuclease proofreading domain immediately chews back mismatched bases, and downstream mismatch repair enzymes reduce the net error rate to just one mistake per billion base pairs copied.',
    examRelevance: 'Molecular Genetics & AP Biology / DNA Repair & Polymerase Mechanisms',
    whyStudentsNeedIt: 'Critical concept for exams distinguishing between initial incorporation error vs post-replicative mismatch repair.',
    citation: 'Kunkel, T. A., DNA Replication Fidelity / Annual Review of Biochemistry',
    tags: ['#Genetics', '#DNARepair', '#MolecularBiology', '#PreMed', '#ArchieExplains']
  }
];
