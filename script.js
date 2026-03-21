// ====== CONSTANTS & STATE ======
const TOTAL_STEPS = 8;
let currentStep = 1;

let formData = {
    business: '',
    revenue: 0,
    expenses: 0,
    hours: 0,
    clients: 0,
    expenseCategory: '',
    country: '',
    goal: ''
};

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

// ====== FORM NAVIGATION & VALIDATION ======

function updateFormView() {
    // 1. Update progress bar
    progressBar.style.width = `${(currentStep / TOTAL_STEPS) * 100}%`;

    // 2. Show/hide steps
    document.querySelectorAll('.form-step').forEach(step => {
        step.classList.remove('active');
        if (parseInt(step.dataset.step) === currentStep) {
            step.classList.add('active');
        }
    });

    // 3. Update buttons
    btnBack.style.visibility = currentStep === 1 ? 'hidden' : 'visible';

    if (currentStep === TOTAL_STEPS) {
        btnNext.style.display = 'none';
        btnSubmit.style.display = 'block';
    } else {
        btnNext.style.display = 'block';
        btnSubmit.style.display = 'none';
    }

    // 4. Autofocus primary input for the step
    setTimeout(() => {
        const activeStepEl = document.querySelector(`.form-step[data-step="${currentStep}"]`);
        if (activeStepEl) {
            const firstInput = activeStepEl.querySelector('input:not([type="hidden"]), select, textarea');
            if (firstInput) firstInput.focus();
        }
    }, 100);
}

function validateStep() {
    const stepEl = document.querySelector(`.form-step[data-step="${currentStep}"]`);
    let isValid = true;

    // Clear previous errors
    const wrapperSelector = currentStep === 8 ? '.radio-group' : '.input-wrapper';
    const wrapper = stepEl.querySelector(wrapperSelector);
    wrapper.classList.remove('invalid', 'shake');

    if (currentStep === 1) {
        const val = document.getElementById('input-business').value.trim();
        isValid = val.length > 0;
        if (isValid) formData.business = val;
    } else if (currentStep === 2) {
        const val = parseFloat(document.getElementById('input-revenue').value);
        isValid = !isNaN(val) && val >= 0;
        if (isValid) formData.revenue = val;
    } else if (currentStep === 3) {
        const val = parseFloat(document.getElementById('input-expenses').value);
        isValid = !isNaN(val) && val >= 0;
        if (isValid) formData.expenses = val;
    } else if (currentStep === 4) {
        const val = parseFloat(document.getElementById('input-hours').value);
        isValid = !isNaN(val) && val > 0;
        if (isValid) formData.hours = val;
    } else if (currentStep === 5) {
        const val = parseInt(document.getElementById('input-clients').value);
        isValid = !isNaN(val) && val >= 0;
        if (isValid) formData.clients = val;
    } else if (currentStep === 6) {
        const val = document.getElementById('input-expense-category').value;
        isValid = val !== '';
        if (isValid) formData.expenseCategory = val;
    } else if (currentStep === 7) {
        const val = document.getElementById('input-country').value;
        isValid = val !== '';
        if (isValid) formData.country = val;
    } else if (currentStep === 8) {
        const checked = document.querySelector('input[name="goal"]:checked');
        isValid = checked !== null;
        if (isValid) formData.goal = checked.value;
    }

    if (!isValid) {
        // Trigger reflow to restart animation
        void wrapper.offsetWidth;
        wrapper.classList.add('invalid', 'shake');
    }

    return isValid;
}

if (btnNext) {
    btnNext.addEventListener('click', () => {
        if (validateStep()) {
            currentStep++;
            updateFormView();
        }
    });
}

// Also allow Enter key
document.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && currentStep < TOTAL_STEPS && formSection && formSection.classList.contains('active-section')) {
        if (btnNext) btnNext.click();
    }
});

if (btnBack) {
    btnBack.addEventListener('click', () => {
        if (currentStep > 1) {
            currentStep--;
            updateFormView();
        }
    });
}

if (btnSubmit) {
    btnSubmit.addEventListener('click', () => {
        if (validateStep()) {
            submitAnalysis();
        }
    });
}

if (btnRestart) {
    btnRestart.addEventListener('click', () => {
        location.reload();
    });
}

// ====== API & AI LOGIC ======
const SYSTEM_PROMPT = `You are a sharp, direct financial advisor - acting like a brutally honest CFO friend for a freelancer or early entrepreneur.
Your job is to analyze their financial data and tell them the truth: Are they making money or just busy?
Provide specific, personalized advice based on their numbers, business type, country and goals. NOT generic. Brutally honest but constructive.

Calculate metrics based on the provided inputs and return a structured JSON block wrapped EXACTLY in |||JSON and ||| delimiters. No text inside the |||JSON block except the raw JSON.
Required JSON keys (all Numbers):
- netProfit (revenue - expenses - tax)
- hourlyRate (profit divided by hours)
- taxReserve (percentage of revenue based on country: US=25%, Mexico=16%, India=18%, UK=20%, others=20%) (return the actual numerical value of tax, not the percent)
- profitMargin (percentage, 0-100)
- revenuePerClient
- financialHealthScore (0-100)
- savingsRecommendation (numerical amount they should save from profit)
- investmentRecommendation (numerical amount they should invest from profit)

After the JSON block, write 3-4 paragraphs of text analysis specific to them. Do not include markdown formatting like ** or *. Do not use generic greetings. Just jump straight into the analysis.
End with ONE specific follow-up question to learn more, prefixed exactly with FOLLOWUP: on a new line.`;

async function callAPI() {
    try {
        const response = await fetch('/api/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                system: SYSTEM_PROMPT,
                messages: chatHistory
            })
        });

        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();
        // Fallback for Vercel/Claude format if needed
        if (data.content && data.content[0] && data.content[0].text) {
            return data.content[0].text;
        }
        return data.response || data.text || "Error: unexpected response format.";
    } catch (error) {
        console.error(error);
        return "Error analyzing data. Please try again later. Make sure the backend endpoint is functioning properly.";
    }
}

function parseAIResponse(fullText) {
    let jsonMatch = fullText.match(/\|\|\|JSON\s*([\s\S]*?)\s*\|\|\|/);
    let jsonData = null;
    let cleanText = fullText;

    if (jsonMatch && jsonMatch[1]) {
        try {
            jsonData = JSON.parse(jsonMatch[1]);
            // Remove the JSON block from text
            cleanText = fullText.replace(/\|\|\|JSON\s*[\s\S]*?\s*\|\|\|/, '').trim();
        } catch (e) {
            console.error('Failed to parse JSON out of Claude response', e);
        }
    }

    // Extract follow-up question
    let followUpQ = null;
    let followUpMatch = cleanText.match(/FOLLOWUP:\s*(.*)/i);
    if (followUpMatch && followUpMatch[1]) {
        followUpQ = followUpMatch[1].trim();
        // Remove follow-up from main text
        cleanText = cleanText.replace(/FOLLOWUP:\s*(.*)/i, '').trim();
    }

    return { jsonData, cleanText, followUpQ };
}

async function submitAnalysis() {
    formSection.classList.remove('active-section');
    formSection.classList.add('hidden-section');
    loadingSection.classList.remove('hidden-section');
    loadingSection.classList.add('active-section');

    const promptText = `Here is my financial data:
- Business: ${formData.business}
- Monthly Revenue: $${formData.revenue}
- Monthly Expenses: $${formData.expenses}
- Hours Worked: ${formData.hours}
- Clients: ${formData.clients}
- Main Expense Category: ${formData.expenseCategory}
- Country: ${formData.country}
- Primary Goal: ${formData.goal}

Please analyze this.`;

    chatHistory.push({ role: 'user', content: promptText });

    const aiMessage = await callAPI();
    chatHistory.push({ role: 'assistant', content: aiMessage });

    loadingSection.classList.remove('active-section');
    loadingSection.classList.add('hidden-section');
    resultsSection.classList.remove('hidden-section');
    resultsSection.classList.add('active-section');

    processDisplayResults(aiMessage);
}

// ====== RESULTS RENDERING ======
const formatCurrency = (val) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
const formatPercent = (val) => val.toFixed(1) + '%';

function processDisplayResults(fullResponse) {
    const { jsonData, cleanText, followUpQ } = parseAIResponse(fullResponse);

    if (jsonData) {
        updateStats(jsonData);
        updateCharts(jsonData);
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
    if (hrEl) hrEl.innerText = formatCurrency(data.hourlyRate || 0);

    const tcEl = document.getElementById('val-tax-country');
    if (tcEl) tcEl.innerText = `(${formData.country})`;

    const trEl = document.getElementById('val-tax-reserve');
    if (trEl) trEl.innerText = formatCurrency(data.taxReserve || 0);

    const hsEl = document.getElementById('val-health-score');
    if (hsEl) {
        let score = data.financialHealthScore || 0;
        hsEl.innerText = score + '/100';
        hsEl.className = 'health-badge ';
        if (score <= 40) hsEl.classList.add('bg-red');
        else if (score <= 70) hsEl.classList.add('bg-yellow');
        else hsEl.classList.add('bg-green');
    }

    const pmEl = document.getElementById('val-profit-margin');
    if (pmEl) pmEl.innerText = formatPercent(data.profitMargin || 0);

    const rcEl = document.getElementById('val-rev-per-client');
    if (rcEl) rcEl.innerText = formatCurrency(data.revenuePerClient || 0);
}

function updateCharts(data) {
    if (typeof Chart === 'undefined') return;

    Chart.defaults.color = '#666666';
    Chart.defaults.font.family = "'DM Sans', sans-serif";

    const commonOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { position: 'bottom', labels: { color: '#111111', boxWidth: 12 } }
        }
    };

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
                    data: [formData.revenue, formData.expenses, data.taxReserve || 0, data.netProfit || 0],
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
    // Expenses / Tax / Savings / Investment / Available
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
                        formData.expenses,
                        data.taxReserve || 0,
                        data.savingsRecommendation || 0,
                        data.investmentRecommendation || 0,
                        Math.max(0, available)
                    ],
                    backgroundColor: [
                        '#ff4a4a', // Expenses red
                        '#ffcc00', // Tax yellow
                        '#4a90e2', // Savings blue
                        '#bd10e0', // Investment purple
                        '#7DF9A6'  // Available green
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

    // Instead of completely clearing to '' and losing old paragraphs,
    // we only create new ones for the new text being typed, or if it's the first time
    // For original AI response we clear, for followups we append
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
            setTimeout(typeChar, 18); // 18ms per char
        } else {
            // End of paragraph
            currentParaIndex++;
            currentCharIndex = 0;
            if (currentParaIndex < paragraphs.length) {
                pEl = document.createElement('p');
                el.appendChild(pEl);
                setTimeout(typeChar, 200); // Small pause between paragraphs
            } else {
                if (callback) callback();
            }
        }
    }

    typeChar();
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

    // Append a separator visually
    const contentEl = document.getElementById('ai-response-content');
    if (contentEl) {
        // Also show user's message
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
        updateStats(jsonData);
        updateCharts(jsonData);
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
        // start at a random number between 847 and 923
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

// ====== TILE SELECTORS LOGIC ======
function initTileSelectors() {
    document.querySelectorAll('.tile-group').forEach(group => {
        const input = group.querySelector('input[type="hidden"]');
        const buttons = group.querySelectorAll('.tile-btn');

        buttons.forEach(btn => {
            btn.addEventListener('click', () => {
                // Remove selected from sisters
                buttons.forEach(b => b.classList.remove('selected'));
                // Select this one
                btn.classList.add('selected');
                // Update hidden input
                input.value = btn.dataset.value;
                // Clear error visually
                group.classList.remove('invalid', 'shake');
            });
        });
    });
}

initTileSelectors();

// Initialize form
if (formSection) {
    updateFormView();
}