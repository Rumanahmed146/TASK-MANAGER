class TaskManager {
    constructor() {
        this.users = JSON.parse(localStorage.getItem('users')) || [];
        this.currentUser = null;
        this.tasks = JSON.parse(localStorage.getItem('tasks')) || {};
        this.currentFilter = 'all';
        this.currentModalTaskId = null;
        this.currentEditTaskId = null;
        this.isDarkMode = localStorage.getItem('darkMode') === 'true';
        this.currentSearchQuery = '';
        
        this.initializeEventListeners();
        this.checkLoginStatus();
        this.initTheme();
    }

    initializeEventListeners() {
        // Signup and login forms
        document.getElementById('signup-form').addEventListener('submit', (e) => this.handleSignup(e));
        document.getElementById('login-form').addEventListener('submit', (e) => this.handleLogin(e));
        
        // Show/hide forms
        document.getElementById('show-login').addEventListener('click', (e) => {
            e.preventDefault();
            this.showLogin();
        });
        
        document.getElementById('show-signup').addEventListener('click', (e) => {
            e.preventDefault();
            this.showSignup();
        });
        
        // Task management
        document.getElementById('add-task-btn').addEventListener('click', () => this.addTask());
        
        // Logout
        document.getElementById('logout-btn').addEventListener('click', () => this.logout());
        
        // Filters
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const filter = e.target.getAttribute('data-filter');
                this.filterTasks(filter);
            });
        });
        
        // Theme toggle
        document.getElementById('theme-toggle').addEventListener('click', () => this.toggleTheme());
        
        // Export/Import
        document.getElementById('export-btn').addEventListener('click', () => this.exportTasks());
        document.getElementById('import-btn').addEventListener('click', () => this.triggerImport());
        document.getElementById('import-file').addEventListener('change', (e) => this.importTasks(e));
        
        // Search
        document.getElementById('search-input').addEventListener('input', (e) => {
            this.currentSearchQuery = e.target.value.toLowerCase();
            this.renderTasks();
        });
        
        // Sort
        document.getElementById('sort-select').addEventListener('change', (e) => {
            this.sortTasks(e.target.value);
        });
        
        // Modal events
        document.querySelector('.close-modal').addEventListener('click', () => this.closeModal());
        document.getElementById('complete-task-btn').addEventListener('click', () => this.completeTask());
        document.getElementById('reopen-task-btn').addEventListener('click', () => this.reopenTask());
        document.getElementById('delete-task-btn').addEventListener('click', () => this.deleteTaskModal());
        document.getElementById('edit-task-btn').addEventListener('click', () => this.openEditModal());
        document.getElementById('save-edit-btn').addEventListener('click', () => this.saveEditTask());
        
        // Subtasks
        document.getElementById('add-subtask-btn').addEventListener('click', () => this.addSubtask());
        document.getElementById('new-subtask').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.addSubtask();
            }
        });
        
        // Close modal when clicking outside
        document.getElementById('task-modal').addEventListener('click', (e) => {
            if (e.target.id === 'task-modal') {
                this.closeModal();
            }
        });
        
        document.getElementById('edit-modal').addEventListener('click', (e) => {
            if (e.target.id === 'edit-modal') {
                this.closeEditModal();
            }
        });
    }

    initTheme() {
        const savedTheme = localStorage.getItem('darkMode');
        this.isDarkMode = savedTheme === 'true';
        
        if (this.isDarkMode) {
            document.body.classList.add('dark-mode');
            document.getElementById('theme-toggle').innerHTML = '<i class="fas fa-sun"></i>';
        } else {
            document.body.classList.remove('dark-mode');
            document.getElementById('theme-toggle').innerHTML = '<i class="fas fa-moon"></i>';
        }
    }

    toggleTheme() {
        this.isDarkMode = !this.isDarkMode;
        localStorage.setItem('darkMode', this.isDarkMode);
        
        if (this.isDarkMode) {
            document.body.classList.add('dark-mode');
            document.getElementById('theme-toggle').innerHTML = '<i class="fas fa-sun"></i>';
            this.showNotification('Dark mode enabled', 'info');
        } else {
            document.body.classList.remove('dark-mode');
            document.getElementById('theme-toggle').innerHTML = '<i class="fas fa-moon"></i>';
            this.showNotification('Light mode enabled', 'info');
        }
    }

    handleSignup(e) {
        e.preventDefault();
        const username = document.getElementById('signup-username').value.trim();
        const email = document.getElementById('signup-email').value.trim();
        const password = document.getElementById('signup-password').value;

        // Validation
        if (username.length < 3) {
            this.showNotification('Username must be at least 3 characters long!', 'error');
            return;
        }

        if (password.length < 6) {
            this.showNotification('Password must be at least 6 characters long!', 'error');
            return;
        }

        if (this.users.find(user => user.username === username)) {
            this.showNotification('Username already exists!', 'error');
            return;
        }

        if (this.users.find(user => user.email === email)) {
            this.showNotification('Email already registered!', 'error');
            return;
        }

        const newUser = { username, email, password };
        this.users.push(newUser);
        localStorage.setItem('users', JSON.stringify(this.users));

        this.showNotification('Signup successful! Please login.', 'success');
        this.showLogin();
        e.target.reset();
    }

    handleLogin(e) {
        e.preventDefault();
        const username = document.getElementById('login-username').value.trim();
        const password = document.getElementById('login-password').value;

        const user = this.users.find(u => u.username === username && u.password === password);
        
        if (user) {
            this.currentUser = user;
            localStorage.setItem('currentUser', JSON.stringify(user));
            this.showTaskManager();
            this.loadTasks();
            this.showNotification(`Welcome back, ${username}!`, 'success');
        } else {
            this.showNotification('Invalid username or password!', 'error');
        }
        
        e.target.reset();
    }

    showSignup() {
        document.getElementById('login-section').classList.add('hidden');
        document.getElementById('signup-section').classList.remove('hidden');
    }

    showLogin() {
        document.getElementById('signup-section').classList.add('hidden');
        document.getElementById('login-section').classList.remove('hidden');
    }

    showTaskManager() {
        document.getElementById('login-section').classList.add('hidden');
        document.getElementById('signup-section').classList.add('hidden');
        document.getElementById('task-manager').classList.remove('hidden');
        document.getElementById('user-name').textContent = this.currentUser.username;
    }

    checkLoginStatus() {
        const savedUser = localStorage.getItem('currentUser');
        if (savedUser) {
            this.currentUser = JSON.parse(savedUser);
            this.showTaskManager();
            this.loadTasks();
        }
    }

    addTask() {
        const taskInput = document.getElementById('new-task');
        const descriptionInput = document.getElementById('task-description');
        const priorityInput = document.getElementById('task-priority');
        const categoryInput = document.getElementById('task-category');
        const dueDateInput = document.getElementById('task-due-date');
        
        const taskText = taskInput.value.trim();

        if (taskText === '') {
            this.showNotification('Please enter a task title!', 'error');
            return;
        }

        const task = {
            id: Date.now(),
            text: taskText,
            description: descriptionInput.value.trim(),
            priority: priorityInput.value,
            category: categoryInput.value,
            dueDate: dueDateInput.value,
            completed: false,
            createdAt: new Date().toLocaleString(),
            updatedAt: new Date().toLocaleString(),
            subtasks: []
        };

        if (!this.tasks[this.currentUser.username]) {
            this.tasks[this.currentUser.username] = [];
        }

        this.tasks[this.currentUser.username].unshift(task);
        localStorage.setItem('tasks', JSON.stringify(this.tasks));

        taskInput.value = '';
        descriptionInput.value = '';
        dueDateInput.value = '';
        priorityInput.value = 'medium';
        categoryInput.value = 'personal';
        
        this.renderTasks();
        this.showNotification('Task added successfully!', 'success');
    }

    loadTasks() {
        this.renderTasks();
    }

    renderTasks() {
        const taskList = document.getElementById('task-list');
        taskList.innerHTML = '';

        const userTasks = this.tasks[this.currentUser.username] || [];
        
        // Apply search filter
        let filteredTasks = userTasks;
        if (this.currentSearchQuery) {
            filteredTasks = userTasks.filter(task => 
                task.text.toLowerCase().includes(this.currentSearchQuery) ||
                task.description.toLowerCase().includes(this.currentSearchQuery)
            );
        }
        
        // Apply type filter
        filteredTasks = this.filterTasksByType(filteredTasks, this.currentFilter);

        if (filteredTasks.length === 0) {
            taskList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-tasks"></i>
                    <p>No tasks found</p>
                </div>
            `;
            this.updateStats();
            return;
        }

        filteredTasks.forEach(task => {
            const taskItem = document.createElement('li');
            taskItem.className = `task-item ${task.completed ? 'completed' : ''} ${task.priority}-priority ${this.isOverdue(task) ? 'overdue' : ''}`;
            
            const dueDateInfo = task.dueDate ? `
                <div class="due-date-info ${this.isOverdue(task) ? 'overdue' : ''}">
                    <i class="fas fa-calendar"></i>
                    Due: ${this.formatDate(task.dueDate)}
                </div>
            ` : '';
            
            taskItem.innerHTML = `
                <div class="task-header">
                    <div class="task-title">${task.text}</div>
                    <div class="task-meta-info">
                        <span class="task-date">${task.createdAt}</span>
                        <span class="priority-badge ${task.priority}">${task.priority}</span>
                        <span class="category-badge ${task.category}">${task.category}</span>
                    </div>
                </div>
                ${dueDateInfo}
                ${task.description ? `<div class="task-preview">${task.description}</div>` : ''}
                <div class="task-actions">
                    <button class="action-btn btn-view" onclick="taskManager.openTaskModal(${task.id})">
                        <i class="fas fa-eye"></i> View
                    </button>
                    <button class="action-btn btn-edit-small" onclick="taskManager.openEditModal(${task.id})">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    ${!task.completed ? `
                        <button class="action-btn btn-complete-small" onclick="taskManager.toggleTask(${task.id})">
                            <i class="fas fa-check"></i> Complete
                        </button>
                    ` : `
                        <button class="action-btn btn-reopen-small" onclick="taskManager.toggleTask(${task.id})">
                            <i class="fas fa-redo"></i> Reopen
                        </button>
                    `}
                    <button class="action-btn btn-delete-small" onclick="taskManager.deleteTask(${task.id})">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            `;
            taskList.appendChild(taskItem);
        });

        this.updateStats();
        this.updateProgress();
        this.updateOverdueIndicator();
    }

    filterTasksByType(tasks, filter) {
        switch (filter) {
            case 'completed':
                return tasks.filter(task => task.completed);
            case 'pending':
                return tasks.filter(task => !task.completed);
            case 'overdue':
                return tasks.filter(task => !task.completed && this.isOverdue(task));
            default:
                return tasks;
        }
    }

    isOverdue(task) {
        if (!task.dueDate || task.completed) return false;
        const dueDate = new Date(task.dueDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return dueDate < today;
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-GB');
    }

    openTaskModal(taskId) {
        const userTasks = this.tasks[this.currentUser.username] || [];
        const task = userTasks.find(t => t.id === taskId);
        
        if (task) {
            this.currentModalTaskId = taskId;
            
            document.getElementById('modal-task-title').textContent = task.text;
            document.getElementById('modal-task-date').textContent = `Created: ${task.createdAt}`;
            document.getElementById('modal-task-description').textContent = task.description || 'No description provided.';
            
            const priorityElement = document.getElementById('modal-task-priority');
            priorityElement.textContent = task.priority;
            priorityElement.className = `priority-badge ${task.priority}`;
            
            const categoryElement = document.getElementById('modal-task-category');
            categoryElement.textContent = task.category;
            categoryElement.className = `category-badge ${task.category}`;
            
            const dueDateElement = document.getElementById('modal-task-due-date');
            if (task.dueDate) {
                dueDateElement.textContent = this.formatDate(task.dueDate);
                dueDateElement.parentElement.classList.toggle('overdue', this.isOverdue(task));
            } else {
                dueDateElement.textContent = 'No due date';
            }
            
            const statusElement = document.getElementById('modal-task-status');
            statusElement.textContent = task.completed ? 'Completed' : 'Pending';
            statusElement.className = `status-badge ${task.completed ? 'completed' : 'pending'}`;
            
            // Show/hide appropriate buttons
            document.getElementById('complete-task-btn').classList.toggle('hidden', task.completed);
            document.getElementById('reopen-task-btn').classList.toggle('hidden', !task.completed);
            
            // Render subtasks
            this.renderSubtasks(task);
            
            document.getElementById('task-modal').classList.remove('hidden');
        }
    }

    renderSubtasks(task) {
        const subtasksList = document.getElementById('subtasks-list');
        subtasksList.innerHTML = '';
        
        if (task.subtasks && task.subtasks.length > 0) {
            task.subtasks.forEach((subtask, index) => {
                const subtaskItem = document.createElement('div');
                subtaskItem.className = `subtask-item ${subtask.completed ? 'completed' : ''}`;
                subtaskItem.innerHTML = `
                    <input type="checkbox" class="subtask-checkbox" ${subtask.completed ? 'checked' : ''} 
                           onchange="taskManager.toggleSubtask(${task.id}, ${index})">
                    <span class="subtask-text">${subtask.text}</span>
                `;
                subtasksList.appendChild(subtaskItem);
            });
        }
    }

    addSubtask() {
        const subtaskInput = document.getElementById('new-subtask');
        const subtaskText = subtaskInput.value.trim();
        
        if (!subtaskText || !this.currentModalTaskId) {
            this.showNotification('Please enter subtask text!', 'error');
            return;
        }
        
        const userTasks = this.tasks[this.currentUser.username];
        const task = userTasks.find(t => t.id === this.currentModalTaskId);
        
        if (task) {
            if (!task.subtasks) {
                task.subtasks = [];
            }
            
            task.subtasks.push({
                text: subtaskText,
                completed: false
            });
            
            localStorage.setItem('tasks', JSON.stringify(this.tasks));
            this.renderSubtasks(task);
            subtaskInput.value = '';
            this.showNotification('Subtask added!', 'success');
        }
    }

    toggleSubtask(taskId, subtaskIndex) {
        const userTasks = this.tasks[this.currentUser.username];
        const task = userTasks.find(t => t.id === taskId);
        
        if (task && task.subtasks && task.subtasks[subtaskIndex]) {
            task.subtasks[subtaskIndex].completed = !task.subtasks[subtaskIndex].completed;
            localStorage.setItem('tasks', JSON.stringify(this.tasks));
            
            // Refresh modal view
            if (this.currentModalTaskId === taskId) {
                this.renderSubtasks(task);
            }
        }
    }

    closeModal() {
        document.getElementById('task-modal').classList.add('hidden');
        this.currentModalTaskId = null;
        document.getElementById('new-subtask').value = '';
    }

    openEditModal(taskId = null) {
        if (taskId) {
            this.currentEditTaskId = taskId;
            const userTasks = this.tasks[this.currentUser.username] || [];
            const task = userTasks.find(t => t.id === taskId);
            
            if (task) {
                document.getElementById('edit-task-title').value = task.text;
                document.getElementById('edit-task-description').value = task.description || '';
                document.getElementById('edit-task-priority').value = task.priority;
                document.getElementById('edit-task-category').value = task.category;
                document.getElementById('edit-task-due-date').value = task.dueDate || '';
                
                document.getElementById('edit-modal').classList.remove('hidden');
                return;
            }
        }
        
        // If no taskId, we're coming from the main modal
        if (this.currentModalTaskId) {
            this.closeModal();
            this.openEditModal(this.currentModalTaskId);
        }
    }

    closeEditModal() {
        document.getElementById('edit-modal').classList.add('hidden');
        this.currentEditTaskId = null;
    }

    saveEditTask() {
        if (!this.currentEditTaskId) return;
        
        const userTasks = this.tasks[this.currentUser.username];
        const task = userTasks.find(t => t.id === this.currentEditTaskId);
        
        if (task) {
            const newTitle = document.getElementById('edit-task-title').value.trim();
            if (!newTitle) {
                this.showNotification('Task title cannot be empty!', 'error');
                return;
            }
            
            task.text = newTitle;
            task.description = document.getElementById('edit-task-description').value.trim();
            task.priority = document.getElementById('edit-task-priority').value;
            task.category = document.getElementById('edit-task-category').value;
            task.dueDate = document.getElementById('edit-task-due-date').value;
            task.updatedAt = new Date().toLocaleString();
            
            localStorage.setItem('tasks', JSON.stringify(this.tasks));
            this.renderTasks();
            this.closeEditModal();
            this.showNotification('Task updated successfully!', 'success');
        }
    }

    completeTask() {
        if (this.currentModalTaskId) {
            this.toggleTask(this.currentModalTaskId, true);
        }
    }

    reopenTask() {
        if (this.currentModalTaskId) {
            this.toggleTask(this.currentModalTaskId, true);
        }
    }

    deleteTaskModal() {
        if (this.currentModalTaskId) {
            this.deleteTask(this.currentModalTaskId, true);
        }
    }

    toggleTask(taskId, fromModal = false) {
        const userTasks = this.tasks[this.currentUser.username];
        const task = userTasks.find(t => t.id === taskId);
        if (task) {
            task.completed = !task.completed;
            task.updatedAt = new Date().toLocaleString();
            localStorage.setItem('tasks', JSON.stringify(this.tasks));
            
            this.renderTasks();
            this.showNotification(`Task marked as ${task.completed ? 'completed' : 'pending'}!`, 'success');
            
            // Check if all tasks are completed for confetti
            if (task.completed) {
                this.checkAllTasksCompleted();
            }
            
            if (fromModal) {
                if (task.completed) {
                    this.closeModal();
                } else {
                    this.openTaskModal(taskId);
                }
            }
        }
    }

    checkAllTasksCompleted() {
        const userTasks = this.tasks[this.currentUser.username] || [];
        const allCompleted = userTasks.length > 0 && userTasks.every(task => task.completed);
        
        if (allCompleted) {
            this.showConfetti();
            this.showNotification('🎉 All tasks completed! Amazing work!', 'success');
        }
    }

    deleteTask(taskId, fromModal = false) {
        if (confirm('Are you sure you want to delete this task?')) {
            this.tasks[this.currentUser.username] = this.tasks[this.currentUser.username].filter(t => t.id !== taskId);
            localStorage.setItem('tasks', JSON.stringify(this.tasks));
            
            this.renderTasks();
            this.showNotification('Task deleted successfully!', 'success');
            
            if (fromModal) {
                this.closeModal();
            }
        }
    }

    filterTasks(filter) {
        this.currentFilter = filter;
        document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelector(`[data-filter="${filter}"]`).classList.add('active');
        this.renderTasks();
    }

    sortTasks(sortBy) {
        const userTasks = this.tasks[this.currentUser.username] || [];
        
        switch (sortBy) {
            case 'name':
                userTasks.sort((a, b) => a.text.localeCompare(b.text));
                break;
            case 'priority':
                const priorityOrder = { high: 1, medium: 2, low: 3 };
                userTasks.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
                break;
            case 'date':
            default:
                userTasks.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                break;
        }
        
        this.tasks[this.currentUser.username] = userTasks;
        localStorage.setItem('tasks', JSON.stringify(this.tasks));
        this.renderTasks();
    }

    updateStats() {
        const userTasks = this.tasks[this.currentUser.username] || [];
        const total = userTasks.length;
        const completed = userTasks.filter(task => task.completed).length;
        const pending = total - completed;
        const overdue = userTasks.filter(task => !task.completed && this.isOverdue(task)).length;

        document.getElementById('total-tasks').textContent = total;
        document.getElementById('completed-tasks').textContent = completed;
        document.getElementById('pending-tasks').textContent = pending;
        document.getElementById('overdue-tasks').textContent = overdue;
    }

    updateProgress() {
        const userTasks = this.tasks[this.currentUser.username] || [];
        const total = userTasks.length;
        const completed = userTasks.filter(task => task.completed).length;
        const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
        
        document.getElementById('progress-fill').style.width = `${progress}%`;
        document.getElementById('progress-text').textContent = `${progress}%`;
    }

    updateOverdueIndicator() {
        const userTasks = this.tasks[this.currentUser.username] || [];
        const hasOverdue = userTasks.some(task => !task.completed && this.isOverdue(task));
        
        const overdueBtn = document.querySelector('[data-filter="overdue"]');
        if (overdueBtn) {
            if (hasOverdue) {
                overdueBtn.classList.add('has-overdue');
            } else {
                overdueBtn.classList.remove('has-overdue');
            }
        }
    }

    exportTasks() {
        const userTasks = this.tasks[this.currentUser.username] || [];
        if (userTasks.length === 0) {
            this.showNotification('No tasks to export!', 'warning');
            return;
        }
        
        const dataStr = JSON.stringify(userTasks, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `tasks-${this.currentUser.username}-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        this.showNotification('Tasks exported successfully!', 'success');
    }

    triggerImport() {
        document.getElementById('import-file').click();
    }

    importTasks(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importedTasks = JSON.parse(e.target.result);
                if (Array.isArray(importedTasks)) {
                    this.tasks[this.currentUser.username] = importedTasks;
                    localStorage.setItem('tasks', JSON.stringify(this.tasks));
                    this.renderTasks();
                    this.showNotification('Tasks imported successfully!', 'success');
                } else {
                    this.showNotification('Invalid file format!', 'error');
                }
            } catch (error) {
                this.showNotification('Error importing tasks!', 'error');
            }
        };
        reader.readAsText(file);
        event.target.value = '';
    }

    showConfetti() {
        const container = document.getElementById('confetti-container');
        container.innerHTML = '';
        
        for (let i = 0; i < 100; i++) {
            const confetti = document.createElement('div');
            confetti.className = 'confetti';
            confetti.style.left = Math.random() * 100 + 'vw';
            confetti.style.background = this.getRandomColor();
            confetti.style.animationDelay = Math.random() * 2 + 's';
            container.appendChild(confetti);
        }
        
        setTimeout(() => {
            container.innerHTML = '';
        }, 3000);
    }

    getRandomColor() {
        const colors = ['#ff4757', '#2ed573', '#1e90ff', '#ffa502', '#a55eea', '#fd9644'];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    logout() {
        this.currentUser = null;
        localStorage.removeItem('currentUser');
        document.getElementById('task-manager').classList.add('hidden');
        this.showLogin();
        this.showNotification('Logged out successfully!', 'info');
    }

    showNotification(message, type = 'info') {
        // Remove existing notifications
        const existingNotifications = document.querySelectorAll('.notification');
        existingNotifications.forEach(notification => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        });

        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        
        // Set icon based on type
        let icon = 'info-circle';
        if (type === 'success') icon = 'check-circle';
        if (type === 'error') icon = 'exclamation-circle';
        if (type === 'warning') icon = 'exclamation-triangle';
        
        notification.innerHTML = `
            <i class="fas fa-${icon}"></i>
            <span>${message}</span>
        `;
        
        document.body.appendChild(notification);
        
        // Remove notification after 3 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 3000);
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    window.taskManager = new TaskManager();
});
