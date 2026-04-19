document.addEventListener('DOMContentLoaded', () => {
    // --- Selectors ---
    const expenseForm       = document.getElementById('expense-form');
    const amountInput       = document.getElementById('amount');
    const categoryInput     = document.getElementById('category');
    const noteInput         = document.getElementById('note');
    const recurringSelect   = document.getElementById('recurring-select');
    const typeInputs        = document.getElementsByName('type');
    const submitBtn         = document.getElementById('submit-btn');

    const optExpense        = document.getElementById('opt-expense');
    const optIncome         = document.getElementById('opt-income');

    const expenseListContainer = document.getElementById('expense-list-container');
    const balanceDisplay    = document.getElementById('total-balance');
    const incomeDisplay     = document.getElementById('total-income');
    const expenseDisplay    = document.getElementById('total-expense');

    const chartCanvas       = document.getElementById('expense-chart');
    const trendCanvas       = document.getElementById('trend-chart');
    const progressContainer = document.getElementById('category-progress-container');

    const filterBtns        = document.querySelectorAll('.filter-btn');
    const budgetInput       = document.getElementById('monthly-budget');
    const budgetProgressFill= document.getElementById('budget-progress-fill');
    const budgetWarning     = document.getElementById('budget-warning');
    const budgetText        = document.getElementById('budget-text');
    const themeBtn          = document.getElementById('theme-toggle');
    const streakBadge       = document.getElementById('streak-badge');
    const streakCountDisplay= document.getElementById('streak-count');
    const insightText       = document.getElementById('insight-text');
    const insightsCard      = document.getElementById('insights-card');
    const exportBtn         = document.getElementById('export-btn');
    const toast             = document.getElementById('toast');
    const undoBtn           = document.getElementById('undo-btn');

    const toggleCatLimitsBtn        = document.getElementById('toggle-cat-limits');
    const catLimitsForm             = document.getElementById('cat-limits-form');
    const catLimitsInputsContainer  = document.getElementById('cat-limits-inputs');
    const saveCatLimitsBtn          = document.getElementById('save-cat-limits');

    // --- State ---
    let expenses        = JSON.parse(localStorage.getItem('spendwise_expenses'))  || [];
    let monthlyBudget   = parseFloat(localStorage.getItem('spendwise_budget'))    || 0;
    let categoryLimits  = JSON.parse(localStorage.getItem('spendwise_cat_limits'))|| {};
    let recurringRules  = JSON.parse(localStorage.getItem('spendwise_recurring')) || [];
    let currentFilter   = 'all';
    let theme           = localStorage.getItem('spendwise_theme') || 'dark';
    let lastDeleted     = null;
    let chartInstance   = null;
    let trendInstance   = null;
    let toastTimer      = null;

    // --- Init ---
    initTheme();
    if (monthlyBudget > 0) budgetInput.value = monthlyBudget;
    checkRecurring();
    renderStreak();
    updateUI();

    /* ===== HELPERS ===== */

    function saveExpenses() {
        localStorage.setItem('spendwise_expenses', JSON.stringify(expenses));
    }

    function saveRecurring() {
        localStorage.setItem('spendwise_recurring', JSON.stringify(recurringRules));
    }

    function formatCurrency(amount) {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency', currency: 'INR',
            minimumFractionDigits: 0, maximumFractionDigits: 0
        }).format(amount);
    }

    const CATEGORY_META = {
        'Food':          { emoji: '🍔', color: '#f97066' },
        'Travel':        { emoji: '🚌', color: '#34d399' },
        'Books':         { emoji: '📚', color: '#fbbf24' },
        'Entertainment': { emoji: '🎮', color: '#a78bfa' },
        'Other':         { emoji: '🧾', color: '#6ea8fe' },
        'Salary':        { emoji: '💼', color: '#22d3a5' },
        'Allowance':     { emoji: '🏠', color: '#34d399' },
        'Bonus':         { emoji: '🎁', color: '#fbbf24' },
        'Other Income':  { emoji: '💵', color: '#22d3a5' },
    };

    function getCategoryEmoji(cat) {
        return (CATEGORY_META[cat] || {}).emoji || '💸';
    }

    function getCategoryColor(cat) {
        return (CATEGORY_META[cat] || {}).color || '#6ea8fe';
    }

    /* ======= THEME ======= */
    function initTheme() {
        if (theme === 'minimal') {
            document.body.setAttribute('data-theme', 'minimal');
            themeBtn.textContent = '☀️';
        } else {
            document.body.removeAttribute('data-theme');
            themeBtn.textContent = '🌙';
        }
    }

    themeBtn.addEventListener('click', () => {
        theme = (theme === 'dark') ? 'minimal' : 'dark';
        localStorage.setItem('spendwise_theme', theme);
        initTheme();
        updateUI();
    });

    /* ======= FILTER ======= */
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.dataset.filter;
            updateUI();
        });
    });

    function getFilteredExpenses() {
        const now = new Date();
        const todayStr = now.toISOString().split('T')[0];
        return expenses.filter(exp => {
            const expDate    = new Date(exp.date);
            const expDateStr = exp.date.split('T')[0];
            if (currentFilter === 'all')   return true;
            if (currentFilter === 'today') return expDateStr === todayStr;
            if (currentFilter === 'week') {
                const weekAgo = new Date();
                weekAgo.setDate(now.getDate() - 7);
                return expDate >= weekAgo && expDate <= now;
            }
            if (currentFilter === 'month') {
                return expDate.getMonth() === now.getMonth() &&
                       expDate.getFullYear() === now.getFullYear();
            }
            return true;
        });
    }

    /* ======= BUDGET ======= */
    budgetInput.addEventListener('change', e => {
        monthlyBudget = parseFloat(e.target.value);
        if (isNaN(monthlyBudget) || monthlyBudget < 0) monthlyBudget = 0;
        localStorage.setItem('spendwise_budget', monthlyBudget);
        updateUI();
    });

    function renderBudget(totalExpense) {
        if (monthlyBudget <= 0) {
            budgetProgressFill.style.width = '0%';
            budgetText.textContent = 'No budget set';
            budgetWarning.style.display = 'none';
            return;
        }
        const pct = (totalExpense / monthlyBudget) * 100;
        budgetProgressFill.style.width = `${Math.min(pct, 100)}%`;
        budgetText.textContent = `${Math.round(pct)}% used of ${formatCurrency(monthlyBudget)}`;

        if (pct >= 100) {
            budgetProgressFill.style.background = 'var(--red)';
            budgetWarning.style.display = 'block';
        } else if (pct >= 80) {
            budgetProgressFill.style.background = 'var(--yellow)';
            budgetWarning.style.display = 'none';
        } else {
            budgetProgressFill.style.background = 'var(--green)';
            budgetWarning.style.display = 'none';
        }
    }

    /* ======= CATEGORY LIMITS ======= */
    toggleCatLimitsBtn.addEventListener('click', () => {
        const open = catLimitsForm.style.display === 'block';
        catLimitsForm.style.display = open ? 'none' : 'block';
        if (!open) renderCatLimitsInputs();
    });

    function renderCatLimitsInputs() {
        catLimitsInputsContainer.innerHTML = '';
        ['Food','Travel','Books','Entertainment','Other'].forEach(cat => {
            const limit = categoryLimits[cat] || '';
            const row   = document.createElement('div');
            row.className = 'cat-limit-row';
            row.innerHTML = `
                <label>${getCategoryEmoji(cat)} ${cat}</label>
                <input type="number" class="cat-limit-input" data-cat="${cat}"
                       value="${limit}" placeholder="No limit" min="0">
            `;
            catLimitsInputsContainer.appendChild(row);
        });
    }

    saveCatLimitsBtn.addEventListener('click', () => {
        document.querySelectorAll('.cat-limit-input').forEach(input => {
            const cat = input.dataset.cat;
            const val = parseFloat(input.value);
            if (!isNaN(val) && val > 0) categoryLimits[cat] = val;
            else delete categoryLimits[cat];
        });
        localStorage.setItem('spendwise_cat_limits', JSON.stringify(categoryLimits));
        catLimitsForm.style.display = 'none';
        updateUI();
    });

    /* ======= RECURRING TRANSACTIONS ======= */
    function checkRecurring() {
        let changed = false;
        const today = new Date();
        today.setHours(0,0,0,0);

        recurringRules.forEach(rule => {
            let nextRun = new Date(rule.nextRun);
            while (nextRun <= today) {
                const suffix = rule.interval === 'weekly' ? ' (Weekly)' : ' (Monthly)';
                expenses.unshift({
                    id:       Date.now().toString() + Math.random().toString().slice(2,5),
                    amount:   rule.amount,
                    category: rule.category,
                    note:     (rule.note || '') + suffix,
                    type:     rule.type,
                    date:     nextRun.toISOString()
                });
                changed = true;
                if (rule.interval === 'weekly') nextRun.setDate(nextRun.getDate() + 7);
                else nextRun.setMonth(nextRun.getMonth() + 1);
                rule.nextRun = nextRun.toISOString();
            }
        });

        if (changed) {
            saveRecurring();
            saveExpenses();
            showNotice('Recurring transactions processed! 🔄');
        }
    }

    /* ======= STREAK ======= */
    function renderStreak() {
        const dates = new Set(expenses.map(e => e.date.split('T')[0]));
        let streak  = 0;
        let d       = new Date();
        const todayStr = d.toISOString().split('T')[0];

        while (true) {
            const ds = d.toISOString().split('T')[0];
            if (dates.has(ds)) {
                streak++;
                d.setDate(d.getDate() - 1);
            } else {
                if (ds === todayStr) { d.setDate(d.getDate() - 1); continue; }
                break;
            }
        }

        if (streak > 0) {
            streakBadge.classList.add('visible');
            streakCountDisplay.textContent = `${streak} Day${streak > 1 ? 's' : ''}`;
        } else {
            streakBadge.classList.remove('visible');
        }
    }

    /* ======= INSIGHTS ======= */
    function renderInsights(list) {
        if (list.length === 0) { insightsCard.style.display = 'none'; return; }

        const totals = {};
        list.filter(e => e.type === 'expense').forEach(e => {
            totals[e.category] = (totals[e.category] || 0) + parseFloat(e.amount);
        });

        const entries = Object.entries(totals);
        if (!entries.length) { insightsCard.style.display = 'none'; return; }

        insightsCard.style.display = 'block';

        const [topCat, topVal] = entries.reduce((a, b) => b[1] > a[1] ? b : a);
        const totalSpent = entries.reduce((s, [,v]) => s + v, 0);
        const topPct     = totalSpent > 0 ? Math.round((topVal / totalSpent) * 100) : 0;

        const tips = [
            `Most spending on <strong>${topCat}</strong> — ${formatCurrency(topVal)} (${topPct}% of total).`,
            `You've logged <strong>${list.length}</strong> transaction${list.length > 1 ? 's' : ''} in this period.`,
            entries.length > 1
                ? `${entries.length} categories tracked. Keep it up!`
                : `All in <strong>${topCat}</strong>. Try diversifying your budget tracking.`
        ];

        // cycle through tips on each render
        const idx = Math.floor(Date.now() / 10000) % tips.length;
        insightText.innerHTML = tips[idx];
    }

    /* ======= EXPORT CSV ======= */
    exportBtn.addEventListener('click', () => {
        if (!expenses.length) return showNotice('No data to export!');
        let csv = 'Date,Type,Category,Amount,Note\n';
        expenses.forEach(e => {
            csv += `${e.date.split('T')[0]},${e.type||'expense'},${e.category},${e.amount},${e.note||''}\n`;
        });
        const link      = document.createElement('a');
        link.href       = 'data:text/csv;charset=utf-8,' + encodeURI(csv);
        link.download   = `spendwise_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showNotice('CSV exported! ✅');
    });

    /* ======= UNDO / TOAST ======= */
    undoBtn.addEventListener('click', () => {
        if (lastDeleted) {
            expenses.push(lastDeleted.item);
            saveExpenses();
            updateUI();
            toast.classList.add('hidden');
            lastDeleted = null;
            clearTimeout(toastTimer);
        }
    });

    function showToast(msg) {
        const spanEl = toast.querySelector('span');
        if (spanEl) spanEl.textContent = msg || 'Transaction deleted.';
        toast.classList.remove('hidden');
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => {
            toast.classList.add('hidden');
            lastDeleted = null;
        }, 5000);
    }

    // Small notice (no undo)
    function showNotice(msg) {
        const notice       = document.createElement('div');
        notice.style.cssText = `
            position:fixed; bottom:2rem; left:50%; transform:translateX(-50%);
            background:#1e293b; color:#f1f5f9; padding:.75rem 1.5rem;
            border-radius:10px; border:1px solid rgba(255,255,255,0.1);
            font-size:.85rem; font-weight:500; z-index:300; white-space:nowrap;
            backdrop-filter:blur(12px); box-shadow:0 8px 32px rgba(0,0,0,.4);
            animation: fadeUp .3s ease;
        `;
        notice.textContent = msg;

        // Create keyframe inline
        if (!document.getElementById('notice-kf')) {
            const s       = document.createElement('style');
            s.id          = 'notice-kf';
            s.textContent = '@keyframes fadeUp { from{opacity:0;transform:translateX(-50%) translateY(15px)} to{opacity:1;transform:translateX(-50%) translateY(0)} }';
            document.head.appendChild(s);
        }

        document.body.appendChild(notice);
        setTimeout(() => { notice.style.opacity = '0'; notice.style.transition='opacity .3s'; }, 2500);
        setTimeout(() => notice.remove(), 2900);
    }

    /* ======= TYPE TOGGLE BEHAVIOR ======= */
    typeInputs.forEach(input => {
        input.addEventListener('change', e => {
            if (e.target.value === 'income') {
                optExpense.style.display  = 'none';
                optIncome.style.display   = 'block';
                categoryInput.value       = 'Salary';
                submitBtn.textContent     = 'Add Income';
                submitBtn.classList.remove('expense-mode');
            } else {
                optExpense.style.display  = 'block';
                optIncome.style.display   = 'none';
                categoryInput.value       = 'Food';
                submitBtn.textContent     = 'Add Transaction';
                submitBtn.classList.add('expense-mode');
            }
        });
    });

    /* ======= RENDER STATS ======= */
    function renderStats(visible) {
        let totalIncome = 0, totalExpense = 0;
        visible.forEach(item => {
            const amt = parseFloat(item.amount);
            if (item.type === 'income') totalIncome += amt;
            else totalExpense += amt;
        });

        animateValue(balanceDisplay, totalIncome - totalExpense);
        animateValue(incomeDisplay, totalIncome, 'income');
        animateValue(expenseDisplay, totalExpense, 'expense');

        // Budget always based on current month expenses
        const now = new Date();
        const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const monthTotal = expenses
            .filter(e => {
                const d = new Date(e.date);
                return e.type !== 'income' && d >= thisMonthStart;
            })
            .reduce((sum, e) => sum + parseFloat(e.amount), 0);
        renderBudget(monthTotal);
    }

    function animateValue(el, target, type) {
        const sign = type === 'income' ? '+' : (type === 'expense' ? '-' : (target < 0 ? '' : ''));
        el.textContent = formatCurrency(Math.abs(target));
    }

    /* ======= RENDER EXPENSES LIST ======= */
    function renderExpenses(visible) {
        expenseListContainer.innerHTML = '';

        if (!visible.length) {
            expenseListContainer.innerHTML = `
                <p class="empty-state">
                    <span class="empty-icon">🚀</span>
                    No transactions for this period yet.
                </p>`;
            return;
        }

        const sorted = [...visible].sort((a, b) => new Date(b.date) - new Date(a.date));

        // Group by date
        const groups = {};
        sorted.forEach(t => {
            const key = t.date.split('T')[0];
            if (!groups[key]) groups[key] = [];
            groups[key].push(t);
        });

        Object.entries(groups).forEach(([dateKey, txns]) => {
            // Date header
            const dateLabel = document.createElement('p');
            dateLabel.style.cssText = 'font-size:.75rem; font-weight:600; color:var(--text-muted); text-transform:uppercase; letter-spacing:.8px; margin: .8rem 0 .4rem; padding-left:.25rem;';
            const d = new Date(dateKey + 'T00:00:00');
            const today = new Date(); today.setHours(0,0,0,0);
            const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);

            if (d.toDateString() === today.toDateString())     dateLabel.textContent = 'Today';
            else if (d.toDateString() === yesterday.toDateString()) dateLabel.textContent = 'Yesterday';
            else dateLabel.textContent = d.toLocaleDateString('en-IN', { day:'numeric', month:'long', year:'numeric' });

            expenseListContainer.appendChild(dateLabel);

            txns.forEach(appExpense => {
                const type = appExpense.type || 'expense';
                const item = document.createElement('div');
                item.classList.add('expense-item', type);

                const emoji = getCategoryEmoji(appExpense.category);
                const sign  = type === 'income' ? '+' : '−';

                item.innerHTML = `
                    <div class="txn-icon">${emoji}</div>
                    <div class="expense-info">
                        <span class="expense-category">${appExpense.category}</span>
                        <span class="expense-date-note">${appExpense.note ? appExpense.note : '&mdash;'}</span>
                    </div>
                    <div class="expense-actions">
                        <span class="expense-amount">${sign}${formatCurrency(appExpense.amount)}</span>
                        <button class="delete-btn" data-id="${appExpense.id}" title="Delete">✕</button>
                    </div>
                `;
                expenseListContainer.appendChild(item);
            });
        });

        expenseListContainer.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', e => {
                const id = e.target.closest('button').dataset.id;
                deleteExpense(id);
            });
        });
    }

    /* ======= ADD EXPENSE ======= */
    function addExpense(e) {
        e.preventDefault();

        const amount    = parseFloat(amountInput.value);
        const category  = categoryInput.value;
        const note      = noteInput.value.trim();
        const type      = document.querySelector('input[name="type"]:checked').value;
        const recurring = recurringSelect.value;

        if (!amount || amount <= 0) {
            showNotice('Enter a valid amount 👆');
            return;
        }

        // Button animation
        submitBtn.style.transform = 'scale(0.96)';
        setTimeout(() => submitBtn.style.transform = '', 200);

        const newExpense = {
            id:       Date.now().toString(),
            amount, category, note, type,
            date: new Date().toISOString()
        };

        if (recurring !== 'none') {
            const nextRun = new Date();
            if (recurring === 'weekly')  nextRun.setDate(nextRun.getDate() + 7);
            if (recurring === 'monthly') nextRun.setMonth(nextRun.getMonth() + 1);
            recurringRules.push({
                id:       Date.now() + '_rule',
                amount, category, note, type,
                interval: recurring,
                nextRun:  nextRun.toISOString()
            });
            saveRecurring();
            showNotice(`Recurring (${recurring}) set! 🔄`);
        }

        expenses.unshift(newExpense);
        saveExpenses();
        renderStreak();
        updateUI();

        expenseForm.reset();
        document.getElementById('type-expense').checked = true;
        optExpense.style.display = 'block';
        optIncome.style.display  = 'none';
        submitBtn.textContent    = 'Add Transaction';
        submitBtn.classList.add('expense-mode');
    }

    /* ======= DELETE EXPENSE ======= */
    function deleteExpense(id) {
        const item = expenses.find(e => e.id === id);
        if (!item) return;
        lastDeleted = { item, index: expenses.indexOf(item) };
        expenses    = expenses.filter(e => e.id !== id);
        saveExpenses();
        updateUI();
        showToast('Transaction deleted.');
    }

    /* ======= CHARTS ======= */
    function renderCharts(visible) {
        const expenseItems = visible.filter(e => e.type !== 'income');
        const categories   = ['Food','Travel','Books','Entertainment','Other'];
        const totals       = {};
        categories.forEach(c => totals[c] = 0);
        expenseItems.forEach(exp => {
            if (totals[exp.category] !== undefined) totals[exp.category] += parseFloat(exp.amount);
            else totals['Other'] += parseFloat(exp.amount);
        });

        const chartColors  = categories.map(c => getCategoryColor(c));
        const isDark       = theme !== 'minimal';
        const gridColor    = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
        const tickColor    = isDark ? '#64748b' : '#94a3b8';
        const legendColor  = isDark ? '#94a3b8' : '#475569';
        const borderCol    = isDark ? 'rgba(15,21,35,0.8)' : 'rgba(255,255,255,0.9)';

        // --- Doughnut ---
        if (chartInstance) chartInstance.destroy();
        chartInstance = new Chart(chartCanvas, {
            type: 'doughnut',
            data: {
                labels: categories.map(c => `${getCategoryEmoji(c)} ${c}`),
                datasets: [{
                    data:            categories.map(c => totals[c]),
                    backgroundColor: chartColors,
                    borderWidth:     2,
                    borderColor:     borderCol,
                    hoverOffset:     6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right',
                        labels: {
                            color:    legendColor,
                            font:     { family: "'Inter', sans-serif", size: 10 },
                            boxWidth: 12,
                            padding:  10
                        }
                    }
                },
                cutout: '65%'
            }
        });

        // --- Bar Trend ---
        let labels, dataPoints;
        if (currentFilter === 'week') {
            labels     = generateDateLabels(7);
            dataPoints = aggregateDaily(labels, expenseItems);
        } else if (currentFilter === 'month') {
            const today = new Date();
            const days  = new Date(today.getFullYear(), today.getMonth()+1, 0).getDate();
            labels      = Array.from({ length: days }, (_,i) => new Date(today.getFullYear(), today.getMonth(), i+1));
            dataPoints  = aggregateDaily(labels, expenseItems);
        } else {
            labels     = generateDateLabels(7);
            dataPoints = aggregateDaily(labels, expenseItems);
        }

        const labelStr = labels.map(d => d.toLocaleDateString('en-GB', { day:'numeric', month:'short' }));

        if (trendInstance) trendInstance.destroy();
        trendInstance = new Chart(trendCanvas, {
            type: 'bar',
            data: {
                labels: labelStr,
                datasets: [{
                    label: 'Spent',
                    data:  dataPoints,
                    backgroundColor: isDark
                        ? 'rgba(110,168,254,0.7)'
                        : 'rgba(110,168,254,0.9)',
                    borderRadius:    6,
                    borderSkipped:   false,
                    barThickness:    currentFilter === 'month' ? 5 : 12
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid:  { color: gridColor },
                        ticks: { color: tickColor, font: { size: 10 }, callback: v => '₹' + v }
                    },
                    x: {
                        grid:  { display: false },
                        ticks: { color: tickColor, font: { size: 10 } }
                    }
                }
            }
        });

        renderCategoryProgress(totals);
    }

    function generateDateLabels(count) {
        return [...Array(count)].map((_,i) => {
            const d = new Date();
            d.setDate(d.getDate() - (count - 1 - i));
            return d;
        });
    }

    function aggregateDaily(dateObjs, items) {
        return dateObjs.map(d => {
            const ds = d.toISOString().split('T')[0];
            return items.filter(e => e.date.startsWith(ds)).reduce((s,e) => s + parseFloat(e.amount), 0);
        });
    }

    function renderCategoryProgress(totals) {
        progressContainer.innerHTML = '';
        const totalSpent = Object.values(totals).reduce((a,b) => a+b, 0);

        Object.entries(totals).forEach(([cat, amount]) => {
            if (amount === 0 && !categoryLimits[cat]) return;

            const pct      = totalSpent > 0 ? (amount / totalSpent) * 100 : 0;
            const limit    = categoryLimits[cat] || 0;
            let barColor   = getCategoryColor(cat);
            let limitLabel = '';

            if (limit > 0) {
                const lpct = (amount / limit) * 100;
                limitLabel = ` / ${formatCurrency(limit)}`;
                if (lpct >= 100) { barColor = 'var(--red)'; limitLabel += ' 🚨'; }
                else if (lpct >= 80) barColor = 'var(--yellow)';
            }

            const el = document.createElement('div');
            el.className = 'progress-item';
            el.innerHTML = `
                <div class="progress-label">
                    <span class="cat-name">${getCategoryEmoji(cat)} ${cat}</span>
                    <span class="cat-amount">${Math.round(pct)}% · ${formatCurrency(amount)}${limitLabel}</span>
                </div>
                <div class="progress-track">
                    <div class="progress-fill" style="width:${pct}%; background:${barColor};"></div>
                </div>
            `;
            progressContainer.appendChild(el);
        });

        if (!progressContainer.children.length) {
            progressContainer.innerHTML = `<p style="color:var(--text-muted); font-size:.85rem; text-align:center; padding:1rem 0;">No expense data to display.</p>`;
        }
    }

    /* ======= UPDATE UI (master render) ======= */
    function updateUI() {
        const filtered = getFilteredExpenses();
        renderExpenses(filtered);
        renderStats(filtered);
        renderCharts(filtered);
        renderInsights(filtered);
    }

    /* ======= INIT LISTENERS ======= */
    expenseForm.addEventListener('submit', addExpense);
    optExpense.style.display = 'block';
    optIncome.style.display  = 'none';
});
