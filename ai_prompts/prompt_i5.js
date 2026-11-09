// Biktrix Support Bot - Build Prompt (V5)
// Based on V4. Adds: MODEL GUIDE REQUESTS — when a customer asks for all the
// guides/articles for a specific bike model, the bot lists the universal
// onboarding guides plus that model's specific guides from a curated registry.
// All URLs are real help-center URLs pulled from the live guide list — the bot
// copies them verbatim and never invents links. All other behavior is
// unchanged from V4 (general Q&A still flows through semantic retrieval).

const hits = $json.result || [];
const question = $('Parse Question').first().json.question;
const context = hits.map((h,i)=>`[Doc ${i+1}] ${h.payload.guideTitle} — ${h.payload.stepTitle}\n${h.payload.text}\nURL: ${h.payload.url}`).join('\n\n---\n\n');

const SHOWROOMS = `Here are our showroom locations:

 Saskatoon Showroom
123 Auditorium Ave, Saskatoon, SK S7M 5S8
Phone: 1-866-245-8749 (Ext. 801)
Hours: Tues–Sat: 10:00am–5:30pm | Sun–Mon: Closed

 Vancouver Showroom
2825 Grandview Hwy, Vancouver, BC V5M 2E1
Phone: 1-866-245-8749 (Ext. 803)
Hours: Tues–Sat: 11:00am–6:00pm | Sun–Mon: Closed

 Kelowna Showroom
107-2714 Highway 97N, Kelowna, BC V1X 4J7
Phone: 1-866-245-8749 (Ext. 806)
Hours: Tues–Sat: 10:00am–5:30pm | Sun–Mon: Closed

 Edmonton Showroom
10135 97 St NW, Edmonton, AB T5J 0L2
Phone: 1-866-245-8749 (Ext. 807)
Hours: Tues–Sat: 10:00am–5:00pm | Sun–Mon: Closed

 Victoria Showroom
2101 Government St, Victoria, BC V8T 4P2
Phone: 1-236-239-5959
Hours: Tues–Sat: 10:30am–6:00pm | Sun–Mon: Closed`;

// ---------------------------------------------------------------------------
// MODEL GUIDE REGISTRY (curated — edit here to add/remove guides or models)
// UNIVERSAL guides apply to every Biktrix eBike. MODEL_GUIDES lists guides
// specific to each model family. URLs are exact live help-center URLs.
// ---------------------------------------------------------------------------

const UNIVERSAL = [
  { title: 'Complete eBike assembly instructions', url: 'https://biktrix.stonly.com/kb/guide/en/complete-ebike-assembly-instructions-lpLl6uyB2U/Steps/943475' },
  { title: 'I just received my eBike, what next?', url: 'https://biktrix.stonly.com/kb/guide/en/i-just-received-my-ebike-what-next-5x8pkilhYd/Steps/1045112' },
  { title: 'How to ride an eBike the first time?', url: 'https://biktrix.stonly.com/kb/guide/en/how-to-ride-an-ebike-the-first-time-FdP1UQbZNF/Steps/943474' },
  { title: 'All about eBike Batteries & Chargers', url: 'https://biktrix.stonly.com/kb/guide/en/all-about-ebike-batteries-chargers-kheKj3A7hR/Steps/1019184' },
  { title: 'User Manuals - LCD Displays', url: 'https://biktrix.stonly.com/kb/guide/en/user-manuals-lcd-displays-5dwggQ6zwZ/Steps/1035267' },
  { title: 'Standard Scheduled Maintenance for your eBike', url: 'https://biktrix.stonly.com/kb/guide/en/standard-scheduled-maintenance-for-your-ebike-3FdsefLxoC/Steps/1163086' },
  { title: 'Register your Biktrix product', url: 'https://biktrix.stonly.com/kb/guide/en/register-your-biktrix-product-KAd3dlup71/Steps/943459' },
];

const MODEL_GUIDES = {
  'RogueHawk': [
    { title: 'How To Access RogueHawk Controller Connections', url: 'https://biktrix.stonly.com/kb/guide/en/how-to-access-roguehawk-controller-connections-CrqwN5KiO7/Steps/4159489' },
    { title: 'How to reseat Roguehawk Fork Lockout Knob', url: 'https://biktrix.stonly.com/kb/guide/en/how-to-reseat-roguehawk-fork-lockout-knob-G58s2s4QBa/Steps/4174245' },
    { title: 'How to access Roguehawk 2 Controller Connections', url: 'https://biktrix.stonly.com/kb/guide/en/how-to-access-roguehawk-2-controller-connections-nmE0ghCAOT/Steps/4716575' },
    { title: 'How to check Roguehawk 2 Downtube Battery Charging Fuse', url: 'https://biktrix.stonly.com/kb/guide/en/how-to-check-roguehawk-2-downtube-battery-charging-fuse-q2UPeZshfl/Steps/5047832' },
    { title: 'How to install Roguehawk FS Rack Mounted Range Extender', url: 'https://biktrix.stonly.com/kb/guide/en/how-to-install-roguehawk-fs-rack-mounted-range-extender-vV8OziIQFf/Steps/4312908' },
    { title: 'How to install Roguehawk Torque Sensor', url: 'https://biktrix.stonly.com/kb/guide/en/how-to-install-roguehawk-torque-sensor-jCnMQR2mu3/Steps/4374039' },
    { title: 'Roguehawk FS 2 Controller Replacement', url: 'https://biktrix.stonly.com/kb/guide/en/roguehawk-fs-2-controller-replacement-J8lMgFGDSs/Steps/4760830' },
  ],
  'Juggernaut': [
    { title: 'How to replace Juggernaut Ultra Beast Dualizer', url: 'https://biktrix.stonly.com/kb/guide/en/how-to-replace-juggernaut-ultra-beast-dualizer-2lZNPOy5eB/Steps/1652022' },
    { title: 'How to Replace Swift Lite and Juggernaut Lite Controller', url: 'https://biktrix.stonly.com/kb/guide/en/how-to-replace-swift-lite-and-juggernaut-lite-controller-dMy46C09NO/Steps/3742113' },
    { title: 'Juggernaut Classic Duo Medium Frame Range Extender Installation', url: 'https://biktrix.stonly.com/kb/guide/en/juggernaut-classic-duo-medium-frame-range-extender-installation-j8eUWoxXwh/Steps/3955726' },
    { title: 'How to remove Juggernaut Lite Swap-Top Battery', url: 'https://biktrix.stonly.com/kb/guide/en/how-to-remove-juggernaut-lite-swap-top-battery-YLTpSpcl5J/Steps/4589248' },
    { title: 'Juggernaut Lite Plus Controller Replacement', url: 'https://biktrix.stonly.com/kb/guide/en/juggernaut-lite-plus-controller-replacement-0TxWz6RLTe/Steps/4661019' },
    { title: 'Juggernaut XD FAQ', url: 'https://biktrix.stonly.com/kb/guide/en/juggernaut-xd-faq-Gxr6oLuilH/Steps/1901347' },
    { title: 'How to Remove and Install Rear Wheel on Juggernaut XD', url: 'https://biktrix.stonly.com/kb/guide/en/how-to-remove-and-install-rear-wheel-on-juggernaut-xd-m5tuonczIJ/Steps/1872315' },
    { title: 'How to install the Juggernaut XD Cadence Sensor', url: 'https://biktrix.stonly.com/kb/guide/en/how-to-install-the-juggernaut-xd-cadence-sensor-7lN5AlSTA2/Steps/2051924' },
    { title: 'How to Remove Juggernaut XD Service Cover', url: 'https://biktrix.stonly.com/kb/guide/en/how-to-remove-juggernaut-xd-service-cover-ofuzzZzx1C/Steps/2156721' },
    { title: 'How to install Juggernaut XD Rear Sprocket and Rotor', url: 'https://biktrix.stonly.com/kb/guide/en/how-to-install-juggernaut-xd-rear-sprocket-and-rotor-V6jXW3jTP6/Steps/2290381' },
    { title: 'How to Remove the Juggernaut XD Motor Controller', url: 'https://biktrix.stonly.com/kb/guide/en/how-to-remove-the-juggernaut-xd-motor-controller-xjW0Ky7Opj/Steps/2400403' },
    { title: 'How to set Juggernaut XD Drive-Chain Tension', url: 'https://biktrix.stonly.com/kb/guide/en/how-to-set-juggernaut-xd-drive-chain-tension-8HN5M4MUYe/Steps/2443570' },
    { title: 'Juggernaut FS XD Front Chain Tensioner Sprocket Reinstallation', url: 'https://biktrix.stonly.com/kb/guide/en/juggernaut-fs-xd-front-chain-tensioner-sprocket-reinstallation-WqhJJIvfIO/Steps/3598721' },
    { title: 'Juggernaut XD Twist Throttle Replacement', url: 'https://biktrix.stonly.com/kb/guide/en/juggernaut-xd-twist-throttle-replacement-wUyNx2K5BN/Steps/3601197' },
    { title: 'Juggernaut FS XD Rear Chain Tensioner Replacement', url: 'https://biktrix.stonly.com/kb/guide/en/juggernaut-fs-xd-rear-chain-tensioner-replacement-mDST2xZLNj/Steps/3624539' },
    { title: 'Juggernaut XD Headlight Removal and Installation', url: 'https://biktrix.stonly.com/kb/guide/en/juggernaut-xd-headlight-removal-and-installation-XmmBDsXdrL/Steps/3677124' },
    { title: 'How to remove and install Juggernaut XD Dual Drive Motor', url: 'https://biktrix.stonly.com/kb/guide/en/how-to-remove-and-install-juggernaut-xd-dual-drive-motor-BmblDTZOL0/Steps/3677149' },
    { title: 'Juggernaut XD Duo Dualizer Installation', url: 'https://biktrix.stonly.com/kb/guide/en/juggernaut-xd-duo-dualizer-installation-Zke3rPJpqx/Steps/3681273' },
    { title: 'How to install Juggernaut XD FS Kickstand', url: 'https://biktrix.stonly.com/kb/guide/en/how-to-install-juggernaut-xd-fs-kickstand-3RSReOLd2r/Steps/3726891' },
    { title: 'How to replace Juggernaut XD Torque Sensor', url: 'https://biktrix.stonly.com/kb/guide/en/how-to-replace-juggernaut-xd-torque-sensor-HMKa4onqIC/Steps/3754605' },
    { title: 'Juggernaut XD Front Drive Sprocket Replacement', url: 'https://biktrix.stonly.com/kb/guide/en/juggernaut-xd-front-drive-sprocket-replacement-V4M6x9tCox/Steps/3915273' },
    { title: 'Juggernaut XD Armageddon Headlight Switch Installation', url: 'https://biktrix.stonly.com/kb/guide/en/juggernaut-xd-armageddon-headlight-switch-installation-bzkGvqKp9h/Steps/4145149' },
    { title: 'How to remove and install Juggernaut XD 2.0 Motor', url: 'https://biktrix.stonly.com/kb/guide/en/how-to-remove-and-install-juggernaut-xd-2-0-motor-eqcerkl1Ja/Steps/5019468' },
  ],
  'Stunner': [
    { title: 'Stunner X 6 Mozo Fork Replacement Bracket Installation', url: 'https://biktrix.stonly.com/kb/guide/en/stunner-x-6-mozo-fork-replacement-bracket-installation-t3NkgWASwH/Steps/2230107' },
    { title: 'Stunner Lite Controller Replacement', url: 'https://biktrix.stonly.com/kb/guide/en/stunner-lite-controller-replacement-6R2qQD4IOO/Steps/4212007' },
    { title: 'Swift Lite 4 and Stunner Lite 2 Controller Replacement', url: 'https://biktrix.stonly.com/kb/guide/en/swift-lite-4-and-stunner-lite-2-controller-replacement-VXsoBXa4fA/Steps/4584069' },
    { title: 'Stunner Lite 3 Controller Replacement', url: 'https://biktrix.stonly.com/kb/guide/en/stunner-lite-3-controller-replacement-r94RULaLZQ/Steps/4709633' },
  ],
  'Swift': [
    { title: 'How to fix a rubbing Swift Lite 3 Fender', url: 'https://biktrix.stonly.com/kb/guide/en/how-to-fix-a-rubbing-swift-lite-3-fender-dZmqFcRNis/Steps/2187204' },
    { title: 'How to adjust Swift CVT Stem Angle', url: 'https://biktrix.stonly.com/kb/guide/en/how-to-adjust-swift-cvt-stem-angle-oXurD0ta5z/Steps/3954415' },
    { title: 'How to adjust Swift CVT Belt Tension', url: 'https://biktrix.stonly.com/kb/guide/en/how-to-adjust-swift-cvt-belt-tension-37CeQ0eKlP/Steps/3973730' },
    { title: 'How to install Swift X Rear Rack and Fenders', url: 'https://biktrix.stonly.com/kb/guide/en/how-to-install-swift-x-rear-rack-and-fenders-ooO7dDKof5/Steps/2797610' },
    { title: 'How to Replace Swift Lite and Juggernaut Lite Controller', url: 'https://biktrix.stonly.com/kb/guide/en/how-to-replace-swift-lite-and-juggernaut-lite-controller-dMy46C09NO/Steps/3742113' },
    { title: 'Swift CVT Belt Removal and Replacement', url: 'https://biktrix.stonly.com/kb/guide/en/swift-cvt-belt-removal-and-replacement-Ffdf3CFSzz/Steps/4006064' },
    { title: 'Swift Lite 4 and Stunner Lite 2 Controller Replacement', url: 'https://biktrix.stonly.com/kb/guide/en/swift-lite-4-and-stunner-lite-2-controller-replacement-VXsoBXa4fA/Steps/4584069' },
    { title: 'How to use the Swift Lite 3 Controls', url: 'https://biktrix.stonly.com/kb/guide/en/how-to-use-the-swift-lite-3-controls-0Hh6eQiDLk/Steps/2486281' },
    { title: 'Swift Lite Full Electronics Walkthrough', url: 'https://biktrix.stonly.com/kb/guide/en/swift-lite-full-electronics-walkthrough-GAqxarqyhf/Steps/3933189' },
  ],
  'Kutty': [
    { title: 'How to secure Kutty X 2 Motor Power Wire', url: 'https://biktrix.stonly.com/kb/guide/en/how-to-secure-kutty-x-2-motor-power-wire-XS3s0XMPRt/Steps/1983820' },
    { title: 'Removing stuck Kutty FS Battery', url: 'https://biktrix.stonly.com/kb/guide/en/removing-stuck-kutty-fs-battery-7Gc8Z1cHp9/Steps/3913435' },
  ],
  'Monte Capro': [
    { title: 'How to replace the Monte Capro Ultra/Lite Power Button', url: 'https://biktrix.stonly.com/kb/guide/en/how-to-replace-the-monte-capro-ultra-lite-power-button-jysz40y65F/Steps/2132387' },
  ],
  'BTX Moto': [
    { title: 'Getting Started with the BTX Moto', url: 'https://biktrix.stonly.com/kb/guide/en/getting-started-with-the-btx-moto-7UE4Z1hKOW/Steps/4133666' },
    { title: 'BTX Moto Throttle Replacement', url: 'https://biktrix.stonly.com/kb/guide/en/btx-moto-throttle-replacement-mprGdUBYDh/Steps/4507094' },
  ],
  'SkyTrike': [],
  'Challenger': [
    { title: 'Installing Challenger Delivery Rear Rack', url: 'https://biktrix.stonly.com/kb/guide/en/installing-challenger-delivery-rear-rack-ycbipftpFJ/Steps/1481176' },
    { title: 'Challenger Controller Replacement', url: 'https://biktrix.stonly.com/kb/guide/en/challenger-controller-replacement-SfmpLU6VmA/Steps/1505481' },
    { title: 'Challenger Seat Riser Installation Instructions', url: 'https://biktrix.stonly.com/kb/guide/en/challenger-seat-riser-installation-instructions-lysfVO2PoA/Steps/2017246' },
  ],
};

const fmt = (arr) => arr.map(g => `- ${g.title}: ${g.url}`).join('\n');

// --- Deterministic model-guide-request detection (in code, not left to the LLM) ---
// A "model guide request" = the question contains a guide-ish word AND a known model name.
// The full list is then built here in JS and the LLM only adds a friendly intro around it —
// this guarantees the list is always complete and every URL is copied verbatim.
const MODEL_ALIASES = {
  'RogueHawk': ['roguehawk'],
  'Juggernaut': ['juggernaut'],
  'Stunner': ['stunner'],
  'Swift': ['swift'],
  'Kutty': ['kutty'],
  'Monte Capro': ['montecapro'],
  'BTX Moto': ['btxmoto', 'btx'],
  'SkyTrike': ['skytrike'],
  'Challenger': ['challenger'],
};
const qNorm = question.toLowerCase().replace(/[^a-z0-9]+/g, '');
const wantsGuides = /(guide|article|manual|resource|documentation|docs|tutorial)/i.test(question);
let matchedModel = null;
for (const [model, aliases] of Object.entries(MODEL_ALIASES)) {
  if (aliases.some(a => qNorm.includes(a))) { matchedModel = model; break; }
}
const isModelGuideRequest = wantsGuides && matchedModel;

const buildModelList = (model) => {
  const specific = MODEL_GUIDES[model] || [];
  return `Universal guides (apply to every Biktrix eBike):\n${fmt(UNIVERSAL)}\n\n` +
    `${model} specific guides:\n${specific.length ? fmt(specific) : '- No ' + model + '-specific guides yet — all the universal guides above apply to your bike.'}`;
};

const sys = `You are the Biktrix eBike customer support assistant. Answer ONLY using the provided help-center documents.

Rules:

1. GREETINGS: If the customer says hello, hi, hey, or any greeting, respond warmly and let them know you can help answer questions about their Biktrix eBike — including batteries, motors, displays, and troubleshooting.

2. SHOWROOM / DEALERSHIP: If the customer asks about a showroom, store, dealership, location, or where to visit in person, reply with the following information exactly and do not add anything else:
${SHOWROOMS}

3. DRIVETRAIN ISSUES: If the customer mentions any of the following — skipping gears, delayed gear changes, extra noise, or chain falling off — always recommend the derailleur adjustment article first before anything else. Find the most relevant derailleur or gear adjustment URL from the provided documents and lead with it.

4. UNRECOGNIZED MODEL GUIDE REQUESTS: If the customer asks for the guides, articles, or manuals for a bike model that is not one of ours, say you don't recognize that model, list the families we carry (Swift, Stunner, Juggernaut, Kutty, Monte Capro, RogueHawk, BTX Moto, SkyTrike), and suggest contacting support: https://www.biktrix.ca/pages/contact-us

5. NO ANSWER IN DOCS: If the documents do not contain the answer, reply exactly: "I don't have information on that in our help center. Please contact our support team. https://www.biktrix.ca/pages/contact-us" — do NOT add any other URL.

6. NORMAL ANSWERS: For all other questions, be friendly and concise for non-technical customers. Then choose one of the following link formats based on the question:

   - SINGLE LINK: If one article clearly and fully covers the question, end your reply with:
     "For more details visit: <the most relevant article URL>"

   - MULTIPLE LINKS: If the question is complex, involves troubleshooting multiple steps, or is better answered by pointing to several related resources, end your reply with a list like:
     "Helpful resources:
     - <Article Title>: <URL>
     - <Article Title>: <URL>"
     Include 2–4 links maximum. Only include links that genuinely help — do not pad the list with loosely related articles.`;

const user = `Customer question: ${question}\n\nHelp-center documents:\n${context}`;

// Model guide request → the complete answer is pre-built here in code (guaranteed
// complete + verbatim URLs); the LLM is only asked to echo it back exactly.
if (isModelGuideRequest) {
  const canned = `Happy to help! Here are all the guides for your ${matchedModel}:\n\n${buildModelList(matchedModel)}\n\nIf you have any questions about a specific guide, just ask!`;
  return [{ json: { body: { model:'gpt-4o-mini', temperature:0, messages:[
    { role:'system', content:'You are a message relay. Reply with EXACTLY the text provided by the user, verbatim, with no additions, omissions, or changes.' },
    { role:'user', content: canned }
  ] } } }];
}

return [{ json: { body: { model:'gpt-4o-mini', temperature:0.2, messages:[{role:'system',content:sys},{role:'user',content:user}] } } }];
