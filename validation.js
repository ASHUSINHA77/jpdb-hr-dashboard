/**
 * HR Dashboard - Form Validation Module
 * Provides real-time field-level validation and form-wide validation.
 * Implements state-aware UI control logic for smart button states.
 */

const FormValidation = (function() {
    'use strict';

    // Cache DOM references (initialized later)
    let elements = {};

    // Validation state
    let validationState = {
        empId: { valid: false, dirty: false },
        empName: { valid: false, dirty: false },
        empSalary: { valid: false, dirty: false },
        empDept: { valid: false, dirty: false }
    };

    // Mode tracking: 'save' (default/new record) or 'edit' (existing record loaded)
    let currentMode = 'save';

    /**
     * Initialize validation - attach event listeners to form fields.
     */
    function init() {
        elements = {
            empId: document.getElementById('empId'),
            empName: document.getElementById('empName'),
            empSalary: document.getElementById('empSalary'),
            empDept: document.getElementById('empDept'),
            empIdError: document.getElementById('empIdError'),
            empNameError: document.getElementById('empNameError'),
            empSalaryError: document.getElementById('empSalaryError'),
            empDeptError: document.getElementById('empDeptError'),
            empIdIcon: document.getElementById('empIdIcon'),
            empNameIcon: document.getElementById('empNameIcon'),
            empSalaryIcon: document.getElementById('empSalaryIcon'),
            empDeptIcon: document.getElementById('empDeptIcon'),
            btnSave: document.getElementById('btnSave'),
            btnUpdate: document.getElementById('btnUpdate'),
            btnDelete: document.getElementById('btnDelete'),
            btnReset: document.getElementById('btnReset')
        };

        // Attach blur listeners for real-time validation
        elements.empId.addEventListener('blur', () => validateField('empId'));
        elements.empName.addEventListener('blur', () => validateField('empName'));
        elements.empSalary.addEventListener('blur', () => validateField('empSalary'));
        elements.empDept.addEventListener('blur', () => validateField('empDept'));

        // Attach input listeners to clear validation state while typing
        elements.empId.addEventListener('input', () => {
            clearFieldValidation('empId');
        });
        elements.empName.addEventListener('input', () => {
            clearFieldValidation('empName');
        });
        elements.empSalary.addEventListener('input', () => {
            clearFieldValidation('empSalary');
        });
        elements.empDept.addEventListener('change', () => {
            clearFieldValidation('empDept');
            validateField('empDept');
        });

        // Initial state
        updateButtonStates();
    }

    /**
     * Validate a single field and update its UI state.
     * @param {string} fieldName - The field to validate
     * @returns {boolean} Whether the field is valid
     */
    function validateField(fieldName) {
        const field = elements[fieldName];
        const errorEl = elements[fieldName + 'Error'];
        const iconEl = elements[fieldName + 'Icon'];

        if (!field) return false;

        validationState[fieldName].dirty = true;

        let isValid = true;
        let errorMessage = '';

        switch (fieldName) {
            case 'empId':
                if (!field.value.trim()) {
                    isValid = false;
                    errorMessage = 'Employee ID is required.';
                } else if (!/^[A-Za-z0-9_\-]+$/.test(field.value.trim())) {
                    isValid = false;
                    errorMessage = 'Only letters, numbers, hyphens, and underscores allowed.';
                } else if (field.value.trim().length < 2) {
                    isValid = false;
                    errorMessage = 'Employee ID must be at least 2 characters.';
                } else if (field.value.trim().length > 30) {
                    isValid = false;
                    errorMessage = 'Employee ID must not exceed 30 characters.';
                }
                break;

            case 'empName':
                if (!field.value.trim()) {
                    isValid = false;
                    errorMessage = 'Employee name is required.';
                } else if (field.value.trim().length < 2) {
                    isValid = false;
                    errorMessage = 'Name must be at least 2 characters.';
                } else if (field.value.trim().length > 100) {
                    isValid = false;
                    errorMessage = 'Name must not exceed 100 characters.';
                } else if (!/^[A-Za-z\s.'\-]+$/.test(field.value.trim())) {
                    isValid = false;
                    errorMessage = 'Name can only contain letters, spaces, dots, apostrophes, and hyphens.';
                }
                break;

            case 'empSalary':
                const salary = parseFloat(field.value);
                if (isNaN(salary) || field.value === '') {
                    isValid = false;
                    errorMessage = 'Salary is required.';
                } else if (salary < 0) {
                    isValid = false;
                    errorMessage = 'Salary cannot be negative.';
                } else if (salary > 99999999) {
                    isValid = false;
                    errorMessage = 'Salary exceeds maximum allowed value.';
                }
                break;

            case 'empDept':
                if (!field.value) {
                    isValid = false;
                    errorMessage = 'Please select a department.';
                }
                break;
        }

        // Update validation state
        validationState[fieldName].valid = isValid;

        // Update UI
        if (isValid) {
            field.classList.remove('input-invalid');
            field.classList.add('input-valid');
            if (errorEl) errorEl.textContent = '';
            if (iconEl) {
                iconEl.textContent = '✓';
                iconEl.style.color = 'var(--color-success)';
                iconEl.classList.add('visible');
            }
        } else {
            field.classList.remove('input-valid');
            field.classList.add('input-invalid');
            if (errorEl) errorEl.textContent = errorMessage;
            if (iconEl) {
                iconEl.textContent = '✗';
                iconEl.style.color = 'var(--color-danger)';
                iconEl.classList.add('visible');
            }
        }

        updateButtonStates();
        return isValid;
    }

    /**
     * Clear validation state for a field while user is editing it.
     * @param {string} fieldName 
     */
    function clearFieldValidation(fieldName) {
        const field = elements[fieldName];
        const iconEl = elements[fieldName + 'Icon'];

        if (field) {
            field.classList.remove('input-valid', 'input-invalid');
        }
        if (iconEl) {
            iconEl.classList.remove('visible');
            iconEl.textContent = '';
        }
        validationState[fieldName].valid = false;
        updateButtonStates();
    }

    /**
     * Validate the entire form.
     * @returns {boolean} True if all fields pass validation
     */
    function validateAll() {
        const fields = ['empId', 'empName', 'empSalary', 'empDept'];
        let allValid = true;

        fields.forEach(fieldName => {
            // Mark all fields as dirty so errors show
            validationState[fieldName].dirty = true;
            const valid = validateField(fieldName);
            if (!valid) allValid = false;
        });

        return allValid;
    }

    /**
     * Check if a specific field is valid.
     * @param {string} fieldName 
     * @returns {boolean}
     */
    function isFieldValid(fieldName) {
        return validationState[fieldName]?.valid || false;
    }

    /**
     * Reset all validation state.
     */
    function reset() {
        const fields = ['empId', 'empName', 'empSalary', 'empDept'];
        fields.forEach(f => {
            validationState[f] = { valid: false, dirty: false };
            if (elements[f]) {
                elements[f].classList.remove('input-valid', 'input-invalid', 'input-warning');
            }
            const iconEl = elements[f + 'Icon'];
            if (iconEl) {
                iconEl.classList.remove('visible');
                iconEl.textContent = '';
            }
            const errorEl = elements[f + 'Error'];
            if (errorEl) errorEl.textContent = '';
        });
        setMode('save');
        updateButtonStates();
    }

    /**
     * Set the form mode.
     * 'save' = Creating a new record (Save enabled, Update/Delete disabled)
     * 'edit' = Editing existing record (Save disabled, Update/Delete enabled)
     * @param {string} mode - 'save' or 'edit'
     */
    function setMode(mode) {
        currentMode = mode;
        updateButtonStates();
    }

    /**
     * Get the current form mode.
     * @returns {string} 'save' or 'edit'
     */
    function getMode() {
        return currentMode;
    }

    /**
     * Update button enabled/disabled states based on form mode and validation.
     * 
     * Logic:
     * - In 'save' mode: Save is enabled (if form valid), Update/Delete are disabled.
     * - In 'edit' mode: Save is DISABLED (duplicate prevention), Update/Delete are enabled (if form valid).
     * - Reset is always enabled.
     */
    function updateButtonStates() {
        const { btnSave, btnUpdate, btnDelete } = elements;

        if (!btnSave || !btnUpdate || !btnDelete) return;

        const formValid = isFormValid();

        if (currentMode === 'save') {
            // Save mode: creating new record
            btnSave.disabled = !formValid;
            btnUpdate.disabled = true;   // Disabled until a record is loaded
            btnDelete.disabled = true;   // Disabled until a record is loaded
        } else if (currentMode === 'edit') {
            // Edit mode: existing record loaded
            btnSave.disabled = true;      // Disabled to prevent duplicate ID insertion
            btnUpdate.disabled = !formValid; // Enabled only when form is valid
            btnDelete.disabled = false;   // Always enabled in edit mode (record exists)
        }
    }

    /**
     * Check if the entire form is valid.
     * @returns {boolean}
     */
    function isFormValid() {
        return validationState.empId.valid &&
               validationState.empName.valid &&
               validationState.empSalary.valid &&
               validationState.empDept.valid;
    }

    /**
     * Get all form field values as an object.
     * @returns {Object} Form data { emp_id, emp_name, emp_salary, emp_dept }
     */
    function getFormData() {
        return {
            emp_id: elements.empId.value.trim(),
            emp_name: elements.empName.value.trim(),
            emp_salary: parseFloat(elements.empSalary.value) || 0,
            emp_dept: elements.empDept.value
        };
    }

    /**
     * Populate the form with existing record data.
     * Sets the form to 'edit' mode.
     * @param {Object} record - Record object with emp_id, emp_name, emp_salary, emp_dept
     */
    function populateForm(record) {
        if (!record) return;

        elements.empId.value = record.emp_id || '';
        elements.empName.value = record.emp_name || '';
        elements.empSalary.value = record.emp_salary !== undefined ? record.emp_salary : '';
        elements.empDept.value = record.emp_dept || '';

        // Mark all fields as valid since data loaded from DB is pre-validated
        ['empId', 'empName', 'empSalary', 'empDept'].forEach(f => {
            validationState[f].valid = true;
            validationState[f].dirty = true;
            if (elements[f]) {
                elements[f].classList.remove('input-invalid');
                elements[f].classList.add('input-valid');
            }
            const iconEl = elements[f + 'Icon'];
            if (iconEl) {
                iconEl.textContent = '✓';
                iconEl.style.color = 'var(--color-success)';
                iconEl.classList.add('visible');
            }
        });

        // Disable ID field in edit mode to prevent changing primary key
        elements.empId.disabled = true;

        setMode('edit');
    }

    /**
     * Clear the form and reset to 'save' mode.
     */
    function clearForm() {
        elements.empId.value = '';
        elements.empName.value = '';
        elements.empSalary.value = '';
        elements.empDept.value = '';

        // Re-enable ID field
        elements.empId.disabled = false;

        reset();
    }

    // ─── Expose Public API ───────────────────────────────────

    return {
        init: init,
        validateField: validateField,
        validateAll: validateAll,
        isFieldValid: isFieldValid,
        isFormValid: isFormValid,
        getFormData: getFormData,
        populateForm: populateForm,
        clearForm: clearForm,
        setMode: setMode,
        getMode: getMode,
        reset: reset
    };

})();
