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
            if (!input || !input.value.trim()) {
                document.getElementById('dynamic-input-wrapper').classList.add('error');
                return;
            }
            const question = document.getElementById('dynamic-question-text').textContent;
            const answer = input.value.trim();

            collectedData[`q${questionCount}`] = { question, answer };
            conversationHistory.push({ role: 'assistant', content: JSON.stringify({ action: 'ask', question }) });
            conversationHistory.push({ role: 'user', content: answer });

            await getNextQuestion();
        }
    });
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

ALWAYS respond with ONLY a valid JSON object, no other text:

If you need more data:
{
  "action": "ask",
  "question": "Your question here",
  "hint": "Optional clarifying hint or leave empty string",
  "inputType": "number" or "text" or "select",
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

    document.getElementById('dynamic-question-text').textContent = q.question;
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
        const stats = jsonData.stats || jsonData;
        updateStats(stats);
        updateCharts(stats);
    }

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

    Chart.defaults.color = '#666666';
    Chart.defaults.font.family = "'Inter', sans-serif";

    const commonOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { position: 'bottom', labels: { color: '#111111', boxWidth: 12 } }
        }
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
                        'rgba(255, 255, 255, 0.8)',
                        'rgba(255, 74, 74, 0.8)',
                        'rgba(255, 204, 0, 0.8)',
                        'rgba(125, 249, 166, 0.8)'
                    ],
                    borderRadius: 4
                }]
            },
            options: {
                ...commonOptions,
                scales: {
                    y: { grid: { color: 'rgba(0, 0, 0, 0.06)' } },
                    x: { grid: { display: false } }
                }
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
                        '#ff4a4a',
                        '#ffcc00',
                        '#4a90e2',
                        '#bd10e0',
                        '#7DF9A6'
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

// ====== INITIALIZE ======
if (btnBack) btnBack.style.visibility = 'hidden';
progressBar.style.width = '0%';
