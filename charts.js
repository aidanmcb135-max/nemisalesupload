/**
 * Handles rendering visualizations using Chart.js
 */
class ChartManager {
    constructor() {
        this.revenueChart = null;
        
        // Setup Chart.js global defaults for our dark sleek theme
        Chart.defaults.color = '#94a3b8';
        Chart.defaults.font.family = "'Outfit', sans-serif";
    }

    renderRevenueChart(monthlyData) {
        const ctx = document.getElementById('revenueChart').getContext('2d');
        
        const labels = monthlyData.map(d => d.month);
        const data = monthlyData.map(d => d.revenue);

        if (this.revenueChart) {
            this.revenueChart.destroy();
        }

        // Create a gradient for the line graph
        const gradient = ctx.createLinearGradient(0, 0, 0, 400);
        gradient.addColorStop(0, 'rgba(0, 242, 254, 0.4)');
        gradient.addColorStop(1, 'rgba(0, 242, 254, 0.0)');

        this.revenueChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Total Revenue',
                    data: data,
                    borderColor: '#00f2fe',
                    backgroundColor: gradient,
                    borderWidth: 3,
                    pointBackgroundColor: '#0b0f19',
                    pointBorderColor: '#00f2fe',
                    pointBorderWidth: 2,
                    pointRadius: 4,
                    pointHoverRadius: 6,
                    fill: true,
                    tension: 0.4 // Creates the modern smooth curve effect
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: 'rgba(11, 15, 25, 0.95)',
                        titleColor: '#fff',
                        bodyColor: '#00f2fe',
                        borderColor: 'rgba(255,255,255,0.1)',
                        borderWidth: 1,
                        padding: 12,
                        displayColors: false,
                        callbacks: {
                            label: function(context) {
                                let label = context.dataset.label || '';
                                if (label) {
                                    label += ': ';
                                }
                                if (context.parsed.y !== null) {
                                    label += new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(context.parsed.y);
                                }
                                return label;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        grid: {
                            color: 'rgba(255, 255, 255, 0.05)',
                            drawBorder: false
                        }
                    },
                    y: {
                        grid: {
                            color: 'rgba(255, 255, 255, 0.05)',
                            drawBorder: false
                        },
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                // Formatting the y-axis values as currency
                                return '$' + value.toLocaleString();
                            }
                        }
                    }
                }
            }
        });
    }

    renderCustomerChart(customerData) {
        const ctx = document.getElementById('customerChart').getContext('2d');
        
        // Show top 10 customers
        const top10 = customerData.slice(0, 10);
        const labels = top10.map(d => d.name);
        const data = top10.map(d => d.revenue);

        if (this.customerChart) {
            this.customerChart.destroy();
        }

        this.customerChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Total Revenue',
                    data: data,
                    backgroundColor: 'rgba(79, 172, 254, 0.6)',
                    borderColor: '#4facfe',
                    borderWidth: 1,
                    borderRadius: 8
                }]
            },
            options: {
                indexAxis: 'y', // Makes it a horizontal bar chart
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    x: {
                        grid: { color: 'rgba(255, 255, 255, 0.05)', drawBorder: false },
                        ticks: {
                            callback: value => '$' + value.toLocaleString()
                        }
                    },
                    y: {
                        grid: { display: false }
                    }
                }
            }
        });
    }
}
