#!/usr/bin/env node
/**
 * Push Verified Student Science Facts to Buffer Idea Box
 *
 * Uses Buffer's GraphQL `createIdea` mutation to save high-yield, verified
 * student science facts into your Buffer Idea Box dashboard.
 */

const fs = require('fs');
const path = require('path');

const RAW_BUFFER_API_KEY = String(process.env.BUFFER_API_KEY || '').trim();
const RAW_BUFFER_ORG_ID = String(process.env.BUFFER_ORGANIZATION_ID || '').trim();

function sanitizeToken(raw) {
  if (!raw) return '';
  let token = String(raw).trim();
  token = token.replace(/^["']|["']$/g, '').trim();
  token = token.replace(/^Bearer\s+/i, '').trim();
  return token;
}

const BUFFER_API_KEY = sanitizeToken(RAW_BUFFER_API_KEY);
const BUFFER_ORGANIZATION_ID = sanitizeToken(RAW_BUFFER_ORG_ID);

const STUDENT_FACTS_POOL = [
  {
    title: 'Why Oceans Don’t Freeze Solid (Thermodynamics)',
    text: 'Water is one of the only liquids that expands when freezing into a crystalline lattice. Ice is 9% less dense than liquid water, so it floats to the surface, insulating the liquid depths beneath and preserving marine ecosystems across entire ice ages.\n\n#Physics #Thermodynamics #StudentScience #ArchieExplains',
    tags: ['Physics', 'Thermodynamics', 'StudentFacts', 'ArchieExplains']
  },
  {
    title: 'Your Smartphone Uses Einstein’s Relativity (GPS)',
    text: 'GPS satellites in orbit run 38 microseconds faster per day due to weaker gravity and orbital velocity. Without Einstein’s General Relativity calculations programmed into receiver chips, phone navigation maps would drift by 11 kilometers every day!\n\n#Physics #Relativity #Einstein #GPS #StudentScience',
    tags: ['Physics', 'Relativity', 'STEM', 'ArchieExplains']
  },
  {
    title: 'You Have Enough DNA to Reach Pluto and Back',
    text: 'Every human cell packs 2 meters of microscopic DNA wrapped around histone proteins. If you uncoiled the DNA in all 37 trillion cells of your body, it would stretch 67 billion miles — enough to reach Pluto and back 6 times!\n\n#Biology #Genetics #DNA #StudentLife #ScienceFacts',
    tags: ['Biology', 'Genetics', 'StudyTips', 'ArchieExplains']
  },
  {
    title: 'Why You Only Inherit Mitochondria from Your Mother',
    text: 'When a sperm fertilizes an egg, the mitochondria in the sperm’s tail are tagged with ubiquitin enzymes and systematically destroyed. 100% of your cellular energy powerhouses descend unbroken through your maternal genetic line.\n\n#Genetics #Biology #Mitochondria #ScienceExam',
    tags: ['Biology', 'Genetics', 'Mitochondria', 'ArchieExplains']
  },
  {
    title: 'Why Sunsets are Red (Rayleigh Scattering)',
    text: 'Shorter blue wavelengths of sunlight scatter quickly in atmospheric gases. At sunset, sunlight passes through up to 10x more atmosphere, scattering away all the blue and leaving only long red and orange wavelengths.\n\n#Optics #Physics #RayleighScattering #StudentScience',
    tags: ['Physics', 'Optics', 'RayleighScattering', 'ArchieExplains']
  },
  {
    title: 'ATP Synthase: A 9,000 RPM Engine Inside Your Cells',
    text: 'Inside your mitochondria sits ATP Synthase — a genuine microscopic rotary turbine. Powered by a proton gradient, its central shaft spins at 9,000 RPM to churn out your entire body weight in ATP energy fuel every single day.\n\n#Biochemistry #CellularRespiration #ATPSynthase #STEM',
    tags: ['Biology', 'Biochemistry', 'STEM', 'ArchieExplains']
  },
  {
    title: 'How Soap Destroys Viruses (Lipid Bilayer Dissolution)',
    text: 'Soap molecules have hydrophobic lipid tails that wedge into the fatty envelope of viruses like a crowbar. Scrubbing for 20 seconds mechanically tears the viral structure apart.\n\n#Chemistry #OrganicChemistry #Soap #ScienceFacts',
    tags: ['Chemistry', 'Health', 'ScienceFacts', 'ArchieExplains']
  },
  {
    title: 'Why Cramming Fails (The Ebbinghaus Forgetting Curve)',
    text: 'The brain forgets 70% of new information within 48 hours unless reviewed. Reviewing at spaced intervals (Day 1, 3, 7) forces neurons to strengthen synaptic connections via Long-Term Potentiation (LTP), locking facts into permanent memory.\n\n#Neuroscience #Memory #StudyHacks #StudentLife',
    tags: ['Neuroscience', 'StudyTips', 'Productivity', 'ArchieExplains']
  },
  {
    title: 'What Your Brain Does While You Sleep (Glymphatic Cleanse)',
    text: 'During deep slow-wave sleep, brain cells shrink 60% so cerebrospinal fluid can flush out toxic metabolic waste. Pulling an all-nighter drops cognitive exam performance by up to 40%!\n\n#Neuroscience #Sleep #BrainHealth #StudyTips',
    tags: ['Neuroscience', 'Sleep', 'StudyTips', 'ArchieExplains']
  },
  {
    title: 'The 5-Minute Rule: How Dopamine Defeats Procrastination',
    text: 'Dopamine is released during anticipation, not task completion. Overcome study procrastination with the 5-Minute Rule: dopamine only starts flowing once you take the first small action!\n\n#Psychology #Dopamine #StudyHacks #Productivity',
    tags: ['Psychology', 'Dopamine', 'Productivity', 'ArchieExplains']
  },
  {
    title: 'Pencil Lead vs $10,000 Diamond (Carbon Allotropes)',
    text: 'Graphite and diamond are 100% identical pure carbon atoms. Graphite is flat sliding 2D sheets, while diamond is locked in an sp3 3D covalent tetrahedral cage — the hardest natural material known.\n\n#Chemistry #Carbon #Diamond #MaterialsScience',
    tags: ['Chemistry', 'Allotropes', 'STEM', 'ArchieExplains']
  },
  {
    title: 'Why Deserts Freeze at Night (Water Heat Capacity)',
    text: 'Water has an unusually high specific heat capacity (4.184 J/g°C). Sand has a specific heat of just 0.8 J/g°C, which is why dry desert temperatures plunge 40 degrees as soon as the sun sets!\n\n#Chemistry #Thermochemistry #HeatCapacity #Physics',
    tags: ['Chemistry', 'Thermochemistry', 'Physics', 'ArchieExplains']
  }
];

async function executeBufferGraphQL(token, query, variables = {}) {
  const res = await fetch('https://api.buffer.com', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ query, variables })
  });

  const text = await res.text();
  try {
    const payload = JSON.parse(text);
    if (!res.ok || payload.errors?.length) {
      const msg = payload.errors ? payload.errors.map(e => e.message).join('; ') : `HTTP ${res.status}`;
      return { ok: false, error: msg, payload };
    }
    return { ok: true, data: payload.data };
  } catch (err) {
    return { ok: false, error: `Buffer returned invalid response: ${text.slice(0, 150)}` };
  }
}

async function getOrganizationId(token) {
  if (BUFFER_ORGANIZATION_ID) {
    return BUFFER_ORGANIZATION_ID;
  }

  const query = `query GetBufferOrgs {
    account {
      organizations {
        id
        name
      }
    }
  }`;

  const res = await executeBufferGraphQL(token, query);
  if (res.ok && res.data?.account?.organizations?.length) {
    return res.data.account.organizations[0].id;
  }
  return null;
}

async function main() {
  console.log('================================================================');
  console.log('💡 ARCHIE IDEA BOX: STUDENT SCIENTIFIC FACTS DISPATCHER');
  console.log('================================================================\n');

  if (!BUFFER_API_KEY) {
    console.log('ℹ️  BUFFER_API_KEY is not set in environment.');
    console.log('Displaying the 12 Verified Student Science Facts in Archie Idea Box:\n');

    STUDENT_FACTS_POOL.forEach((item, idx) => {
      console.log(`[Fact #${idx + 1}] ${item.title}`);
      console.log(`  Content: ${item.text.replace(/\n/g, ' ')}`);
      console.log(`  Tags: ${item.tags.join(', ')}\n`);
    });

    console.log('👉 To automatically push these ideas into your Buffer Dashboard:');
    console.log('   Run with BUFFER_API_KEY="your_token" node scripts/push_student_facts_to_buffer_ideas.cjs\n');
    return;
  }

  console.log('Resolving Buffer Organization...');
  const orgId = await getOrganizationId(BUFFER_API_KEY);
  if (!orgId) {
    console.error('❌ Could not retrieve your Buffer Organization ID. Please ensure your Buffer email is verified.');
    process.exit(1);
  }

  console.log(`✅ Organization resolved: ${orgId}`);
  console.log(`Pushing ${STUDENT_FACTS_POOL.length} Student Science Facts to your Buffer Idea Box...\n`);

  const createIdeaMutation = `mutation CreateStudentIdea($input: CreateIdeaInput!) {
    createIdea(input: $input) {
      idea {
        id
      }
    }
  }`;

  let successCount = 0;
  for (const [idx, item] of STUDENT_FACTS_POOL.entries()) {
    const variables = {
      input: {
        organizationId: orgId,
        content: {
          title: item.title,
          text: item.text,
          tags: item.tags
        }
      }
    };

    const res = await executeBufferGraphQL(BUFFER_API_KEY, createIdeaMutation, variables);
    if (res.ok) {
      successCount++;
      console.log(`  ✔ [${idx + 1}/${STUDENT_FACTS_POOL.length}] Saved Idea: "${item.title}" (ID: ${res.data?.createIdea?.idea?.id || 'OK'})`);
    } else {
      console.warn(`  ⚠️ [${idx + 1}/${STUDENT_FACTS_POOL.length}] Skipped "${item.title}": ${res.error}`);
    }
  }

  console.log(`\n🎉 Finished! ${successCount}/${STUDENT_FACTS_POOL.length} ideas pushed to your Buffer Idea Box.`);
}

main().catch(err => {
  console.error('[Dispatcher Error]:', err);
  process.exit(1);
});
