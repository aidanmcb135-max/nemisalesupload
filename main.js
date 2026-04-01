/**
 * Main application logic bridging UI and data scripts
 */
document.addEventListener('DOMContentLoaded', () => {
    const dropzone = document.getElementById('dropzone');
    const fileInput = document.getElementById('fileInput');
    const uploadStatus = document.getElementById('uploadStatus');
    const dashboard = document.getElementById('dashboard');
    const debugLog = document.getElementById('debugLog');
    const logContent = document.getElementById('logContent');
    
    function log(message, type = 'info') {
        const entry = document.createElement('div');
        entry.className = `log-entry ${type}`;
        entry.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
        logContent.appendChild(entry);
        logContent.scrollTop = logContent.scrollHeight;
        debugLog.classList.remove('hidden');
    }

    const chartManager = new ChartManager();

    // Drag and drop setup
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => dropzone.addEventListener(eventName, preventDefaults, false));
    function preventDefaults(e) { e.preventDefault(); e.stopPropagation(); }

    ['dragenter', 'dragover'].forEach(eventName => dropzone.addEventListener(eventName, () => dropzone.classList.add('dragover'), false));
    ['dragleave', 'drop'].forEach(eventName => dropzone.addEventListener(eventName, () => dropzone.classList.remove('dragover'), false));

    dropzone.addEventListener('drop', (e) => {
        const dt = e.dataTransfer;
        const files = dt.files;
        if (files.length) handleFiles(files[0]);
    });

    dropzone.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', function() { if (this.files.length) handleFiles(this.files[0]); });

    async function handleFiles(file) {
        if (!file.name.match(/\.(xlsx|xls)$/)) {
            uploadStatus.textContent = "Error: Please upload a valid Excel file (.xlsx or .xls)";
            uploadStatus.style.color = '#ef4444';
            return;
        }

        uploadStatus.textContent = "Processing and analyzing your data...";
        uploadStatus.style.color = '#10b981';

        try {
            log(`Starting process for: ${file.name}`);
            if (typeof XLSX === 'undefined') throw new Error("Spreadsheet library (SheetJS) failed to load.");

            log("Reading file into memory...");
            const rawData = await DataLoader.parseExcelFile(file, log);
            if (rawData.length === 0) throw new Error("No valid data found.");

            log(`Analyzing ${rawData.length} valid sales records...`, 'success');
            uploadStatus.textContent = `Successfully processed ${rawData.length} rows.`;
            
            const analyzer = new DataAnalyzer(rawData);
            
            // 1. Dashboard Metrics
            updateDashboardMetrics(analyzer);
            
            // 2. Main Charts
            chartManager.renderRevenueChart(analyzer.getRevenueByMonth());
            chartManager.renderVolumeChart(analyzer.getVolumeByQuarter());
            chartManager.renderCustomerChart(analyzer.getRevenueByCustomer());
            chartManager.renderProductChart(analyzer.getRevenueByProduct());

            // 3. Boss V2 Charts
            chartManager.renderTop20Products(analyzer.getTopProductsByQuantity(20));
            chartManager.renderTop10Trends(analyzer.getTop10ProductTrends());

            // 4. Tables and Lists
            renderFrequencyTable(analyzer.getCustomerFrequencyTable());
            renderChurnLists(analyzer.getChurnedCustomers());

            dashboard.classList.remove('hidden');
            dashboard.scrollIntoView({ behavior: 'smooth', block: 'start' });

        } catch (error) {
            console.error(error);
            log(`ERROR: ${error.message}`, 'error');
            uploadStatus.textContent = `Error: ${error.message}`;
            uploadStatus.style.color = '#ef4444';
        }
    }

    function updateDashboardMetrics(analyzer) {
        const colFormatter = new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: 0 });

        document.getElementById('val-revenue').textContent = colFormatter.format(analyzer.getTotalRevenue());
        document.getElementById('sub-revenue').textContent = `${analyzer.getTotalTransactions().toLocaleString()} orders processed`;
        
        const bestMonth = analyzer.getBestSalesMonth();
        document.getElementById('val-best-month').textContent = bestMonth.month !== '-' ? bestMonth.month : '-';
        document.getElementById('sub-best-month').textContent = `${colFormatter.format(bestMonth.revenue || 0)} revenue`;
        
        const topProduct = analyzer.getTopProductsByQuantity(1)[0] || { product: '-', quantity: 0 };
        document.getElementById('val-top-product').textContent = topProduct.product;
        document.getElementById('sub-top-product').textContent = `${(topProduct.quantity || 0).toLocaleString()} units sold`;
        
        document.getElementById('val-total-customers').textContent = analyzer.getTotalCustomers().toLocaleString();
    }

    function renderFrequencyTable(freqData) {
        const table = document.getElementById('frequencyTable');
        table.innerHTML = '';

        // Build Header
        const thead = document.createElement('thead');
        let headerRow = '<tr><th>Customer</th>';
        freqData.months.forEach(m => {
            headerRow += `<th>${m.label.split(' ')[0]}</th>`; // Show just the month name to save space
        });
        headerRow += '<th class="total-col">Total</th></tr>';
        thead.innerHTML = headerRow;
        table.appendChild(thead);

        // Build Body
        const tbody = document.createElement('tbody');
        freqData.data.forEach(row => {
            let tr = document.createElement('tr');
            let content = `<td><strong>${row.customer}</strong></td>`;
            freqData.months.forEach(m => {
                const count = row[m.key] || 0;
                content += `<td>${count === 0 ? '-' : count}</td>`;
            });
            content += `<td class="total-col">${row.total}</td>`;
            tr.innerHTML = content;
            tbody.appendChild(tr);
        });
        table.appendChild(tbody);
    }

    function renderChurnLists(churnData) {
        const list90 = document.getElementById('churn90List');
        const list60 = document.getElementById('churn60List');
        
        list90.innerHTML = '';
        list60.innerHTML = '';

        if (churnData.churned90.length === 0) list90.innerHTML = '<div class="no-data-msg">No high-risk accounts found.</div>';
        if (churnData.churned60.length === 0) list60.innerHTML = '<div class="no-data-msg">No dormant accounts found.</div>';

        churnData.churned90.forEach(c => {
            const dateStr = c.lastOrder.toLocaleDateString();
            list90.innerHTML += `<div class="churn-item"><span class="churn-name">${c.customer}</span><span class="churn-days">${c.daysSince} days ago (${dateStr})</span></div>`;
        });

        churnData.churned60.forEach(c => {
            const dateStr = c.lastOrder.toLocaleDateString();
            list60.innerHTML += `<div class="churn-item"><span class="churn-name">${c.customer}</span><span class="churn-days">${c.daysSince} days ago (${dateStr})</span></div>`;
        });
    }
});
