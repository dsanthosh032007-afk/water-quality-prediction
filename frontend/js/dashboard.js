/**
 * AquaGuard AI - Dashboard & Chart Visualizations Manager
 * Utilizes Chart.js for rendering ML metrics, dataset distributions, and correlation heatmap.
 */

class DashboardManager {
    constructor() {
        this.potabilityChart = null;
        this.featureChart = null;
        this.phChart = null;
    }

    async init() {
        try {
            const [metricsRes, statsRes] = await Promise.all([
                fetch('/api/metrics'),
                fetch('/api/stats')
            ]);

            if (!metricsRes.ok || !statsRes.ok) {
                console.error("Failed to load dashboard metrics API.");
                return;
            }

            const metrics = await metricsRes.json();
            const stats = await statsRes.json();

            this.updateKpiCards(metrics);
            this.renderPotabilityPieChart(stats.safe_count, stats.unsafe_count);
            this.renderFeatureImportanceChart(metrics.feature_importances);
            this.renderPhDistributionChart(stats.ph_distribution);
            this.renderCorrelationHeatmap(stats.correlation_matrix);

        } catch (err) {
            console.error("Error initializing dashboard charts:", err);
        }
    }

    updateKpiCards(metrics) {
        document.getElementById('kpi-accuracy').textContent = `${metrics.accuracy}%`;
        document.getElementById('kpi-precision').textContent = `${metrics.precision}%`;
        document.getElementById('kpi-recall').textContent = `${metrics.recall}%`;
        document.getElementById('kpi-f1').textContent = `${metrics.f1_score}%`;
        
        const heroAcc = document.getElementById('hero-stat-acc');
        if (heroAcc) heroAcc.textContent = `${metrics.accuracy}%`;
    }

    renderPotabilityPieChart(safeCount, unsafeCount) {
        const ctx = document.getElementById('chart-potability-pie');
        if (!ctx) return;

        if (this.potabilityChart) this.potabilityChart.destroy();

        this.potabilityChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Unsafe for Drinking (0)', 'Safe for Drinking (1)'],
                datasets: [{
                    data: [unsafeCount, safeCount],
                    backgroundColor: ['#ef4444', '#10b981'],
                    borderWidth: 2,
                    borderColor: '#ffffff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            font: { family: 'Plus Jakarta Sans', size: 12, weight: '600' }
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const total = safeCount + unsafeCount;
                                const val = context.raw;
                                const pct = ((val / total) * 100).toFixed(1);
                                return ` ${context.label}: ${val} samples (${pct}%)`;
                            }
                        }
                    }
                }
            }
        });
    }

    renderFeatureImportanceChart(featureImportances) {
        const ctx = document.getElementById('chart-feature-importance');
        if (!ctx) return;

        if (this.featureChart) this.featureChart.destroy();

        const labels = Object.keys(featureImportances);
        const dataValues = Object.values(featureImportances).map(v => (v * 100).toFixed(1));

        this.featureChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Feature Weight (%)',
                    data: dataValues,
                    backgroundColor: 'rgba(0, 180, 216, 0.75)',
                    borderColor: '#00b4d8',
                    borderWidth: 1.5,
                    borderRadius: 6
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: (ctx) => ` Relative Importance: ${ctx.raw}%`
                        }
                    }
                },
                scales: {
                    x: {
                        grid: { color: 'rgba(226, 232, 240, 0.5)' },
                        title: { display: true, text: 'Importance Weight (%)' }
                    },
                    y: {
                        grid: { display: false }
                    }
                }
            }
        });
    }

    renderPhDistributionChart(phDist) {
        const ctx = document.getElementById('chart-ph-distribution');
        if (!ctx) return;

        if (this.phChart) this.phChart.destroy();

        const labels = phDist.bins.map(b => `${b}`);
        const counts = phDist.counts;

        // Color bars: Highlight WHO optimal pH range (6.5 - 8.5) in Green
        const barColors = phDist.bins.map(val => {
            if (val >= 6.5 && val <= 8.5) {
                return 'rgba(16, 185, 129, 0.8)'; // Safe green
            }
            return 'rgba(239, 68, 68, 0.55)'; // Unsafe warning red/orange
        });

        this.phChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Sample Count',
                    data: counts,
                    backgroundColor: barColors,
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            title: (items) => `pH Bin: ${items[0].label}`,
                            label: (ctx) => ` Sample Frequency: ${ctx.raw}`
                        }
                    }
                },
                scales: {
                    x: {
                        title: { display: true, text: 'pH Levels (6.5 - 8.5 Optimal Range in Green)' }
                    },
                    y: {
                        beginAtZero: true,
                        title: { display: true, text: 'Frequency' }
                    }
                }
            }
        });
    }

    renderCorrelationHeatmap(corrMatrix) {
        const container = document.getElementById('heatmap-container');
        if (!container || !corrMatrix) return;

        const cols = corrMatrix.columns;
        const values = corrMatrix.values;

        let html = '<table class="heatmap-table"><thead><tr><th>Feature</th>';
        cols.forEach(col => {
            html += `<th>${col.substring(0, 6)}</th>`;
        });
        html += '</tr></thead><tbody>';

        values.forEach((row, i) => {
            html += `<tr><th>${cols[i].substring(0, 6)}</th>`;
            row.forEach((val, j) => {
                // Color mapping: val ranges from -1 to 1
                let bg = 'rgba(240, 246, 250, 0.5)';
                let textColor = '#0f172a';
                if (val > 0.05) {
                    const intensity = Math.min(1, val * 3);
                    bg = `rgba(0, 119, 182, ${0.15 + intensity * 0.55})`;
                    if (intensity > 0.4) textColor = '#ffffff';
                } else if (val < -0.05) {
                    const intensity = Math.min(1, Math.abs(val) * 3);
                    bg = `rgba(239, 68, 68, ${0.15 + intensity * 0.55})`;
                    if (intensity > 0.4) textColor = '#ffffff';
                }
                html += `<td style="background-color: ${bg}; color: ${textColor}; font-weight: 600;" title="${cols[i]} vs ${cols[j]}: ${val.toFixed(3)}">${val.toFixed(2)}</td>`;
            });
            html += '</tr>';
        });
        html += '</tbody></table>';

        container.innerHTML = html;
    }
}

// Global instance
window.dashboardManager = new DashboardManager();
