// ====== CONSTANTS & STATE ======
let conversationHistory = [];
let collectedData = {};
let currentStep = 'initial';
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
        if (currentStep === 'initial') {
            const val = document.getElementById('input-business-type').value.trim();
            if (!val) {
                document.querySelector('#step-initial .input-wrapper').classList.add('error');
                return;
            }
            currentStep = 'dynamic';
            collectedData.businessType = val;
            conversationHistory.push({ role: 'user', content: `My business type: ${val}` });
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
        wrapper.innerHTML = `
          <span class="currency-symbol">$</span>
          <input type="number" id="dynamic-input-value" class="with-symbol" placeholder="0.00" autofocus>
          <span class="error-msg">Please enter a valid number.</span>`;
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
        hint.style.cssText = 'font-size:12px; color:#9ca3af; margin-top:8px;';
        hint.textContent = '💡 Tip: The more detail you give, the better your analysis will be.';
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
const ANALYSIS_SYSTEM_PROMPT = `You are FounderLytics — a sharp, direct AI financial advisor for freelancers and early entrepreneurs. You have just finished collecting financial data through a conversation.

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

    try {
        const response = await fetch('/api/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                system: ANALYSIS_SYSTEM_PROMPT,
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

    const icons = ['✅', '📊', '🎯', '💡', '🛡️', '📈'];
    const helpList = document.getElementById('how-we-help-list');
    helpList.innerHTML = jsonData.founderlytics_help.map((item, i) => `
        <div class="help-item">
          <span class="help-item-icon">${icons[i] || '✅'}</span>
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

// ====== INITIALIZE ======
if (btnBack) btnBack.style.visibility = 'hidden';
progressBar.style.width = '0%';
