// Utility functions for the bill verifier application

class BillVerifierUtils {
    /**
     * Read Excel file and extract data
     */
    static readExcelFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                try {
                    const data = new Uint8Array(e.target.result);
                    const workbook = XLSX.read(data, { type: 'array' });
                    const sheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[sheetName];
                    const jsonData = XLSX.utils.sheet_to_json(worksheet);
                    resolve(jsonData);
                } catch (error) {
                    reject(new Error('فشل قراءة ملف Excel: ' + error.message));
                }
            };

            reader.onerror = () => {
                reject(new Error('خطأ في قراءة الملف'));
            };

            reader.readAsArrayBuffer(file);
        });
    }

    /**
     * Read image file
     */
    static readImageFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                resolve({
                    name: file.name,
                    data: e.target.result,
                    file: file
                });
            };

            reader.onerror = () => {
                reject(new Error('خطأ في قراءة الصورة'));
            };

            reader.readAsDataURL(file);
        });
    }

    /**
     * Extract text from image using OCR (using Tesseract.js)
     */
    static async extractTextFromImage(imageData) {
        try {
            // This is a placeholder for OCR functionality
            // In production, you'd use Tesseract.js or similar
            return {
                subscriptionNumber: null,
                billNumber: null,
                consumptionValue: null,
                extractedText: 'OCR functionality requires Tesseract.js library'
            };
        } catch (error) {
            throw new Error('فشل استخراج النص من الصورة: ' + error.message);
        }
    }

    /**
     * Validate if number is numeric
     */
    static isNumeric(value) {
        return !isNaN(parseFloat(value)) && isFinite(value);
    }

    /**
     * Normalize data for comparison
     */
    static normalizeValue(value) {
        if (value === null || value === undefined) return '';
        return String(value).trim();
    }

    /**
     * Compare two values (allow small numeric variations)
     */
    static compareValues(value1, value2, tolerance = 0.01) {
        // For numeric values
        if (this.isNumeric(value1) && this.isNumeric(value2)) {
            const num1 = parseFloat(value1);
            const num2 = parseFloat(value2);
            const difference = Math.abs(num1 - num2);
            return difference <= tolerance;
        }

        // For text values
        return this.normalizeValue(value1) === this.normalizeValue(value2);
    }

    /**
     * Generate Excel export file
     */
    static generateExcelExport(results) {
        const exportData = results.map(result => ({
            'اسم المشترك': result.subscriberName,
            'رقم الملف': result.fileNumber,
            'رقم الاشتراك': result.subscriptionNumber,
            'قيمة الاستهلاك': result.consumptionValue,
            'رقم الفاتورة': result.billNumber,
            'حالة المطابقة': result.status === 'success' ? '✓ صحيح' : '✗ خطأ',
            'سبب الخطأ': result.errorMessage || '-',
            'التفاصيل': result.details || '-'
        }));

        const worksheet = XLSX.utils.json_to_sheet(exportData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'نتائج المطابقة');

        // Set column widths
        worksheet['!cols'] = [
            { wch: 20 },
            { wch: 12 },
            { wch: 15 },
            { wch: 15 },
            { wch: 15 },
            { wch: 15 },
            { wch: 30 },
            { wch: 30 }
        ];

        return workbook;
    }

    /**
     * Show notification toast
     */
    static showToast(message, type = 'info', duration = 3000) {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, duration);
    }

    /**
     * Validate Excel data structure
     */
    static validateExcelStructure(data) {
        if (!Array.isArray(data) || data.length === 0) {
            throw new Error('ملف Excel فارغ أو غير صحيح');
        }

        const firstRow = data[0];
        const requiredColumns = ['اسم المشترك', 'رقم الملف', 'رقم الاشتراك', 'قيمة الاستهلاك', 'رقم الفاتورة'];
        
        const missingColumns = requiredColumns.filter(col => !(col in firstRow));
        
        if (missingColumns.length > 0) {
            throw new Error(`الأعمدة المفقودة: ${missingColumns.join(', ')}`);
        }

        return true;
    }

    /**
     * Get file extension
     */
    static getFileExtension(filename) {
        return filename.split('.').pop().toLowerCase();
    }

    /**
     * Validate file type
     */
    static isValidImageFile(filename) {
        const validExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp'];
        return validExtensions.includes(this.getFileExtension(filename));
    }

    /**
     * Format date to Arabic format
     */
    static formatDateArabic(date) {
        const arabicNumbers = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
        const dateObj = new Date(date);
        const formatted = dateObj.toLocaleDateString('ar-EG');
        return formatted.replace(/\d/g, digit => arabicNumbers[digit]);
    }

    /**
     * Deep clone object
     */
    static deepClone(obj) {
        return JSON.parse(JSON.stringify(obj));
    }

    /**
     * Get file size in MB
     */
    static getFileSizeInMB(file) {
        return (file.size / (1024 * 1024)).toFixed(2);
    }

    /**
     * Check if file size is valid
     */
    static isValidFileSize(file, maxSizeMB = 50) {
        return (file.size / (1024 * 1024)) <= maxSizeMB;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BillVerifierUtils;
}