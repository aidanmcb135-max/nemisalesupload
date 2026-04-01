/**
 * Handles rendering visualizations using Chart.js
 */
class ChartManager {
    constructor() {
        this.revenueChart = null;
        this.volumeChart = null;
        this.customerChart = null;
        this.productChart = null;
        
        // Setup Chart.js global defaults for Base44 light theme
        Chart.defaults.color = '#6B7280';
        Chart.defaults.font.family = "'Inter', sans-serif";
        Chart.defaults.plugins.tooltip.backgroundColor = '#FFFFFF';
        Chart.defaults.plugins.tooltip.titleColor = '#111827';
        Chart.defaults.plugins.tooltip.bodyColor = '#4B5563';
        Chart.defaults.plugins.tooltip.borderColor = '#E5E7EB';
        Chart.defaults.plugins.tooltip.borderWidth = 1;
        Chart.defaults.plugins.tooltip.padding = 10;
        Chart.defaults.plugins.tooltip.boxPadding = 4;
        Chart.defaults.plugins.tooltip.usePointStyle = true;
    }

    renderRevenueChart(monthlyData) {
        const ctx = document.getElementById('revenueChart').getContext('2d');
        const labels = monthlyData.map(d => d.month);
        const data = monthlyData.map(d => d.revenue);

        if (this.revenueChart) this.revenueChart.destroy();

        // Create a gradient for the line graph
        const gradient = ctx.createLinearGradient(0, 0, 0, 300);
        gradient.addColorStop(0, 'rgba(44, 110, 73, 0.2)');
        gradient.addColorStop(1, 'rgba(44, 110, 73, 0.0)');

        this.revenueChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Revenue',
                    data: data,
                    borderColor: '#2c6e49',
                    backgroundColor: gradient,
                    borderWidth: 2,
                    pointBackgroundColor: '#FFFFFF',
                    pointBorderColor: '#2c6e49',
                    pointBorderWidth: 2,
                    pointRadius: 4,
                    pointHoverRadius: 6,
                    fill: true,
                    tension: 0.3
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: (context) => '£' + context.parsed.y.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})
                        }
                    }
                },
                scales: {
                    x: {
                        grid: { display: false }
                    },
                    y: {
                        grid: {
                            color: '#E5E7EB',
                            drawBorder: false,
                            borderDash: [5, 5]
                        },
                        beginAtZero: true,
                        ticks: {
                            callback: value => '£' + (value >= 1000 ? (value/1000) + 'k' : value)
                        }
                    }
                }
            }
        });
    }

    renderVolumeChart(monthlyData) {
        const ctx = document.getElementById('volumeChart').getContext('2d');
        const labels = monthlyData.map(d => d.month);
        const data = monthlyData.map(d => d.quantity);

        if (this.volumeChart) this.volumeChart.destroy();

        this.volumeChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Sales Volume',
                    data: data,
                    backgroundColor: '#3b8258',
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    x: { grid: { display: false } },
                    y: {
                        grid: { color: '#E5E7EB', drawBorder: false, borderDash: [5, 5] },
                        beginAtZero: true
                    }
                }
            }
        });
    }

    renderCustomerChart(customerData) {
        const ctx = document.getElementById('customerChart').getContext('2d');
        const top10 = customerData.slice(0, 10);
        const labels = top10.map(d => d.name);
        const data = top10.map(d => d.revenue);

        if (this.customerChart) this.customerChart.destroy();

        this.customerChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Revenue',
                    data: data,
                    backgroundColor: '#3b8258',
                    borderRadius: 4,
                    barThickness: 'flex',
                    maxBarThickness: 24
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    x: {
                        grid: { color: '#E5E7EB', drawBorder: false, borderDash: [5, 5] },
                        ticks: { callback: value => '£' + (value >= 1000 ? (value/1000) + 'k' : value) }
                    },
                    y: { grid: { display: false } }
                }
            }
        });
    }

    renderProductChart(productData) {
        const ctx = document.getElementById('productChart').getContext('2d');
        
        // Base44 greens palette
        const palette = [
            '#215237', '#2c6e49', '#3b8258', '#4c9568', 
            '#60a97a', '#77bc8d', '#90cfa2', '#aee2b7'
        ];
        
        // Take top 8 products, combine rest into "Other"
        let displayData = [];
        if (productData.length > 8) {
            displayData = productData.slice(0, 7);
            const otherRev = productData.slice(7).reduce((sum, p) => sum + p.revenue, 0);
            displayData.push({ product: 'Other', revenue: otherRev });
        } else {
            displayData = productData;
        }

        const labels = displayData.map(d => d.product);
        const data = displayData.map(d => d.revenue);

        if (this.productChart) this.productChart.destroy();

        this.productChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: palette.slice(0, displayData.length),
                    borderWidth: 2,
                    borderColor: '#FFFFFF'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '70%',
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            usePointStyle: true,
                            padding: 20,
                            font: { size: 11 }
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: (context) => ' £' + context.parsed.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})
                        }
                    }
                }
            }
        });
    }
}
