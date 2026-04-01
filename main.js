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

    // Initialize the chart manager
    const chartManager = new ChartManager();

    // Setup drag and drop events
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropzone.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    ['dragenter', 'dragover'].forEach(eventName => {
        dropzone.addEventListener(eventName, () => dropzone.classList.add('dragover'), false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropzone.addEventListener(eventName, () => dropzone.classList.remove('dragover'), false);
    });

    // Handle File Drop
    dropzone.addEventListener('drop', (e) => {
        const dt = e.dataTransfer;
        const files = dt.files;
        if (files.length) handleFiles(files[0]);
    });

    // Handle File Browse Click
    dropzone.addEventListener('click', () => {
        fileInput.click();
    });

    fileInput.addEventListener('change', function() {
        if (this.files.length) handleFiles(this.files[0]);
    });

    async function handleFiles(file) {
        // Basic extension validation
        if (!file.name.match(/\.(xlsx|xls)$/)) {
            uploadStatus.textContent = "Error: Please upload a valid Excel file (.xlsx or .xls)";
            uploadStatus.style.color = '#ef4444'; // Error Red
            return;
        }

        uploadStatus.textContent = "Processing and analyzing your data...";
        uploadStatus.style.color = '#10b981'; // Green

        try {
            log(`Starting process for: ${file.name}`);
            
            if (typeof XLSX === 'undefined') {
                throw new Error("System Error: Spreadsheet library (SheetJS) failed to load. Please check your internet connection.");
            }

            // Load and filter the Excel data
            log("Reading file into memory...");
            const rawData = await DataLoader.parseExcelFile(file, log);
            
            if (rawData.length === 0) {
                throw new Error("No valid data found. Please ensure headers match expectations.");
            }

            log(`Filtering complete. Analyzing ${rawData.length} valid sales records...`, 'success');

            uploadStatus.textContent = `Successfully processed ${rawData.length} rows.`;
            
            // Analyze the cleaned Data
            const analyzer = new DataAnalyzer(rawData);
            
            // Update Dashboard UI Elements
            updateDashboardMetrics(analyzer);
            
            // Render the line Chart
            const monthlyData = analyzer.getRevenueByMonth();
            chartManager.renderRevenueChart(monthlyData);
            
            // Render Customer Chart
            const customerData = analyzer.getRevenueByCustomer();
            chartManager.renderCustomerChart(customerData);
            
            // Reveal the dashboard with a smooth scroll
            dashboard.classList.remove('hidden');
            dashboard.scrollIntoView({ behavior: 'smooth', block: 'start' });

        } catch (error) {
            console.error(error);
            log(`ERROR: ${error.message}`, 'error');
            uploadStatus.textContent = `Error: ${error.message}`;
            uploadStatus.style.color = '#ef4444'; // Error Red
        }
    }

    function updateDashboardMetrics(analyzer) {
        const colFormatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

        // Total Revenue
        document.getElementById('val-revenue').textContent = colFormatter.format(analyzer.getTotalRevenue());
        
        // Best Sales Month (by Revenue)
        const bestMonth = analyzer.getBestSalesMonth();
        document.getElementById('val-best-month').textContent = bestMonth.month !== '-' 
            ? `${bestMonth.month}`
            : '-';
        
        // Find Top Customer for the metric card
        const customerStats = analyzer.getRevenueByCustomer();
        if (customerStats.length > 0) {
            const topCust = customerStats[0];
            // We'll repurpose 'Peak Volume Month' subtitle or just show them in the card
            // Actually let's just make sure Top Product and Best Month are clear
        }
        
        // Top Product (by Quantity)
        const topProduct = analyzer.getTopProduct();
        document.getElementById('val-top-product').textContent = topProduct.product;
        
        // Peak Volume Month (by Quantity Sold)
        const peakMonth = analyzer.getPeakVolumeMonth();
        document.getElementById('val-peak-volume-month').textContent = peakMonth.month;
    }
});
