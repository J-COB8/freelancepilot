// ====== ICONS ======
const ICONS = {
    stats: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="18" y="3" width="4" height="18"/><rect x="10" y="8" width="4" height="13"/><rect x="2" y="13" width="4" height="8"/></svg>`,
    charts: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/></svg>`,
    scenarios: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/></svg>`,
    ai: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a4 4 0 0 1 4 4v1h1a3 3 0 0 1 0 6h-1v1a4 4 0 0 1-8 0v-1H7a3 3 0 0 1 0-6h1V6a4 4 0 0 1 4-4z"/></svg>`,
    tools: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>`,
    projection: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>`,
    investment: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>`,
    optimizer: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3v12"/><path d="M18 9v12"/><path d="M3 9h6"/><path d="M15 3h6"/><path d="M3 15h18"/></svg>`,
    check: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`,
    tip: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`,
    cfo: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 7H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="2"/><path d="M6 12h.01M18 12h.01"/></svg>`
};

// ====== CONSTANTS & STATE ======
let conversationHistory = [];
let collectedData = {};
let currentStep = 'name';
let questionCount = 0;

let chatHistory = [];
let followupCount = 0;
const MAX_FOLLOWUPS = 3;

// Chart Instances
let barChartInst = null;
let doughnutChartInst = null;
// Expose chart instances for tab resize
window._barChart = null;
window._doughnutChart = null;

// ====== DOM ELEMENTS ======
const formSection = document.getElementById('form-section');
const loadingSection = document.getElementById('loading-section');
const resultsSection = document.getElementById('results-section');
const progressBar = document.getElementById('progress-bar');

const btnBack = document.getElementById('btn-back');
const btnNext = document.getElementById('btn-next');
const btnSubmit = document.getElementById('btn-submit');
const btnRestart = document.getElementById('btn-restart');

// Debug helper — remove before production
function debugLog(label, data) {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        console.log(`[FounderLytics] ${label}:`, data);
    }
}

// ====== ONBOARDING TRANSITION ======
function proceedFromOnboarding() {
    const onboardingEl = document.getElementById('onboarding-step');
    if (onboardingEl) onboardingEl.style.display = 'none';
    const stepName = document.getElementById('step-name');
    stepName.style.display = 'block';
    stepName.classList.add('active');
    updateProgressBar();
    setTimeout(() => {
        const nameInput = document.getElementById('input-user-name');
        if (nameInput) nameInput.focus();
    }, 100);
}

// ====== PROGRESS BAR ======
function updateProgressBar() {
    const maxQuestions = 7;
    const progress = Math.min((questionCount / maxQuestions) * 100, 90);
    progressBar.style.width = `${progress}%`;
}

// ====== BACK & RESTART ======
if (btnBack) {
    btnBack.addEventListener('click', () => {
        location.reload();
    });
}

if (btnRestart) {
    btnRestart.addEventListener('click', () => {
        sessionStorage.clear();
        location.reload();
    });
}

// Global Enter key — triggers Continue when form section is active
document.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && formSection && formSection.classList.contains('active-section')) {
        if (btnNext && !btnNext.disabled) btnNext.click();
    }
});

// ====== NEXT BUTTON HANDLER ======
if (btnNext) {
    btnNext.addEventListener('click', async () => {
        if (currentStep === 'name') {
            const name = document.getElementById('input-user-name').value.trim();
            if (!name) {
                document.querySelector('#step-name .input-wrapper').classList.add('error');
                return;
            }
            window.userName = name;
            localStorage.setItem('fl_username', name);
            conversationHistory.push({ role: 'user', content: `My name is ${name}` });
            const heading = document.querySelector('.main-heading');
            if (heading) heading.textContent = `Let's look at your numbers, ${name}.`;
            document.getElementById('step-name').style.display = 'none';
            document.getElementById('step-name').classList.remove('active');
            const stepInitial = document.getElementById('step-initial');
            stepInitial.style.display = 'block';
            stepInitial.classList.add('active');
            currentStep = 'initial';
            if (btnBack) btnBack.style.visibility = 'visible';
            updateProgressBar();
            setTimeout(() => document.getElementById('input-business-type').focus(), 100);

        } else if (currentStep === 'initial') {
            const val = document.getElementById('input-business-type').value.trim();
            if (!val) {
                document.querySelector('#step-initial .input-wrapper').classList.add('error');
                return;
            }
            collectedData.businessType = val;
            conversationHistory.push({ role: 'user', content: `My business type: ${val}` });
            document.getElementById('step-initial').style.display = 'none';
            updateProgressBar();
            showCurrencyStep();

        } else if (currentStep === 'currency') {
            const currencyVal = document.getElementById('input-currency').value;
            if (!currencyVal) {
                document.getElementById('currency-tiles').classList.add('error');
                return;
            }

            if (currencyVal === 'other') {
                const otherVal = document.getElementById('input-currency-other').value.trim();
                if (!otherVal) return;
                window.userCurrency = otherVal;
                window.userCurrencyLabel = otherVal;
            }

            collectedData.currency = window.userCurrencyLabel || window.userCurrency;
            conversationHistory.push({
                role: 'user',
                content: `My currency: ${collectedData.currency}`
            });

            document.getElementById('step-currency').style.display = 'none';
            currentStep = 'dynamic';
            enableRefreshWarning();
            const notice = document.getElementById('no-refresh-notice');
            if (notice) notice.style.display = 'block';
            await getNextQuestion();

        } else if (currentStep === 'dynamic') {
            const input = document.getElementById('dynamic-input-value');
            const value = input && input.tagName === 'TEXTAREA' ? input.value.trim() : (input ? input.value.trim() : '');
            if (!value) {
                document.getElementById('dynamic-input-wrapper').classList.add('error');
                return;
            }
            const question = document.getElementById('dynamic-question-text').textContent;
            const answer = value;

            collectedData[`q${questionCount}`] = { question, answer };
            conversationHistory.push({ role: 'assistant', content: JSON.stringify({ action: 'ask', question }) });
            conversationHistory.push({ role: 'user', content: answer });
            saveSession();

            await getNextQuestion();
        }
    });
}

// ====== KEYWORD HIGHLIGHTING ======
function highlightKeyWords(text) {
    const fixedKeywords = [
        'monthly expenses', 'monthly revenue', 'total income', 'net profit',
        'hourly rate', 'hours worked', 'number of clients', 'biggest expense',
        'monthly profit', 'cost of goods', 'ad spend', 'profit margin',
        'monthly sales', 'fixed costs', 'variable costs', 'take home',
        'gastos del mes', 'ingresos', 'ganancias', 'clientes'
    ];

    const commonWords = new Set([
        'the', 'your', 'what', 'this', 'that', 'have', 'does', 'did', 'you',
        'how', 'much', 'many', 'last', 'for', 'from', 'with', 'when', 'are',
        'was', 'were', 'will', 'been', 'being', 'and', 'but', 'not', 'any',
        'all', 'each', 'per', 'its', 'our', 'their', 'them', 'they', 'make',
        'earn', 'spend', 'paid', 'pay', 'get', 'got', 'just', 'about', 'over',
        'than', 'into', 'out', 'more', 'most', 'long', 'such', 'month', 'week',
        'year', 'day', 'time', 'also', 'like', 'would', 'could', 'should',
        'typically', 'usually', 'often', 'might', 'can', 'do', 'in', 'on',
        'at', 'by', 'an', 'a', 'is', 'it', 'of', 'to', 'up', 'or', 'if',
        'so', 'us', 'we', 'me', 'my', 'he', 'she', 'his', 'her', 'who',
        'which', 'work', 'used', 'use', 'take', 'give', 'put', 'set', 'run',
        'lot', 'new', 'old', 'own', 'off', 'too', 'only', 'very', 'well',
        'then', 'now', 'here', 'there', 'no', 'yes', 'one', 'two', 'total',
        'include', 'including', 'example', 'describe', 'please', 'tell'
    ]);

    let result = text;

    // First pass: fixed keyword phrases (multi-word first to avoid partial matches)
    const sortedFixed = [...fixedKeywords].sort((a, b) => b.length - a.length);
    sortedFixed.forEach(kw => {
        const regex = new RegExp(`(${kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
        result = result.replace(regex, '<mark class="question-highlight">$1</mark>');
    });

    // Second pass: dynamic — words longer than 6 chars not in common list, not already highlighted
    result = result.replace(/(?<!<[^>]*)\b([A-Za-z]{7,})\b(?![^<]*>)/g, (match) => {
        if (commonWords.has(match.toLowerCase())) return match;
        if (result.includes(`>${match}<`) || result.includes(`>${match} `)) return match;
        return `<mark class="question-highlight">${match}</mark>`;
    });

    return result;
}

// ====== FETCH WITH TIMEOUT ======
async function fetchWithTimeout(url, options, timeoutMs = 30000) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    try {
        const response = await fetch(url, { ...options, signal: controller.signal });
        clearTimeout(timeoutId);
        return response;
    } catch (err) {
        clearTimeout(timeoutId);
        if (err.name === 'AbortError') throw new Error('Request timed out after 30 seconds');
        throw err;
    }
}

// ====== REFRESH WARNING ======
function enableRefreshWarning() {
    window.onbeforeunload = function (e) {
        if (currentStep === 'dynamic' || currentStep === 'currency' || currentStep === 'name') {
            const message = 'Your progress will be saved, but the AI conversation may restart. Are you sure?';
            e.returnValue = message;
            return message;
        }
    };
}

function disableRefreshWarning() {
    window.onbeforeunload = null;
}

// ====== FORM VIEW ======
function updateFormView() {
    const storedName = localStorage.getItem('fl_username');
    if (storedName) {
        window.userName = storedName;
        currentStep = 'initial';
        document.getElementById('step-name').style.display = 'none';
        document.getElementById('step-name').classList.remove('active');
        document.getElementById('step-initial').style.display = 'block';
        document.getElementById('step-initial').classList.add('active');
        setTimeout(() => document.getElementById('input-business-type').focus(), 100);
    } else {
        currentStep = 'name';
        const stepName = document.getElementById('step-name');
        stepName.style.display = 'block';
        stepName.classList.add('active');
        updateProgressBar();
        setTimeout(() => {
            const nameInput = document.getElementById('input-user-name');
            if (nameInput) nameInput.focus();
        }, 100);
    }
}

// ====== AI CONVERSATION ======
async function getNextQuestion() {
    // Layer 1 — Force analysis if we have enough data
    if (questionCount >= 7) {
        debugLog('Max questions reached — forcing analysis', collectedData);
        await submitAnalysis();
        return;
    }

    btnNext.textContent = 'Thinking...';
    btnNext.disabled = true;

    // Layer 4 — Show thinking indicator with timeout warning
    const thinkingMsg = document.createElement('p');
    thinkingMsg.id = 'thinking-msg';
    thinkingMsg.style.cssText = 'font-size:13px; color:#9ca3af; text-align:center; margin-top:16px;';
    thinkingMsg.textContent = 'Analyzing your answer...';
    const formCard = document.querySelector('.form-card');
    if (formCard && !document.getElementById('thinking-msg')) {
        formCard.appendChild(thinkingMsg);
    }

    const warningTimeout = setTimeout(() => {
        const msg = document.getElementById('thinking-msg');
        if (msg) msg.textContent = 'Taking longer than usual... almost there.';
    }, 15000);

    window._warningTimeout = warningTimeout;

    const systemPrompt = `You are FounderLytics — a sharp, warm financial coach for early-stage entrepreneurs and freelancers. Your job is to have a short conversation that collects exactly the right information to generate a concrete, personalized action plan for their business.

You are NOT collecting data to fill a spreadsheet. You are having a real conversation with a real person who is trying to build something. Every question you ask should feel like it comes from someone who genuinely wants to help them succeed.

YOUR GOAL: Collect enough context to generate 4-6 specific, actionable Next Steps that will make their business financially stronger. The steps must be concrete — not "save more money" but "set aside exactly $X this week because of Y."

WHAT YOU NEED TO COLLECT — ask these in a natural conversational order:
1. Business type and how long they've been running it
2. Monthly revenue (approximate is fine)
3. Monthly expenses — what are the main ones
4. Hours worked per month
5. Number of clients or customers
6. Their biggest current challenge: getting clients / managing costs / scaling / pricing
7. Their income goal for the next 6 months
8. What they've already tried to grow or improve

RULES:
- Ask ONE question at a time. Never combine two questions.
- After 6-8 questions, if you have enough context, signal you're ready to analyze.
- Use their name naturally — not every message, but occasionally.
- Be warm and direct. Like a smart friend who happens to know finance.
- Celebrate honest answers: "That's actually a solid margin for your stage."
- Be honest about problems but never discouraging: "That's lower than ideal — but it's exactly the kind of thing we can fix."
- Use contractions: you're, don't, we'll, that's.
- Keep questions under 12 words.
- Hints should give a real example.
- If they mention a specific number or challenge, acknowledge it before moving to the next question.

INPUT TYPE RULES:
- Use "number" ONLY for precise dollar amounts or counts
- Use "freetext" when description gives more value than a number
- Use "select" for categories or multiple choice
- Never force a number when a description would be more useful

TONE EXAMPLES:
Good: "How long have you been running this business?"
Good: "What's eating most of your budget right now?"
Good: "What's your income goal for the next 6 months — roughly?"
Bad: "Please specify your monthly gross revenue."
Bad: "What is your primary expenditure category?"

ALWAYS respond with ONLY valid JSON, no other text:

If you need more data:
{
  "action": "ask",
  "question": "Your conversational question here",
  "hint": "A friendly example or clarification",
  "inputType": "number" or "text" or "select" or "freetext",
  "options": ["Option 1", "Option 2"]
}

If you have enough data (after 6-8 exchanges):
{
  "action": "analyze",
  "summary": "One sentence of what you learned about their business"
}`;

    // Helper to clean up thinking state
    function cleanupThinking() {
        clearTimeout(window._warningTimeout);
        const msg = document.getElementById('thinking-msg');
        if (msg) msg.remove();
        btnNext.textContent = 'Continue →';
        btnNext.disabled = false;
    }

    try {
        // Layer 2 — Timeout-protected fetch
        const response = await fetchWithTimeout('/api/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                system: systemPrompt,
                messages: conversationHistory
            })
        });

        const data = await response.json();
        const text = data.content?.[0]?.text || '';

        // Layer 3 — Hardened parse with fallback
        let parsed;
        try {
            const trimmed = text.trim();
            parsed = JSON.parse(trimmed);
        } catch (e1) {
            try {
                const match = text.match(/\{[\s\S]*\}/);
                if (match) {
                    parsed = JSON.parse(match[0]);
                } else {
                    throw new Error('No JSON found');
                }
            } catch (e2) {
                console.error('Could not parse AI question response:', text);
                if (questionCount >= 4) {
                    debugLog('Parse failed with enough data — forcing analysis', {});
                    cleanupThinking();
                    await submitAnalysis();
                    return;
                }
                parsed = {
                    action: 'ask',
                    question: 'What is your biggest financial challenge right now?',
                    hint: 'Getting clients, managing costs, pricing, or scaling?',
                    inputType: 'freetext'
                };
            }
        }

        debugLog('Next question from AI', parsed);

        if (parsed.action === 'analyze') {
            cleanupThinking();
            await submitAnalysis();
        } else {
            renderDynamicQuestion(parsed);
            questionCount++;
            updateProgressBar();
            cleanupThinking();
            if (btnBack) btnBack.style.visibility = 'visible';
        }
    } catch (err) {
        console.error(err);
        cleanupThinking();
    }
}

function isMoneyQuestion(questionText) {
    const moneyKeywords = [
        'spend', 'earn', 'make', 'revenue', 'income', 'expense', 'cost',
        'charge', 'pay', 'salary', 'profit', 'budget', 'price', 'rate',
        'investment', 'save', 'money', 'dollar', 'peso', 'amount',
        'monthly', 'annual', 'weekly', 'total'
    ];
    const countKeywords = [
        'how many', 'number of', 'count', 'clients', 'customers', 'orders',
        'projects', 'hours', 'employees', 'people', 'products', 'items', 'weeks'
    ];
    const lowerQ = questionText.toLowerCase();
    if (countKeywords.some(kw => lowerQ.includes(kw))) return false;
    return moneyKeywords.some(kw => lowerQ.includes(kw));
}

function renderDynamicQuestion(q) {
    document.getElementById('step-initial').style.display = 'none';
    const dynamicStep = document.getElementById('dynamic-step');
    dynamicStep.style.display = 'block';
    dynamicStep.classList.add('active');

    document.getElementById('dynamic-question-text').innerHTML = highlightKeyWords(q.question);
    document.getElementById('dynamic-question-hint').textContent = q.hint || '';

    const wrapper = document.getElementById('dynamic-input-wrapper');
    wrapper.classList.remove('error');

    if (q.inputType === 'select' && q.options) {
        wrapper.innerHTML = `<div class="tile-group" id="dynamic-tiles">
          ${q.options.map(opt => `<button class="tile-btn" data-value="${opt}">${opt}</button>`).join('')}
          <input type="hidden" id="dynamic-input-value" value="">
          <span class="error-msg">Please select an option.</span>
        </div>`;
        wrapper.querySelectorAll('.tile-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                wrapper.querySelectorAll('.tile-btn').forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
                document.getElementById('dynamic-input-value').value = btn.dataset.value;
                wrapper.classList.remove('error');
            });
        });
    } else if (q.inputType === 'number') {
        const showCurrency = isMoneyQuestion(q.question);
        const currencySymbol = window.userCurrency || '$';
        if (showCurrency) {
            wrapper.innerHTML = `
              <span class="currency-symbol">${currencySymbol}</span>
              <input type="number" id="dynamic-input-value" class="with-symbol" placeholder="0.00" autofocus>
              <span class="error-msg">Please enter a valid amount.</span>`;
        } else {
            wrapper.innerHTML = `
              <input type="number" id="dynamic-input-value" placeholder="Enter a number..." autofocus>
              <span class="error-msg">Please enter a valid number.</span>`;
        }
    } else if (q.inputType === 'freetext') {
        wrapper.innerHTML = `
          <textarea
            id="dynamic-input-value"
            placeholder="Describe it in your own words..."
            rows="3"
            style="width:100%; background:var(--surface); border:1.5px solid var(--border);
                   border-radius:10px; padding:14px 16px; font-family:var(--font);
                   font-size:15px; color:var(--text); outline:none; resize:none;
                   line-height:1.6; transition:border-color 0.2s, box-shadow 0.2s;"
          ></textarea>
          <span class="error-msg">Please describe your situation.</span>`;

        const textarea = document.getElementById('dynamic-input-value');
        textarea.addEventListener('focus', () => {
            textarea.style.borderColor = 'var(--accent)';
            textarea.style.boxShadow = '0 0 0 3px rgba(79,70,229,0.12)';
        });
        textarea.addEventListener('blur', () => {
            textarea.style.borderColor = 'var(--border)';
            textarea.style.boxShadow = 'none';
        });
        textarea.addEventListener('input', () => {
            wrapper.classList.remove('error');
        });
        textarea.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) btnNext.click();
        });

        const hint = document.createElement('p');
        hint.style.cssText = 'font-size:12px; color:#9ca3af; margin-top:8px; display:flex; align-items:center; gap:5px;';
        hint.innerHTML = `${ICONS.tip} Tip: The more detail you give, the better your analysis will be.`;
        wrapper.appendChild(hint);

        setTimeout(() => textarea.focus(), 100);
        return;
    } else {
        wrapper.innerHTML = `
          <input type="text" id="dynamic-input-value" placeholder="Your answer..." autofocus>
          <span class="error-msg">Please enter your answer.</span>`;
    }

    const input = document.getElementById('dynamic-input-value');
    if (input && input.tagName === 'INPUT') {
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') btnNext.click();
        });
        input.addEventListener('input', () => {
            wrapper.classList.remove('error');
        });
        setTimeout(() => input.focus(), 100);
    }
}

// ====== ANALYSIS SYSTEM PROMPT ======
function getAnalysisSystemPrompt() {
    return `You are FounderLytics — a sharp, direct financial coach for early-stage entrepreneurs. You have just finished a conversation and collected financial data about their business.

Your job is to deliver two things:
1. A structured JSON with their financial metrics AND their personalized Next Steps
2. A short, focused written explanation of WHY these are their next steps

THE MOST IMPORTANT PART IS THE NEXT STEPS. Everything else supports them.

NEXT STEPS RULES:
- Generate exactly 4-6 next steps
- Each step must be SPECIFIC to their numbers and business type — never generic
- Each step must have a clear timeline: This Week / This Month / Next 90 Days
- Each step must include the expected financial impact in concrete numbers
- Order steps by urgency and impact — most important first
- A dropshipper and a freelancer get completely different steps
- If their health score is below 40, focus on survival steps first
- If their health score is 40-70, focus on stability and growth
- If above 70, focus on scaling and optimization

WRITTEN ANALYSIS RULES:
- Maximum 3 short paragraphs
- Paragraph 1: Honest bottom line — are they in good shape or not, and the single most important thing to address
- Paragraph 2: The 2 numbers that matter most and what they reveal about the business
- Paragraph 3: What success looks like in 90 days if they follow the steps
- No bullet points. No headers. No markdown.
- Be direct and encouraging. Use their name once.
- Never describe numbers they can already see on screen

Return ONLY a valid JSON object wrapped EXACTLY between |||JSON and ||| delimiters, followed by the written analysis, followed by a follow-up question prefixed with FOLLOWUP:

|||JSON
{
  "stats": {
    "netProfit": number,
    "hourlyRate": number or null,
    "taxReserve": number,
    "profitMargin": number,
    "revenuePerClient": number or null,
    "financialHealthScore": number,
    "savingsRecommendation": number,
    "investmentRecommendation": number,
    "monthlyRevenue": number,
    "monthlyExpenses": number
  },
  "businessType": "freelancer" or "dropshipping" or "local_business" or "saas" or "other",
  "businessSummary": "One sentence that honestly describes the state of their business right now",
  "projectionBase": number,
  "nextSteps": [
    {
      "priority": 1,
      "timeline": "This Week",
      "title": "Specific actionable title — max 8 words",
      "urgency": "One sentence: why this can't wait",
      "action": "Exactly what to do — specific, no vague advice",
      "impact": "Concrete expected result in numbers or clear outcome"
    },
    {
      "priority": 2,
      "timeline": "This Month",
      "title": "...",
      "urgency": "...",
      "action": "...",
      "impact": "..."
    },
    {
      "priority": 3,
      "timeline": "This Month",
      "title": "...",
      "urgency": "...",
      "action": "...",
      "impact": "..."
    },
    {
      "priority": 4,
      "timeline": "Next 90 Days",
      "title": "...",
      "urgency": "...",
      "action": "...",
      "impact": "..."
    }
  ],
  "whyTheseSteps": "2-3 sentences explaining the reasoning behind the priority order of these steps"
}
|||

[3 paragraphs of written analysis here]

FOLLOWUP: [One specific follow-up question based on the most important next step]`;
}

const ANALYSIS_SYSTEM_PROMPT = getAnalysisSystemPrompt();

// ====== API CALL (for followup chat) ======
async function callAPI() {
    try {
        const response = await fetch('/api/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                system: ANALYSIS_SYSTEM_PROMPT,
                messages: chatHistory
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error('API error response:', errorData);
            throw new Error(`API error: ${response.status} — ${errorData.error?.message || 'Unknown error'}`);
        }

        const data = await response.json();

        // Handle all possible response formats
        if (data.content && Array.isArray(data.content) && data.content[0]?.text) {
            return data.content[0].text;
        }
        if (typeof data.content === 'string') return data.content;
        if (typeof data.response === 'string') return data.response;
        if (typeof data.text === 'string') return data.text;

        console.error('Unexpected API response format:', data);
        return JSON.stringify(data);

    } catch (error) {
        console.error('callAPI error:', error);
        document.getElementById('ai-response-content').textContent =
            'Connection error. Please check your internet and try again.';
        return '';
    }
}

// ====== SUBMIT ANALYSIS ======
function lockFormForSubmission() {
    const formActions = document.querySelector('.form-actions');
    if (formActions) formActions.style.display = 'none';

    const noRefreshNotice = document.getElementById('no-refresh-notice');
    if (noRefreshNotice) noRefreshNotice.style.display = 'none';

    disableRefreshWarning();
}

function calculateStatsLocally() {
    // Extract numbers from conversation history
    const allAnswers = conversationHistory
        .filter(m => m.role === 'user')
        .map(m => m.content);

    // Try to find revenue, expenses, hours, clients from answers
    let revenue = 0, expenses = 0, hours = 0, clients = 0;

    allAnswers.forEach(answer => {
        const nums = answer.match(/\d+(\.\d+)?/g);
        if (!nums) return;
        const val = parseFloat(nums[0]);

        const lower = answer.toLowerCase();
        if (lower.includes('revenue') || lower.includes('made') || lower.includes('earned') || lower.includes('income') || lower.includes('make')) {
            if (val > revenue) revenue = val;
        }
        if (lower.includes('expense') || lower.includes('spend') || lower.includes('cost') || lower.includes('spent')) {
            if (val > expenses) expenses = val;
        }
        if (lower.includes('hour')) {
            if (val > hours) hours = val;
        }
        if (lower.includes('client') || lower.includes('customer') || lower.includes('order')) {
            if (val > clients && val < 10000) clients = val;
        }
    });

    // Also check collectedData questions
    Object.values(collectedData).forEach(item => {
        if (!item || !item.question || !item.answer) return;
        const q = item.question.toLowerCase();
        const a = item.answer.toString().toLowerCase();
        const nums = a.match(/\d+(\.\d+)?/g);
        if (!nums) return;
        const val = parseFloat(nums[0]);

        if (q.includes('revenue') || q.includes('make') || q.includes('earn') || q.includes('income')) {
            if (val > 0 && val > revenue) revenue = val;
        }
        if (q.includes('expense') || q.includes('spend') || q.includes('cost')) {
            if (val > 0 && val > expenses) expenses = val;
        }
        if (q.includes('hour')) {
            if (val > 0 && val > hours) hours = val;
        }
        if (q.includes('client') || q.includes('customer') || q.includes('order')) {
            if (val > 0 && val < 10000 && val > clients) clients = val;
        }
    });

    // Fallback estimates if extraction failed
    if (revenue === 0) revenue = 1000;
    if (expenses === 0) expenses = revenue * 0.4;

    const taxRates = { '$': 0.25, '£': 0.20, '€': 0.20, '₹': 0.18 };
    const taxRate = taxRates[window.userCurrency] || 0.20;
    const netProfit = revenue - expenses;
    const taxReserve = Math.max(0, netProfit * taxRate);
    const profitMargin = revenue > 0 ? (netProfit / revenue) * 100 : 0;
    const hourlyRate = hours > 0 ? netProfit / hours : null;
    const revenuePerClient = clients > 0 ? revenue / clients : null;

    // Health score based on margin and profitability
    let healthScore = 50;
    if (profitMargin > 70) healthScore = 80;
    else if (profitMargin > 50) healthScore = 65;
    else if (profitMargin > 30) healthScore = 50;
    else if (profitMargin > 10) healthScore = 35;
    else healthScore = 20;

    if (netProfit < 0) healthScore = 15;
    if (revenue > 5000) healthScore = Math.min(healthScore + 10, 100);

    const savingsRecommendation = Math.max(0, netProfit * 0.2);
    const investmentRecommendation = Math.max(0, netProfit * 0.1);

    return {
        netProfit: Math.round(netProfit),
        hourlyRate: hourlyRate ? Math.round(hourlyRate * 100) / 100 : null,
        taxReserve: Math.round(taxReserve),
        profitMargin: Math.round(profitMargin * 10) / 10,
        revenuePerClient: revenuePerClient ? Math.round(revenuePerClient) : null,
        financialHealthScore: healthScore,
        savingsRecommendation: Math.round(savingsRecommendation),
        investmentRecommendation: Math.round(investmentRecommendation),
        monthlyRevenue: Math.round(revenue),
        monthlyExpenses: Math.round(expenses)
    };
}

async function submitAnalysis() {
    lockFormForSubmission();

    const btnBackEl = document.getElementById('btn-back');
    const btnNextEl = document.getElementById('btn-next');
    const btnSubmitEl = document.getElementById('btn-submit');
    if (btnBackEl) btnBackEl.style.visibility = 'hidden';
    if (btnNextEl) btnNextEl.style.display = 'none';
    if (btnSubmitEl) btnSubmitEl.style.display = 'none';

    const arrow = document.getElementById('scroll-arrow-indicator');
    if (arrow) arrow.remove();

    // PHASE 1: Show results immediately with local calculations
    const localStats = calculateStatsLocally();

    const localData = {
        stats: localStats,
        businessType: collectedData.businessType || 'other',
        businessSummary: 'Calculating your personalized analysis...',
        projectionBase: localStats.netProfit,
        nextSteps: [],
        whyTheseSteps: ''
    };

    window.analysisData = localData;

    // Transition to results immediately
    document.getElementById('form-section').classList.remove('active-section');
    document.getElementById('form-section').classList.add('hidden-section');
    document.getElementById('results-section').classList.remove('hidden-section');
    document.getElementById('results-section').classList.add('active-section');

    // Render stats and charts right away
    updateStats(localStats);
    updateCharts(localStats);
    setTimeout(() => initInteractiveCharts(), 100);

    // Open blocks
    toggleBlock('block-stats', true);
    toggleBlock('block-charts', true);

    // Set date
    const dateEl = document.getElementById('results-date');
    if (dateEl) dateEl.textContent = new Date().toLocaleDateString('en-US', {
        month: 'long', day: 'numeric', year: 'numeric'
    });

    // Show loading state in AI block
    toggleBlock('block-ai', true);
    const aiContent = document.getElementById('ai-response-content');
    if (aiContent) {
        aiContent.innerHTML = `
      <div style="display:flex; align-items:center; gap:10px; color:#9ca3af; font-size:14px; padding:8px 0;">
        <div style="display:flex; gap:4px;">
          <div style="width:6px;height:6px;background:#9ca3af;border-radius:50%;animation:pulse 1.4s ease-in-out infinite;"></div>
          <div style="width:6px;height:6px;background:#9ca3af;border-radius:50%;animation:pulse 1.4s ease-in-out 0.2s infinite;"></div>
          <div style="width:6px;height:6px;background:#9ca3af;border-radius:50%;animation:pulse 1.4s ease-in-out 0.4s infinite;"></div>
        </div>
        Building your personalized Next Steps...
      </div>
    `;
    }

    // Show loading state in tools block
    toggleBlock('block-tools', true);
    const toolsContent = document.getElementById('content-block-tools');
    if (toolsContent) {
        toolsContent.innerHTML = `
      <div style="padding:24px; text-align:center; color:#9ca3af; font-size:14px;">
        Your AI-powered Next Steps are being generated...
      </div>
    `;
    }

    incrementUsage();
    saveSession();

    // Show scroll notification
    const scrollNotice = document.createElement('div');
    scrollNotice.style.cssText = `
    position: fixed;
    bottom: 24px;
    left: 50%;
    transform: translateX(-50%);
    background: #111827;
    color: white;
    padding: 12px 24px;
    border-radius: 999px;
    font-size: 14px;
    font-weight: 600;
    font-family: 'Inter', sans-serif;
    z-index: 1000;
    display: flex;
    align-items: center;
    gap: 8px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.3);
    animation: fadeIn 0.4s ease both;
    cursor: pointer;
  `;
    scrollNotice.innerHTML = `
    Your results are ready
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <line x1="12" y1="5" x2="12" y2="19"/>
      <polyline points="19 12 12 19 5 12"/>
    </svg>
  `;
    scrollNotice.onclick = () => {
        document.getElementById('results-section').scrollIntoView({ behavior: 'smooth' });
        scrollNotice.remove();
    };
    document.body.appendChild(scrollNotice);
    setTimeout(() => { if (scrollNotice.parentNode) scrollNotice.remove(); }, 5000);

    // Scroll to results
    setTimeout(() => {
        document.getElementById('results-section').scrollIntoView({ behavior: 'smooth' });
    }, 200);

    // PHASE 2: Call AI for next steps only
    const nextStepsPrompt = `You are FounderLytics — a sharp financial coach. Based on this entrepreneur's conversation data, generate their personalized Next Steps action plan.

Conversation data:
${conversationHistory.filter(m => m.role === 'user').map(m => `- ${m.content}`).join('\n')}

Local calculations already shown to user:
- Monthly Revenue: $${localStats.monthlyRevenue}
- Monthly Expenses: $${localStats.monthlyExpenses}
- Net Profit: $${localStats.netProfit}
- Profit Margin: ${localStats.profitMargin}%
- Financial Health Score: ${localStats.financialHealthScore}/100
- Business Type: ${collectedData.businessType || 'unknown'}
- User Name: ${window.userName || 'Entrepreneur'}

Generate EXACTLY this JSON structure, then 2-3 paragraphs of analysis, then a FOLLOWUP question:

|||JSON
{
  "businessSummary": "One honest sentence about their business state",
  "nextSteps": [
    {
      "priority": 1,
      "timeline": "This Week",
      "title": "Specific action under 8 words",
      "urgency": "Why this can't wait — one sentence",
      "action": "Exactly what to do, step by step",
      "impact": "Concrete expected outcome with numbers"
    },
    {
      "priority": 2,
      "timeline": "This Month",
      "title": "...",
      "urgency": "...",
      "action": "...",
      "impact": "..."
    },
    {
      "priority": 3,
      "timeline": "This Month",
      "title": "...",
      "urgency": "...",
      "action": "...",
      "impact": "..."
    },
    {
      "priority": 4,
      "timeline": "Next 90 Days",
      "title": "...",
      "urgency": "...",
      "action": "...",
      "impact": "..."
    }
  ],
  "whyTheseSteps": "2 sentences explaining the priority order"
}
|||

[2-3 paragraphs of honest analysis]

FOLLOWUP: [One specific follow-up question]`;

    try {
        const response = await fetch('/api/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            system: 'You are a financial advisor. You MUST respond with ONLY the |||JSON block first, then analysis paragraphs, then FOLLOWUP. Never add headers like ## Analysis. Never use markdown. Start your response immediately with |||JSON',
            messages: [{ role: 'user', content: nextStepsPrompt }]
          })
        });

        if (!response.ok) throw new Error(`API error: ${response.status}`);

        const data = await response.json();
        let aiMessage = '';

        if (data.content && Array.isArray(data.content) && data.content[0]?.text) {
          aiMessage = data.content[0].text;
        } else if (typeof data.content === 'string') {
          aiMessage = data.content;
        } else {
          aiMessage = JSON.stringify(data);
        }

        console.log('[FounderLytics] Raw AI response (first 500 chars):', aiMessage.substring(0, 500));

        chatHistory.push({ role: 'assistant', content: aiMessage });

        // Try to extract JSON manually with brace counting
        let jsonData = null;
        let cleanText = aiMessage;

        // Method 1: standard delimiters
        const delimMatch = aiMessage.match(/\|\|\|JSON\s*([\s\S]*?)\s*\|\|\|/);
        if (delimMatch) {
          try {
            jsonData = JSON.parse(delimMatch[1].trim());
            cleanText = aiMessage.replace(/\|\|\|JSON\s*[\s\S]*?\s*\|\|\|/, '').trim();
            console.log('[FounderLytics] Parsed via delimiters. nextSteps:', jsonData?.nextSteps?.length);
          } catch(e) { console.error('Delimiter parse failed:', e); }
        }

        // Method 2: brace counting from |||JSON
        if (!jsonData) {
          const openIdx = aiMessage.indexOf('|||JSON');
          if (openIdx !== -1) {
            let str = aiMessage.substring(openIdx + 7).trim();
            let depth = 0, endIdx = -1;
            for (let i = 0; i < str.length; i++) {
              if (str[i] === '{') depth++;
              else if (str[i] === '}') { depth--; if (depth === 0) { endIdx = i; break; } }
            }
            if (endIdx > 0) {
              try {
                jsonData = JSON.parse(str.substring(0, endIdx + 1));
                cleanText = aiMessage.substring(0, openIdx) + aiMessage.substring(openIdx + 7 + endIdx + 1);
                console.log('[FounderLytics] Parsed via brace counting. nextSteps:', jsonData?.nextSteps?.length);
              } catch(e) { console.error('Brace count parse failed:', e); }
            }
          }
        }

        // Method 3: find any object with nextSteps key
        if (!jsonData) {
          const nsIdx = aiMessage.indexOf('"nextSteps"');
          if (nsIdx !== -1) {
            let searchFrom = nsIdx;
            while (searchFrom > 0 && aiMessage[searchFrom] !== '{') searchFrom--;
            let depth = 0, endIdx = -1;
            for (let i = searchFrom; i < aiMessage.length; i++) {
              if (aiMessage[i] === '{') depth++;
              else if (aiMessage[i] === '}') { depth--; if (depth === 0) { endIdx = i; break; } }
            }
            if (endIdx > 0) {
              try {
                jsonData = JSON.parse(aiMessage.substring(searchFrom, endIdx + 1));
                cleanText = aiMessage.substring(0, searchFrom) + aiMessage.substring(endIdx + 1);
                console.log('[FounderLytics] Parsed via nextSteps search. nextSteps:', jsonData?.nextSteps?.length);
              } catch(e) { console.error('nextSteps search parse failed:', e); }
            }
          }
        }

        // Clean display text
        cleanText = cleanText
          .replace(/\|\|\|JSON[\s\S]*?\|\|\|/g, '')
          .replace(/\|\|\|JSON[\s\S]*/g, '')
          .replace(/\|\|\|/g, '')
          .replace(/##\s+\w+/g, '')
          .replace(/\*\*/g, '')
          .trim();

        // Extract followup
        let followUpQ = null;
        const fuMatch = cleanText.match(/FOLLOWUP:\s*([\s\S]*?)(?:\n|$)/i);
        if (fuMatch) {
          followUpQ = fuMatch[1].trim();
          cleanText = cleanText.replace(/FOLLOWUP:\s*[\s\S]*?(?:\n|$)/i, '').trim();
        }

        // Render next steps if we got them
        if (jsonData && jsonData.nextSteps && jsonData.nextSteps.length > 0) {
          const mergedData = {
            stats: localStats,
            businessType: collectedData.businessType || 'other',
            businessSummary: jsonData.businessSummary || '',
            projectionBase: localStats.netProfit,
            nextSteps: jsonData.nextSteps.map((step, i) => ({
              priority: step.priority || i + 1,
              timeline: step.timeline || 'This Month',
              title: step.title || 'Action required',
              urgency: step.urgency || '',
              action: step.action || '',
              impact: step.impact || ''
            })),
            whyTheseSteps: jsonData.whyTheseSteps || ''
          };
          window.analysisData = mergedData;
          renderNextSteps(mergedData);
          console.log('[FounderLytics] Next steps rendered successfully:', mergedData.nextSteps.length);
        } else {
          console.warn('[FounderLytics] No nextSteps found. Showing fallback.');
          const toolsContent = document.getElementById('content-block-tools');
          if (toolsContent) {
            toolsContent.innerHTML = `
              <div style="padding:20px 0;">
                <p style="font-size:15px; font-weight:600; color:#111827; margin-bottom:8px;">Analysis complete.</p>
                <p style="font-size:14px; color:#6b7280; line-height:1.7;">Based on your ${localStats.profitMargin}% profit margin and $${localStats.netProfit.toLocaleString()}/month net profit, use the chat below to ask specific questions like "What should I focus on this week?" or "How do I reduce my expenses?"</p>
              </div>`;
          }
        }

        // Type analysis text
        let analysisText = cleanText || 'Your financial picture is ready. Review the sections above.';
        if (analysisText.length < 20) analysisText = 'Your numbers are ready above. Use the chat to ask specific questions about your business.';

        typeText(analysisText, 'ai-response-content', () => {
          if (followUpQ) {
            const fqEl = document.getElementById('followup-question-text');
            if (fqEl) fqEl.innerText = followUpQ;
            const container = document.getElementById('followup-container');
            if (container) container.classList.remove('hidden');
          }
        });

        saveSession();

    } catch (error) {
        console.error('AI next steps error:', error);
        const aiContent = document.getElementById('ai-response-content');
        if (aiContent) {
          aiContent.innerHTML = `<p style="color:#374151; font-size:15px; line-height:1.7;">Your numbers are ready above. Use the chat below to ask specific questions about your business.</p>`;
        }
    }
}

// ====== RESULTS RENDERING ======
const formatCurrency = (val) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val || 0);
const formatPercent = (val) => (val || 0).toFixed(1) + '%';

function processDisplayResults(fullResponse) {
    if (!fullResponse || typeof fullResponse !== 'string') {
        console.error('processDisplayResults received invalid response:', fullResponse);
        return;
    }

    const { jsonData, cleanText, followUpQ } = parseAIResponse(fullResponse);

    // Store globally for interactive charts and email
    if (jsonData) {
        window.analysisData = jsonData;

        // Render stats and charts
        updateStats(jsonData.stats);
        updateCharts(jsonData.stats);
        initInteractiveCharts();

        // Render next steps
        renderNextSteps(jsonData);

        // Open key blocks automatically
        toggleBlock('block-stats', true);
        toggleBlock('block-ai', true);
        toggleBlock('block-tools', true);
    } else {
        console.warn('No JSON data parsed — showing text only');
    }

    // Set date
    const dateEl = document.getElementById('results-date');
    if (dateEl) {
        dateEl.textContent = new Date().toLocaleDateString('en-US', {
            month: 'long', day: 'numeric', year: 'numeric'
        });
    }

    // Set profile header
    const profileName = document.getElementById('profile-display-name');
    if (profileName && window.userName) profileName.textContent = window.userName;
    const profileAvatar = document.getElementById('profile-avatar');
    if (profileAvatar && window.userName) profileAvatar.textContent = window.userName[0].toUpperCase();
    const profileTitle = document.getElementById('profile-title-el');
    if (profileTitle && collectedData && collectedData.businessType) {
        // Capitalize first letter
        const btype = collectedData.businessType;
        profileTitle.textContent = btype.charAt(0).toUpperCase() + btype.slice(1);
    }

    // Show email block after analysis
    const emailBlock = document.getElementById('block-email-results');
    if (emailBlock) emailBlock.style.display = '';

    // Type out the AI analysis text
    const analysisText = cleanText || 'Analysis complete. Review your Next Steps above.';

    typeText(analysisText, 'ai-response-content', () => {
        if (followUpQ && followupCount < MAX_FOLLOWUPS) {
            const fqEl = document.getElementById('followup-question-text');
            if (fqEl) fqEl.innerText = followUpQ;
            const container = document.getElementById('followup-container');
            if (container) container.classList.remove('hidden');
        } else if (followupCount >= MAX_FOLLOWUPS) {
            const container = document.getElementById('followup-container');
            if (container) container.classList.remove('hidden');
            const grp = document.querySelector('.followup-input-group');
            if (grp) grp.classList.add('hidden');
            const limitMsg = document.getElementById('followup-limit-msg');
            if (limitMsg) limitMsg.classList.remove('hidden');
        }
    });

    // Pre-fill email if known
    const storedEmail = localStorage.getItem('fl_email');
    const emailInput = document.getElementById('input-results-email');
    if (emailInput && storedEmail && storedEmail.includes('@')) {
        emailInput.value = storedEmail;
    }

    // Save session
    saveSession();
}

function updateStats(data) {
    const npEl = document.getElementById('val-net-profit');
    if (npEl) {
        npEl.innerText = formatCurrency(data.netProfit || 0);
        npEl.className = 'stat-value ' + ((data.netProfit || 0) >= 0 ? 'value-positive' : 'value-negative');
    }

    const hrEl = document.getElementById('val-hourly-rate');
    if (hrEl) hrEl.innerText = data.hourlyRate != null ? formatCurrency(data.hourlyRate) : 'N/A';

    const tcEl = document.getElementById('val-tax-country');
    if (tcEl) tcEl.innerText = '';

    const trEl = document.getElementById('val-tax-reserve');
    if (trEl) trEl.innerText = formatCurrency(data.taxReserve || 0);

    const hsEl = document.getElementById('val-health-score');
    if (hsEl) {
        let score = data.financialHealthScore || 0;
        hsEl.textContent = score;
        hsEl.className = 'health-score-number';
        if (score <= 40) hsEl.classList.add('score-red');
        else if (score <= 70) hsEl.classList.add('score-yellow');
        else hsEl.classList.add('score-green');
    }
    // Also update finances tab badge
    const hsFin = document.getElementById('val-health-score-finance');
    if (hsFin) {
        let score = data.financialHealthScore || 0;
        hsFin.textContent = score + '/100';
        hsFin.className = 'health-badge';
    }

    const pmEl = document.getElementById('val-profit-margin');
    if (pmEl) pmEl.innerText = formatPercent(data.profitMargin || 0);

    const rcEl = document.getElementById('val-rev-per-client');
    if (rcEl) rcEl.innerText = data.revenuePerClient != null ? formatCurrency(data.revenuePerClient) : 'N/A';
}

function updateCharts(data) {
    if (typeof Chart === 'undefined') return;

    Chart.defaults.font.family = 'Inter, system-ui, sans-serif';
    Chart.defaults.font.size = 12;
    Chart.defaults.color = '#9ca3af';

    const sharedPlugins = {
        legend: {
            position: 'bottom',
            labels: {
                padding: 16,
                usePointStyle: true,
                pointStyleWidth: 8,
                font: { size: 11, weight: '600' }
            }
        },
        tooltip: {
            backgroundColor: '#111827',
            titleColor: '#f9fafb',
            bodyColor: '#d1d5db',
            padding: 12,
            cornerRadius: 10,
            borderColor: 'rgba(255,255,255,0.1)',
            borderWidth: 1,
            callbacks: {
                label: (ctx) => ` $${ctx.parsed.y?.toLocaleString() ?? ctx.parsed.toLocaleString()}`
            }
        }
    };

    const sharedScales = {
        y: {
            grid: { color: 'rgba(0,0,0,0.04)', drawBorder: false },
            border: { display: false },
            ticks: { padding: 8, callback: v => `$${v.toLocaleString()}` }
        },
        x: {
            grid: { display: false },
            border: { display: false },
            ticks: { padding: 8 }
        }
    };

    const commonOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: sharedPlugins
    };

    const revenue = data.monthlyRevenue || 0;
    const expenses = data.monthlyExpenses || 0;

    // 1. Bar Chart
    const barEl = document.getElementById('barChart');
    if (barEl) {
        const barCtx = barEl.getContext('2d');
        if (barChartInst) barChartInst.destroy();

        barChartInst = new Chart(barCtx, {
            type: 'bar',
            data: {
                labels: ['Revenue', 'Expenses', 'Tax Reserve', 'Net Profit'],
                datasets: [{
                    label: 'Monthly Financials ($)',
                    data: [revenue, expenses, data.taxReserve || 0, data.netProfit || 0],
                    backgroundColor: [
                        'rgba(17,24,39,0.85)',
                        'rgba(220,38,38,0.7)',
                        'rgba(217,119,6,0.7)',
                        'rgba(22,163,74,0.85)'
                    ],
                    borderRadius: 6
                }]
            },
            options: {
                ...commonOptions,
                scales: sharedScales
            }
        });
    }

    // 2. Doughnut Chart
    const available = (data.netProfit || 0) - (data.savingsRecommendation || 0) - (data.investmentRecommendation || 0);

    const dsEl = document.getElementById('doughnutChart');
    if (dsEl) {
        const dsCtx = dsEl.getContext('2d');
        if (doughnutChartInst) doughnutChartInst.destroy();

        doughnutChartInst = new Chart(dsCtx, {
            type: 'doughnut',
            data: {
                labels: ['Expenses', 'Tax Reserve', 'Savings', 'Investment', 'Available'],
                datasets: [{
                    data: [
                        expenses,
                        data.taxReserve || 0,
                        data.savingsRecommendation || 0,
                        data.investmentRecommendation || 0,
                        Math.max(0, available)
                    ],
                    backgroundColor: [
                        '#ef4444',
                        '#f59e0b',
                        '#6b7280',
                        '#374151',
                        '#22c55e'
                    ],
                    borderWidth: 0,
                    hoverOffset: 4
                }]
            },
            options: {
                ...commonOptions,
                cutout: '65%'
            }
        });
    }
}

// ====== TYPING ANIMATION ======
function typeText(text, elementId, callback) {
    const el = document.getElementById(elementId);
    if (!el) {
        if (callback) callback();
        return;
    }

    if (elementId === 'ai-response-content') {
        el.innerHTML = '';
    }

    const paragraphs = text.split(/\n+/).map(p => p.trim()).filter(p => p.length > 0);

    let currentParaIndex = 0;
    let currentCharIndex = 0;

    if (paragraphs.length === 0) {
        if (callback) callback();
        return;
    }

    let pEl = document.createElement('p');
    el.appendChild(pEl);

    function typeChar() {
        if (currentParaIndex >= paragraphs.length) {
            // Save rendered HTML to session for refresh restore
            if (elementId === 'ai-response-content') {
                const el = document.getElementById('ai-response-content');
                if (el) sessionStorage.setItem('fl_ai_text', el.innerHTML);
            }
            if (callback) callback();
            return;
        }

        const currentParaText = paragraphs[currentParaIndex];

        if (currentCharIndex < currentParaText.length) {
            pEl.innerHTML += currentParaText.charAt(currentCharIndex);
            currentCharIndex++;
            setTimeout(typeChar, 18);
        } else {
            currentParaIndex++;
            currentCharIndex = 0;
            if (currentParaIndex < paragraphs.length) {
                pEl = document.createElement('p');
                el.appendChild(pEl);
                setTimeout(typeChar, 200);
            } else {
                if (callback) callback();
            }
        }
    }

    typeChar();
}

// ====== PARSE AI RESPONSE ======
function parseAIResponse(fullText) {
    if (typeof fullText !== 'string') {
        console.error('parseAIResponse received non-string:', fullText);
        return { jsonData: null, cleanText: String(fullText || ''), followUpQ: null };
    }

    let jsonMatch = fullText.match(/\|\|\|JSON\s*([\s\S]*?)\s*\|\|\|/);
    let jsonData = null;
    let cleanText = fullText;

    if (jsonMatch && jsonMatch[1]) {
        try {
            jsonData = JSON.parse(jsonMatch[1].trim());
            cleanText = fullText
                .replace(/\|\|\|JSON[\s\S]*?\|\|\|/g, '')
                .replace(/\|\|\|JSON[\s\S]*/g, '')
                .replace(/\|\|\|/g, '')
                .replace(/```json[\s\S]*?```/gi, '')
                .replace(/`{1,3}/g, '')
                .trim();

            // Validate nextSteps structure
            if (jsonData.nextSteps && Array.isArray(jsonData.nextSteps)) {
                jsonData.nextSteps = jsonData.nextSteps.map((step, i) => ({
                    priority: step.priority || i + 1,
                    timeline: step.timeline || 'This Month',
                    title: step.title || 'Action required',
                    urgency: step.urgency || '',
                    action: step.action || '',
                    impact: step.impact || ''
                }));
            } else {
                jsonData.nextSteps = [];
            }

            // Ensure stats object exists with fallbacks
            if (!jsonData.stats) jsonData.stats = {};
            const s = jsonData.stats;
            s.netProfit = s.netProfit || 0;
            s.hourlyRate = s.hourlyRate || null;
            s.taxReserve = s.taxReserve || 0;
            s.profitMargin = s.profitMargin || 0;
            s.revenuePerClient = s.revenuePerClient || null;
            s.financialHealthScore = s.financialHealthScore || 0;
            s.savingsRecommendation = s.savingsRecommendation || 0;
            s.investmentRecommendation = s.investmentRecommendation || 0;
            s.monthlyRevenue = s.monthlyRevenue || 0;
            s.monthlyExpenses = s.monthlyExpenses || 0;

            debugLog('Parsed analysis JSON', jsonData);
            debugLog('Next steps count', jsonData?.nextSteps?.length);

        } catch (e) {
            console.error('Failed to parse JSON from AI response:', e);
            console.error('Raw JSON string:', jsonMatch[1]);
            jsonData = null;
        }
    } else {
        console.warn('No |||JSON||| block found in AI response. Full response:', fullText);
    }

    // Extract follow-up question
    let followUpQ = null;
    let followUpMatch = cleanText.match(/FOLLOWUP:\s*([\s\S]*?)(?:\n|$)/i);
    if (followUpMatch && followUpMatch[1]) {
        followUpQ = followUpMatch[1].trim();
        cleanText = cleanText.replace(/FOLLOWUP:\s*[\s\S]*?(?:\n|$)/i, '').trim();
    }

    return { jsonData, cleanText, followUpQ };
}

// ====== FOLLOW UP CHAT ======
const btnSendFollowup = document.getElementById('btn-send-followup');
const inputFollowup = document.getElementById('input-followup');

if (btnSendFollowup && inputFollowup) {
    btnSendFollowup.addEventListener('click', handleFollowupRequest);
    inputFollowup.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleFollowupRequest();
    });
}

async function handleFollowupRequest() {
    const val = inputFollowup.value.trim();
    if (!val) return;

    inputFollowup.value = '';
    document.getElementById('followup-container').classList.add('hidden');

    const loadingInd = document.getElementById('ai-loading-indicator');
    if (loadingInd) loadingInd.classList.remove('hidden');

    chatHistory.push({ role: 'user', content: val });
    followupCount++;

    const aiMessage = await callAPI();
    chatHistory.push({ role: 'assistant', content: aiMessage });

    if (loadingInd) loadingInd.classList.add('hidden');

    const contentEl = document.getElementById('ai-response-content');
    if (contentEl) {
        const userMsg = document.createElement('p');
        userMsg.innerHTML = '<strong>You:</strong> ' + val;
        userMsg.style.color = 'var(--text-secondary)';
        contentEl.appendChild(userMsg);

        const sep = document.createElement('hr');
        sep.style.borderColor = 'var(--card-border)';
        sep.style.margin = '1.5rem 0';
        sep.style.borderTop = '1px solid var(--card-border)';
        contentEl.appendChild(sep);
    }

    const { jsonData, cleanText, followUpQ } = parseAIResponse(aiMessage);

    if (jsonData) {
        const stats = jsonData.stats || jsonData;
        updateStats(stats);
        updateCharts(stats);
    }

    if (contentEl) {
        const newTextContainer = document.createElement('div');
        newTextContainer.id = 'followup-text-' + followupCount;
        contentEl.appendChild(newTextContainer);

        typeText(cleanText, newTextContainer.id, () => {
            if (followUpQ && followupCount < MAX_FOLLOWUPS) {
                const fqEl = document.getElementById('followup-question-text');
                if (fqEl) fqEl.innerText = followUpQ;
                document.getElementById('followup-container').classList.remove('hidden');
                inputFollowup.focus();
            } else {
                document.getElementById('followup-container').classList.remove('hidden');
                const grp = document.querySelector('.followup-input-group');
                if (grp) grp.classList.add('hidden');
                const fqEl = document.getElementById('followup-question-text');
                if (fqEl) fqEl.innerText = '';
                const limitMsg = document.getElementById('followup-limit-msg');
                if (limitMsg) limitMsg.classList.remove('hidden');
            }
        });
    }
}

// ====== WAITLIST LOGIC ======
const emailInput = document.getElementById('input-waitlist-email');
const btnJoin = document.getElementById('btn-join-waitlist');
const countEl = document.getElementById('waitlist-count');
const successMsg = document.getElementById('waitlist-success-msg');

if (countEl) {
    let currentCount = localStorage.getItem('waitlistCount');
    if (!currentCount) {
        currentCount = Math.floor(Math.random() * (923 - 847 + 1)) + 847;
        localStorage.setItem('waitlistCount', currentCount);
    }
    countEl.innerText = currentCount;

    if (localStorage.getItem('waitlistEmail')) {
        if (emailInput) emailInput.style.display = 'none';
        if (btnJoin) btnJoin.style.display = 'none';
        if (successMsg) successMsg.classList.remove('hidden');
    }

    if (btnJoin && emailInput) {
        btnJoin.addEventListener('click', () => {
            const email = emailInput.value.trim();
            if (email && email.includes('@')) {
                localStorage.setItem('waitlistEmail', email);
                currentCount++;
                localStorage.setItem('waitlistCount', currentCount);
                countEl.innerText = currentCount;

                emailInput.style.display = 'none';
                btnJoin.style.display = 'none';
                if (successMsg) successMsg.classList.remove('hidden');
            } else {
                emailInput.classList.add('shake');
                emailInput.style.borderColor = 'var(--error-color)';
                setTimeout(() => { emailInput.classList.remove('shake'); }, 400);
            }
        });
    }
}

// ====== INTERACTIVE CHARTS ======
let projectionChartInst = null;
let compoundChartInst = null;
let optimizerChartInst = null;

function initInteractiveCharts() {
    const baseProfit = window.analysisData?.projectionBase || window.analysisData?.stats?.netProfit || 1000;
    const baseExpenses = window.analysisData?.stats?.monthlyExpenses || 2000;
    const baseRevenue = window.analysisData?.stats?.monthlyRevenue || 3000;

    function renderProjectionChart() {
        const growthRate = parseFloat(document.getElementById('slider-growth').value) / 100;
        document.getElementById('growth-rate-label').textContent = `${Math.round(growthRate * 100)}%`;

        const months = Array.from({ length: 12 }, (_, i) => `Month ${i + 1}`);
        const values = months.map((_, i) => Math.round(baseProfit * Math.pow(1 + growthRate, i)));
        const year1Total = values.reduce((a, b) => a + b, 0);

        const ctx = document.getElementById('projectionChart').getContext('2d');
        if (projectionChartInst) projectionChartInst.destroy();
        projectionChartInst = new Chart(ctx, {
            type: 'line',
            data: {
                labels: months,
                datasets: [{
                    label: 'Monthly Profit ($)',
                    data: values,
                    borderColor: '#111827',
                    backgroundColor: 'rgba(17,24,39,0.05)',
                    fill: true,
                    tension: 0.4,
                    pointRadius: 3,
                    pointBackgroundColor: '#111827'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    y: {
                        grid: { color: 'rgba(0,0,0,0.04)' },
                        ticks: { callback: v => `$${v.toLocaleString()}` }
                    },
                    x: { grid: { display: false } }
                }
            }
        });
        document.getElementById('projection-summary').textContent =
            `At ${Math.round(growthRate * 100)}% monthly growth, you'd earn $${year1Total.toLocaleString()} in total over 12 months.`;
    }

    function renderCompoundChart() {
        const monthly = parseFloat(document.getElementById('input-monthly-investment').value) || 200;
        const annualRate = parseFloat(document.getElementById('input-return-rate').value) || 8;
        const years = parseFloat(document.getElementById('slider-years').value) || 5;
        const monthlyRate = annualRate / 100 / 12;
        const totalMonths = years * 12;

        document.getElementById('years-label').textContent = `${years} year${years > 1 ? 's' : ''}`;

        const labels = Array.from({ length: years }, (_, i) => `Year ${i + 1}`);
        const values = labels.map((_, i) => {
            const n = (i + 1) * 12;
            return Math.round(monthly * ((Math.pow(1 + monthlyRate, n) - 1) / monthlyRate));
        });
        const totalInvested = monthly * totalMonths;
        const finalValue = values[values.length - 1];
        const gains = finalValue - totalInvested;

        const ctx = document.getElementById('compoundChart').getContext('2d');
        if (compoundChartInst) compoundChartInst.destroy();
        compoundChartInst = new Chart(ctx, {
            type: 'bar',
            data: {
                labels,
                datasets: [
                    {
                        label: 'Total Value',
                        data: values,
                        backgroundColor: 'rgba(17,24,39,0.8)',
                        borderRadius: 6
                    },
                    {
                        label: 'Amount Invested',
                        data: labels.map((_, i) => monthly * (i + 1) * 12),
                        backgroundColor: 'rgba(17,24,39,0.15)',
                        borderRadius: 6
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { position: 'bottom', labels: { font: { size: 12 } } } },
                scales: {
                    y: {
                        grid: { color: 'rgba(0,0,0,0.04)' },
                        ticks: { callback: v => `$${v.toLocaleString()}` }
                    },
                    x: { grid: { display: false } }
                }
            }
        });
        document.getElementById('compound-summary').textContent =
            `Investing $${monthly}/mo at ${annualRate}% return — after ${years} years: $${finalValue.toLocaleString()} total ($${gains.toLocaleString()} in gains).`;
    }

    function renderOptimizerChart() {
        const cutPercent = parseFloat(document.getElementById('slider-expense-cut').value);
        document.getElementById('expense-cut-label').textContent = `${cutPercent}%`;

        const newExpenses = baseExpenses * (1 - cutPercent / 100);
        const newProfit = baseRevenue - newExpenses;
        const profitIncrease = newProfit - baseProfit;

        const ctx = document.getElementById('optimizerChart').getContext('2d');
        if (optimizerChartInst) optimizerChartInst.destroy();
        optimizerChartInst = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Current', `After ${cutPercent}% Cut`],
                datasets: [
                    {
                        label: 'Expenses',
                        data: [baseExpenses, Math.round(newExpenses)],
                        backgroundColor: ['rgba(220,38,38,0.7)', 'rgba(220,38,38,0.3)'],
                        borderRadius: 6
                    },
                    {
                        label: 'Net Profit',
                        data: [baseProfit, Math.round(newProfit)],
                        backgroundColor: ['rgba(22,163,74,0.5)', 'rgba(22,163,74,0.9)'],
                        borderRadius: 6
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { position: 'bottom' } },
                scales: {
                    y: {
                        grid: { color: 'rgba(0,0,0,0.04)' },
                        ticks: { callback: v => `$${v.toLocaleString()}` }
                    },
                    x: { grid: { display: false } }
                }
            }
        });
        document.getElementById('optimizer-summary').textContent =
            `Cutting expenses by ${cutPercent}% would increase your monthly profit by $${Math.round(profitIncrease).toLocaleString()}.`;
    }

    // Initial renders
    renderProjectionChart();
    renderCompoundChart();
    renderOptimizerChart();

    // Event listeners
    document.getElementById('slider-growth').addEventListener('input', renderProjectionChart);
    document.getElementById('slider-years').addEventListener('input', renderCompoundChart);
    document.getElementById('input-monthly-investment').addEventListener('input', renderCompoundChart);
    document.getElementById('input-return-rate').addEventListener('input', renderCompoundChart);
    document.getElementById('slider-expense-cut').addEventListener('input', renderOptimizerChart);
}

// ====== FOUNDERLYTICS TOOLS SECTION ======
function renderNextSteps(jsonData) {
    const section = document.getElementById('block-tools');
    if (!jsonData || !jsonData.nextSteps || jsonData.nextSteps.length === 0) return;

    debugLog('Rendering next steps', jsonData.nextSteps);

    section.classList.remove('hidden');

    const content = document.getElementById('content-block-tools');
    if (!content) return;
    // Ensure content is visible before writing
    content.classList.remove('hidden');

    const timelineColors = {
        'This Week': { bg: '#fef2f2', border: '#fecaca', text: '#dc2626', dot: '#dc2626' },
        'This Month': { bg: '#fffbeb', border: '#fde68a', text: '#d97706', dot: '#d97706' },
        'Next 90 Days': { bg: '#f0fdf4', border: '#bbf7d0', text: '#16a34a', dot: '#16a34a' }
    };

    const summaryEl = jsonData.businessSummary ? `
        <div style="background:#f9fafb; border:1px solid #e5e7eb; border-radius:12px; padding:16px 20px; margin-bottom:28px;">
          <p style="font-size:14px; font-weight:600; color:#374151; margin:0; line-height:1.6;">
            <span style="font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:0.08em; color:#9ca3af; display:block; margin-bottom:6px;">Business Summary</span>
            ${jsonData.businessSummary}
          </p>
        </div>
    ` : '';

    const stepsHTML = jsonData.nextSteps.map((step) => {
        const colors = timelineColors[step.timeline] || timelineColors['Next 90 Days'];
        return `
          <div style="background:white; border:1px solid #e5e7eb; border-radius:14px; padding:24px; position:relative; overflow:hidden; transition:box-shadow 0.2s ease;"
               onmouseover="this.style.boxShadow='0 4px 20px rgba(0,0,0,0.08)'"
               onmouseout="this.style.boxShadow='none'">
            <div style="position:absolute; top:0; left:0; bottom:0; width:4px; background:${colors.dot};"></div>
            <div style="padding-left:8px;">
              <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:12px; flex-wrap:wrap; gap:8px;">
                <span style="font-size:11px; font-weight:800; text-transform:uppercase; letter-spacing:0.08em; color:#9ca3af;">Step ${step.priority}</span>
                <span style="background:${colors.bg}; color:${colors.text}; border:1px solid ${colors.border}; font-size:11px; font-weight:700; padding:3px 10px; border-radius:999px; text-transform:uppercase; letter-spacing:0.05em;">${step.timeline}</span>
              </div>
              <h4 style="font-size:16px; font-weight:800; color:#111827; margin-bottom:8px; letter-spacing:-0.01em; line-height:1.3;">${step.title}</h4>
              <p style="font-size:13px; color:#dc2626; font-weight:600; margin-bottom:10px; line-height:1.4;">
                <svg style="display:inline; vertical-align:middle; margin-right:4px;" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                ${step.urgency}
              </p>
              <p style="font-size:14px; color:#374151; line-height:1.6; margin-bottom:14px;">${step.action}</p>
              <div style="background:#f9fafb; border:1px solid #e5e7eb; border-radius:8px; padding:10px 14px; display:flex; align-items:center; gap:8px;">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>
                <span style="font-size:13px; font-weight:600; color:#374151;">${step.impact}</span>
              </div>
            </div>
          </div>
        `;
    }).join('');

    const whyHTML = jsonData.whyTheseSteps ? `
        <div style="background:#f9fafb; border-left:4px solid #111827; border-radius:0 12px 12px 0; padding:20px 24px; margin-top:24px;">
          <p style="font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:0.08em; color:#9ca3af; margin-bottom:8px;">Why This Order</p>
          <p style="font-size:14px; color:#374151; line-height:1.7; margin:0;">${jsonData.whyTheseSteps}</p>
        </div>
    ` : '';

    content.innerHTML = `
        <div style="padding-top:8px;">
          ${summaryEl}
          <div style="display:flex; flex-direction:column; gap:14px;">
            ${stepsHTML}
          </div>
          ${whyHTML}
        </div>
    `;
}

// ====== ACCORDION + SCENARIO TABS ======
function toggleBlock(blockId, forceOpen = true) {
    // In the tab-based layout, blocks are always visible — just ensure content is shown
    const content = document.getElementById('content-' + blockId);
    if (content) content.classList.remove('hidden');
}

function switchScenario(panel) {
    document.querySelectorAll('.scenario-panel').forEach(p => {
        p.classList.remove('active');
        p.style.display = 'none';
    });
    document.querySelectorAll('.scenario-tab').forEach(t => t.classList.remove('active'));

    const target = document.getElementById(`panel-${panel}`);
    if (target) { target.style.display = 'block'; target.classList.add('active'); }

    const tabs = document.querySelectorAll('.scenario-tab');
    const tabMap = { projection: 0, compound: 1, optimizer: 2 };
    if (tabs[tabMap[panel]]) tabs[tabMap[panel]].classList.add('active');
}

// ====== SESSION PERSISTENCE ======
function saveSession() {
    try {
        sessionStorage.setItem('fl_history', JSON.stringify(conversationHistory));
        sessionStorage.setItem('fl_data', JSON.stringify(collectedData));
        sessionStorage.setItem('fl_step', currentStep);
        sessionStorage.setItem('fl_qcount', String(questionCount));
        if (window.userCurrency) sessionStorage.setItem('fl_currency', window.userCurrency);
        if (window.userCurrencyLabel) sessionStorage.setItem('fl_currencyLabel', window.userCurrencyLabel);
        if (window.userName) sessionStorage.setItem('fl_username_session', window.userName);
        if (window.analysisData) {
            sessionStorage.setItem('fl_analysis', JSON.stringify(window.analysisData));
        }
    } catch (e) {
        console.warn('Could not save session:', e);
    }
}

function loadSession() {
    try {
        const history = sessionStorage.getItem('fl_history');
        const data = sessionStorage.getItem('fl_data');
        const step = sessionStorage.getItem('fl_step');
        const qcount = sessionStorage.getItem('fl_qcount');
        const currency = sessionStorage.getItem('fl_currency');
        const currencyLabel = sessionStorage.getItem('fl_currencyLabel');
        const usernameSession = sessionStorage.getItem('fl_username_session');
        const analysis = sessionStorage.getItem('fl_analysis');

        if (history) conversationHistory = JSON.parse(history);
        if (data) collectedData = JSON.parse(data);
        if (step) currentStep = step;
        if (qcount) questionCount = parseInt(qcount);
        if (currency) window.userCurrency = currency;
        if (currencyLabel) window.userCurrencyLabel = currencyLabel;
        if (usernameSession) window.userName = usernameSession;

        if (analysis) {
            window.analysisData = JSON.parse(analysis);
            return true;
        }
        return false;
    } catch (e) {
        console.warn('Could not load session:', e);
        return false;
    }
}

function showCurrencyStep() {
    const stepCurrency = document.getElementById('step-currency');
    stepCurrency.style.display = 'block';
    stepCurrency.classList.add('active');
    currentStep = 'currency';
    if (btnBack) btnBack.style.visibility = 'visible';
    updateProgressBar();

    document.querySelectorAll('.currency-tile').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.currency-tile').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            document.getElementById('input-currency').value = btn.dataset.value;

            const otherWrapper = document.getElementById('currency-other-wrapper');
            if (btn.dataset.value === 'other') {
                otherWrapper.style.display = 'block';
                document.getElementById('input-currency-other').focus();
            } else {
                otherWrapper.style.display = 'none';
                window.userCurrency = btn.dataset.value;
                window.userCurrencyLabel = btn.dataset.label;
            }
        });
    });
}

// ====== USAGE LIMIT ======
// DEV MODE — set to true to bypass usage limit during testing
const DEV_MODE = true;
sessionStorage.clear();

function checkUsageLimit() {
    if (DEV_MODE) return true; // bypass limit in dev mode

    const uses = parseInt(localStorage.getItem('fl_uses') || '0');
    if (uses >= 3) {
        document.getElementById('form-section').innerHTML = `
          <div style="text-align:center; max-width:480px; margin:0 auto; padding:60px 24px;">
            <div style="width:56px;height:56px;background:#f4f4f5;border-radius:12px;display:flex;align-items:center;justify-content:center;margin:0 auto 24px;">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#374151" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            </div>
            <h2 style="font-size:26px;font-weight:800;color:#111827;letter-spacing:-0.02em;margin-bottom:12px;">You've used your 3 free analyses</h2>
            <p style="font-size:15px;color:#6b7280;line-height:1.7;margin-bottom:32px;">Join the waitlist to get priority access when FounderLytics Pro launches. Early members get exclusive founding pricing.</p>
            <iframe data-tally-src="https://tally.so/embed/Pd0qr5?alignLeft=1&hideTitle=1&transparentBackground=1&dynamicHeight=1" loading="lazy" width="100%" height="300" frameborder="0"></iframe>
            <script>var d=document,w="https://tally.so/widgets/embed.js",v=function(){"undefined"!=typeof Tally?Tally.loadEmbeds():d.querySelectorAll("iframe[data-tally-src]:not([src])").forEach((function(e){e.src=e.dataset.tallySrc}))};if("undefined"!=typeof Tally)v();else if(d.querySelector('script[src="'+w+'"]')==null){var s=d.createElement("script");s.src=w,s.onload=v,s.onerror=v,d.body.appendChild(s);}<\/script>
          </div>
        `;
        return false;
    }
    return true;
}

function incrementUsage() {
    if (DEV_MODE) return; // don't increment in dev mode
    const uses = parseInt(localStorage.getItem('fl_uses') || '0');
    localStorage.setItem('fl_uses', uses + 1);
}

// ====== INITIALIZE ======
if (btnBack) btnBack.style.visibility = 'hidden';
progressBar.style.width = '0%';

window.addEventListener('load', async () => {
    // Check usage limit first
    if (!checkUsageLimit()) return;

    // Try to restore session
    const hasAnalysis = loadSession();

    if (hasAnalysis && window.analysisData) {
        debugLog('Restoring session with analysis', window.analysisData);

        // Skip form, go straight to results
        document.getElementById('form-section').classList.remove('active-section');
        document.getElementById('form-section').classList.add('hidden-section');
        document.getElementById('results-section').classList.remove('hidden-section');
        document.getElementById('results-section').classList.add('active-section');
        document.getElementById('progress-bar').style.width = '100%';

        // Re-render everything
        try {
            updateStats(window.analysisData.stats);
            updateCharts(window.analysisData.stats);

            setTimeout(() => {
                initInteractiveCharts();
                renderNextSteps(window.analysisData);
            }, 100);

            toggleBlock('block-stats', true);
            toggleBlock('block-ai', true);
            toggleBlock('block-tools', true);

            // Restore profile header
            const pName = document.getElementById('profile-display-name');
            if (pName && window.userName) pName.textContent = window.userName;
            const pAvatar = document.getElementById('profile-avatar');
            if (pAvatar && window.userName) pAvatar.textContent = window.userName[0].toUpperCase();
            const pTitle = document.getElementById('profile-title-el');
            if (pTitle && collectedData && collectedData.businessType) {
                const btype = collectedData.businessType;
                pTitle.textContent = btype.charAt(0).toUpperCase() + btype.slice(1);
            }

            const dateEl = document.getElementById('results-date');
            if (dateEl) dateEl.textContent = new Date().toLocaleDateString('en-US', {
                month: 'long', day: 'numeric', year: 'numeric'
            });

            // Restore AI text if available
            const savedText = sessionStorage.getItem('fl_ai_text');
            if (savedText) {
                const contentEl = document.getElementById('ai-response-content');
                if (contentEl) contentEl.innerHTML = savedText;
            }

            // Pre-fill email
            const storedEmail = localStorage.getItem('fl_email');
            const emailInput = document.getElementById('input-results-email');
            if (emailInput && storedEmail && storedEmail.includes('@')) {
                emailInput.value = storedEmail;
            }

        } catch (err) {
            console.error('Error restoring session:', err);
            sessionStorage.clear();
            location.reload();
        }

    } else if (currentStep === 'dynamic' && conversationHistory.length > 0) {
        debugLog('Restoring mid-conversation session', { questionCount, currentStep });

        // Was in the middle of conversation — show warning and restart
        document.getElementById('form-section').classList.add('active-section');

        const warningBanner = document.createElement('div');
        warningBanner.style.cssText = `
            background: #fffbeb;
            border: 1px solid #fde68a;
            border-radius: 10px;
            padding: 14px 20px;
            margin-bottom: 24px;
            font-size: 14px;
            color: #92400e;
            font-weight: 500;
            text-align: center;
        `;
        warningBanner.innerHTML = `
            <strong>Your progress was saved.</strong> Continue where you left off — or
            <button onclick="sessionStorage.clear(); location.reload();"
                style="background:none; border:none; color:#92400e; text-decoration:underline; cursor:pointer; font-size:14px; font-weight:700;">
                start over
            </button>
        `;

        const formSectionEl = document.getElementById('form-section');
        if (formSectionEl) formSectionEl.insertBefore(warningBanner, formSectionEl.firstChild);

        updateFormView();

    } else {
        // Fresh start
        debugLog('Fresh session — starting from beginning', {});
        if (typeof updateFormView === 'function') updateFormView();
    }
});

function sendResultsByEmail() {
    const email = document.getElementById('input-results-email').value.trim();
    const errorEl = document.getElementById('email-results-error');
    const btn = document.getElementById('btn-send-results');

    if (!email || !email.includes('@')) {
        errorEl.textContent = 'Please enter a valid email address.';
        errorEl.style.display = 'block';
        return;
    }

    errorEl.style.display = 'none';
    btn.textContent = 'Sending...';
    btn.disabled = true;

    // Build the next steps text
    const data = window.analysisData;
    if (!data) {
        errorEl.textContent = 'No results to send yet. Complete your analysis first.';
        errorEl.style.display = 'block';
        btn.textContent = 'Send My Results →';
        btn.disabled = false;
        return;
    }

    const stepsText = data.nextSteps ? data.nextSteps.map((s) =>
        `STEP ${s.priority} — ${s.timeline.toUpperCase()}\n${s.title}\nAction: ${s.action}\nExpected Impact: ${s.impact}`
    ).join('\n\n') : 'No steps available.';

    const stats = data.stats || {};
    const summaryText = `
FOUNDERLYTICS — YOUR FINANCIAL ANALYSIS
========================================

BUSINESS SUMMARY
${data.businessSummary || 'Analysis complete.'}

YOUR NUMBERS
Net Profit: ${stats.netProfit ? '$' + stats.netProfit.toLocaleString() : 'N/A'}
Profit Margin: ${stats.profitMargin ? stats.profitMargin.toFixed(1) + '%' : 'N/A'}
Financial Health Score: ${stats.financialHealthScore || 'N/A'}/100
Tax to Reserve: ${stats.taxReserve ? '$' + stats.taxReserve.toLocaleString() : 'N/A'}

YOUR NEXT STEPS
===============
${stepsText}

WHY THESE STEPS
${data.whyTheseSteps || ''}

---
Generated by FounderLytics · founderlytics.vercel.app
    `.trim();

    emailjs.send(
        'YOUR_SERVICE_ID',
        'YOUR_TEMPLATE_ID',
        {
            to_email: email,
            subject: 'Your FounderLytics Results — Next Steps for Your Business',
            message: summaryText,
            user_email: email
        }
    ).then(() => {
        document.getElementById('email-results-form').style.display = 'none';
        document.getElementById('email-results-success').style.display = 'block';
        localStorage.setItem('fl_email', email);
    }).catch((err) => {
        console.error('EmailJS error:', err);
        errorEl.textContent = 'Something went wrong. Please try again.';
        errorEl.style.display = 'block';
        btn.textContent = 'Send My Results →';
        btn.disabled = false;
    });
}
