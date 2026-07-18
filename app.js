/**
 * HR Dashboard - Main Application Controller
 * 
 * Orchestrates all CRUD operations, navigation, UI state management,
 * and user interaction flows for the Employee Record Management System.
 * 
 * Architecture:
 * - config.js       → Connection & DB settings
 * - jpdb-helper.js  → Low-level JPDB API wrappers (AJAX)
 * - validation.js   → Form validation & state-aware button logic
 * - app.js (this)   → High-level orchestration & UI event handling
 */

const HRApp = (function() {
    'use strict';

    // ─── State ──────────────────────────────────────────────
    
    let currentLoadedEmpId = null;  // Tracks which record is currently loaded
    let isLoading = false;          // Prevents concurrent AJAX calls

    // ─── DOM References (cached after DOMContentLoaded) ──────
    
    let dom = {};

    // ─── Initialization ─────────────────────────────────────

    /**
     * Initialize the HR Dashboard application.
     * Called on DOMContentLoaded.
     */
    function init() {
        cacheDom();
        FormValidation.init();
        attachEventListeners();
        checkJpdbConnection();
        updateNavButtonStates();
    }

    /**
     * Cache frequently-used DOM element references.
     */
    function cacheDom() {
        dom = {
            // Form fields
            empId: document.getElementById('empId'),
            empName: document.getElementById('empName'),
            empSalary: document.getElementById('empSalary'),
            empDept: document.getElementById('empDept'),
            employeeForm: document.getElementById('employeeForm'),

            // Buttons
            btnSave: document.getElementById('btnSave'),
            btnUpdate: document.getElementById('btnUpdate'),
            btnDelete: document.getElementById('btnDelete'),
            btnReset: document.getElementById('btnReset'),

            // Navigation buttons
            btnFirst: document.getElementById('btnFirst'),
            btnPrev: document.getElementById('btnPrev'),
            btnNext: document.getElementById('btnNext'),
            btnLast: document.getElementById('btnLast'),

            // Record card
            recordCard: document.getElementById('recordCard'),
            recordCardPlaceholder: document.querySelector('.record-card-placeholder'),
            recordCardData: document.getElementById('recordCardData'),
            recordPosition: document.getElementById('recordPosition'),
            recId: document.getElementById('recId'),
            recName: document.getElementById('recName'),
            recSalary: document.getElementById('recSalary'),
            recDept: document.getElementById('recDept'),

            // Connection status
            connectionStatus: document.getElementById('connectionStatus'),
            statusDot: document.querySelector('.status-dot'),
            statusText: document.querySelector('.status-text'),

            // Toast container
            toastContainer: document.getElementById('toastContainer')
        };
    }

    /**
     * Attach all event listeners to form and navigation controls.
     */
    function attachEventListeners() {
        // Prevent form submission on Enter key
        dom.employeeForm.addEventListener('submit', (e) => e.preventDefault());

        // --- CRUD Action Buttons ---
        dom.btnSave.addEventListener('click', handleSave);
        dom.btnUpdate.addEventListener('click', handleUpdate);
        dom.btnDelete.addEventListener('click', handleDelete);
        dom.btnReset.addEventListener('click', handleReset);

        // --- Navigation Buttons ---
        dom.btnFirst.addEventListener('click', () => navigate('FIRST_RECORD'));
        dom.btnPrev.addEventListener('click', () => navigate('PREV_RECORD'));
        dom.btnNext.addEventListener('click', () => navigate('NEXT_RECORD'));
        dom.btnLast.addEventListener('click', () => navigate('LAST_RECORD'));

        // --- Employee ID Blur: Auto-search for existing record ---
        dom.empId.addEventListener('blur', function() {
            const id = this.value.trim();
            if (id && FormValidation.isFieldValid('empId')) {
                fetchAndLoadRecord(id);
            }
        });

        // --- Keyboard shortcuts ---
        document.addEventListener('keydown', handleKeyboardShortcuts);
    }

    // ─── Connection Check ───────────────────────────────────

    /**
     * Check JsonPowerDB server connectivity and update status indicator.
     */
    async function checkJpdbConnection() {
        updateConnectionStatus('checking', 'Checking connection to JPDB...');

        try {
            const connected = await JPDBHelper.checkConnection();
            if (connected) {
                updateConnectionStatus('connected', 'JPDB Connected');
            } else {
                updateConnectionStatus('error', 'JPDB Unreachable');
            }
        } catch (err) {
            updateConnectionStatus('error', 'Connection Error');
        }
    }

    /**
     * Update the connection status UI element.
     * @param {string} state - 'checking', 'connected', 'error'
     * @param {string} text - Status text to display
     */
    function updateConnectionStatus(state, text) {
        dom.statusDot.className = 'status-dot';
        if (state === 'connected') dom.statusDot.classList.add('connected');
        if (state === 'error') dom.statusDot.classList.add('error');
        dom.statusText.textContent = text;
    }

    // ─── CRUD Operations ────────────────────────────────────

    /**
     * Handle the Save button click.
     * Creates a new employee record in JPDB.
     */
    async function handleSave() {
        if (!FormValidation.validateAll()) return;
        if (isLoading) return;

        const record = FormValidation.getFormData();

        // Quick duplicate check before save
        try {
            const existing = await JPDBHelper.getRecord(record.emp_id);
            if (existing.data && existing.data.data) {
                // Record already exists!
                showToast('error', 'Duplicate ID', `Employee ID "${record.emp_id}" already exists. Use Update instead.`);
                FormValidation.setMode('edit');
                return;
            }
        } catch (err) {
            // If GET fails (record not found), that's good - we can proceed with PUT
        }

        setLoading(true);
        try {
            const response = await JPDBHelper.createRecord(record);
            
            if (response.data && response.data.message && 
                response.data.message.toLowerCase().includes('success')) {
                showToast('success', 'Record Created', `Employee "${record.emp_name}" saved successfully.`);
                currentLoadedEmpId = record.emp_id;
                FormValidation.setMode('edit');
                FormValidation.populateForm(record);
                updateRecordCard(record);
                updateNavButtonStates();
            } else {
                const errMsg = response.data?.message || 'Unknown server error.';
                showToast('error', 'Save Failed', errMsg);
            }
        } catch (err) {
            showToast('error', 'Network Error', err.error || 'Failed to connect to JPDB server.');
        } finally {
            setLoading(false);
        }
    }

    /**
     * Handle the Update button click.
     * Modifies the currently loaded employee record.
     */
    async function handleUpdate() {
        if (!FormValidation.validateAll()) return;
        if (isLoading) return;
        if (!currentLoadedEmpId) {
            showToast('warning', 'No Record', 'Load a record first using Employee ID search or navigation.');
            return;
        }

        const record = FormValidation.getFormData();

        setLoading(true);
        try {
            const response = await JPDBHelper.updateRecord(currentLoadedEmpId, record);

            if (response.data && response.data.message && 
                response.data.message.toLowerCase().includes('success')) {
                showToast('success', 'Record Updated', `Employee "${record.emp_name}" updated successfully.`);
                updateRecordCard(record);
            } else {
                const errMsg = response.data?.message || 'Unknown server error.';
                showToast('error', 'Update Failed', errMsg);
            }
        } catch (err) {
            showToast('error', 'Network Error', err.error || 'Failed to connect to JPDB server.');
        } finally {
            setLoading(false);
        }
    }

    /**
     * Handle the Delete button click.
     * Removes the currently loaded employee record after confirmation.
     */
    async function handleDelete() {
        if (isLoading) return;
        if (!currentLoadedEmpId) {
            showToast('warning', 'No Record', 'Load a record first before deleting.');
            return;
        }

        const record = FormValidation.getFormData();

        // Show confirmation modal
        const confirmed = await showConfirmModal(
            'Delete Employee Record',
            `Are you sure you want to permanently delete the record for <strong>${record.emp_name}</strong> (ID: ${currentLoadedEmpId})? This action cannot be undone.`
        );

        if (!confirmed) return;

        setLoading(true);
        try {
            const response = await JPDBHelper.removeRecord(currentLoadedEmpId);

            if (response.data && response.data.message && 
                response.data.message.toLowerCase().includes('success')) {
                showToast('success', 'Record Deleted', `Employee "${record.emp_name}" has been removed.`);
                currentLoadedEmpId = null;
                FormValidation.clearForm();
                clearRecordCard();
                updateNavButtonStates();
            } else {
                const errMsg = response.data?.message || 'Unknown server error.';
                showToast('error', 'Delete Failed', errMsg);
            }
        } catch (err) {
            showToast('error', 'Network Error', err.error || 'Failed to connect to JPDB server.');
        } finally {
            setLoading(false);
        }
    }

    /**
     * Handle the Reset button click.
     * Clears the form and resets all state.
     */
    function handleReset() {
        currentLoadedEmpId = null;
        FormValidation.clearForm();
        clearRecordCard();
        updateNavButtonStates();
        showToast('info', 'Form Reset', 'All fields have been cleared.');
    }

    // ─── Record Fetch & Navigation ─────────────────────────

    /**
     * Fetch a record by Employee ID and load it into the form.
     * @param {string} empId - Employee ID to search for
     */
    async function fetchAndLoadRecord(empId) {
        if (isLoading) return;
        
        setLoading(true);
        try {
            const response = await JPDBHelper.getRecord(empId);
            
            if (response.data && response.data.data) {
                const record = response.data.data;
                
                // Flatten: JPDB may return nested JSON
                const flatRecord = flattenJpdbRecord(record);
                
                currentLoadedEmpId = flatRecord.emp_id;
                FormValidation.populateForm(flatRecord);
                updateRecordCard(flatRecord);
                updateNavButtonStates();
                showToast('success', 'Record Found', `Loaded employee: ${flatRecord.emp_name}`);
            } else if (response.data && response.data.message) {
                const msg = response.data.message;
                if (msg.toLowerCase().includes('not found') || msg.toLowerCase().includes('no data')) {
                    // Record doesn't exist - switch to save mode
                    currentLoadedEmpId = null;
                    FormValidation.clearForm();
                    // Restore the ID the user typed
                    dom.empId.value = empId;
                    FormValidation.validateField('empId');
                    FormValidation.setMode('save');
                    showToast('info', 'New Record', `No record found for ID "${empId}". You can create a new one.`);
                } else {
                    showToast('error', 'Lookup Error', msg);
                }
            }
        } catch (err) {
            showToast('error', 'Network Error', err.error || 'Failed to connect to JPDB server.');
        } finally {
            setLoading(false);
        }
    }

    /**
     * Navigate to a specific record using JPDB IML commands.
     * @param {string} command - IML command: FIRST_RECORD, LAST_RECORD, PREV_RECORD, NEXT_RECORD
     */
    async function navigate(command) {
        if (isLoading) return;

        setLoading(true);
        try {
            const response = await JPDBHelper.executeImlCommand(command, currentLoadedEmpId);

            if (response.data && response.data.data) {
                const record = flattenJpdbRecord(response.data.data);
                
                currentLoadedEmpId = record.emp_id;
                FormValidation.populateForm(record);
                updateRecordCard(record);
                updateNavButtonStates();

                const actionNames = {
                    'FIRST_RECORD': 'First record',
                    'LAST_RECORD': 'Last record',
                    'PREV_RECORD': 'Previous record',
                    'NEXT_RECORD': 'Next record'
                };
                showToast('success', actionNames[command] || 'Record', `Loaded: ${record.emp_name}`);
            } else if (response.data && response.data.message) {
                const msg = response.data.message;
                if (msg.toLowerCase().includes('no data') || msg.toLowerCase().includes('not found')) {
                    showToast('info', 'No Records', 'No more records found in this direction.');
                    updateNavButtonStates();
                } else {
                    showToast('error', 'Navigation Error', msg);
                }
            }
        } catch (err) {
            showToast('error', 'Network Error', err.error || 'Failed to navigate records.');
        } finally {
            setLoading(false);
        }
    }

    /**
     * Flatten a potentially nested JPDB record into a consistent format.
     * JPDB sometimes nests the full JSON string inside the 'record' field.
     * @param {Object} data - Raw JPDB record data
     * @returns {Object} Flat record with emp_id, emp_name, emp_salary, emp_dept
     */
    function flattenJpdbRecord(data) {
        // If data has a 'record' field that's a string, parse it
        if (data.record && typeof data.record === 'string') {
            try {
                data = JSON.parse(data.record);
            } catch (e) {
                // Not parseable JSON, use as-is
            }
        }

        // If data has a 'jsonStr' field (common in IML responses), parse it
        if (data.jsonStr && typeof data.jsonStr === 'string') {
            try {
                const parsed = JSON.parse(data.jsonStr);
                data = { ...data, ...parsed };
            } catch (e) {
                // Not parseable
            }
        }

        return {
            emp_id: data.emp_id || data.empId || data.EMP_ID || data.id || '—',
            emp_name: data.emp_name || data.empName || data.EMP_NAME || data.name || '—',
            emp_salary: Number(data.emp_salary || data.empSalary || data.EMP_SALARY || data.salary || 0),
            emp_dept: data.emp_dept || data.empDept || data.EMP_DEPT || data.dept || data.department || '—'
        };
    }

    /**
     * Update the record card display in the right panel.
     * @param {Object} record 
     */
    function updateRecordCard(record) {
        dom.recordCardPlaceholder.style.display = 'none';
        dom.recordCardData.style.display = 'flex';
        dom.recordPosition.style.display = 'block';

        dom.recId.textContent = record.emp_id;
        dom.recName.textContent = record.emp_name;
        dom.recSalary.textContent = '₹' + Number(record.emp_salary).toLocaleString('en-IN');
        dom.recDept.textContent = record.emp_dept;

        dom.recordPosition.textContent = 'Currently viewing record';
    }

    /**
     * Clear the record card and show the placeholder.
     */
    function clearRecordCard() {
        dom.recordCardPlaceholder.style.display = 'flex';
        dom.recordCardData.style.display = 'none';
        dom.recordPosition.style.display = 'none';
        dom.recordPosition.textContent = '';
    }

    /**
     * Update navigation button states based on current context.
     */
    function updateNavButtonStates() {
        // Navigation buttons are always enabled — they just return
        // "no data" messages if at boundaries
        dom.btnFirst.disabled = false;
        dom.btnPrev.disabled = false;
        dom.btnNext.disabled = false;
        dom.btnLast.disabled = false;
    }

    // ─── Loading State ──────────────────────────────────────

    /**
     * Set the global loading state and show/hide loading overlay.
     * @param {boolean} loading 
     */
    function setLoading(loading) {
        isLoading = loading;

        // Remove any existing overlay
        const existing = document.querySelector('.loading-overlay');
        if (existing) existing.remove();

        if (loading) {
            const overlay = document.createElement('div');
            overlay.className = 'loading-overlay';
            overlay.innerHTML = '<div class="spinner"></div>';
            document.body.appendChild(overlay);
        }
    }

    // ─── Toast Notifications ────────────────────────────────

    /**
     * Display a toast notification.
     * @param {string} type - 'success', 'error', 'warning', 'info'
     * @param {string} title - Toast title
     * @param {string} message - Toast body text
     */
    function showToast(type, title, message) {
        const icons = {
            success: '✓',
            error: '✗',
            warning: '⚠',
            info: 'ℹ'
        };

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <span class="toast-icon">${icons[type] || icons.info}</span>
            <div class="toast-body">
                <div class="toast-title">${title}</div>
                ${message ? `<div class="toast-message">${message}</div>` : ''}
            </div>
            <button class="toast-close" aria-label="Close notification">&times;</button>
        `;

        dom.toastContainer.appendChild(toast);

        // Close button handler
        const closeBtn = toast.querySelector('.toast-close');
        closeBtn.addEventListener('click', () => removeToast(toast));

        // Auto-remove after duration
        const timer = setTimeout(() => removeToast(toast), APP_CONFIG.toastDuration);

        // Store timer on element for cleanup
        toast._timer = timer;
    }

    /**
     * Remove a toast notification with animation.
     * @param {HTMLElement} toast 
     */
    function removeToast(toast) {
        if (toast._removing) return;
        toast._removing = true;

        clearTimeout(toast._timer);
        toast.classList.add('toast-removing');

        toast.addEventListener('animationend', () => {
            if (toast.parentNode) {
                toast.remove();
            }
        }, { once: true });

        // Fallback removal
        setTimeout(() => {
            if (toast.parentNode) toast.remove();
        }, 300);
    }

    // ─── Confirmation Modal ─────────────────────────────────

    /**
     * Display a confirmation dialog and return user choice.
     * @param {string} title - Modal title
     * @param {string} message - Modal body (HTML allowed)
     * @returns {Promise<boolean>} True if confirmed, false if cancelled
     */
    function showConfirmModal(title, message) {
        return new Promise((resolve) => {
            const backdrop = document.createElement('div');
            backdrop.className = 'modal-backdrop';
            backdrop.innerHTML = `
                <div class="modal-dialog">
                    <div class="modal-header">
                        <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="var(--color-danger)" stroke-width="2">
                            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                            <line x1="12" y1="9" x2="12" y2="13"/>
                            <line x1="12" y1="17" x2="12.01" y2="17"/>
                        </svg>
                        <h3>${title}</h3>
                    </div>
                    <div class="modal-body">${message}</div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-outline" id="modalCancel">Cancel</button>
                        <button type="button" class="btn btn-danger" id="modalConfirm">Delete Record</button>
                    </div>
                </div>
            `;

            document.body.appendChild(backdrop);

            const cancelBtn = backdrop.querySelector('#modalCancel');
            const confirmBtn = backdrop.querySelector('#modalConfirm');

            function cleanup(confirmed) {
                backdrop.classList.add('toast-removing');
                backdrop.addEventListener('animationend', () => backdrop.remove(), { once: true });
                setTimeout(() => { if (backdrop.parentNode) backdrop.remove(); }, 300);
                resolve(confirmed);
            }

            cancelBtn.addEventListener('click', () => cleanup(false));
            confirmBtn.addEventListener('click', () => cleanup(true));

            // Close on backdrop click
            backdrop.addEventListener('click', (e) => {
                if (e.target === backdrop) cleanup(false);
            });

            // Close on Escape key
            function escHandler(e) {
                if (e.key === 'Escape') {
                    document.removeEventListener('keydown', escHandler);
                    cleanup(false);
                }
            }
            document.addEventListener('keydown', escHandler);

            // Auto-close timeout
            setTimeout(() => cleanup(false), APP_CONFIG.confirmTimeout);

            // Focus the cancel button
            cancelBtn.focus();
        });
    }

    // ─── Keyboard Shortcuts ─────────────────────────────────

    /**
     * Handle keyboard shortcuts for navigation and actions.
     * @param {KeyboardEvent} e 
     */
    function handleKeyboardShortcuts(e) {
        // Don't trigger shortcuts when typing in input fields
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || e.target.tagName === 'TEXTAREA') {
            return;
        }

        switch (e.key) {
            case 'ArrowLeft':
                if (!e.ctrlKey && !e.metaKey) {
                    e.preventDefault();
                    navigate('PREV_RECORD');
                }
                break;
            case 'ArrowRight':
                if (!e.ctrlKey && !e.metaKey) {
                    e.preventDefault();
                    navigate('NEXT_RECORD');
                }
                break;
            case 'Home':
                if (!e.ctrlKey && !e.metaKey) {
                    e.preventDefault();
                    navigate('FIRST_RECORD');
                }
                break;
            case 'End':
                if (!e.ctrlKey && !e.metaKey) {
                    e.preventDefault();
                    navigate('LAST_RECORD');
                }
                break;
            case 'Delete':
                if (e.ctrlKey && currentLoadedEmpId && !isLoading) {
                    e.preventDefault();
                    handleDelete();
                }
                break;
            case 's':
            case 'S':
                if (e.ctrlKey && !currentLoadedEmpId && !isLoading) {
                    e.preventDefault();
                    handleSave();
                }
                break;
        }
    }

    // ─── Public API ─────────────────────────────────────────

    return {
        init: init
    };

})();

// ─── Bootstrap: Start the application when DOM is ready ────
document.addEventListener('DOMContentLoaded', function() {
    HRApp.init();
});
