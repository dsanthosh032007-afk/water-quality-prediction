/**
 * AquaGuard AI - Core Application Controller
 * Handles SPA navigation, form validation, prediction API calls, preset loading,
 * history management, CSV export, and dark mode toggling.
 */

document.addEventListener('DOMContentLoaded', () => {
    // 1. Theme Management (Dark Mode)
    initThemeManager();

    // 2. Navigation / Tab Controller
    initTabNavigation();

    // 3. Water Predictor Form & Preset Loader
    initPredictorModule();

    // 4. Prediction History & CSV Export
    initHistoryModule();

    // 5. Contact Form Handler
    initContactModule();
});

/* ================= THEME MANAGER ================= */
function initThemeManager() {
    const themeBtn = document.getElementById('theme-toggle');
    if (!themeBtn) return;

    const currentTheme = localStorage.getItem('aquaguard_theme') || 'light';
    document.documentElement.setAttribute('data-theme', currentTheme);
    updateThemeIcon(themeBtn, currentTheme);

    themeBtn.addEventListener('click', () => {
        const activeTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = activeTheme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('aquaguard_theme', newTheme);
        updateThemeIcon(themeBtn, newTheme);
    });
}

function updateThemeIcon(btn, theme) {
    btn.innerHTML = theme === 'dark' 
        ? '<i class="fa-solid fa-sun" style="color: #f59e0b;"></i>' 
        : '<i class="fa-solid fa-moon"></i>';
}

/* ================= TAB NAVIGATION ================= */
function initTabNavigation() {
    const navButtons = document.querySelectorAll('.nav-btn');
    const sections = document.querySelectorAll('.page-section');

    function switchTab(targetId) {
        sections.forEach(sec => {
            if (sec.id === targetId) {
                sec.classList.add('active');
            } else {
                sec.classList.remove('active');
            }
        });

        navButtons.forEach(btn => {
            if (btn.getAttribute('data-target') === targetId) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });

        // Trigger dashboard charts render if Dashboard page opened
        if (targetId === 'dashboard-page' && window.dashboardManager) {
            window.dashboardManager.init();
        }

        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    navButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = btn.getAttribute('data-target');
            if (targetId) switchTab(targetId);
        });
    });

    const brandNav = document.getElementById('nav-brand');
    if (brandNav) {
        brandNav.addEventListener('click', () => switchTab('home-page'));
    }
}

/* ================= PREDICTOR MODULE ================= */
let currentActivePrediction = null;

function initPredictorModule() {
    const form = document.getElementById('water-predict-form');
    const resetBtn = document.getElementById('reset-form-btn');
    const errorAlert = document.getElementById('form-error-alert');
    const errorText = document.getElementById('form-error-text');

    // Preset click listeners
    const presetButtons = document.querySelectorAll('.preset-btn');
    presetButtons.forEach(btn => {
        btn.addEventListener('click', async () => {
            const presetId = btn.getAttribute('data-preset');
            await loadPresetData(presetId);
        });
    });

    // Form submit listener
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            errorAlert.classList.add('hidden');

            const formData = new FormData(form);
            const payload = {};
            let hasError = false;

            formData.forEach((val, key) => {
                if (val === "" || val === null) {
                    hasError = true;
                } else {
                    payload[key] = parseFloat(val);
                }
            });

            if (hasError) {
                showError("Please complete all 9 parameter fields with valid numeric values.");
                return;
            }

            // Input Range Checks
            if (payload.ph < 0 || payload.ph > 14) {
                showError("pH level must be between 0.0 and 14.0.");
                return;
            }

            // Call Backend API
            const submitBtn = document.getElementById('predict-submit-btn');
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Analyzing Water Sample...';

            try {
                const response = await fetch('/api/predict', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                const data = await response.json();

                if (!response.ok || !data.success) {
                    showError(data.details ? data.details.join(', ') : (data.error || "Prediction failed."));
                    return;
                }

                currentActivePrediction = {
                    timestamp: new Date().toLocaleString(),
                    inputs: payload,
                    result: data
                };

                displayPredictionResults(data);

            } catch (err) {
                showError("Unable to connect to ML prediction backend server.");
                console.error(err);
            } finally {
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<i class="fa-solid fa-circle-play"></i> Predict Water Safety';
            }
        });
    }

    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            form.reset();
            errorAlert.classList.add('hidden');
            document.getElementById('results-placeholder').classList.remove('hidden');
            document.getElementById('results-content').classList.add('hidden');
        });
    }

    const logHistoryBtn = document.getElementById('add-to-history-btn');
    if (logHistoryBtn) {
        logHistoryBtn.addEventListener('click', () => {
            if (currentActivePrediction) {
                savePredictionToHistory(currentActivePrediction);
                alert("Sample logged to Prediction History!");
            }
        });
    }
}

async function loadPresetData(presetId) {
    try {
        const res = await fetch('/api/presets');
        if (!res.ok) return;
        const presets = await res.json();
        const targetPreset = presets.find(p => p.id === presetId);

        if (targetPreset && targetPreset.values) {
            Object.keys(targetPreset.values).forEach(key => {
                const inputEl = document.querySelector(`[name="${key}"]`);
                if (inputEl) {
                    inputEl.value = targetPreset.values[key];
                    inputEl.classList.add('preset-highlight');
                    setTimeout(() => inputEl.classList.remove('preset-highlight'), 1000);
                }
            });

            // Automatically run form submit
            document.getElementById('water-predict-form').dispatchEvent(new Event('submit'));
        }
    } catch (err) {
        console.error("Failed to load preset data:", err);
    }
}

function showError(msg) {
    const errorAlert = document.getElementById('form-error-alert');
    const errorText = document.getElementById('form-error-text');
    errorText.textContent = msg;
    errorAlert.classList.remove('hidden');
}

function displayPredictionResults(data) {
    const placeholder = document.getElementById('results-placeholder');
    const content = document.getElementById('results-content');
    
    placeholder.classList.add('hidden');
    content.classList.remove('hidden');

    const badgeBox = document.getElementById('result-badge-box');
    const statusIcon = document.getElementById('result-status-icon');
    const labelTitle = document.getElementById('result-label');

    if (data.is_safe) {
        badgeBox.className = "result-badge-container green";
        statusIcon.innerHTML = '<i class="fa-solid fa-circle-check"></i>';
        labelTitle.textContent = "SAFE FOR DRINKING";
    } else {
        badgeBox.className = "result-badge-container red";
        statusIcon.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i>';
        labelTitle.textContent = "UNSAFE FOR DRINKING";
    }

    // Confidence & Probabilities
    document.getElementById('result-confidence-val').textContent = `${data.confidence}%`;
    document.getElementById('confidence-bar-fill').style.width = `${data.confidence}%`;
    document.getElementById('safe-prob-val').textContent = `${data.safe_probability}%`;
    document.getElementById('unsafe-prob-val').textContent = `${data.unsafe_probability}%`;

    // Recommendation
    document.getElementById('result-recommendation-text').textContent = data.recommendation;

    // Compliance Summary Table
    const tbody = document.getElementById('compliance-table-body');
    tbody.innerHTML = '';

    data.parameter_summary.forEach(item => {
        const tr = document.createElement('tr');

        let statusClass = "optimal";
        if (item.status.includes("Above")) statusClass = "above";
        if (item.status.includes("Below")) statusClass = "below";

        tr.innerHTML = `
            <td><strong>${item.name}</strong></td>
            <td>${item.value} ${item.unit}</td>
            <td>${item.recommended_range}</td>
            <td><span class="status-tag ${statusClass}">${item.status}</span></td>
        `;
        tbody.appendChild(tr);
    });

    // Smooth scroll into results view on mobile
    if (window.innerWidth < 992) {
        content.scrollIntoView({ behavior: 'smooth' });
    }
}

/* ================= HISTORY MODULE ================= */
function initHistoryModule() {
    renderHistoryTable();

    const searchInput = document.getElementById('history-search-input');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase();
            renderHistoryTable(query);
        });
    }

    const clearBtn = document.getElementById('clear-history-btn');
    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            if (confirm("Are you sure you want to clear all prediction history logs?")) {
                localStorage.removeItem('aquaguard_history');
                renderHistoryTable();
            }
        });
    }

    const exportBtn = document.getElementById('export-csv-btn');
    if (exportBtn) {
        exportBtn.addEventListener('click', exportHistoryToCSV);
    }
}

function getHistoryItems() {
    const raw = localStorage.getItem('aquaguard_history');
    return raw ? JSON.parse(raw) : [];
}

function savePredictionToHistory(item) {
    const history = getHistoryItems();
    history.unshift(item); // prepend latest
    localStorage.setItem('aquaguard_history', JSON.stringify(history));
    renderHistoryTable();
}

function renderHistoryTable(filterQuery = "") {
    const history = getHistoryItems();
    const tbody = document.getElementById('history-table-body');
    const emptyState = document.getElementById('history-empty');
    const tableEl = document.getElementById('history-table');
    const countBadge = document.getElementById('history-count-badge');

    countBadge.textContent = history.length;

    if (!history || history.length === 0) {
        tableEl.classList.add('hidden');
        emptyState.classList.remove('hidden');
        return;
    }

    tableEl.classList.remove('hidden');
    emptyState.classList.add('hidden');
    tbody.innerHTML = '';

    const filtered = history.filter(row => {
        if (!filterQuery) return true;
        const text = `${row.timestamp} ${row.result.label} ${row.inputs.ph}`.toLowerCase();
        return text.includes(filterQuery);
    });

    filtered.forEach((entry, idx) => {
        const tr = document.createElement('tr');
        const inputs = entry.inputs;
        const result = entry.result;

        const badgeClass = result.is_safe ? 'optimal' : 'above';

        tr.innerHTML = `
            <td>${idx + 1}</td>
            <td><small>${entry.timestamp}</small></td>
            <td><span class="status-tag ${badgeClass}">${result.label}</span></td>
            <td><strong>${result.confidence}%</strong></td>
            <td>${inputs.ph}</td>
            <td>${inputs.Hardness}</td>
            <td>${inputs.Solids}</td>
            <td>${inputs.Chloramines}</td>
            <td>${inputs.Sulfate}</td>
            <td>${inputs.Turbidity}</td>
            <td>
                <button class="btn btn-ghost danger btn-sm" onclick="deleteHistoryRow(${idx})" title="Delete record">
                    <i class="fa-solid fa-xmark"></i>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function deleteHistoryRow(index) {
    const history = getHistoryItems();
    history.splice(index, 1);
    localStorage.setItem('aquaguard_history', JSON.stringify(history));
    renderHistoryTable();
}

function exportHistoryToCSV() {
    const history = getHistoryItems();
    if (!history || history.length === 0) {
        alert("No prediction history available to export.");
        return;
    }

    const headers = [
        "Timestamp", "Classification", "Confidence_Pct", "Safe_Prob", "Unsafe_Prob",
        "pH", "Hardness", "Solids_TDS", "Chloramines", "Sulfate",
        "Conductivity", "Organic_Carbon", "Trihalomethanes", "Turbidity"
    ];

    const rows = history.map(item => {
        const inp = item.inputs;
        const res = item.result;
        return [
            `"${item.timestamp}"`,
            `"${res.label}"`,
            res.confidence,
            res.safe_probability,
            res.unsafe_probability,
            inp.ph,
            inp.Hardness,
            inp.Solids,
            inp.Chloramines,
            inp.Sulfate,
            inp.Conductivity,
            inp.Organic_carbon,
            inp.Trihalomethanes,
            inp.Turbidity
        ].join(",");
    });

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `water_quality_predictions_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

/* ================= CONTACT MODULE ================= */
function initContactModule() {
    const contactForm = document.getElementById('contact-form');
    const successMsg = document.getElementById('contact-success-msg');

    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();
            successMsg.classList.remove('hidden');
            contactForm.reset();
            setTimeout(() => successMsg.classList.add('hidden'), 5000);
        });
    }
}
