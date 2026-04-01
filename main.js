/**
 * Main application logic bridging UI and data scripts
 */
document.addEventListener('DOMContentLoaded', () => {
    const dropzone = document.getElementById('dropzone');
    const fileInput = document.getElementById('fileInput');
    const uploadStatus = document.getElementById('uploadStatus');
    const dashboard = document.getElementById('dashboard');
    
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
            // Load and filter the Excel data
            const rawData = await DataLoader.parseExcelFile(file);
            
            if (rawData.length === 0) {
                throw new Error("No valid data found. Please ensure headers match expectations (Transaction Date, Product Sold, etc.)");
            }

            uploadStatus.textContent = `Successfully processed ${rawData.length} rows.`;
            
            // Analyze the cleaned Data
            const analyzer = new DataAnalyzer(rawData);
            
            // Update Dashboard UI Elements
            updateDashboardMetrics(analyzer);
            
            // Render the line Chart
            const monthlyData = analyzer.getRevenueByMonth();
            chartManager.renderRevenueChart(monthlyData);
            
            // Reveal the dashboard with a smooth scroll
            dashboard.classList.remove('hidden');
            dashboard.scrollIntoView({ behavior: 'smooth', block: 'start' });

        } catch (error) {
            console.error(error);
            uploadStatus.textContent = "There was an error parsing the file. Please check console for details.";
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
        
        // Top Product (by Quantity)
        const topProduct = analyzer.getTopProduct();
        document.getElementById('val-top-product').textContent = topProduct.product;
        
        // Peak Volume Month (by Quantity Sold)
        const peakMonth = analyzer.getPeakVolumeMonth();
        document.getElementById('val-peak-volume-month').textContent = peakMonth.month;
    }
});
