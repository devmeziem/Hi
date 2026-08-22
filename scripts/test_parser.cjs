function extractFirstJson(str) {
  const start = str.indexOf('{');
  if (start === -1) return null;
  let depth = 0;
  let inString = false;
  let escape = false;

  for (let i = start; i < str.length; i++) {
    const char = str[i];
    if (escape) {
      escape = false;
      continue;
    }
    if (char === '\\') {
      escape = true;
      continue;
    }
    if (char === '"') {
      inString = !inString;
      continue;
    }
    if (!inString) {
      if (char === '{') depth++;
      else if (char === '}') {
        depth--;
        if (depth === 0) {
          const jsonSub = str.substring(start, i + 1);
          try {
            return JSON.parse(jsonSub);
          } catch {
            return null;
          }
        }
      }
    }
  }
  return null;
}

const sample = ` Here is the JSON:
{
  "title": "₦50k AI Automation Agency in 2026",
  "description": "Unlock ₦50k/month AI automation agency in 2026 with zero coding. #Shorts #FinBlueprint",
  "tags": ["#Shorts", "#AI", "#Automation"],
  "slides": [
    {
      "text": "Rule 1: Identify high-demand services.",
      "visual": "Growing demand graphic"
    },
    {
      "text": "Rule 2: Offer WhatsApp and invoice bots to local shops.",
      "visual": "WhatsApp business catalog"
    }
  ]
}
Extra trailing commentary here...`;

console.log(extractFirstJson(sample));
