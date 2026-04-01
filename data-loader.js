/**
 * Handles file reading and parsing using SheetJS
 */
class DataLoader {
    static async parseExcelFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = (e) => {
                try {
                    const data = new Uint8Array(e.target.result);
                    const workbook = XLSX.read(data, { type: 'array', cellDates: true });
                    
                    // Assume the first sheet contains the data
                    const firstSheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[firstSheetName];
                    
                    // Convert to JSON
                    const rawJson = XLSX.utils.sheet_to_json(worksheet, { defval: null });
                    
                    // Normalize and filter the data according to requirements
                    const cleanedData = this.cleanAndFilterData(rawJson);
                    resolve(cleanedData);
                } catch (error) {
                    reject(error);
                }
            };

            reader.onerror = (error) => {
                reject(error);
            };

            reader.readAsArrayBuffer(file);
        });
    }

    static cleanAndFilterData(rawData) {
        return rawData.map(row => {
            // Find keys case-insensitively using a helper
            const getVal = (possibleKeys) => {
                const key = Object.keys(row).find(k => 
                    possibleKeys.some(pk => k.toLowerCase().includes(pk.toLowerCase()))
                );
                return key ? row[key] : null;
            };

            // Safely parse numbers, stripping currency symbols or commas
            const parseNumber = (val) => {
                if (typeof val === 'number') return val;
                if (typeof val === 'string') {
                    // Remove anything that isn't a digit, period, or minus sign
                    const cleaned = val.replace(/[^0-9.-]+/g, "");
                    return parseFloat(cleaned) || 0;
                }
                return 0;
            };

            // STRICT FILTERING: We intentionally ignore 'transaction type', 
            // 'transaction number', 'sales price', and 'balance' as requested.
            const customer = getVal(['customer']);
            const transactionDate = getVal(['transaction date', 'date']);
            const productSold = getVal(['product sold', 'product']);
            const description = getVal(['description']);
            const quantity = getVal(['quantity', 'qty']);
            const amount = getVal(['amount']); // specifically keep amount for revenue

            return {
                customer,
                transactionDate, // JS Date object (if cellDates: true worked) or string
                productSold,
                description,
                quantity: parseNumber(quantity),
                amount: parseNumber(amount)
            };
        }).filter(row => row.transactionDate && row.productSold); // Filter out empty or invalid rows
    }
}
