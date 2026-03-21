let conversationHistory = [];
let userData = {};

async function analyze() {
    const revenue = parseFloat(document.getElementById("revenue").value);
    const expenses = parseFloat(document.getElementById("expenses").value);
    const hours = parseFloat(document.getElementById("hours").value);
    const business = document.getElementById("business").value;

    if (!revenue || !expenses || !hours || !business) {
        alert("Please fill in all fields.");
        return;
    }

    // Save user data
    userData = { revenue, expenses, hours, business };

    // Calculate basic stats
    const profit = revenue - expenses;
    const hourlyRate = profit / hours;
    const tax = profit * 0.25;

    // Show results section
    document.getElementById("form-section").style.display = "none";
    document.getElementById("results-section").style.display = "block";

    // Fill stat cards
    document.getElementById("stat-profit").textContent = `$${profit.toFixed(0)}`;
    document.getElementById("stat-rate").textContent = `$${hourlyRate.toFixed(2)}/hr`;
    document.getElementById("stat-tax").textContent = `$${tax.toFixed(0)}`;

    // Color profit card
    const profitCard = document.getElementById("stat-profit");
    profitCard.style.color = profit >= 0 ? "#a8f0a8" : "#f0a8a8";

    // Render chart
    renderChart(revenue, expenses, profit, tax);

    // Call Claude
    document.getElementById("ai-response").innerHTML = '<span class="loading">Analyzing your finances...</span>';
    document.getElementById("analyze-btn").disabled = true;

    const systemPrompt = `You are a sharp, direct financial advisor for freelancers and early entrepreneurs. 
You analyze their numbers and give specific, actionable advice — not generic tips.
Your tone is honest, direct, and supportive. Like a friend who happens to be a CFO.
After your analysis, always end with ONE follow-up question to learn more about their situation and give better advice.
Format your follow-up question on a new line starting exactly with: FOLLOWUP: your question here`;

    const userMessage = `Here are my numbers for this month:
- Business type: ${business}
- Monthly revenue: $${revenue}
- Monthly expenses: $${expenses}
- Hours worked: ${hours}
- Net profit: $${profit}
- Effective hourly rate: $${hourlyRate.toFixed(2)}/hr

Give me an honest analysis. Am I actually doing well or not? What should I change?`;

    conversationHistory = [{ role: "user", content: userMessage }];

    const response = await callClaude(systemPrompt, conversationHistory);

    if (response) {
        // Split AI response from follow-up question
        const parts = response.split("FOLLOWUP:");
        const analysis = parts[0].trim();
        const followup = parts[1] ? parts[1].trim() : null;

        document.getElementById("ai-response").textContent = analysis;
        conversationHistory.push({ role: "assistant", content: response });

        if (followup) {
            document.getElementById("followup-question").textContent = followup;
            document.getElementById("followup-box").style.display = "block";
        }
    }
}

async function sendFollowup() {
    const input = document.getElementById("followup-input").value;
    if (!input) return;

    document.getElementById("followup-question").innerHTML = '<span class="loading">Thinking...</span>';
    document.getElementById("followup-input").value = "";

    conversationHistory.push({ role: "user", content: input });

    const systemPrompt = `You are a sharp, direct financial advisor for freelancers and early entrepreneurs.
Continue the conversation naturally. Give specific advice based on everything you know about this person.
If you need more information, ask ONE more follow-up question starting with: FOLLOWUP: your question here
If you have enough info, just give your best advice with no follow-up.`;

    const response = await callClaude(systemPrompt, conversationHistory);

    if (response) {
        const parts = response.split("FOLLOWUP:");
        const advice = parts[0].trim();
        const followup = parts[1] ? parts[1].trim() : null;

        // Append to main AI response
        document.getElementById("ai-response").textContent += "\n\n" + advice;
        conversationHistory.push({ role: "assistant", content: response });

        if (followup) {
            document.getElementById("followup-question").textContent = followup;
        } else {
            document.getElementById("followup-box").style.display = "none";
        }
    }
}

async function callClaude(systemPrompt, messages) {
    try {
        const res = await fetch("/api/analyze", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ system: systemPrompt, messages })
        });

        const data = await res.json();

        if (data.content && data.content[0]) {
            return data.content[0].text;
        } else {
            console.error("API error:", data);
            document.getElementById("ai-response").textContent = "Error connecting to AI.";
            return null;
        }
    } catch (err) {
        console.error("Fetch error:", err);
        document.getElementById("ai-response").textContent = "Connection error.";
        return null;
    }
}

function renderChart(revenue, expenses, profit, tax) {
    const ctx = document.getElementById("myChart").getContext("2d");
    new Chart(ctx, {
        type: "bar",
        data: {
            labels: ["Revenue", "Expenses", "Net Profit", "Tax Reserve"],
            datasets: [{
                label: "This Month ($)",
                data: [revenue, expenses, profit, tax],
                backgroundColor: [
                    "rgba(168, 240, 168, 0.6)",
                    "rgba(240, 168, 168, 0.6)",
                    "rgba(168, 200, 255, 0.6)",
                    "rgba(255, 220, 168, 0.6)"
                ],
                borderColor: [
                    "rgba(168, 240, 168, 1)",
                    "rgba(240, 168, 168, 1)",
                    "rgba(168, 200, 255, 1)",
                    "rgba(255, 220, 168, 1)"
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { labels: { color: "rgba(255,255,255,0.6)" } }
            },
            scales: {
                x: { ticks: { color: "rgba(255,255,255,0.6)" }, grid: { color: "rgba(255,255,255,0.05)" } },
                y: { ticks: { color: "rgba(255,255,255,0.6)" }, grid: { color: "rgba(255,255,255,0.05)" } }
            }
        }
    });
}

function reset() {
    document.getElementById("form-section").style.display = "block";
    document.getElementById("results-section").style.display = "none";
    document.getElementById("followup-box").style.display = "none";
    document.getElementById("analyze-btn").disabled = false;
    conversationHistory = [];
    userData = {};

    // Destroy existing chart
    const canvas = document.getElementById("myChart");
    const existingChart = Chart.getChart(canvas);
    if (existingChart) existingChart.destroy();
}