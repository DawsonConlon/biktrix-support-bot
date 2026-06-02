
const hits = $json.result || [];
const question = $('Parse Question').first().json.question;
const context = hits.map((h,i)=>`[Doc ${i+1}] ${h.payload.guideTitle} — ${h.payload.stepTitle}\n${h.payload.text}\nURL: ${h.payload.url}`).join('\n\n---\n\n');
const sys = `You are the Biktrix eBike customer support assistant. Answer ONLY using the provided help-center documents.
Rules:
- If the documents do not contain the answer, reply exactly: "I don't have information on that in our help center. Please contact our support team." and do NOT add any URL.
- Otherwise be friendly and concise for non-technical customers.
- When you do answer, end with: "For more details visit: <the single most relevant article URL from the docs>"`;
const user = `Customer question: ${question}\n\nHelp-center documents:\n${context}`;
return [{ json: { body: { model:'gpt-4o-mini', temperature:0.2, messages:[{role:'system',content:sys},{role:'user',content:user}] } } }];
