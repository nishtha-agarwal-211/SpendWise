document.addEventListener('DOMContentLoaded', () => {
    // --- Selectors ---
    const expenseForm       = document.getElementById('expense-form');
    const amountInput       = document.getElementById('amount');
    const categoryInput     = document.getElementById('category');
    const noteInput         = document.getElementById('note');
    const txnDateInput      = document.getElementById('txn-date');
    const recurringSelect   = document.getElementById('recurring-select');
    const recurringGroup    = document.getElementById('recurring-group');
    const typeInputs        = document.getElementsByName('type');
    const submitBtn         = document.getElementById('submit-btn');
    const editIdInput       = document.getElementById('edit-id');
    const editBanner        = document.getElementById('edit-banner');
    const cancelEditBtn     = document.getElementById('cancel-edit-btn');
    const formCardTitle     = document.getElementById('form-card-title');

    // Category option lists (used by populateCategoryOptions)
    const EXPENSE_CATEGORIES = [
        { value: 'Food',          label: '🍔 Food' },
        { value: 'Travel',        label: '🚌 Travel' },
        { value: 'Books',         label: '📚 Books' },
        { value: 'Entertainment', label: '🎮 Entertainment' },
        { value: 'Health',        label: '🏥 Health' },
        { value: 'Shopping',      label: '🛍️ Shopping' },
        { value: 'Other',         label: '🧾 Other' },
    ];
    const INCOME_CATEGORIES = [
        { value: 'Salary',        label: '💼 Salary' },
        { value: 'Allowance',     label: '🏠 Allowance' },
        { value: 'Bonus',         label: '🎁 Bonus' },
        { value: 'Freelance',     label: '💻 Freelance' },
        { value: 'Other Income',  label: '💵 Other Income' },
    ];

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
    const insightsDots      = document.getElementById('insights-dots');
    const exportBtn         = document.getElementById('export-btn');
    const toast             = document.getElementById('toast');
    const undoBtn           = document.getElementById('undo-btn');
    const searchInput       = document.getElementById('search-input');

    const toggleCatLimitsBtn        = document.getElementById('toggle-cat-limits');
    const catLimitsForm             = document.getElementById('cat-limits-form');
    const catLimitsInputsContainer  = document.getElementById('cat-limits-inputs');
    const saveCatLimitsBtn          = document.getElementById('save-cat-limits');

    // Month nav
    const monthNav          = document.getElementById('month-nav');
    const monthPrevBtn      = document.getElementById('month-prev');
    const monthNextBtn      = document.getElementById('month-next');
    const monthNavLabel     = document.getElementById('month-nav-label');

    // Savings goal
    const toggleSavingsForm   = document.getElementById('toggle-savings-form');
    const savingsFormPanel    = document.getElementById('savings-form-panel');
    const savingsGoalName     = document.getElementById('savings-goal-name');
    const savingsGoalTarget   = document.getElementById('savings-goal-target');
    const saveSavingsGoal     = document.getElementById('save-savings-goal');
    const savingsProgressArea = document.getElementById('savings-progress-area');
    const savingsEmpty        = document.getElementById('savings-empty');

    // --- Category Metadata (must be defined before any init call that uses it) ---
    const CATEGORY_META = {
        'Food':          { emoji: '🍔', color: '#f97066', bg: 'rgba(249,112,102,0.15)' },
        'Travel':        { emoji: '🚌', color: '#34d399', bg: 'rgba(52,211,153,0.15)'  },
        'Books':         { emoji: '📚', color: '#fbbf24', bg: 'rgba(251,191,36,0.15)'  },
        'Entertainment': { emoji: '🎮', color: '#a78bfa', bg: 'rgba(167,139,250,0.15)' },
        'Health':        { emoji: '🏥', color: '#38bdf8', bg: 'rgba(56,189,248,0.15)'  },
        'Shopping':      { emoji: '🛍️', color: '#fb923c', bg: 'rgba(251,146,60,0.15)'  },
        'Other':         { emoji: '🧾', color: '#6ea8fe', bg: 'rgba(110,168,254,0.15)' },
        'Salary':        { emoji: '💼', color: '#22d3a5', bg: 'rgba(34,211,165,0.15)'  },
        'Allowance':     { emoji: '🏠', color: '#34d399', bg: 'rgba(52,211,153,0.15)'  },
        'Bonus':         { emoji: '🎁', color: '#fbbf24', bg: 'rgba(251,191,36,0.15)'  },
        'Freelance':     { emoji: '💻', color: '#a78bfa', bg: 'rgba(167,139,250,0.15)' },
        'Other Income':  { emoji: '💵', color: '#22d3a5', bg: 'rgba(34,211,165,0.15)'  },
    };

    // --- State ---
    let expenses        = JSON.parse(localStorage.getItem('spendwise_expenses'))  || [];
    let monthlyBudget   = parseFloat(localStorage.getItem('spendwise_budget'))    || 0;
    let categoryLimits  = JSON.parse(localStorage.getItem('spendwise_cat_limits'))|| {};
    let recurringRules  = JSON.parse(localStorage.getItem('spendwise_recurring')) || [];
    let savingsGoal     = JSON.parse(localStorage.getItem('spendwise_savings_goal')) || null;
    let currentFilter   = 'all';
    let theme           = localStorage.getItem('spendwise_theme') || 'dark';
    let lastDeleted     = null;
    let chartInstance   = null;
    let trendInstance   = null;
    let toastTimer      = null;
    let searchQuery     = '';
    let insightIndex    = 0;
    let insightData     = [];

    // Month navigator state (0-indexed month)
    const nowRef = new Date();
    let navMonth = nowRef.getMonth();
    let navYear  = nowRef.getFullYear();

    // --- Init ---
    try {
        initTheme();
        setDefaultDate();
        populateCategoryOptions('expense'); // seed the select on load
        if (monthlyBudget > 0 && budgetInput) budgetInput.value = monthlyBudget;
        checkRecurring();
        renderStreak();
        renderSavingsGoal();
        updateUI();
    } catch(initErr) {
        console.error('SpendWise init error:', initErr);
    }

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

    function setDefaultDate() {
        const today = new Date().toISOString().split('T')[0];
        txnDateInput.value = today;
        txnDateInput.max   = today;
    }

    function getCategoryEmoji(cat) {
        return (CATEGORY_META[cat] || {}).emoji || '💸';
    }

    function getCategoryColor(cat) {
        return (CATEGORY_META[cat] || {}).color || '#6ea8fe';
    }

    function getCategoryBg(cat) {
        return (CATEGORY_META[cat] || {}).bg || 'rgba(110,168,254,0.15)';
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
            // reset nav to current month when switching to month view
            if (currentFilter === 'month') {
                const n = new Date();
                navMonth = n.getMonth();
                navYear  = n.getFullYear();
                updateMonthNavLabel();
                monthNav.style.display = 'flex';
            } else {
                monthNav.style.display = 'none';
            }
            updateUI();
        });
    });

    /* ======= MONTH NAVIGATOR ======= */
    function updateMonthNavLabel() {
        const d = new Date(navYear, navMonth, 1);
        monthNavLabel.textContent = d.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });

        // Disable next if we're already at or past current month
        const now = new Date();
        const isCurrent = navYear === now.getFullYear() && navMonth === now.getMonth();
        monthNextBtn.disabled = isCurrent;
        monthNextBtn.style.opacity = isCurrent ? '0.35' : '1';
    }

    monthPrevBtn.addEventListener('click', () => {
        navMonth--;
        if (navMonth < 0) { navMonth = 11; navYear--; }
        updateMonthNavLabel();
        updateUI();
    });

    monthNextBtn.addEventListener('click', () => {
        const now = new Date();
        if (navYear === now.getFullYear() && navMonth === now.getMonth()) return;
        navMonth++;
        if (navMonth > 11) { navMonth = 0; navYear++; }
        updateMonthNavLabel();
        updateUI();
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
                return expDate.getMonth() === navMonth &&
                       expDate.getFullYear() === navYear;
            }
            return true;
        });
    }

    /* ======= SEARCH ======= */
    searchInput.addEventListener('input', e => {
        searchQuery = e.target.value.trim().toLowerCase();
        updateUI();
    });

    function applySearch(list) {
        if (!searchQuery) return list;
        return list.filter(t =>
            t.category.toLowerCase().includes(searchQuery) ||
            (t.note && t.note.toLowerCase().includes(searchQuery))
        );
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

    /* ======= SAVINGS GOAL ======= */
    toggleSavingsForm.addEventListener('click', () => {
        const open = savingsFormPanel.style.display === 'block';
        savingsFormPanel.style.display = open ? 'none' : 'block';
        if (!open && savingsGoal) {
            savingsGoalName.value   = savingsGoal.name || '';
            savingsGoalTarget.value = savingsGoal.target || '';
        }
    });

    saveSavingsGoal.addEventListener('click', () => {
        const name   = savingsGoalName.value.trim();
        const target = parseFloat(savingsGoalTarget.value);
        if (!name || isNaN(target) || target <= 0) {
            showNotice('Please enter a valid goal name and amount.');
            return;
        }
        savingsGoal = { name, target };
        localStorage.setItem('spendwise_savings_goal', JSON.stringify(savingsGoal));
        savingsFormPanel.style.display = 'none';
        renderSavingsGoal();
        updateUI();
        showNotice(`Goal "${name}" saved! 🎯`);
    });

    function renderSavingsGoal() {
        // Clear out dynamic content but keep the empty message node
        // Remove all children except savingsEmpty
        Array.from(savingsProgressArea.children).forEach(child => {
            if (child.id !== 'savings-empty') child.remove();
        });

        if (!savingsGoal || !savingsGoal.target) {
            savingsEmpty.style.display = 'block';
            return;
        }
        savingsEmpty.style.display = 'none';

        // Compute total balance
        const totalIncome  = expenses.filter(e => e.type === 'income').reduce((s,e) => s + parseFloat(e.amount), 0);
        const totalExpense = expenses.filter(e => e.type !== 'income').reduce((s,e) => s + parseFloat(e.amount), 0);
        const balance      = Math.max(0, totalIncome - totalExpense);
        const pct          = Math.min((balance / savingsGoal.target) * 100, 100);
        const remaining    = Math.max(0, savingsGoal.target - balance);

        const el = document.createElement('div');
        el.className = 'savings-progress';
        el.innerHTML = `
            <div class="savings-goal-info">
                <span class="savings-goal-name">${savingsGoal.name}</span>
                <span class="savings-goal-vals">${formatCurrency(balance)} <span class="savings-divider">/</span> ${formatCurrency(savingsGoal.target)}</span>
            </div>
            <div class="progress-track savings-track">
                <div class="progress-fill savings-fill" style="width:${pct}%;"></div>
            </div>
            <div class="savings-meta">
                <span class="savings-pct">${Math.round(pct)}% saved</span>
                ${remaining > 0
                    ? `<span class="savings-remaining">₹${remaining.toLocaleString('en-IN')} to go</span>`
                    : `<span class="savings-achieved">🎉 Goal achieved!</span>`}
            </div>
            ${pct >= 100 ? '<div class="savings-confetti">🎊 Congratulations — you hit your goal!</div>' : ''}
        `;
        savingsProgressArea.appendChild(el);
    }

    /* ======= CATEGORY LIMITS ======= */
    toggleCatLimitsBtn.addEventListener('click', () => {
        const open = catLimitsForm.style.display === 'block';
        catLimitsForm.style.display = open ? 'none' : 'block';
        if (!open) renderCatLimitsInputs();
    });

    function renderCatLimitsInputs() {
        catLimitsInputsContainer.innerHTML = '';
        ['Food','Travel','Books','Entertainment','Health','Shopping','Other'].forEach(cat => {
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
    function buildInsights(list) {
        if (list.length === 0) return [];

        const tips = [];
        const expenseItems = list.filter(e => e.type !== 'income');
        const incomeItems  = list.filter(e => e.type === 'income');

        // Totals per category
        const totals = {};
        expenseItems.forEach(e => { totals[e.category] = (totals[e.category] || 0) + parseFloat(e.amount); });
        const entries    = Object.entries(totals);
        if (!entries.length) return [];

        const [topCat, topVal] = entries.reduce((a, b) => b[1] > a[1] ? b : a);
        const totalSpent = entries.reduce((s, [,v]) => s + v, 0);
        const totalEarned= incomeItems.reduce((s,e) => s + parseFloat(e.amount), 0);
        const topPct     = totalSpent > 0 ? Math.round((topVal / totalSpent) * 100) : 0;

        tips.push(`🏆 Most spending on <strong>${topCat}</strong> — ${formatCurrency(topVal)} (${topPct}% of total).`);
        tips.push(`📋 You've logged <strong>${list.length}</strong> transaction${list.length > 1 ? 's' : ''} in this period.`);

        if (entries.length > 1) {
            tips.push(`📂 <strong>${entries.length} categories</strong> tracked. Diversified budgeting!`);
        }

        // Weekend vs weekday
        const weekendSpend  = expenseItems.filter(e => { const d = new Date(e.date); return d.getDay() === 0 || d.getDay() === 6; }).reduce((s,e) => s + parseFloat(e.amount), 0);
        const weekdaySpend  = totalSpent - weekendSpend;
        if (weekendSpend > 0 && weekdaySpend > 0) {
            if (weekendSpend > weekdaySpend) {
                tips.push(`🎉 You spend <strong>more on weekends</strong> (${formatCurrency(weekendSpend)} vs ${formatCurrency(weekdaySpend)} on weekdays).`);
            } else {
                tips.push(`💼 You spend <strong>more on weekdays</strong> (${formatCurrency(weekdaySpend)} vs ${formatCurrency(weekendSpend)} on weekends).`);
            }
        }

        // Savings rate
        if (totalEarned > 0) {
            const savRate = Math.round(((totalEarned - totalSpent) / totalEarned) * 100);
            if (savRate >= 0) {
                tips.push(`💰 Savings rate this period: <strong>${savRate}%</strong>${savRate >= 30 ? ' — great job!' : savRate >= 10 ? ' — keep it up!' : ' — try to save a bit more.'}`);
            } else {
                tips.push(`⚠️ You've spent <strong>${formatCurrency(totalSpent - totalEarned)}</strong> more than you earned this period.`);
            }
        }

        // Budget tip
        if (monthlyBudget > 0) {
            const now = new Date();
            const monthTotal = expenses
                .filter(e => { const d = new Date(e.date); return e.type !== 'income' && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear(); })
                .reduce((sum, e) => sum + parseFloat(e.amount), 0);
            const pct = (monthTotal / monthlyBudget) * 100;
            if (pct >= 100) {
                tips.push(`🚨 You're <strong>over budget</strong> this month by ${formatCurrency(monthTotal - monthlyBudget)}!`);
            } else if (pct >= 80) {
                tips.push(`⚠️ <strong>${Math.round(pct)}%</strong> of monthly budget used — only ${formatCurrency(monthlyBudget - monthTotal)} left.`);
            } else {
                tips.push(`✅ <strong>Under budget</strong> — ${formatCurrency(monthlyBudget - monthTotal)} remaining this month.`);
            }
        }

        return tips;
    }

    function renderInsights(list) {
        insightData = buildInsights(list);
        if (!insightData.length) { insightsCard.style.display = 'none'; return; }
        insightsCard.style.display = 'block';
        insightIndex = Math.min(insightIndex, insightData.length - 1);
        renderInsightSlide();
        renderInsightDots();
    }

    function renderInsightSlide() {
        insightText.innerHTML = insightData[insightIndex];
        insightText.style.animation = 'none';
        requestAnimationFrame(() => { insightText.style.animation = 'fadeSlide 0.35s ease'; });
    }

    function renderInsightDots() {
        insightsDots.innerHTML = '';
        insightData.forEach((_, i) => {
            const dot = document.createElement('span');
            dot.className = 'insight-dot' + (i === insightIndex ? ' active' : '');
            dot.addEventListener('click', () => { insightIndex = i; renderInsightSlide(); renderInsightDots(); });
            insightsDots.appendChild(dot);
        });
    }

    // Auto-cycle insights every 6 s
    setInterval(() => {
        if (!insightData.length) return;
        insightIndex = (insightIndex + 1) % insightData.length;
        renderInsightSlide();
        renderInsightDots();
    }, 6000);

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
            expenses.splice(lastDeleted.index, 0, lastDeleted.item);
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

    /* ======= POPULATE CATEGORY OPTIONS ======= */
    function populateCategoryOptions(type, selectedValue) {
        const cats = (type === 'income') ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
        categoryInput.innerHTML = '';
        cats.forEach(cat => {
            const opt = document.createElement('option');
            opt.value = cat.value;
            opt.textContent = cat.label;
            if (selectedValue && cat.value === selectedValue) opt.selected = true;
            categoryInput.appendChild(opt);
        });
        // If no explicit selectedValue, default to first
        if (!selectedValue) categoryInput.selectedIndex = 0;
    }

    /* ======= TYPE TOGGLE BEHAVIOR ======= */
    typeInputs.forEach(input => {
        input.addEventListener('change', e => {
            if (e.target.value === 'income') {
                populateCategoryOptions('income');
                submitBtn.textContent = editIdInput.value ? 'Save Changes' : 'Add Income';
                submitBtn.classList.remove('expense-mode');
            } else {
                populateCategoryOptions('expense');
                submitBtn.textContent = editIdInput.value ? 'Save Changes' : 'Add Transaction';
                submitBtn.classList.add('expense-mode');
            }
        });
    });

    /* ======= EDIT CANCEL ======= */
    cancelEditBtn.addEventListener('click', resetFormToAddMode);

    function resetFormToAddMode() {
        editIdInput.value = '';
        expenseForm.reset();
        setDefaultDate();
        document.getElementById('type-expense').checked = true;
        populateCategoryOptions('expense');
        submitBtn.textContent    = 'Add Transaction';
        submitBtn.classList.add('expense-mode');
        editBanner.style.display = 'none';
        formCardTitle.textContent = 'New Transaction';
        recurringGroup.style.display = '';
    }

    function editExpense(id) {
        const item = expenses.find(e => e.id === id);
        if (!item) return;

        editIdInput.value = id;
        amountInput.value = item.amount;
        noteInput.value   = item.note || '';
        txnDateInput.value = item.date.split('T')[0];

        const type = item.type || 'expense';
        document.querySelector(`input[name="type"][value="${type}"]`).checked = true;

        if (type === 'income') {
            populateCategoryOptions('income', item.category);
            submitBtn.classList.remove('expense-mode');
        } else {
            populateCategoryOptions('expense', item.category);
            submitBtn.classList.add('expense-mode');
        }
        submitBtn.textContent = 'Save Changes';
        editBanner.style.display = 'flex';
        formCardTitle.textContent = 'Edit Transaction';
        recurringGroup.style.display = 'none'; // hide recurring in edit mode

        // Scroll sidebar into view on mobile
        document.querySelector('.sidebar').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    /* ======= RENDER STATS ======= */
    function renderStats(visible) {
        let totalIncome = 0, totalExpense = 0;
        visible.forEach(item => {
            const amt = parseFloat(item.amount);
            if (item.type === 'income') totalIncome += amt;
            else totalExpense += amt;
        });

        balanceDisplay.textContent = formatCurrency(totalIncome - totalExpense);
        incomeDisplay.textContent  = formatCurrency(totalIncome);
        expenseDisplay.textContent = formatCurrency(totalExpense);

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

    /* ======= RENDER EXPENSES LIST ======= */
    function renderExpenses(visible) {
        const searched = applySearch(visible);
        expenseListContainer.innerHTML = '';

        if (!searched.length) {
            expenseListContainer.innerHTML = `
                <p class="empty-state">
                    <span class="empty-icon">${searchQuery ? '🔍' : '🚀'}</span>
                    ${searchQuery ? `No results for "<strong>${searchQuery}</strong>"` : 'No transactions for this period yet.'}
                </p>`;
            return;
        }

        const sorted = [...searched].sort((a, b) => new Date(b.date) - new Date(a.date));

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
            dateLabel.className = 'date-group-label';
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

                const emoji    = getCategoryEmoji(appExpense.category);
                const iconBg   = type === 'income' ? getCategoryBg(appExpense.category) : getCategoryBg(appExpense.category);
                const sign     = type === 'income' ? '+' : '−';

                item.innerHTML = `
                    <div class="txn-icon" style="background:${iconBg};">${emoji}</div>
                    <div class="expense-info">
                        <span class="expense-category">${appExpense.category}</span>
                        <span class="expense-date-note">${appExpense.note ? appExpense.note : '&mdash;'}</span>
                    </div>
                    <div class="expense-actions">
                        <span class="expense-amount">${sign}${formatCurrency(appExpense.amount)}</span>
                        <button class="edit-btn" data-id="${appExpense.id}" title="Edit">✏️</button>
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

        expenseListContainer.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', e => {
                const id = e.target.closest('button').dataset.id;
                editExpense(id);
            });
        });
    }

    /* ======= ADD / SAVE EXPENSE ======= */
    function addExpense(e) {
        e.preventDefault();

        const amount    = parseFloat(amountInput.value);
        const category  = categoryInput.value;
        const note      = noteInput.value.trim();
        const type      = document.querySelector('input[name="type"]:checked').value;
        const recurring = recurringSelect.value;
        const dateVal   = txnDateInput.value; // YYYY-MM-DD

        if (!amount || amount <= 0) { showNotice('Enter a valid amount 👆'); return; }
        if (!dateVal) { showNotice('Pick a date 📅'); return; }

        // Button animation
        submitBtn.style.transform = 'scale(0.96)';
        setTimeout(() => submitBtn.style.transform = '', 200);

        // ---- EDIT MODE ----
        if (editIdInput.value) {
            const idx = expenses.findIndex(ex => ex.id === editIdInput.value);
            if (idx !== -1) {
                expenses[idx] = {
                    ...expenses[idx],
                    amount, category, note, type,
                    date: new Date(dateVal + 'T12:00:00').toISOString()
                };
                saveExpenses();
                showNotice('Transaction updated ✏️');
                resetFormToAddMode();
                renderStreak();
                renderSavingsGoal();
                updateUI();
            }
            return;
        }

        // ---- ADD MODE ----
        const newExpense = {
            id:       Date.now().toString(),
            amount, category, note, type,
            date: new Date(dateVal + 'T12:00:00').toISOString()
        };

        if (recurring !== 'none') {
            const nextRun = new Date(dateVal);
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
        renderSavingsGoal();
        updateUI();

        expenseForm.reset();
        setDefaultDate();
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
        renderSavingsGoal();
        updateUI();
        showToast('Transaction deleted.');
    }

    /* ======= CHARTS ======= */
    function renderCharts(visible) {
        if (typeof Chart === 'undefined') return; // Chart.js not loaded
        const expenseItems = visible.filter(e => e.type !== 'income');
        const categories   = ['Food','Travel','Books','Entertainment','Health','Shopping','Other'];
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
        try { if (chartInstance) chartInstance.destroy(); } catch(e) { chartInstance = null; }
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
            const days  = new Date(navYear, navMonth + 1, 0).getDate();
            labels      = Array.from({ length: days }, (_,i) => new Date(navYear, navMonth, i+1));
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
