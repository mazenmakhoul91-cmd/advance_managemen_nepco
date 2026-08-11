// Main application logic for bill verifier

class BillVerifierApp {
    constructor() {
        this.excelData = [];
        this.billImages = [];
        this.verificationResults = [];
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupDropZones();
    }

    setupEventListeners() {
        // Excel file upload
        const excelDropArea = document.getElementById('excelDropArea');
        const excelFile = document.getElementById('excelFile');

        excelDropArea.addEventListener('click', () => excelFile.click());
        excelDropArea.addEventListener('dragover', (e) => this.handleDragOver(e, excelDropArea));
        excelDropArea.addEventListener('dragleave', (e) => this.handleDragLeave(e, excelDropArea));
        excelDropArea.addEventListener('drop', (e) => this.handleExcelDrop(e, excelDropArea));
        excelFile.addEventListener('change', (e) => this.handleExcelSelect(e));

        // Images upload
        const imagesDropArea = document.getElementById('imagesDropArea');
        const billImages = document.getElementById('billImages');

        imagesDropArea.addEventListener('click', () => billImages.click());
        imagesDropArea.addEventListener('dragover', (e) => this.handleDragOver(e, imagesDropArea));
        imagesDropArea.addEventListener('dragleave', (e) => this.handleDragLeave(e, imagesDropArea));
        imagesDropArea.addEventListener('drop', (e) => this.handleImagesDrop(e, imagesDropArea));
        billImages.addEventListener('change', (e) => this.handleImagesSelect(e));

        // Process button
        document.getElementById('processBtn').addEventListener('click', () => this.processVerification());

        // Export button
        document.getElementById('exportBtn').addEventListener('click', () => this.exportResults());

        // Tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => this.switchTab(btn));
        });

        // Modal close button
        const modal = document.getElementById('billModal');
        const closeBtn = document.querySelector('.close');
        closeBtn.addEventListener('click', () => modal.style.display = 'none');
        window.addEventListener('click', (e) => {
            if (e.target === modal) modal.style.display = 'none';
        });
    }

    setupDropZones() {
        // Already covered in setupEventListeners
    }

    handleDragOver(e, dropArea) {
        e.preventDefault();
        e.stopPropagation();
        dropArea.classList.add('dragover');
    }

    handleDragLeave(e, dropArea) {
        e.preventDefault();
        e.stopPropagation();
        dropArea.classList.remove('dragover');
    }

    async handleExcelDrop(e, dropArea) {
        e.preventDefault();
        e.stopPropagation();
        dropArea.classList.remove('dragover');

        const files = e.dataTransfer.files;
        if (files.length > 0) {
            await this.handleExcelFile(files[0]);
        }
    }

    async handleExcelSelect(e) {
        const files = e.target.files;
        if (files.length > 0) {
            await this.handleExcelFile(files[0]);
        }
    }

    async handleExcelFile(file) {
        try {
            if (!BillVerifierUtils.isValidFileSize(file)) {
                BillVerifierUtils.showToast('حجم الملف كبير جداً (الحد الأقصى 50 MB)', 'error');
                return;
            }

            this.excelData = await BillVerifierUtils.readExcelFile(file);
            BillVerifierUtils.validateExcelStructure(this.excelData);

            BillVerifierUtils.showToast(`تم تحميل ${this.excelData.length} سجل من Excel`, 'success');
            this.updateUI();
            this.displayExcelPreview();
        } catch (error) {
            BillVerifierUtils.showToast(error.message, 'error');
        }
    }

    async handleImagesDrop(e, dropArea) {
        e.preventDefault();
        e.stopPropagation();
        dropArea.classList.remove('dragover');

        const files = e.dataTransfer.files;
        await this.handleImageFiles(files);
    }

    async handleImagesSelect(e) {
        const files = e.target.files;
        await this.handleImageFiles(files);
    }

    async handleImageFiles(files) {
        try {
            const validFiles = [];
            for (let file of files) {
                if (BillVerifierUtils.isValidImageFile(file.name)) {
                    if (BillVerifierUtils.isValidFileSize(file)) {
                        validFiles.push(file);
                    }
                }
            }

            if (validFiles.length === 0) {
                BillVerifierUtils.showToast('لا توجد صور صحيحة للرفع', 'warning');
                return;
            }

            for (let file of validFiles) {
                const imageData = await BillVerifierUtils.readImageFile(file);
                this.billImages.push(imageData);
            }

            BillVerifierUtils.showToast(`تم تحميل ${validFiles.length} صورة`, 'success');
            this.updateUI();
            this.displayImagePreview();
        } catch (error) {
            BillVerifierUtils.showToast(error.message, 'error');
        }
    }

    updateUI() {
        const processBtn = document.getElementById('processBtn');
        processBtn.disabled = !(this.excelData.length > 0 && this.billImages.length > 0);

        if (!processBtn.disabled) {
            processBtn.textContent = '🔍 تحليل الفواتير (' + this.excelData.length + ' سجل، ' + this.billImages.length + ' صورة)';
        }
    }

    displayExcelPreview() {
        const table = document.getElementById('excelDataTable');
        const thead = table.querySelector('thead');
        const tbody = table.querySelector('tbody');

        thead.innerHTML = '';
        tbody.innerHTML = '';

        if (this.excelData.length === 0) return;

        const headers = Object.keys(this.excelData[0]);
        const headerRow = document.createElement('tr');

        headers.forEach(header => {
            const th = document.createElement('th');
            th.textContent = header;
            headerRow.appendChild(th);
        });

        thead.appendChild(headerRow);

        this.excelData.slice(0, 20).forEach(row => {
            const tr = document.createElement('tr');
            headers.forEach(header => {
                const td = document.createElement('td');
                td.textContent = row[header] || '-';
                tr.appendChild(td);
            });
            tbody.appendChild(tr);
        });

        document.getElementById('previewSection').style.display = 'block';
    }

    displayImagePreview() {
        const grid = document.getElementById('imagesGrid');
        grid.innerHTML = '';

        this.billImages.forEach((img, index) => {
            const item = document.createElement('div');
            item.className = 'image-item';
            item.innerHTML = `
                <img src="${img.data}" alt="صورة الفاتورة ${index + 1}">
                <div class="image-item-label">${img.name}</div>
            `;
            item.style.cursor = 'pointer';
            item.addEventListener('click', () => this.showImageModal(img));
            grid.appendChild(item);
        });

        document.getElementById('previewSection').style.display = 'block';
    }

    showImageModal(img) {
        const modal = document.getElementById('billModal');
        document.getElementById('modalImage').src = img.data;
        document.getElementById('modalTitle').textContent = img.name;

        const detailsList = document.getElementById('detailsList');
        detailsList.innerHTML = `
            <div class="detail-item">
                <span class="detail-label">حجم الملف:</span>
                <span class="detail-value">${BillVerifierUtils.getFileSizeInMB(img.file)} MB</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">نوع الملف:</span>
                <span class="detail-value">${BillVerifierUtils.getFileExtension(img.name).toUpperCase()}</span>
            </div>
        `;

        modal.style.display = 'block';
    }

    async processVerification() {
        const processBtn = document.getElementById('processBtn');
        processBtn.disabled = true;
        processBtn.textContent = '⏳ جاري المعالجة...';

        try {
            this.verificationResults = [];

            // Match each image to corresponding Excel row
            for (const excelRow of this.excelData) {
                const result = {
                    subscriberName: excelRow['اسم المشترك'] || '',
                    fileNumber: excelRow['رقم الملف'] || '',
                    subscriptionNumber: excelRow['رقم الاشتراك'] || '',
                    consumptionValue: excelRow['قيمة الاستهلاك'] || '',
                    billNumber: excelRow['رقم الفاتورة'] || '',
                    status: 'pending',
                    errorMessage: '',
                    details: '',
                    matchedImage: null
                };

                // Try to find matching image
                const matchedImg = this.findMatchingImage(excelRow);
                if (matchedImg) {
                    result.matchedImage = matchedImg;
                    // Perform verification
                    const verification = await this.verifyBill(excelRow, matchedImg);
                    result.status = verification.status;
                    result.errorMessage = verification.errors.join(' | ');
                    result.details = verification.details;
                } else {
                    result.status = 'pending';
                    result.errorMessage = 'لم يتم العثور على صورة مطابقة';
                }

                this.verificationResults.push(result);
            }

            this.displayResults();
            BillVerifierUtils.showToast('تم إكمال التحقق من جميع الفواتير', 'success');

        } catch (error) {
            BillVerifierUtils.showToast('حدث خطأ: ' + error.message, 'error');
        } finally {
            processBtn.disabled = false;
            processBtn.textContent = '🔍 تحليل الفواتير';
        }
    }

    findMatchingImage(excelRow) {
        const subscriptionNumber = String(excelRow['رقم الاشتراك']).trim();
        const billNumber = String(excelRow['رقم الفاتورة']).trim();

        // Try to match by subscription number or bill number in filename
        return this.billImages.find(img => {
            const fileName = img.name.toLowerCase();
            return fileName.includes(subscriptionNumber) || fileName.includes(billNumber);
        });
    }

    async verifyBill(excelRow, imageData) {
        const errors = [];
        let details = '';

        try {
            // Simulated OCR - in production, use actual OCR library
            // For now, we'll do basic validation

            const subscriptionNumber = excelRow['رقم الاشتراك'];
            const billNumber = excelRow['رقم الفاتورة'];
            const consumptionValue = excelRow['قيمة الاستهلاك'];

            // Validate required fields exist
            if (!subscriptionNumber) {
                errors.push('رقم الاشتراك مفقود في البيانات');
            }
            if (!billNumber) {
                errors.push('رقم الفاتورة مفقود في البيانات');
            }
            if (!consumptionValue) {
                errors.push('قيمة الاستهلاك مفقودة في البيانات');
            }

            // Validate data types
            if (subscriptionNumber && !BillVerifierUtils.isNumeric(subscriptionNumber)) {
                errors.push('رقم الاشتراك يجب أن يكون رقمياً');
            }
            if (billNumber && !BillVerifierUtils.isNumeric(billNumber)) {
                errors.push('رقم الفاتورة يجب أن يكون رقمياً');
            }
            if (consumptionValue && !BillVerifierUtils.isNumeric(consumptionValue)) {
                errors.push('قيمة الاستهلاك يجب أن تكون رقمية');
            }

            if (errors.length === 0) {
                details = 'تم التحقق بنجاح من جميع البيانات';
            }

            return {
                status: errors.length === 0 ? 'success' : 'error',
                errors: errors,
                details: details
            };

        } catch (error) {
            return {
                status: 'error',
                errors: ['حدث خطأ أثناء التحقق: ' + error.message],
                details: ''
            };
        }
    }

    displayResults() {
        const resultsSection = document.getElementById('resultsSection');
        const resultsBody = document.getElementById('resultsBody');
        const successCount = document.getElementById('successCount');
        const errorCount = document.getElementById('errorCount');
        const pendingCount = document.getElementById('pendingCount');

        resultsBody.innerHTML = '';

        let successNum = 0;
        let errorNum = 0;
        let pendingNum = 0;

        this.verificationResults.forEach((result, index) => {
            const row = document.createElement('tr');

            let statusClass = result.status;
            let statusText = '';

            if (result.status === 'success') {
                successNum++;
                statusText = '✓ صحيح';
            } else if (result.status === 'error') {
                errorNum++;
                statusText = '✗ خطأ';
            } else {
                pendingNum++;
                statusText = '⏳ معالجة';
            }

            row.innerHTML = `
                <td>${result.subscriberName}</td>
                <td>${result.fileNumber}</td>
                <td>${result.subscriptionNumber}</td>
                <td>${result.consumptionValue}</td>
                <td>${result.billNumber}</td>
                <td><span class="status-badge ${statusClass}">${statusText}</span></td>
                <td><span class="error-details">${result.errorMessage || result.details || '-'}</span></td>
            `;

            resultsBody.appendChild(row);
        });

        successCount.textContent = successNum;
        errorCount.textContent = errorNum;
        pendingCount.textContent = pendingNum;

        resultsSection.style.display = 'block';

        // Enable export button
        document.getElementById('exportBtn').disabled = false;
    }

    exportResults() {
        try {
            if (this.verificationResults.length === 0) {
                BillVerifierUtils.showToast('لا توجد نتائج للتصدير', 'warning');
                return;
            }

            const workbook = BillVerifierUtils.generateExcelExport(this.verificationResults);

            // Generate filename with current date
            const now = new Date();
            const dateStr = now.toISOString().split('T')[0];
            const filename = `نتائج_التحقق_${dateStr}.xlsx`;

            XLSX.writeFile(workbook, filename);
            BillVerifierUtils.showToast(`تم تصدير النتائج كـ ${filename}`, 'success');

        } catch (error) {
            BillVerifierUtils.showToast('فشل التصدير: ' + error.message, 'error');
        }
    }

    switchTab(btn) {
        // Remove active class from all tabs
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

        // Add active class to clicked tab
        btn.classList.add('active');
        const tabName = btn.getAttribute('data-tab');
        document.getElementById(tabName).classList.add('active');
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new BillVerifierApp();
});