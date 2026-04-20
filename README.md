# 💰 SpendWise — Track Smart. Spend Better.

> A beautiful, fully client-side personal finance tracker built with vanilla HTML, CSS, and JavaScript.

---

## ✨ Features

| Feature | Details |
|---|---|
| 💸 **Transaction Logging** | Add income & expense entries with amount, category, note, and date |
| ✏️ **Edit & Delete** | Inline editing of any transaction; delete with a 5-second undo toast |
| 📂 **Category System** | 7 expense categories (Food, Travel, Books, Entertainment, Health, Shopping, Other) and 5 income categories (Salary, Allowance, Bonus, Freelance, Other Income) |
| 📅 **Time Filters** | View transactions for All Time, Today, This Week, or a specific Month with a month navigator |
| 🔍 **Search** | Real-time search across categories and notes |
| 📊 **Charts** | Doughnut chart for expense distribution + line chart for spending trend (via Chart.js) |
| 💡 **Smart Insights** | Auto-rotating tips: top category, savings rate, weekend vs. weekday spend, budget alerts |
| 🎯 **Savings Goal** | Set a named savings goal with a target amount and live progress bar |
| 📈 **Monthly Budget** | Set a monthly budget cap with a colour-coded progress bar (green → yellow → red) |
| 📉 **Category Limits** | Per-category monthly spending limits with individual progress bars |
| 🔄 **Recurring Transactions** | Mark any transaction as weekly or monthly — auto-posted on next app load |
| 🏆 **Streak Tracker** | Counts consecutive days with at least one logged transaction |
| 📄 **CSV Export** | One-click export of all transactions as a dated CSV file |
| 🌙 **Dark / Light Theme** | Toggle between a dark (default) and minimal light theme; preference persisted |
| 💾 **Offline & Persistent** | All data stored in `localStorage` — no backend, no sign-up required |

---

## 🗂️ Project Structure

```
SpendWise/
├── index.html   # App shell & all UI markup
├── style.css    # Design system, layout, animations, theme variables
└── script.js    # All application logic (~1 050 lines, vanilla JS)
```

No build step. No dependencies to install. Just open `index.html`.

---

## 🚀 Getting Started

### Run locally

```bash
# Clone or download the repo
git clone <your-repo-url>
cd SpendWise

# Open directly in a browser (no server needed)
open index.html          # macOS
start index.html         # Windows
xdg-open index.html      # Linux
```

Or serve with any static server for a more realistic environment:

```bash
npx serve .
# → http://localhost:3000
```

---

## 🖥️ Usage Guide

### Adding a Transaction
1. Choose **Expense** or **Income** using the toggle at the top of the sidebar.
2. Fill in **Amount**, **Category**, an optional **Note**, and a **Date**.
3. Optionally mark it as a **Weekly** or **Monthly** recurring entry.
4. Click **Add Transaction** (or **Add Income**).

### Editing / Deleting
- Click ✏️ next to any transaction to load it into the form for editing.
- Click ✕ to delete — an **Undo** toast appears for 5 seconds.

### Budgets & Limits
- Enter a value in **Monthly Budget** to enable the global budget progress bar.
- Click ⚙️ **Limits** inside the *Spending Breakdown* card to set per-category caps.

### Savings Goal
- Click ⚙️ **Edit** in the *Savings Goal* card, enter a name and target amount, then save.
- Progress is calculated automatically from your net balance (total income − total expenses).

### Exporting Data
- Click **📄 Export CSV** in the Transaction History section to download a dated `.csv` file.

---

## 🛠️ Tech Stack

| Technology | Role |
|---|---|
| **HTML5** | Semantic app structure |
| **CSS3** (Vanilla) | Custom design system, CSS variables, glassmorphism, animations |
| **JavaScript (ES6+)** | All app logic — no frameworks |
| **Chart.js 4.4.3** | Doughnut & line charts (CDN) |
| **Google Fonts** | Inter & Space Grotesk typography |
| **localStorage** | Client-side data persistence |

---

## 📦 Data Model

Each transaction object stored in `localStorage`:

```json
{
  "id": "1713600000000abc",
  "amount": 450,
  "category": "Food",
  "note": "Lunch with team",
  "type": "expense",
  "date": "2026-04-20T00:00:00.000Z"
}
```

`localStorage` keys used by the app:

| Key | Contents |
|---|---|
| `spendwise_expenses` | Array of transaction objects |
| `spendwise_budget` | Monthly budget number |
| `spendwise_cat_limits` | Object mapping category → limit |
| `spendwise_recurring` | Array of recurring rule objects |
| `spendwise_savings_goal` | `{ name, target }` object |
| `spendwise_theme` | `"dark"` or `"minimal"` |

---

## 🎨 Theming

SpendWise ships with two themes toggled via the 🌙 button in the header:

- **Dark** (default) — deep navy background, vivid accent colours, glassmorphism cards.
- **Minimal** (light) — soft white/grey palette for daytime use.

The selected theme persists across sessions via `localStorage`.

---

## 📋 Expense Categories

**Expenses:** 🍔 Food · 🚌 Travel · 📚 Books · 🎮 Entertainment · 🏥 Health · 🛍️ Shopping · 🧾 Other

**Income:** 💼 Salary · 🏠 Allowance · 🎁 Bonus · 💻 Freelance · 💵 Other Income

---

## 🔮 Potential Enhancements

- [ ] Multi-currency support
- [ ] Cloud sync / account system
- [ ] PDF report generation
- [ ] Budget roll-over between months
- [ ] Push notifications for recurring reminders
- [ ] PWA / installable offline app

---

## 📄 License

This project is open source. Feel free to fork, adapt, and use it as you see fit.

---

*Made with ❤️ — because every rupee counts.*
