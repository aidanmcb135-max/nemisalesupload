/**
 * Analyzes the cleaned data and produces metrics
 */
class DataAnalyzer {
    constructor(data) {
        this.data = data;
        
        // Ensure dates are parsed properly for grouping
        this.data.forEach(row => {
            if (!(row.transactionDate instanceof Date)) {
                // Try converting from string or Excel serial Number if cellDates failed
                if (typeof row.transactionDate === 'number') {
                    // Excel epoch offset
                    row.transactionDate = new Date(Math.round((row.transactionDate - 25569) * 86400 * 1000));
                } else {
                    row.transactionDate = new Date(row.transactionDate);
                }
            }
            // Format month string roughly like "2023-01" for sorting, and "Jan 2023" for display
            const d = row.transactionDate;
            if (!isNaN(d.getTime())) {
                row.monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
                row.monthLabel = d.toLocaleString('en-US', { month: 'short', year: 'numeric' });
            } else {
                row.monthKey = 'Unknown';
                row.monthLabel = 'Unknown';
            }
        });
    }

    getTotalRevenue() {
        return this.data.reduce((sum, row) => sum + row.amount, 0);
    }

    getRevenueByMonth() {
        const monthly = {};
        this.data.forEach(row => {
            if (row.monthKey === 'Unknown') return;
            if (!monthly[row.monthKey]) {
                monthly[row.monthKey] = { label: row.monthLabel, revenue: 0, quantity: 0 };
            }
            monthly[row.monthKey].revenue += row.amount;
            monthly[row.monthKey].quantity += row.quantity;
        });

        // Sort chronologically ascending
        return Object.keys(monthly).sort().map(key => ({
            month: monthly[key].label,
            revenue: monthly[key].revenue,
            quantity: monthly[key].quantity
        }));
    }

    getBestSalesMonth() {
        const monthly = this.getRevenueByMonth();
        if (monthly.length === 0) return { month: '-', revenue: 0 };
        
        return monthly.reduce((best, current) => 
            current.revenue > best.revenue ? current : best
        , monthly[0]);
    }

    getPeakVolumeMonth() {
        const monthly = this.getRevenueByMonth();
        if (monthly.length === 0) return { month: '-', quantity: 0 };
        
        return monthly.reduce((best, current) => 
            current.quantity > best.quantity ? current : best
        , monthly[0]);
    }

    getTopProduct() {
        const products = {};
        this.data.forEach(row => {
            if (!row.productSold) return;
            const prodText = String(row.productSold).trim();
            if (!products[prodText]) products[prodText] = { quantity: 0, revenue: 0 };
            products[prodText].quantity += row.quantity;
            products[prodText].revenue += row.amount;
        });

        let topProduct = '-';
        let maxQty = 0;

        for (const [product, stats] of Object.entries(products)) {
            if (stats.quantity > maxQty) {
                maxQty = stats.quantity;
                topProduct = product;
            }
        }

        return { product: topProduct, quantity: maxQty };
    }

    getRevenueByCustomer() {
        const customers = {};
        this.data.forEach(row => {
            const name = row.customer || 'Unknown';
            if (!customers[name]) customers[name] = 0;
            customers[name] += row.amount;
        });

        // Convert to sorted array
        return Object.keys(customers)
            .map(name => ({ name, revenue: customers[name] }))
            .sort((a, b) => b.revenue - a.revenue);
    }
}
