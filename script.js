// ==================== GLOBAL VARIABLES ====================
let currentUser = null;
const STORAGE_KEY = 'ipt_demo_v1';

// Global database object
window.db = {
    accounts: [],
    departments: [],
    employees: [],
    requests: []
};

// ==================== STORAGE FUNCTIONS ====================

function loadFromStorage() {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            window.db = JSON.parse(stored);
        } else {
            // Seed initial data
            window.db = {
                accounts: [
                    {
                        firstName: 'French Cyril',
                        lastName: 'Sambilad',
                        email: 'admin@example.com',
                        password: 'Password123!',
                        role: 'Admin',
                        verified: true
                    },
                    {
                        firstName: 'Regular',
                        lastName: 'User',
                        email: 'user@example.com',
                        password: 'user123',
                        role: 'User',
                        verified: true
                    }
                ],
                departments: [
                    { id: 1, name: 'Engineering', description: 'Software Development Team' },
                    { id: 2, name: 'HR', description: 'Human Resources Department' },
                    { id: 3, name: 'Marketing', description: 'Marketing and Communications' }
                ],
                employees: [],
                requests: []
            };
            saveToStorage();
        }
    } catch (error) {
        console.error('Error loading from storage:', error);
        showToast('Error loading data', 'danger');
    }
}

function saveToStorage() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(window.db));
    } catch (error) {
        console.error('Error saving to storage:', error);
        showToast('Error saving data', 'danger');
    }
}

// ==================== ROUTING SYSTEM ====================

function navigateTo(hash) {
    window.location.hash = hash;
}

function handleRouting() {
    const hash = window.location.hash || '#/';
    const route = hash.substring(2); // Remove '#/'
    
    // Hide all pages
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    
    // Protected routes (require authentication)
    const protectedRoutes = ['profile', 'requests', 'employees', 'departments', 'accounts', 'all-requests'];
    const adminRoutes = ['employees', 'departments', 'accounts', 'all-requests'];
    
    // Check authentication for protected routes
    if (protectedRoutes.includes(route)) {
        if (!currentUser) {
            showToast('Please log in to access this page', 'warning');
            navigateTo('#/login');
            return;
        }
        
        // Check admin access
        if (adminRoutes.includes(route) && currentUser.role !== 'Admin') {
            showToast('Admin access required', 'danger');
            navigateTo('#/');
            return;
        }
    }
    
    // Show the appropriate page
    let pageId = route === '' ? 'home' : route;
    pageId = pageId + '-page';
    
    const targetPage = document.getElementById(pageId);
    if (targetPage) {
        targetPage.classList.add('active');
        
        // Render page-specific content
        switch(route) {
            case 'profile':
                renderProfile();
                break;
            case 'employees':
                renderEmployees();
                break;
            case 'departments':
                renderDepartments();
                break;
            case 'accounts':
                renderAccounts();
                break;
            case 'requests':
                renderRequests();
                break;
            case 'all-requests':
                renderAllRequests();
                break;
        }
    } else {
        // Page not found, go home
        document.getElementById('home-page').classList.add('active');
    }
}

// ==================== AUTHENTICATION ====================

function setAuthState(isAuth, user = null) {
    currentUser = user;
    const body = document.body;
    
    if (isAuth && user) {
        body.classList.remove('not-authenticated');
        body.classList.add('authenticated');
        
        // Set admin class if user is admin
        if (user.role === 'Admin') {
            body.classList.add('is-admin');
        } else {
            body.classList.remove('is-admin');
        }
        
        // Update username display
        const usernameDisplay = document.getElementById('username-display');
        if (usernameDisplay) {
            usernameDisplay.textContent = user.firstName + ' ' + user.lastName;
        }
    } else {
        body.classList.remove('authenticated', 'is-admin');
        body.classList.add('not-authenticated');
        currentUser = null;
    }
}

function checkStoredAuth() {
    const authToken = localStorage.getItem('auth_token');
    if (authToken) {
        const user = window.db.accounts.find(acc => acc.email === authToken && acc.verified);
        if (user) {
            setAuthState(true, user);
        } else {
            localStorage.removeItem('auth_token');
        }
    }
}

// ==================== REGISTRATION ====================

function handleRegister(e) {
    e.preventDefault();
    
    const firstName = document.getElementById('reg-firstname').value.trim();
    const lastName = document.getElementById('reg-lastname').value.trim();
    const email = document.getElementById('reg-email').value.trim().toLowerCase();
    const password = document.getElementById('reg-password').value;
    const confirmPassword = document.getElementById('reg-confirm-password').value;
    
    // Enhanced validation
    if (!firstName || !lastName) {
        showToast('Please enter your full name', 'danger');
        return;
    }
    
    if (firstName.length < 2 || lastName.length < 2) {
        showToast('Names must be at least 2 characters', 'danger');
        return;
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showToast('Please enter a valid email address', 'danger');
        return;
    }
    
    // Password validation
    if (password.length < 6) {
        showToast('Password must be at least 6 characters', 'danger');
        return;
    }
    
    // Password confirmation validation
    if (password !== confirmPassword) {
        showToast('Passwords do not match. Please try again.', 'danger');
        return;
    }
    
    // Check if email already exists
    const existingAccount = window.db.accounts.find(acc => acc.email === email);
    if (existingAccount) {
        showToast('Email already registered. Please use a different email.', 'danger');
        return;
    }
    
    // Create new account
    const newAccount = {
        firstName,
        lastName,
        email,
        password,
        role: 'User',
        verified: false
    };
    
    window.db.accounts.push(newAccount);
    saveToStorage();
    
    // Store unverified email
    localStorage.setItem('unverified_email', email);
    
    showToast('Registration successful! Please verify your email.', 'success');
    navigateTo('#/verify-email');
}

// ==================== EMAIL VERIFICATION ====================

function showVerifyEmail() {
    const email = localStorage.getItem('unverified_email');
    const display = document.getElementById('verify-email-display');
    if (display && email) {
        display.textContent = email;
    }
}

function simulateEmailVerification() {
    const email = localStorage.getItem('unverified_email');
    if (!email) {
        showToast('No email to verify', 'danger');
        return;
    }
    
    const account = window.db.accounts.find(acc => acc.email === email);
    if (account) {
        account.verified = true;
        saveToStorage();
        localStorage.removeItem('unverified_email');
        showToast('Email verified successfully!', 'success');
        
        // Show success message and redirect
        const loginMessage = document.getElementById('login-message');
        if (loginMessage) {
            loginMessage.innerHTML = '<div class="alert alert-success">✅ Email verified! You may now log in.</div>';
        }
        
        navigateTo('#/login');
    } else {
        showToast('Account not found', 'danger');
    }
}

// ==================== LOGIN ====================

function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('login-email').value.trim().toLowerCase();
    const password = document.getElementById('login-password').value;
    
    // Validation
    if (!email || !password) {
        showToast('Please enter both email and password', 'danger');
        return;
    }
    
    // Find account
    const account = window.db.accounts.find(acc => acc.email === email);
    
    if (!account) {
        showToast('Account not found. Please register first.', 'danger');
        return;
    }
    
    if (!account.verified) {
        showToast('Email not verified. Please check your email for verification link.', 'warning');
        localStorage.setItem('unverified_email', email);
        setTimeout(() => navigateTo('#/verify-email'), 1500);
        return;
    }
    
    if (account.password !== password) {
        showToast('Incorrect password. Please try again.', 'danger');
        return;
    }
    
    // Successful login
    localStorage.setItem('auth_token', email);
    setAuthState(true, account);
    showToast(`Welcome back, ${account.firstName}!`, 'success');
    navigateTo('#/profile');
}

// ==================== LOGOUT ====================

function handleLogout() {
    localStorage.removeItem('auth_token');
    setAuthState(false);
    showToast('Logged out successfully', 'info');
    navigateTo('#/');
}

// ==================== PROFILE EDIT ====================

function editProfile() {
    if (!currentUser) return;
    
    // Populate form with current values
    document.getElementById('edit-firstname').value = currentUser.firstName;
    document.getElementById('edit-lastname').value = currentUser.lastName;
    document.getElementById('edit-email').value = currentUser.email;
    
    // Update avatar preview
    const avatarPreview = document.getElementById('edit-avatar-preview');
    if (avatarPreview) {
        avatarPreview.textContent = currentUser.firstName.charAt(0) + currentUser.lastName.charAt(0);
    }
    
    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('editProfileModal'));
    modal.show();
}

function handleEditProfileSubmit(e) {
    e.preventDefault();
    
    const firstName = document.getElementById('edit-firstname').value.trim();
    const lastName = document.getElementById('edit-lastname').value.trim();
    
    // Validate
    if (!firstName || !lastName) {
        showToast('Names cannot be empty', 'danger');
        return;
    }
    
    if (firstName.length < 2 || lastName.length < 2) {
        showToast('Names must be at least 2 characters', 'danger');
        return;
    }
    
    // Update account
    const account = window.db.accounts.find(acc => acc.email === currentUser.email);
    if (account) {
        account.firstName = firstName;
        account.lastName = lastName;
        saveToStorage();
        
        // Update current user
        currentUser.firstName = account.firstName;
        currentUser.lastName = account.lastName;
        
        // Update display
        setAuthState(true, currentUser);
        renderProfile();
        
        // Close modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('editProfileModal'));
        modal.hide();
        
        showToast('Profile updated successfully!', 'success');
    }
}

function changePassword() {
    if (!currentUser) return;
    
    // Reset form
    document.getElementById('change-password-form').reset();
    
    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('changePasswordModal'));
    modal.show();
}

function handleChangePasswordSubmit(e) {
    e.preventDefault();
    
    const currentPassword = document.getElementById('current-password').value;
    const newPassword = document.getElementById('new-password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    
    const account = window.db.accounts.find(acc => acc.email === currentUser.email);
    
    if (account.password !== currentPassword) {
        showToast('Current password is incorrect', 'danger');
        return;
    }
    
    if (newPassword.length < 6) {
        showToast('Password must be at least 6 characters', 'danger');
        return;
    }
    
    if (newPassword !== confirmPassword) {
        showToast('Passwords do not match', 'danger');
        return;
    }
    
    // Update password
    account.password = newPassword;
    saveToStorage();
    
    // Close modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('changePasswordModal'));
    modal.hide();
    
    // Reset form
    document.getElementById('change-password-form').reset();
    
    showToast('Password changed successfully!', 'success');
}

// ==================== PROFILE ====================

function renderProfile() {
    const container = document.getElementById('profile-content');
    if (!container || !currentUser) return;
    
    container.innerHTML = `
        <div class="text-center mb-4">
            <div class="profile-avatar mb-3">
                <div class="avatar-circle">${currentUser.firstName.charAt(0)}${currentUser.lastName.charAt(0)}</div>
            </div>
            <h4>${currentUser.firstName} ${currentUser.lastName}</h4>
            <span class="badge bg-${currentUser.role === 'Admin' ? 'primary' : 'secondary'}">${currentUser.role}</span>
        </div>
        
        <div class="profile-info">
            <div class="info-row">
                <strong>Email:</strong>
                <span>${currentUser.email}</span>
            </div>
            <div class="info-row">
                <strong>Role:</strong>
                <span>${currentUser.role}</span>
            </div>
            <div class="info-row">
                <strong>Account Status:</strong>
                <span class="text-success">✓ Verified</span>
            </div>
        </div>
        
        <div class="mt-4 text-center">
            <button class="btn btn-primary" onclick="editProfile()">
                <svg width="16" height="16" fill="currentColor" class="me-1" viewBox="0 0 16 16">
                    <path d="M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708l-10 10a.5.5 0 0 1-.168.11l-5 2a.5.5 0 0 1-.65-.65l2-5a.5.5 0 0 1 .11-.168l10-10zM11.207 2.5 13.5 4.793 14.793 3.5 12.5 1.207 11.207 2.5zm1.586 3L10.5 3.207 4 9.707V10h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.293l6.5-6.5zm-9.761 5.175-.106.106-1.528 3.821 3.821-1.528.106-.106A.5.5 0 0 1 5 12.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.468-.325z"/>
                </svg>
                Edit Profile
            </button>
            <button class="btn btn-secondary" onclick="changePassword()">
                <svg width="16" height="16" fill="currentColor" class="me-1" viewBox="0 0 16 16">
                    <path d="M8 1a2 2 0 0 1 2 2v4H6V3a2 2 0 0 1 2-2zm3 6V3a3 3 0 0 0-6 0v4a2 2 0 0 0-2 2v5a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z"/>
                </svg>
                Change Password
            </button>
        </div>
    `;
}

// ==================== EMPLOYEES (ADMIN) ====================

function renderEmployees() {
    const tbody = document.getElementById('employees-tbody');
    if (!tbody) return;
    
    const employees = window.db.employees;
    
    if (employees.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center">No employees.</td></tr>';
    } else {
        tbody.innerHTML = employees.map(emp => {
            const user = window.db.accounts.find(acc => acc.email === emp.userEmail);
            const dept = window.db.departments.find(d => d.id === emp.departmentId);
            const userName = user ? `${user.firstName} ${user.lastName}` : emp.userEmail;
            const deptName = dept ? dept.name : 'Unknown';
            
            return `
                <tr>
                    <td>${emp.employeeId}</td>
                    <td>${userName}</td>
                    <td>${emp.position}</td>
                    <td>${deptName}</td>
                    <td>
                        <button class="btn btn-sm btn-primary" onclick="editEmployee('${emp.employeeId}')">Edit</button>
                        <button class="btn btn-sm btn-danger" onclick="deleteEmployee('${emp.employeeId}')">Delete</button>
                    </td>
                </tr>
            `;
        }).join('');
    }
}

function populateUserEmailDropdown() {
    const select = document.getElementById('emp-email');
    if (!select) return;
    
    // Get all accounts that are NOT already employees AND are not admins
    const employeeEmails = window.db.employees.map(emp => emp.userEmail);
    const availableAccounts = window.db.accounts.filter(acc => 
        !employeeEmails.includes(acc.email) && acc.role !== 'Admin'
    );
    
    // Clear existing options except the first placeholder
    while (select.options.length > 1) {
        select.remove(1);
    }
    
    if (availableAccounts.length === 0) {
        // Update placeholder text if no accounts available
        select.options[0].text = '-- No available user accounts --';
        select.options[0].value = '';
    } else {
        // Add user options
        availableAccounts.forEach(acc => {
            const option = document.createElement('option');
            option.value = acc.email;
            option.text = `${acc.firstName} ${acc.lastName} (${acc.email})`;
            select.add(option);
        });
    }
}

function populateDepartmentDropdown() {
    const select = document.getElementById('emp-department');
    if (!select) return;
    
    select.innerHTML = window.db.departments.map(dept => 
        `<option value="${dept.id}">${dept.name}</option>`
    ).join('');
}

function showEmployeeModal(editId = null) {
    const modal = new bootstrap.Modal(document.getElementById('employeeModal'));
    const form = document.getElementById('employee-form');
    const title = document.getElementById('employee-modal-title');
    const emailContainer = document.getElementById('emp-email-container');
    
    // Populate departments first
    populateDepartmentDropdown();
    
    // Reset form
    form.reset();
    document.getElementById('emp-edit-id').value = '';
    
    if (editId) {
        // Edit mode - show as readonly text input
        const emp = window.db.employees.find(e => e.employeeId === editId);
        if (emp) {
            title.textContent = 'Edit Employee';
            document.getElementById('emp-edit-id').value = editId;
            document.getElementById('emp-id').value = emp.employeeId;
            
            // For edit mode, show as readonly input
            emailContainer.innerHTML = `
                <label class="form-label">User Email</label>
                <input type="email" class="form-control" id="emp-email" value="${emp.userEmail}" readonly>
                <small class="text-muted">Email cannot be changed</small>
            `;
            
            document.getElementById('emp-position').value = emp.position;
            document.getElementById('emp-department').value = emp.departmentId;
            document.getElementById('emp-hire-date').value = emp.hireDate;
        }
    } else {
        // Add mode - show as dropdown
        title.textContent = 'Add Employee';
        
        // Restore select element
        emailContainer.innerHTML = `
            <label class="form-label">User Email</label>
            <select class="form-control" id="emp-email" required>
                <option value="">-- Select a user account --</option>
            </select>
            <small class="text-muted">Select from registered user accounts</small>
        `;
        
        // Populate the dropdown
        populateUserEmailDropdown();
    }
    
    modal.show();
}

function editEmployee(employeeId) {
    showEmployeeModal(employeeId);
}

function handleEmployeeSubmit(e) {
    e.preventDefault();
    
    const employeeId = document.getElementById('emp-id').value.trim();
    const userEmail = document.getElementById('emp-email').value.trim().toLowerCase();
    const position = document.getElementById('emp-position').value.trim();
    const departmentId = parseInt(document.getElementById('emp-department').value);
    const hireDate = document.getElementById('emp-hire-date').value;
    const editId = document.getElementById('emp-edit-id').value;
    
    // Enhanced validation
    if (!employeeId || !userEmail || !position || !hireDate) {
        showToast('Please fill in all required fields', 'danger');
        return;
    }
    
    // Validate user exists
    const user = window.db.accounts.find(acc => acc.email === userEmail);
    if (!user) {
        showToast('User email does not exist. Please create an account first.', 'danger');
        return;
    }
    
    // Check if employee ID already exists (when adding new)
    if (!editId) {
        const existingEmp = window.db.employees.find(e => e.employeeId === employeeId);
        if (existingEmp) {
            showToast('Employee ID already exists. Please use a different ID.', 'danger');
            return;
        }
    }
    
    // Validate hire date is not in future
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selectedDate = new Date(hireDate);
    selectedDate.setHours(0, 0, 0, 0);
    
    if (selectedDate > today) {
        showToast('Hire date cannot be in the future', 'danger');
        return;
    }
    
    if (editId) {
        // Edit existing
        const emp = window.db.employees.find(e => e.employeeId === editId);
        if (emp) {
            emp.employeeId = employeeId;
            emp.userEmail = userEmail;
            emp.position = position;
            emp.departmentId = departmentId;
            emp.hireDate = hireDate;
            showToast('Employee updated successfully!', 'success');
        }
    } else {
        // Add new
        const newEmployee = {
            employeeId,
            userEmail,
            position,
            departmentId,
            hireDate
        };
        window.db.employees.push(newEmployee);
        showToast('Employee added successfully!', 'success');
    }
    
    saveToStorage();
    
    // Close modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('employeeModal'));
    modal.hide();
    
    // Refresh display
    renderEmployees();
}

function editEmployee(employeeId) {
    showEmployeeModal(employeeId);
}

function deleteEmployee(employeeId) {
    if (!confirm('Delete this employee?')) return;
    
    window.db.employees = window.db.employees.filter(e => e.employeeId !== employeeId);
    saveToStorage();
    showToast('Employee deleted', 'info');
    renderEmployees();
}

// ==================== DEPARTMENTS (ADMIN) ====================

function renderDepartments() {
    const tbody = document.getElementById('departments-tbody');
    if (!tbody) return;
    
    if (window.db.departments.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3" class="text-center">No departments yet.</td></tr>';
    } else {
        tbody.innerHTML = window.db.departments.map(dept => `
            <tr>
                <td><strong>${dept.name}</strong></td>
                <td>${dept.description}</td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="editDepartment(${dept.id})">Edit</button>
                    <button class="btn btn-sm btn-danger" onclick="deleteDepartment(${dept.id})">Delete</button>
                </td>
            </tr>
        `).join('');
    }
}

function showDepartmentModal(editId = null) {
    const modal = new bootstrap.Modal(document.getElementById('departmentModal'));
    const form = document.getElementById('department-form');
    const title = document.getElementById('department-modal-title');
    
    // Reset form
    form.reset();
    document.getElementById('dept-edit-id').value = '';
    
    if (editId) {
        // Edit mode
        const dept = window.db.departments.find(d => d.id === editId);
        if (dept) {
            title.textContent = 'Edit Department';
            document.getElementById('dept-edit-id').value = editId;
            document.getElementById('dept-name').value = dept.name;
            document.getElementById('dept-description').value = dept.description;
        }
    } else {
        // Add mode
        title.textContent = 'Add Department';
    }
    
    modal.show();
}

function editDepartment(deptId) {
    showDepartmentModal(deptId);
}

function handleDepartmentSubmit(e) {
    e.preventDefault();
    
    const editId = document.getElementById('dept-edit-id').value;
    const name = document.getElementById('dept-name').value.trim();
    const description = document.getElementById('dept-description').value.trim();
    
    // Validation
    if (!name || !description) {
        showToast('Please fill in all fields', 'danger');
        return;
    }
    
    if (name.length < 2) {
        showToast('Department name must be at least 2 characters', 'danger');
        return;
    }
    
    // Check for duplicate department name (case insensitive)
    const existingDept = window.db.departments.find(d => 
        d.name.toLowerCase() === name.toLowerCase() && 
        (!editId || d.id !== parseInt(editId))
    );
    
    if (existingDept) {
        showToast('Department name already exists', 'danger');
        return;
    }
    
    if (editId) {
        // Edit existing
        const dept = window.db.departments.find(d => d.id === parseInt(editId));
        if (dept) {
            dept.name = name;
            dept.description = description;
            showToast('Department updated successfully!', 'success');
        }
    } else {
        // Add new
        const newId = window.db.departments.length > 0 
            ? Math.max(...window.db.departments.map(d => d.id)) + 1 
            : 1;
        
        const newDepartment = {
            id: newId,
            name,
            description
        };
        
        window.db.departments.push(newDepartment);
        showToast('Department added successfully!', 'success');
    }
    
    saveToStorage();
    
    // Close modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('departmentModal'));
    modal.hide();
    
    // Refresh display
    renderDepartments();
}

function deleteDepartment(deptId) {
    const dept = window.db.departments.find(d => d.id === deptId);
    if (!dept) {
        showToast('Department not found', 'danger');
        return;
    }
    
    // Check if any employees are assigned to this department
    const employeesInDept = window.db.employees.filter(e => e.departmentId === deptId);
    
    if (employeesInDept.length > 0) {
        // Create warning modal
        const modalHtml = `
            <div class="modal fade" id="deleteDepartmentModal" tabindex="-1">
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content">
                        <div class="modal-header bg-danger text-white">
                            <h5 class="modal-title">
                                <svg width="20" height="20" fill="currentColor" class="me-2" viewBox="0 0 16 16" style="vertical-align: middle;">
                                    <path d="M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5zm.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"/>
                                </svg>
                                Cannot Delete Department
                            </h5>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="alert alert-warning">
                                <strong>⚠️ Warning:</strong> This department has ${employeesInDept.length} employee(s) assigned to it.
                            </div>
                            <p>You must reassign or remove these employees before deleting this department.</p>
                            <div class="card bg-light">
                                <div class="card-body">
                                    <strong>Department:</strong> ${dept.name}<br>
                                    <strong>Employees:</strong> ${employeesInDept.length}
                                </div>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Remove existing modal if any
        const existingModal = document.getElementById('deleteDepartmentModal');
        if (existingModal) {
            existingModal.remove();
        }
        
        // Add and show modal
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        const modal = new bootstrap.Modal(document.getElementById('deleteDepartmentModal'));
        modal.show();
        
        // Clean up
        document.getElementById('deleteDepartmentModal').addEventListener('hidden.bs.modal', function () {
            this.remove();
        });
        
        return;
    }
    
    // No employees - show delete confirmation
    const modalHtml = `
        <div class="modal fade" id="deleteDepartmentModal" tabindex="-1">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content">
                    <div class="modal-header bg-danger text-white">
                        <h5 class="modal-title">
                            <svg width="20" height="20" fill="currentColor" class="me-2" viewBox="0 0 16 16" style="vertical-align: middle;">
                                <path d="M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5zm.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"/>
                            </svg>
                            Confirm Delete Department
                        </h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="alert alert-warning">
                            <strong>⚠️ Warning:</strong> This action cannot be undone!
                        </div>
                        <p>Are you sure you want to delete this department?</p>
                        <div class="card bg-light">
                            <div class="card-body">
                                <strong>Name:</strong> ${dept.name}<br>
                                <strong>Description:</strong> ${dept.description}
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                        <button type="button" class="btn btn-danger" id="confirm-delete-dept-btn">
                            <svg width="14" height="14" fill="currentColor" class="me-1" viewBox="0 0 16 16">
                                <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/>
                                <path fill-rule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/>
                            </svg>
                            Delete Department
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Remove existing modal if any
    const existingModal = document.getElementById('deleteDepartmentModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // Add modal to body
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    // Handle confirm delete
    document.getElementById('confirm-delete-dept-btn').addEventListener('click', function() {
        window.db.departments = window.db.departments.filter(d => d.id !== deptId);
        saveToStorage();
        
        // Close modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('deleteDepartmentModal'));
        modal.hide();
        
        showToast('Department deleted successfully', 'info');
        renderDepartments();
    });
    
    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('deleteDepartmentModal'));
    modal.show();
    
    // Clean up modal after hiding
    document.getElementById('deleteDepartmentModal').addEventListener('hidden.bs.modal', function () {
        this.remove();
    });
}

// ==================== ACCOUNTS (ADMIN) ====================

function renderAccounts() {
    const tbody = document.getElementById('accounts-tbody');
    if (!tbody) return;
    
    tbody.innerHTML = window.db.accounts.map(acc => `
        <tr>
            <td>${acc.firstName} ${acc.lastName}</td>
            <td>${acc.email}</td>
            <td><span class="badge bg-${acc.role === 'Admin' ? 'primary' : 'secondary'}">${acc.role}</span></td>
            <td>${acc.verified ? '<span class="text-success">✅</span>' : '<span class="text-danger">❌</span>'}</td>
            <td>
                <button class="btn btn-sm btn-primary" onclick="editAccount('${acc.email}')">Edit</button>
                <button class="btn btn-sm btn-warning" onclick="resetPassword('${acc.email}')">Reset Password</button>
                <button class="btn btn-sm btn-danger" onclick="deleteAccount('${acc.email}')">Delete</button>
            </td>
        </tr>
    `).join('');
}

function showAccountModal(editEmail = null) {
    const modal = new bootstrap.Modal(document.getElementById('accountModal'));
    const form = document.getElementById('account-form');
    const title = document.getElementById('account-modal-title');
    
    // Reset form
    form.reset();
    document.getElementById('acc-edit-email').value = '';
    document.getElementById('acc-verified').checked = false;
    
    if (editEmail) {
        // Edit mode
        const acc = window.db.accounts.find(a => a.email === editEmail);
        if (acc) {
            title.textContent = 'Edit Account';
            document.getElementById('acc-edit-email').value = editEmail;
            document.getElementById('acc-firstname').value = acc.firstName;
            document.getElementById('acc-lastname').value = acc.lastName;
            document.getElementById('acc-email').value = acc.email;
            document.getElementById('acc-password').value = acc.password;
            document.getElementById('acc-role').value = acc.role;
            document.getElementById('acc-verified').checked = acc.verified;
        }
    } else {
        // Add mode
        title.textContent = 'Add Account';
    }
    
    modal.show();
}

function editAccount(email) {
    showAccountModal(email);
}

function handleAccountSubmit(e) {
    e.preventDefault();
    
    const firstName = document.getElementById('acc-firstname').value.trim();
    const lastName = document.getElementById('acc-lastname').value.trim();
    const email = document.getElementById('acc-email').value.trim().toLowerCase();
    const password = document.getElementById('acc-password').value;
    const role = document.getElementById('acc-role').value;
    const verified = document.getElementById('acc-verified').checked;
    const editEmail = document.getElementById('acc-edit-email').value;
    
    // Enhanced validation
    if (!firstName || !lastName || !email || !password) {
        showToast('Please fill in all required fields', 'danger');
        return;
    }
    
    if (firstName.length < 2 || lastName.length < 2) {
        showToast('Names must be at least 2 characters', 'danger');
        return;
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showToast('Please enter a valid email address', 'danger');
        return;
    }
    
    // Password validation
    if (password.length < 6) {
        showToast('Password must be at least 6 characters', 'danger');
        return;
    }
    
    if (editEmail) {
        // Edit existing
        const acc = window.db.accounts.find(a => a.email === editEmail);
        if (acc) {
            // Check if new email already exists (if email changed)
            if (email !== editEmail && window.db.accounts.find(a => a.email === email)) {
                showToast('Email already exists. Please use a different email.', 'danger');
                return;
            }
            
            acc.firstName = firstName;
            acc.lastName = lastName;
            acc.email = email;
            acc.password = password;
            acc.role = role;
            acc.verified = verified;
            
            // Update current user if editing own account
            if (currentUser && currentUser.email === editEmail) {
                currentUser.email = email;
                currentUser.firstName = firstName;
                currentUser.lastName = lastName;
                currentUser.role = role;
                localStorage.setItem('auth_token', email);
                setAuthState(true, currentUser);
            }
            
            showToast('Account updated successfully!', 'success');
        }
    } else {
        // Check if email exists
        if (window.db.accounts.find(a => a.email === email)) {
            showToast('Email already exists. Please use a different email.', 'danger');
            return;
        }
        
        // Add new
        const newAccount = {
            firstName,
            lastName,
            email,
            password,
            role,
            verified
        };
        window.db.accounts.push(newAccount);
        showToast('Account created successfully!', 'success');
    }
    
    saveToStorage();
    
    // Close modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('accountModal'));
    modal.hide();
    
    // Refresh display
    renderAccounts();
}

function editAccount(email) {
    showAccountModal(email);
}

function resetPassword(email) {
    const acc = window.db.accounts.find(a => a.email === email);
    if (!acc) {
        showToast('Account not found', 'danger');
        return;
    }
    
    // Create and show modal
    const modalHtml = `
        <div class="modal fade" id="resetPasswordModal" tabindex="-1">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Reset Password</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="alert alert-info">
                            <strong>Account:</strong> ${acc.firstName} ${acc.lastName}<br>
                            <strong>Email:</strong> ${acc.email}
                        </div>
                        <form id="reset-password-form">
                            <div class="mb-3">
                                <label class="form-label">New Password</label>
                                <input type="password" class="form-control" id="reset-new-password" minlength="6" required>
                                <small class="text-muted">Minimum 6 characters</small>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Confirm New Password</label>
                                <input type="password" class="form-control" id="reset-confirm-password" minlength="6" required>
                            </div>
                            <div class="d-grid gap-2">
                                <button type="submit" class="btn btn-warning">Reset Password</button>
                                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Remove existing modal if any
    const existingModal = document.getElementById('resetPasswordModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // Add modal to body
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    // Handle form submit
    document.getElementById('reset-password-form').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const newPassword = document.getElementById('reset-new-password').value;
        const confirmPassword = document.getElementById('reset-confirm-password').value;
        
        if (newPassword.length < 6) {
            showToast('Password must be at least 6 characters', 'danger');
            return;
        }
        
        if (newPassword !== confirmPassword) {
            showToast('Passwords do not match', 'danger');
            return;
        }
        
        // Update password
        acc.password = newPassword;
        saveToStorage();
        
        // Close modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('resetPasswordModal'));
        modal.hide();
        
        showToast('Password reset successfully', 'success');
    });
    
    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('resetPasswordModal'));
    modal.show();
    
    // Clean up modal after hiding
    document.getElementById('resetPasswordModal').addEventListener('hidden.bs.modal', function () {
        this.remove();
    });
}

function deleteAccount(email) {
    // Prevent self-deletion
    if (currentUser && currentUser.email === email) {
        showToast('Cannot delete your own account', 'danger');
        return;
    }
    
    const acc = window.db.accounts.find(a => a.email === email);
    if (!acc) {
        showToast('Account not found', 'danger');
        return;
    }
    
    // Check if this account has an associated employee
    const associatedEmployee = window.db.employees.find(emp => emp.userEmail === email);
    
    // Create confirmation modal
    const modalHtml = `
        <div class="modal fade" id="deleteAccountModal" tabindex="-1">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content">
                    <div class="modal-header bg-danger text-white">
                        <h5 class="modal-title">
                            <svg width="20" height="20" fill="currentColor" class="me-2" viewBox="0 0 16 16" style="vertical-align: middle;">
                                <path d="M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5zm.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"/>
                            </svg>
                            Confirm Delete Account
                        </h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="alert alert-warning">
                            <strong>⚠️ Warning:</strong> This action cannot be undone!
                        </div>
                        ${associatedEmployee ? `
                            <div class="alert alert-info">
                                <strong>ℹ️ Note:</strong> This account has an associated employee record that will also be deleted.
                            </div>
                        ` : ''}
                        <p>Are you sure you want to delete this account${associatedEmployee ? ' and its employee record' : ''}?</p>
                        <div class="card bg-light">
                            <div class="card-body">
                                <strong>Name:</strong> ${acc.firstName} ${acc.lastName}<br>
                                <strong>Email:</strong> ${acc.email}<br>
                                <strong>Role:</strong> ${acc.role}
                                ${associatedEmployee ? `<br><strong>Employee ID:</strong> ${associatedEmployee.employeeId}<br><strong>Position:</strong> ${associatedEmployee.position}` : ''}
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                        <button type="button" class="btn btn-danger" id="confirm-delete-btn">
                            <svg width="14" height="14" fill="currentColor" class="me-1" viewBox="0 0 16 16">
                                <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/>
                                <path fill-rule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/>
                            </svg>
                            Delete Account${associatedEmployee ? ' & Employee' : ''}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Remove existing modal if any
    const existingModal = document.getElementById('deleteAccountModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // Add modal to body
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    // Handle confirm delete
    document.getElementById('confirm-delete-btn').addEventListener('click', function() {
        // Delete the account
        window.db.accounts = window.db.accounts.filter(a => a.email !== email);
        
        // Also delete associated employee if exists
        if (associatedEmployee) {
            window.db.employees = window.db.employees.filter(emp => emp.userEmail !== email);
        }
        
        saveToStorage();
        
        // Close modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('deleteAccountModal'));
        modal.hide();
        
        showToast(`Account${associatedEmployee ? ' and employee record' : ''} deleted successfully`, 'info');
        renderAccounts();
    });
    
    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('deleteAccountModal'));
    modal.show();
    
    // Clean up modal after hiding
    document.getElementById('deleteAccountModal').addEventListener('hidden.bs.modal', function () {
        this.remove();
    });
}

// ==================== REQUESTS ====================

function renderRequests() {
    const container = document.getElementById('requests-content');
    if (!container || !currentUser) return;
    
    const userRequests = window.db.requests.filter(req => req.employeeEmail === currentUser.email);
    
    if (userRequests.length === 0) {
        container.innerHTML = `
            <div class="alert alert-info">
                You have no requests yet.
            </div>
            <button class="btn btn-success" onclick="showRequestModal()">Create One</button>
        `;
    } else {
        const tableHtml = `
            <div class="table-responsive">
                <table class="table table-striped">
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Type</th>
                            <th>Items</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${userRequests.map(req => {
                            const statusClass = req.status === 'Pending' ? 'warning' : 
                                              req.status === 'Approved' ? 'success' : 
                                              req.status === 'Cancelled' ? 'secondary' : 'danger';
                            const itemsList = req.items.map(item => `${item.name} (${item.qty})`).join(', ');
                            
                            return `
                                <tr>
                                    <td>${req.date}</td>
                                    <td>${req.type}</td>
                                    <td>${itemsList}</td>
                                    <td><span class="badge bg-${statusClass}">${req.status}</span></td>
                                    <td>
                                        <button class="btn btn-sm btn-primary" onclick="viewRequest(${req.id})">View</button>
                                        ${req.status === 'Pending' ? `
                                            <button class="btn btn-sm btn-danger" onclick="cancelRequest(${req.id})">Cancel</button>
                                        ` : ''}
                                    </td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        `;
        container.innerHTML = tableHtml;
    }
}

// View request details
function viewRequest(requestId) {
    const request = window.db.requests.find(req => req.id === requestId);
    if (!request) {
        showToast('Request not found', 'danger');
        return;
    }
    
    const itemsList = request.items.map(item => `<li>${item.name} - Quantity: ${item.qty}</li>`).join('');
    const statusClass = request.status === 'Pending' ? 'warning' : 
                       request.status === 'Approved' ? 'success' : 'danger';
    
    const modalHtml = `
        <div class="modal fade" id="viewRequestModal" tabindex="-1">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Request Details</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="mb-3">
                            <strong>Type:</strong> ${request.type}
                        </div>
                        <div class="mb-3">
                            <strong>Date:</strong> ${request.date}
                        </div>
                        <div class="mb-3">
                            <strong>Status:</strong> <span class="badge bg-${statusClass}">${request.status}</span>
                        </div>
                        <div class="mb-3">
                            <strong>Requested By:</strong> ${request.employeeEmail}
                        </div>
                        <div class="mb-3">
                            <strong>Items:</strong>
                            <ul class="mt-2">
                                ${itemsList}
                            </ul>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Remove any existing modal
    const existingModal = document.getElementById('viewRequestModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // Add modal to body
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('viewRequestModal'));
    modal.show();
    
    // Remove modal from DOM after it's hidden
    document.getElementById('viewRequestModal').addEventListener('hidden.bs.modal', function () {
        this.remove();
    });
}

// Cancel request
function cancelRequest(requestId) {
    if (!confirm('Are you sure you want to cancel this request?')) {
        return;
    }
    
    const request = window.db.requests.find(req => req.id === requestId);
    if (!request) {
        showToast('Request not found', 'danger');
        return;
    }
    
    if (request.status !== 'Pending') {
        showToast('Only pending requests can be cancelled', 'warning');
        return;
    }
    
    // Update status to Cancelled
    request.status = 'Cancelled';
    saveToStorage();
    
    showToast('Request cancelled successfully', 'info');
    renderRequests();
    
    // Also refresh admin requests if admin
    if (currentUser.role === 'Admin') {
        renderAllRequests();
    }
}

function showRequestModal() {
    const modal = new bootstrap.Modal(document.getElementById('requestModal'));
    
    // Reset form
    document.getElementById('request-form').reset();
    const itemsContainer = document.getElementById('request-items-container');
    itemsContainer.innerHTML = `
        <div class="input-group mb-2 request-item-row">
            <input type="text" class="form-control item-name" placeholder="Item name" required>
            <input type="number" class="form-control item-qty" placeholder="Qty" value="1" min="1" style="max-width: 80px;" required>
            <button type="button" class="btn btn-danger remove-item-btn">×</button>
        </div>
    `;
    
    modal.show();
}

function handleRequestSubmit(e) {
    e.preventDefault();
    
    const type = document.getElementById('request-type').value;
    const itemRows = document.querySelectorAll('.request-item-row');
    
    const items = [];
    let hasEmptyFields = false;
    
    itemRows.forEach(row => {
        const nameInput = row.querySelector('.item-name');
        const qtyInput = row.querySelector('.item-qty');
        const name = nameInput ? nameInput.value.trim() : '';
        const qty = qtyInput ? parseInt(qtyInput.value) : 0;
        
        if (name && qty > 0) {
            items.push({ name, qty });
        } else if (name || qty > 0) {
            hasEmptyFields = true;
        }
    });
    
    if (hasEmptyFields) {
        showToast('Please complete all item fields or remove empty rows', 'warning');
        return;
    }
    
    if (items.length === 0) {
        showToast('Please add at least one item with name and quantity', 'danger');
        return;
    }
    
    // Validate quantities
    const invalidQty = items.find(item => item.qty < 1);
    if (invalidQty) {
        showToast('Quantity must be at least 1', 'danger');
        return;
    }
    
    const newRequest = {
        id: Date.now(),
        type,
        items,
        status: 'Pending',
        date: new Date().toISOString().split('T')[0],
        employeeEmail: currentUser.email
    };
    
    window.db.requests.push(newRequest);
    saveToStorage();
    
    showToast(`${type} request submitted successfully!`, 'success');
    
    // Close modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('requestModal'));
    modal.hide();
    
    renderRequests();
}

function addRequestItem() {
    const container = document.getElementById('request-items-container');
    const newRow = document.createElement('div');
    newRow.className = 'input-group mb-2 request-item-row';
    newRow.innerHTML = `
        <input type="text" class="form-control item-name" placeholder="Item name" required>
        <input type="number" class="form-control item-qty" placeholder="Qty" value="1" min="1" style="max-width: 80px;" required>
        <button type="button" class="btn btn-danger remove-item-btn">×</button>
    `;
    container.appendChild(newRow);
}

// ==================== ALL REQUESTS (ADMIN) ====================

function renderAllRequests() {
    const container = document.getElementById('all-requests-content');
    if (!container) return;
    
    const allRequests = window.db.requests;
    
    if (allRequests.length === 0) {
        container.innerHTML = `
            <div class="alert alert-info">
                No requests in the system yet.
            </div>
        `;
    } else {
        const tableHtml = `
            <div class="table-responsive">
                <table class="table table-striped">
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Employee</th>
                            <th>Type</th>
                            <th>Items</th>
                            <th>Status</th>
                            <th style="min-width: 200px;">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${allRequests.map(req => {
                            const statusClass = req.status === 'Pending' ? 'warning' : 
                                              req.status === 'Approved' ? 'success' : 
                                              req.status === 'Cancelled' ? 'secondary' : 'danger';
                            const itemsList = req.items.map(item => `${item.name} (${item.qty})`).join(', ');
                            
                            return `
                                <tr>
                                    <td>${req.date}</td>
                                    <td>${req.employeeEmail}</td>
                                    <td>${req.type}</td>
                                    <td>${itemsList}</td>
                                    <td><span class="badge bg-${statusClass}">${req.status}</span></td>
                                    <td>
                                        <div class="d-flex flex-nowrap gap-1">
                                            <button class="btn btn-sm btn-primary" onclick="viewRequest(${req.id})">View</button>
                                            ${req.status === 'Pending' ? `
                                                <button class="btn btn-sm btn-success" onclick="showApproveModal(${req.id})">Approve</button>
                                                <button class="btn btn-sm btn-danger" onclick="showRejectModal(${req.id})">Reject</button>
                                            ` : ''}
                                        </div>
                                    </td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        `;
        container.innerHTML = tableHtml;
    }
}

// Show approve confirmation modal
function showApproveModal(requestId) {
    const request = window.db.requests.find(req => req.id === requestId);
    if (!request) {
        showToast('Request not found', 'danger');
        return;
    }
    
    const itemsList = request.items.map(item => `<li>${item.name} - Quantity: ${item.qty}</li>`).join('');
    
    const modalHtml = `
        <div class="modal fade" id="approveRequestModal" tabindex="-1">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content">
                    <div class="modal-header bg-success text-white">
                        <h5 class="modal-title">
                            <svg width="20" height="20" fill="currentColor" class="me-2" viewBox="0 0 16 16" style="vertical-align: middle;">
                                <path d="M10.97 4.97a.75.75 0 0 1 1.07 1.05l-3.99 4.99a.75.75 0 0 1-1.08.02L4.324 8.384a.75.75 0 1 1 1.06-1.06l2.094 2.093 3.473-4.425a.267.267 0 0 1 .02-.022z"/>
                            </svg>
                            Approve Request
                        </h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <p>Are you sure you want to approve this request?</p>
                        <div class="card bg-light">
                            <div class="card-body">
                                <strong>Type:</strong> ${request.type}<br>
                                <strong>Employee:</strong> ${request.employeeEmail}<br>
                                <strong>Date:</strong> ${request.date}<br>
                                <strong>Items:</strong>
                                <ul class="mt-2 mb-0">
                                    ${itemsList}
                                </ul>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                        <button type="button" class="btn btn-success" id="confirm-approve-btn">
                            <svg width="14" height="14" fill="currentColor" class="me-1" viewBox="0 0 16 16">
                                <path d="M10.97 4.97a.75.75 0 0 1 1.07 1.05l-3.99 4.99a.75.75 0 0 1-1.08.02L4.324 8.384a.75.75 0 1 1 1.06-1.06l2.094 2.093 3.473-4.425a.267.267 0 0 1 .02-.022z"/>
                            </svg>
                            Approve Request
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Remove existing modal
    const existingModal = document.getElementById('approveRequestModal');
    if (existingModal) existingModal.remove();
    
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    document.getElementById('confirm-approve-btn').addEventListener('click', function() {
        approveRequest(requestId);
        const modal = bootstrap.Modal.getInstance(document.getElementById('approveRequestModal'));
        modal.hide();
    });
    
    const modal = new bootstrap.Modal(document.getElementById('approveRequestModal'));
    modal.show();
    
    document.getElementById('approveRequestModal').addEventListener('hidden.bs.modal', function () {
        this.remove();
    });
}

// Show reject confirmation modal
function showRejectModal(requestId) {
    const request = window.db.requests.find(req => req.id === requestId);
    if (!request) {
        showToast('Request not found', 'danger');
        return;
    }
    
    const itemsList = request.items.map(item => `<li>${item.name} - Quantity: ${item.qty}</li>`).join('');
    
    const modalHtml = `
        <div class="modal fade" id="rejectRequestModal" tabindex="-1">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content">
                    <div class="modal-header bg-danger text-white">
                        <h5 class="modal-title">
                            <svg width="20" height="20" fill="currentColor" class="me-2" viewBox="0 0 16 16" style="vertical-align: middle;">
                                <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zM5.354 4.646a.5.5 0 1 0-.708.708L7.293 8l-2.647 2.646a.5.5 0 0 0 .708.708L8 8.707l2.646 2.647a.5.5 0 0 0 .708-.708L8.707 8l2.647-2.646a.5.5 0 0 0-.708-.708L8 7.293 5.354 4.646z"/>
                            </svg>
                            Reject Request
                        </h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <p>Are you sure you want to reject this request?</p>
                        <div class="card bg-light">
                            <div class="card-body">
                                <strong>Type:</strong> ${request.type}<br>
                                <strong>Employee:</strong> ${request.employeeEmail}<br>
                                <strong>Date:</strong> ${request.date}<br>
                                <strong>Items:</strong>
                                <ul class="mt-2 mb-0">
                                    ${itemsList}
                                </ul>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                        <button type="button" class="btn btn-danger" id="confirm-reject-btn">
                            <svg width="14" height="14" fill="currentColor" class="me-1" viewBox="0 0 16 16">
                                <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zM5.354 4.646a.5.5 0 1 0-.708.708L7.293 8l-2.647 2.646a.5.5 0 0 0 .708.708L8 8.707l2.646 2.647a.5.5 0 0 0 .708-.708L8.707 8l2.647-2.646a.5.5 0 0 0-.708-.708L8 7.293 5.354 4.646z"/>
                            </svg>
                            Reject Request
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Remove existing modal
    const existingModal = document.getElementById('rejectRequestModal');
    if (existingModal) existingModal.remove();
    
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    document.getElementById('confirm-reject-btn').addEventListener('click', function() {
        rejectRequest(requestId);
        const modal = bootstrap.Modal.getInstance(document.getElementById('rejectRequestModal'));
        modal.hide();
    });
    
    const modal = new bootstrap.Modal(document.getElementById('rejectRequestModal'));
    modal.show();
    
    document.getElementById('rejectRequestModal').addEventListener('hidden.bs.modal', function () {
        this.remove();
    });
}

// Approve request (admin only)
function approveRequest(requestId) {
    if (!currentUser || currentUser.role !== 'Admin') {
        showToast('Admin access required', 'danger');
        return;
    }
    
    const request = window.db.requests.find(req => req.id === requestId);
    if (!request) {
        showToast('Request not found', 'danger');
        return;
    }
    
    if (request.status !== 'Pending') {
        showToast('Only pending requests can be approved', 'warning');
        return;
    }
    
    request.status = 'Approved';
    saveToStorage();
    
    showToast('Request approved successfully!', 'success');
    renderAllRequests();
}

// Reject request (admin only)
function rejectRequest(requestId) {
    if (!currentUser || currentUser.role !== 'Admin') {
        showToast('Admin access required', 'danger');
        return;
    }
    
    const request = window.db.requests.find(req => req.id === requestId);
    if (!request) {
        showToast('Request not found', 'danger');
        return;
    }
    
    if (request.status !== 'Pending') {
        showToast('Only pending requests can be rejected', 'warning');
        return;
    }
    
    request.status = 'Rejected';
    saveToStorage();
    
    showToast('Request rejected', 'info');
    renderAllRequests();
}

// ==================== TOAST NOTIFICATIONS ====================

function showToast(message, type = 'info') {
    const toastEl = document.getElementById('liveToast');
    const toastBody = document.getElementById('toast-message');
    
    toastBody.textContent = message;
    toastEl.className = `toast bg-${type} text-white`;
    
    const toast = new bootstrap.Toast(toastEl);
    toast.show();
}

// ==================== EVENT LISTENERS ====================

document.addEventListener('DOMContentLoaded', function() {
    // Load data and check auth
    loadFromStorage();
    checkStoredAuth();
    
    // Set up routing
    window.addEventListener('hashchange', handleRouting);
    
    // Initial route
    if (!window.location.hash) {
        window.location.hash = '#/';
    }
    handleRouting();
    
    // Register form
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }
    
    // Verify email button
    const verifyBtn = document.getElementById('simulate-verify-btn');
    if (verifyBtn) {
        verifyBtn.addEventListener('click', simulateEmailVerification);
    }
    
    // Show verify email when on that page
    if (window.location.hash === '#/verify-email') {
        showVerifyEmail();
    }
    
    // Login form
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    // Logout button
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            handleLogout();
        });
    }
    
    // Employee form and button
    const employeeForm = document.getElementById('employee-form');
    if (employeeForm) {
        employeeForm.addEventListener('submit', handleEmployeeSubmit);
    }
    
    const addEmployeeBtn = document.getElementById('add-employee-btn');
    if (addEmployeeBtn) {
        addEmployeeBtn.addEventListener('click', () => showEmployeeModal());
    }
    
    // Account form and button
    const accountForm = document.getElementById('account-form');
    if (accountForm) {
        accountForm.addEventListener('submit', handleAccountSubmit);
    }
    
    const addAccountBtn = document.getElementById('add-account-btn');
    if (addAccountBtn) {
        addAccountBtn.addEventListener('click', () => showAccountModal());
    }
    
    // Request form
    const requestForm = document.getElementById('request-form');
    if (requestForm) {
        requestForm.addEventListener('submit', handleRequestSubmit);
    }
    
    const newRequestBtn = document.getElementById('new-request-btn');
    if (newRequestBtn) {
        newRequestBtn.addEventListener('click', showRequestModal);
    }
    
    const addItemBtn = document.getElementById('add-item-btn');
    if (addItemBtn) {
        addItemBtn.addEventListener('click', addRequestItem);
    }
    
    // Remove item buttons (event delegation)
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('remove-item-btn')) {
            const row = e.target.closest('.request-item-row');
            const container = document.getElementById('request-items-container');
            if (container.children.length > 1) {
                row.remove();
            } else {
                showToast('Must have at least one item', 'warning');
            }
        }
    });
    
    // Edit Profile form
    const editProfileForm = document.getElementById('edit-profile-form');
    if (editProfileForm) {
        editProfileForm.addEventListener('submit', handleEditProfileSubmit);
    }
    
    // Change Password form
    const changePasswordForm = document.getElementById('change-password-form');
    if (changePasswordForm) {
        changePasswordForm.addEventListener('submit', handleChangePasswordSubmit);
    }
    
    // Department form and button
    const departmentForm = document.getElementById('department-form');
    if (departmentForm) {
        departmentForm.addEventListener('submit', handleDepartmentSubmit);
    }
    
    const addDepartmentBtn = document.getElementById('add-department-btn');
    if (addDepartmentBtn) {
        addDepartmentBtn.addEventListener('click', () => showDepartmentModal());
    }
});