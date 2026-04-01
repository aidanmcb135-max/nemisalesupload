/**
 * Analyzes the cleaned data and produces metrics
 */
class DataAnalyzer {
    constructor(data) {
        this.data = data;
        
        // Setup Date and Month parsing
        this.data.forEach(row => {
            if (!(row.transactionDate instanceof Date)) {
                if (typeof row.transactionDate === 'number') {
                    row.transactionDate = new Date(Math.round((row.transactionDate - 25569) * 86400 * 1000));
                } else {
                    row.transactionDate = new Date(row.transactionDate);
                }
            }
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

    getTotalTransactions() {
        return this.data.length;
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

        return Object.keys(monthly).sort().map(key => ({
            month: monthly[key].label,
            revenue: monthly[key].revenue,
            quantity: monthly[key].quantity
        }));
    }

    getBestSalesMonth() {
        const monthly = this.getRevenueByMonth();
        if (monthly.length === 0) return { month: '-', revenue: 0 };
        return monthly.reduce((best, current) => current.revenue > best.revenue ? current : best, monthly[0]);
    }

    getTopProduct() {
        const products = {};
        this.data.forEach(row => {
            const prodText = String(row.productSold || 'Unknown').trim();
            // Don't count Deposits for Top Product
            if (prodText === 'Other / Deposit') return;
            
            if (!products[prodText]) products[prodText] = { quantity: 0, revenue: 0 };
            products[prodText].quantity += row.quantity;
            products[prodText].revenue += row.amount;
        });

        let topProduct = '-';
        let maxQty = 0;
        let revenueObj = 0;

        for (const [product, stats] of Object.entries(products)) {
            if (stats.quantity > maxQty) {
                maxQty = stats.quantity;
                topProduct = product;
                revenueObj = stats.revenue;
            }
        }
        return { product: topProduct, quantity: maxQty, revenue: revenueObj };
    }

    getRevenueByProduct() {
        const products = {};
        this.data.forEach(row => {
            const prodText = String(row.productSold || 'Unknown').trim();
            // Optional: Exclude 'Other / Deposit' from the product pie chart if desired,
            // but we'll include it so the pie exactly matches total revenue.
            if (!products[prodText]) products[prodText] = 0;
            products[prodText] += row.amount;
        });

        return Object.keys(products)
            .map(name => ({ product: name, revenue: products[name] }))
            .sort((a, b) => b.revenue - a.revenue);
    }

    getRevenueByCustomer() {
        const customers = {};
        this.data.forEach(row => {
            const name = row.customer || 'Unknown';
            if (!customers[name]) customers[name] = 0;
            customers[name] += row.amount;
        });

        return Object.keys(customers)
            .map(name => ({ name, revenue: customers[name] }))
            .sort((a, b) => b.revenue - a.revenue);
    }

    getTotalCustomers() {
        const customerList = this.getRevenueByCustomer();
        return customerList.length;
    }
}
