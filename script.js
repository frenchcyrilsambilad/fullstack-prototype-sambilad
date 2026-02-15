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
                        firstName: 'Admin',
                        lastName: 'User',
                        email: 'admin@example.com',
                        password: 'Password123!',
                        role: 'Admin',
                        verified: true
                    }
                ],
                departments: [
                    { id: 1, name: 'Engineering', description: 'Software team' },
                    { id: 2, name: 'HR', description: 'Human Resources' }
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
    const protectedRoutes = ['profile', 'requests', 'employees', 'departments', 'accounts'];
    const adminRoutes = ['employees', 'departments', 'accounts'];
    
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
    
    // Check if email already exists
    const existingAccount = window.db.accounts.find(acc => acc.email === email);
    if (existingAccount) {
        showToast('Email already registered', 'danger');
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
    
    const account = window.db.accounts.find(acc => 
        acc.email === email && 
        acc.password === password && 
        acc.verified === true
    );
    
    if (account) {
        localStorage.setItem('auth_token', email);
        setAuthState(true, account);
        showToast('Login successful!', 'success');
        navigateTo('#/profile');
    } else {
        showToast('Invalid credentials or email not verified', 'danger');
    }
}

// ==================== LOGOUT ====================

function handleLogout() {
    localStorage.removeItem('auth_token');
    setAuthState(false);
    showToast('Logged out successfully', 'info');
    navigateTo('#/');
}

// ==================== PROFILE ====================

function renderProfile() {
    const container = document.getElementById('profile-content');
    if (!container || !currentUser) return;
    
    container.innerHTML = `
        <div class="mb-3">
            <h4>${currentUser.firstName} ${currentUser.lastName}</h4>
        </div>
        <p><strong>Email:</strong> ${currentUser.email}</p>
        <p><strong>Role:</strong> ${currentUser.role}</p>
        <button class="btn btn-primary" onclick="alert('Edit profile feature coming soon!')">Edit Profile</button>
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
    
    // Populate department dropdown
    populateDepartmentDropdown();
}

function populateDepartmentDropdown() {
    const select = document.getElementById('emp-department');
    if (!select) return;
    
    select.innerHTML = window.db.departments.map(dept => 
        `<option value="${dept.id}">${dept.name}</option>`
    ).join('');
}

function showEmployeeForm() {
    document.getElementById('employee-form-container').style.display = 'block';
    document.getElementById('employee-form').reset();
    document.getElementById('emp-edit-id').value = '';
}

function hideEmployeeForm() {
    document.getElementById('employee-form-container').style.display = 'none';
}

function handleEmployeeSubmit(e) {
    e.preventDefault();
    
    const employeeId = document.getElementById('emp-id').value.trim();
    const userEmail = document.getElementById('emp-email').value.trim().toLowerCase();
    const position = document.getElementById('emp-position').value.trim();
    const departmentId = parseInt(document.getElementById('emp-department').value);
    const hireDate = document.getElementById('emp-hire-date').value;
    const editId = document.getElementById('emp-edit-id').value;
    
    // Validate user exists
    const user = window.db.accounts.find(acc => acc.email === userEmail);
    if (!user) {
        showToast('User email does not exist in accounts', 'danger');
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
            showToast('Employee updated', 'success');
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
        showToast('Employee added', 'success');
    }
    
    saveToStorage();
    hideEmployeeForm();
    renderEmployees();
}

function editEmployee(employeeId) {
    const emp = window.db.employees.find(e => e.employeeId === employeeId);
    if (!emp) return;
    
    document.getElementById('emp-edit-id').value = employeeId;
    document.getElementById('emp-id').value = emp.employeeId;
    document.getElementById('emp-email').value = emp.userEmail;
    document.getElementById('emp-position').value = emp.position;
    document.getElementById('emp-department').value = emp.departmentId;
    document.getElementById('emp-hire-date').value = emp.hireDate;
    
    showEmployeeForm();
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
    
    tbody.innerHTML = window.db.departments.map(dept => `
        <tr>
            <td>${dept.name}</td>
            <td>${dept.description}</td>
            <td>
                <button class="btn btn-sm btn-primary" onclick="alert('Edit not implemented')">Edit</button>
                <button class="btn btn-sm btn-danger" onclick="alert('Delete not implemented')">Delete</button>
            </td>
        </tr>
    `).join('');
}

// ==================== ACCOUNTS (ADMIN) ====================

function renderAccounts() {
    const tbody = document.getElementById('accounts-tbody');
    if (!tbody) return;
    
    tbody.innerHTML = window.db.accounts.map(acc => `
        <tr>
            <td>${acc.firstName} ${acc.lastName}</td>
            <td>${acc.email}</td>
            <td>${acc.role}</td>
            <td>${acc.verified ? '✅' : '❌'}</td>
            <td>
                <button class="btn btn-sm btn-primary" onclick="editAccount('${acc.email}')">Edit</button>
                <button class="btn btn-sm btn-warning" onclick="resetPassword('${acc.email}')">Reset Password</button>
                <button class="btn btn-sm btn-danger" onclick="deleteAccount('${acc.email}')">Delete</button>
            </td>
        </tr>
    `).join('');
}

function showAccountForm() {
    document.getElementById('account-form-container').style.display = 'block';
    document.getElementById('account-form').reset();
    document.getElementById('acc-edit-email').value = '';
    document.getElementById('acc-verified').checked = false;
}

function hideAccountForm() {
    document.getElementById('account-form-container').style.display = 'none';
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
    
    if (editEmail) {
        // Edit existing
        const acc = window.db.accounts.find(a => a.email === editEmail);
        if (acc) {
            acc.firstName = firstName;
            acc.lastName = lastName;
            acc.email = email;
            acc.password = password;
            acc.role = role;
            acc.verified = verified;
            showToast('Account updated', 'success');
        }
    } else {
        // Check if email exists
        if (window.db.accounts.find(a => a.email === email)) {
            showToast('Email already exists', 'danger');
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
        showToast('Account created', 'success');
    }
    
    saveToStorage();
    hideAccountForm();
    renderAccounts();
}

function editAccount(email) {
    const acc = window.db.accounts.find(a => a.email === email);
    if (!acc) return;
    
    document.getElementById('acc-edit-email').value = email;
    document.getElementById('acc-firstname').value = acc.firstName;
    document.getElementById('acc-lastname').value = acc.lastName;
    document.getElementById('acc-email').value = acc.email;
    document.getElementById('acc-password').value = acc.password;
    document.getElementById('acc-role').value = acc.role;
    document.getElementById('acc-verified').checked = acc.verified;
    
    showAccountForm();
}

function resetPassword(email) {
    const newPassword = prompt('Enter new password (min 6 characters):');
    if (!newPassword || newPassword.length < 6) {
        showToast('Password must be at least 6 characters', 'danger');
        return;
    }
    
    const acc = window.db.accounts.find(a => a.email === email);
    if (acc) {
        acc.password = newPassword;
        saveToStorage();
        showToast('Password reset successful', 'success');
    }
}

function deleteAccount(email) {
    // Prevent self-deletion
    if (currentUser && currentUser.email === email) {
        showToast('Cannot delete your own account', 'danger');
        return;
    }
    
    if (!confirm('Delete this account?')) return;
    
    window.db.accounts = window.db.accounts.filter(a => a.email !== email);
    saveToStorage();
    showToast('Account deleted', 'info');
    renderAccounts();
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
                        </tr>
                    </thead>
                    <tbody>
                        ${userRequests.map(req => {
                            const statusClass = req.status === 'Pending' ? 'warning' : 
                                              req.status === 'Approved' ? 'success' : 'danger';
                            const itemsList = req.items.map(item => `${item.name} (${item.qty})`).join(', ');
                            
                            return `
                                <tr>
                                    <td>${req.date}</td>
                                    <td>${req.type}</td>
                                    <td>${itemsList}</td>
                                    <td><span class="badge bg-${statusClass}">${req.status}</span></td>
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
    itemRows.forEach(row => {
        const name = row.querySelector('.item-name').value.trim();
        const qty = parseInt(row.querySelector('.item-qty').value);
        if (name) {
            items.push({ name, qty });
        }
    });
    
    if (items.length === 0) {
        showToast('Please add at least one item', 'danger');
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
    
    showToast('Request submitted', 'success');
    
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
    
    // Employee form
    const employeeForm = document.getElementById('employee-form');
    if (employeeForm) {
        employeeForm.addEventListener('submit', handleEmployeeSubmit);
    }
    
    const addEmployeeBtn = document.getElementById('add-employee-btn');
    if (addEmployeeBtn) {
        addEmployeeBtn.addEventListener('click', showEmployeeForm);
    }
    
    const cancelEmployeeBtn = document.getElementById('cancel-employee-btn');
    if (cancelEmployeeBtn) {
        cancelEmployeeBtn.addEventListener('click', hideEmployeeForm);
    }
    
    // Account form
    const accountForm = document.getElementById('account-form');
    if (accountForm) {
        accountForm.addEventListener('submit', handleAccountSubmit);
    }
    
    const addAccountBtn = document.getElementById('add-account-btn');
    if (addAccountBtn) {
        addAccountBtn.addEventListener('click', showAccountForm);
    }
    
    const cancelAccountBtn = document.getElementById('cancel-account-btn');
    if (cancelAccountBtn) {
        cancelAccountBtn.addEventListener('click', hideAccountForm);
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
});