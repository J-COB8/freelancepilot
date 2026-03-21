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

// ====== DOM ELEMENTS ======
const formSection = document.getElementById('form-section');
const loadingSection = document.getElementById('loading-section');
const resultsSection = document.getElementById('results-section');
const progressBar = document.getElementById('progress-bar');

const btnBack = document.getElementById('btn-back');
const btnNext = document.getElementById('btn-next');
const btnSubmit = document.getElementById('btn-submit');
const btnRestart = document.getElementById('btn-restart');

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

// ====== AI CONVERSATION ======
async function getNextQuestion() {
    btnNext.textContent = 'Thinking...';
    btnNext.disabled = true;
    if (btnBack) btnBack.style.visibility = 'hidden';

    const systemPrompt = `You are a smart financial data collector for FounderLytics, an AI financial advisor for freelancers and entrepreneurs.

The user works in: ${window.userCurrencyLabel || 'USD'}. Use appropriate currency context when asking about amounts.
The user's name is: ${window.userName || 'there'}. Address them by name naturally — not in every single message, but occasionally to keep it personal. For example: "Nice, ${window.userName || 'there'} — now tell me..." or just use it in the first question naturally.

Your job is to ask the RIGHT questions to collect enough financial data to give this person a meaningful analysis.

Based on their business type and previous answers, decide what to ask next. Ask questions that are SPECIFIC to their business type. For example:
- Freelancers: hourly rate, number of clients, billable hours, main expense
- Dropshippers: revenue, cost of goods, ad spend, number of orders, profit margin per product
- Local businesses: monthly revenue, fixed costs, variable costs, number of customers
- SaaS/Digital products: MRR, churn, CAC, hosting costs

You need to collect at minimum: revenue, expenses, and at least 2-3 business-specific metrics.

After 4-7 questions, if you have enough data for a solid analysis, signal that you're done.

LANGUAGE RULES — strictly follow these:
- Write like you're talking to a smart 15-year-old who just started their first business
- Never use: "revenue", "expenditure", "remuneration", "fiscal", "gross", "net" alone without explaining it
- Instead use: "money you made", "money you spent", "what you take home", "before taxes"
- Always give an example in the hint field: "e.g. rent, phone bill, Netflix, software"
- Keep questions under 12 words
- Hints should be one friendly sentence with a real example
- If asking about money, always clarify the time period: "this month" or "last month"

GOOD examples:
- "How much money did you make this month?" hint: "Add up all payments you received, even small ones"
- "What did you spend money on this month?" hint: "Rent, phone, apps, materials — everything counts"
- "How many hours did you actually work?" hint: "Think about a typical week and multiply by 4"

BAD examples (never do this):
- "What is your monthly gross revenue?"
- "Please specify your total expenditure"
- "What is your effective hourly remuneration?"

INPUT TYPE RULES:
- Use "number" ONLY when you need a precise dollar amount or count
- Use "freetext" when the user might want to describe a situation, like listing multiple expenses, explaining irregular income, or describing their business model
- Use "select" for categories or yes/no choices
- Never force a number when a description would give you MORE useful information

Example of when to use freetext:
Q: "What are your main monthly expenses?" → freetext (they might say "I pay $200 rent, $50 phone, sometimes $100 for materials")
Q: "How much did you make last month?" → number (you need the exact figure)

ALWAYS respond with ONLY a valid JSON object, no other text:

If you need more data:
{
  "action": "ask",
  "question": "Your question here",
  "hint": "Optional clarifying hint or leave empty string",
  "inputType": "number" or "text" or "select" or "freetext",
  "options": ["Option 1", "Option 2"]
}

If you have enough data:
{
  "action": "analyze",
  "summary": "One sentence summary of what you collected"
}`;

    try {
        const response = await fetch('/api/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                system: systemPrompt,
                messages: conversationHistory
            })
        });

        const data = await response.json();
        const text = data.content?.[0]?.text || '';

        let parsed;
        try {
            parsed = JSON.parse(text.trim());
        } catch (e) {
            const match = text.match(/\{[\s\S]*\}/);
            parsed = match ? JSON.parse(match[0]) : { action: 'analyze' };
        }

        if (parsed.action === 'analyze') {
            await submitAnalysis();
        } else {
            renderDynamicQuestion(parsed);
            questionCount++;
            updateProgressBar();
            btnNext.textContent = 'Continue →';
            btnNext.disabled = false;
            if (btnBack) btnBack.style.visibility = 'visible';
        }
    } catch (err) {
        console.error(err);
        btnNext.textContent = 'Continue →';
        btnNext.disabled = false;
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
    return `You are FounderLytics — a sharp, direct AI financial advisor for freelancers and early entrepreneurs. You have just finished collecting financial data through a conversation.

The user's currency is: ${window.userCurrencyLabel || '$'}. Use this currency symbol in all monetary values in your analysis and JSON.

Analyze everything the user told you and provide a complete financial picture. Be brutally honest but constructive. Be SPECIFIC to their business type — a dropshipper and a freelancer need completely different insights.

Return ONLY a valid JSON object wrapped EXACTLY between |||JSON and ||| delimiters, followed by 3-4 paragraphs of plain text analysis, followed by a follow-up question prefixed with FOLLOWUP:

The JSON must contain:
{
  "stats": {
    "netProfit": number,
    "hourlyRate": number or null if not applicable,
    "taxReserve": number (25% of profit for US, 16% Mexico, 18% India, 20% others),
    "profitMargin": number (percentage 0-100),
    "revenuePerClient": number or null,
    "financialHealthScore": number (0-100),
    "savingsRecommendation": number,
    "investmentRecommendation": number,
    "monthlyRevenue": number,
    "monthlyExpenses": number
  },
  "businessType": "freelancer" or "dropshipping" or "local_business" or "saas" or "other",
  "projectionBase": number (monthly net profit to use for projections),
  "founderlytics_help": [
    "Specific way 1 FounderLytics helps THIS business type",
    "Specific way 2",
    "Specific way 3",
    "Specific way 4"
  ],
  "tools": [
    {
      "name": "Tool name relevant to their business",
      "description": "What it does for them specifically",
      "status": "coming_soon"
    }
  ]
}

After the |||JSON block, write 3-4 paragraphs of honest, specific analysis. No markdown formatting. Jump straight into the analysis — no greetings.
End with: FOLLOWUP: one specific follow-up question`;
}

// ====== API CALL (for followup chat) ======
async function callAPI() {
    try {
        const response = await fetch('/api/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                system: getAnalysisSystemPrompt(),
                messages: chatHistory
            })
        });

        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();
        if (data.content && data.content[0] && data.content[0].text) {
            return data.content[0].text;
        }
        return data.response || data.text || "Error: unexpected response format.";
    } catch (error) {
        console.error(error);
        return "Error analyzing data. Please try again later. Make sure the backend endpoint is functioning properly.";
    }
}

// ====== SUBMIT ANALYSIS ======
async function submitAnalysis() {
    // Hide heading, subheading, and form card
    const heading = document.querySelector('.main-heading');
    const subheading = document.querySelector('.sub-heading');
    const formCard = document.querySelector('.form-card');
    if (heading) heading.style.display = 'none';
    if (subheading) subheading.style.display = 'none';
    if (formCard) formCard.style.display = 'none';

    // Show the analyzing indicator
    const indicator = document.getElementById('analyzing-indicator');
    if (indicator) indicator.classList.add('visible');

    // Show loading section
    loadingSection.classList.remove('hidden-section');
    loadingSection.classList.add('active-section');

    window.scrollTo({ top: loadingSection.offsetTop, behavior: 'smooth' });

    // Build final analysis messages from the full conversation
    const analysisMessages = [
        ...conversationHistory,
        {
            role: 'user',
            content: 'Based on everything I told you, please give me my full financial analysis now.'
        }
    ];

    incrementUsage();

    try {
        const response = await fetch('/api/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                system: getAnalysisSystemPrompt(),
                messages: analysisMessages
            })
        });

        if (!response.ok) throw new Error(`API error: ${response.status}`);

        const data = await response.json();
        const aiMessage = data.content?.[0]?.text || data.response || data.text || '';

        // Seed chatHistory for followup chat
        chatHistory = [...analysisMessages, { role: 'assistant', content: aiMessage }];

        // Transition to results
        formSection.classList.remove('active-section');
        formSection.classList.add('hidden-section');
        loadingSection.classList.remove('active-section');
        loadingSection.classList.add('hidden-section');
        resultsSection.classList.remove('hidden-section');
        resultsSection.classList.add('active-section');

        progressBar.style.width = '100%';
        processDisplayResults(aiMessage);
        saveSession();

    } catch (err) {
        console.error(err);
        formSection.classList.remove('active-section');
        formSection.classList.add('hidden-section');
        loadingSection.classList.remove('active-section');
        loadingSection.classList.add('hidden-section');
        resultsSection.classList.remove('hidden-section');
        resultsSection.classList.add('active-section');
        document.getElementById('ai-response-content').textContent = 'Error analyzing data. Please try again.';
    }
}

// ====== RESULTS RENDERING ======
const formatCurrency = (val) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val || 0);
const formatPercent = (val) => (val || 0).toFixed(1) + '%';

function processDisplayResults(fullResponse) {
    const { jsonData, cleanText, followUpQ } = parseAIResponse(fullResponse);

    if (jsonData) {
        window.analysisData = jsonData; // store globally for interactive charts
        const stats = jsonData.stats || jsonData;
        updateStats(stats);
        updateCharts(stats);
        initInteractiveCharts();
        renderFounderLyticsTools(jsonData);
    }

    // Auto-open stats block and set date
    toggleBlock('block-stats');
    const dateEl = document.getElementById('results-date');
    if (dateEl) dateEl.textContent = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

    // Type out the AI text
    typeText(cleanText, 'ai-response-content', () => {
        // Show followup box after typing finishes
        if (followUpQ && followupCount < MAX_FOLLOWUPS) {
            const fqEl = document.getElementById('followup-question-text');
            if (fqEl) fqEl.innerText = followUpQ;
            document.getElementById('followup-container').classList.remove('hidden');
        } else if (followupCount >= MAX_FOLLOWUPS) {
            document.getElementById('followup-container').classList.remove('hidden');
            const grp = document.querySelector('.followup-input-group');
            if (grp) grp.classList.add('hidden');
            const fqEl = document.getElementById('followup-question-text');
            if (fqEl) fqEl.innerText = '';
            document.getElementById('followup-limit-msg').classList.remove('hidden');
        }
    });
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
        hsEl.innerText = score + '/100';
        hsEl.className = 'health-badge ';
        if (score <= 40) hsEl.classList.add('bad');
        else if (score <= 70) hsEl.classList.add('ok');
        else hsEl.classList.add('good');
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

    const paragraphs = text.split('\\n').map(p => p.trim()).filter(p => p.length > 0);

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
    let jsonMatch = fullText.match(/\|\|\|JSON\s*([\s\S]*?)\s*\|\|\|/);
    let jsonData = null;
    let cleanText = fullText;

    if (jsonMatch && jsonMatch[1]) {
        try {
            jsonData = JSON.parse(jsonMatch[1]);
            cleanText = fullText.replace(/\|\|\|JSON\s*[\s\S]*?\s*\|\|\|/, '').trim();
        } catch (e) {
            console.error('Failed to parse JSON out of Claude response', e);
        }
    }

    let followUpQ = null;
    let followUpMatch = cleanText.match(/FOLLOWUP:\s*(.*)/i);
    if (followUpMatch && followUpMatch[1]) {
        followUpQ = followUpMatch[1].trim();
        cleanText = cleanText.replace(/FOLLOWUP:\s*(.*)/i, '').trim();
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

        const months = Array.from({length: 12}, (_, i) => `Month ${i + 1}`);
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

        const labels = Array.from({length: years}, (_, i) => `Year ${i + 1}`);
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
function renderFounderLyticsTools(jsonData) {
    if (!jsonData || !jsonData.founderlytics_help) return;

    const blockTools = document.getElementById('block-tools');
    if (blockTools) blockTools.classList.remove('hidden');

    const helpList = document.getElementById('how-we-help-list');
    helpList.innerHTML = jsonData.founderlytics_help.map((item) => `
        <div class="help-item">
          <span class="help-item-icon">${ICONS.check}</span>
          <span class="help-item-text">${item}</span>
        </div>
    `).join('');

    if (jsonData.tools && jsonData.tools.length > 0) {
        const toolsGrid = document.getElementById('tools-grid');
        toolsGrid.innerHTML = jsonData.tools.map(tool => `
            <div class="tool-card-mini">
              <span class="coming-soon-badge">Soon</span>
              <h5>${tool.name}</h5>
              <p>${tool.description}</p>
            </div>
        `).join('');
    }
}

// ====== ACCORDION + SCENARIO TABS ======
function toggleBlock(blockId) {
    const content = document.getElementById(`content-${blockId}`);
    const toggle = document.getElementById(`toggle-${blockId}`);

    const isOpen = !content.classList.contains('hidden');

    if (isOpen) {
        content.classList.add('hidden');
        if (toggle) { toggle.textContent = 'Show →'; toggle.classList.remove('open'); }
    } else {
        content.classList.remove('hidden');
        if (toggle) { toggle.textContent = 'Hide ↑'; toggle.classList.add('open'); }
    }
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
    sessionStorage.setItem('fl_history', JSON.stringify(conversationHistory));
    sessionStorage.setItem('fl_data', JSON.stringify(collectedData));
    sessionStorage.setItem('fl_step', currentStep);
    sessionStorage.setItem('fl_qcount', questionCount);
    if (window.userCurrency) sessionStorage.setItem('fl_currency', window.userCurrency);
    if (window.userCurrencyLabel) sessionStorage.setItem('fl_currencyLabel', window.userCurrencyLabel);
    if (window.analysisData) sessionStorage.setItem('fl_analysis', JSON.stringify(window.analysisData));
}

function loadSession() {
    const history = sessionStorage.getItem('fl_history');
    const data = sessionStorage.getItem('fl_data');
    const step = sessionStorage.getItem('fl_step');
    const qcount = sessionStorage.getItem('fl_qcount');
    const currency = sessionStorage.getItem('fl_currency');
    const currencyLabel = sessionStorage.getItem('fl_currencyLabel');
    const analysis = sessionStorage.getItem('fl_analysis');

    if (history) conversationHistory = JSON.parse(history);
    if (data) collectedData = JSON.parse(data);
    if (step) currentStep = step;
    if (qcount) questionCount = parseInt(qcount);
    if (currency) window.userCurrency = currency;
    if (currencyLabel) window.userCurrencyLabel = currencyLabel;
    if (analysis) {
        window.analysisData = JSON.parse(analysis);
        return true;
    }
    return false;
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
function checkUsageLimit() {
    const uses = parseInt(localStorage.getItem('fl_uses') || '0');
    if (uses >= 3) {
        document.getElementById('form-section').innerHTML = `
          <div style="text-align:center; max-width:480px; margin:0 auto; padding:60px 24px;">
            <div style="width:56px;height:56px;background:#f4f4f5;border-radius:12px;display:flex;align-items:center;justify-content:center;margin:0 auto 24px;">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#374151" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            </div>
            <h2 style="font-size:26px;font-weight:800;color:#111827;letter-spacing:-0.02em;margin-bottom:12px;">You've used your 3 free analyses</h2>
            <p style="font-size:15px;color:#6b7280;line-height:1.7;margin-bottom:32px;">Join the waitlist to get unlimited access when FounderLytics Pro launches. Early members get a lifetime discount.</p>
            <iframe data-tally-src="https://tally.so/embed/Pd0qr5?alignLeft=1&hideTitle=1&transparentBackground=1&dynamicHeight=1" loading="lazy" width="100%" height="300" frameborder="0"></iframe>
            <script>var d=document,w="https://tally.so/widgets/embed.js",v=function(){"undefined"!=typeof Tally?Tally.loadEmbeds():d.querySelectorAll("iframe[data-tally-src]:not([src])").forEach((function(e){e.src=e.dataset.tallySrc}))};if("undefined"!=typeof Tally)v();else if(d.querySelector('script[src="'+w+'"]')==null){var s=d.createElement("script");s.src=w,s.onload=v,s.onerror=v,d.body.appendChild(s);}<\/script>
          </div>
        `;
        return false;
    }
    return true;
}

function incrementUsage() {
    const uses = parseInt(localStorage.getItem('fl_uses') || '0');
    localStorage.setItem('fl_uses', uses + 1);
}

// ====== INITIALIZE ======
if (btnBack) btnBack.style.visibility = 'hidden';
progressBar.style.width = '0%';

window.addEventListener('load', () => {
    if (!checkUsageLimit()) return;

    const hasSession = loadSession();
    if (hasSession && window.analysisData) {
        document.getElementById('form-section').classList.add('hidden-section');
        document.getElementById('form-section').classList.remove('active-section');
        document.getElementById('results-section').classList.remove('hidden-section');
        document.getElementById('results-section').classList.add('active-section');
        updateStats(window.analysisData.stats);
        updateCharts(window.analysisData.stats);
        initInteractiveCharts();
        renderFounderLyticsTools(window.analysisData);
        toggleBlock('block-stats');
        const dateEl = document.getElementById('results-date');
        if (dateEl) dateEl.textContent = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
        progressBar.style.width = '100%';
    } else {
        // No saved analysis — reset state to ensure a clean form
        conversationHistory = [];
        collectedData = {};
        questionCount = 0;
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
        }
    }
});
