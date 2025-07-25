/**
 * Promptin Chrome Extension Popup
 * Manages prompts with URL targeting functionality
 */

class PromptinPopup {
  constructor() {
    this.selectedPromptId = -1;
    this.currentTabUrl = '';
    this.elements = {};
    
    this.init();
  }

  /**
   * Initialize the popup application
   */
  async init() {
    try {
      this.initializeElements();
      await this.initializeDatabase();
      await this.getCurrentTab();
      await this.loadCurrentPrompt();
      this.attachEventListeners();
      await this.renderSidebar();
    } catch (error) {
      console.error('Failed to initialize popup:', error);
    }
  }

  /**
   * Cache DOM elements for better performance
   */
  initializeElements() {
    const elementIds = [
      'btn-add', 'noSelection', 'prompt-content', 'input-title',
      'pencil-icon', 'input-url', 'input-prompt', 'input-target',
      'btn-delete', 'btn-duplicate', 'btn-save', 'currentUrl',
      'sidebar-content', 'target-url-title'
    ];

    elementIds.forEach(id => {
      const element = document.getElementById(id);
      if (!element) {
        console.warn(`Element with id '${id}' not found`);
      }
      this.elements[this.toCamelCase(id)] = element;
    });
  }

  /**
   * Convert kebab-case to camelCase
   */
  toCamelCase(str) {
    return str.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
  }

  /**
   * Extract domain from URL
   */
  extractDomain(url) {
    try {
      const urlObj = new URL(url);
      return `${urlObj.protocol}//${urlObj.hostname}`;
    } catch (error) {
      // If URL parsing fails, try to extract domain manually
      const match = url.match(/^(https?:\/\/[^\/]+)/);
      return match ? match[1] : url;
    }
  }

  /**
   * Database Management
   */
  async getDatabase() {
    try {
      const result = await chrome.storage.local.get(['promptinJsonDB']);
      return result.promptinJsonDB || null;
    } catch (error) {
      console.error('Failed to get database:', error);
      return null;
    }
  }

  async saveDatabase(data) {
    try {
      await chrome.storage.local.set({ promptinJsonDB: data });
      return true;
    } catch (error) {
      console.error('Failed to save database:', error);
      return false;
    }
  }

  async initializeDatabase() {
    const db = await this.getDatabase();
    if (db === null) {
      const initialData = [{
        id: await this.generateId(),
        title: "Welcome to Promptin!",
        url: "https://www.github.com/yebece/promptin",
        prompt: "Thank you for installing Promptin! You can support me by starring the repo on GitHub. You can safely delete this prompt now.",
        target: "1", // 0: Domain, 1: Specific URL, 2: All Websites
        timestamp: Date.now()
      }];
      await this.saveDatabase(initialData);
    }
  }

  async generateId() {
    const db = await this.getDatabase() || [];
    const maxId = db.length > 0 ? Math.max(...db.map(p => p.id)) : -1;
    return maxId + 1;
  }

  /**
   * Prompt CRUD Operations
   */
  async getPromptById(id) {
    const db = await this.getDatabase();
    return db ? db.find(prompt => prompt.id === id) : null;
  }

  async getPromptByUrl(url) {
    const db = await this.getDatabase();
    return db ? db.find(prompt => prompt.url === url) : null;
  }

  async getPromptByDomain(domain) {
    const db = await this.getDatabase();
    return db ? db.find(prompt => prompt.url.includes(domain)) : null;
  }

  async addPrompt(promptData) {
    const db = await this.getDatabase() || [];
    const newPrompt = {
      id: await this.generateId(),
      title: promptData.title || "New Prompt",
      url: promptData.url || "",
      prompt: promptData.prompt || "",
      target: promptData.target || "1",
      timestamp: Date.now()
    };
    
    db.unshift(newPrompt);
    
    if (await this.saveDatabase(db)) {
      this.selectedPromptId = newPrompt.id;
      this.loadPromptData(newPrompt);
      await this.renderSidebar();
      this.checkForChanges();
      return newPrompt;
    }
    return null;
  }

  async updatePrompt(id, updates) {
    const db = await this.getDatabase();
    if (!db) return false;

    const index = db.findIndex(prompt => prompt.id === id);
    if (index === -1) return false;

    db[index] = {
      ...db[index],
      ...updates,
      timestamp: Date.now()
    };

    return await this.saveDatabase(db);
  }

  async deletePrompt(id) {
    const db = await this.getDatabase();
    if (!db) return false;

    const filteredDb = db.filter(prompt => prompt.id !== id);
    return await this.saveDatabase(filteredDb);
  }

  async duplicatePrompt(id) {
    const originalPrompt = await this.getPromptById(id);
    if (!originalPrompt) return null;

    return await this.addPrompt({
      title: `${originalPrompt.title} (Copy)`,
      url: originalPrompt.url,
      prompt: originalPrompt.prompt,
      target: originalPrompt.target
    });
  }

  /**
   * Tab and URL Management
   */
  async getCurrentTab() {
    return new Promise((resolve) => {
      chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
        if (tabs && tabs[0]) {
          this.currentTabUrl = tabs[0].url;
        }
        resolve();
      });
    });
  }

  async loadCurrentPrompt() {
    const foundPrompt = await this.getPromptByUrl(this.currentTabUrl);
    
    if (foundPrompt) {
      this.showPromptContent();
      this.selectedPromptId = foundPrompt.id;
      this.loadPromptData(foundPrompt);
    } else {
      this.showNoSelection();
      this.selectedPromptId = -1;
    }
  }

  /**
   * UI State Management
   */
  showPromptContent() {
    if (this.elements.promptContent && this.elements.noSelection) {
      this.elements.promptContent.classList.remove('displayNone');
      this.elements.noSelection.classList.add('displayNone');
    }
  }

  showNoSelection() {
    if (this.elements.promptContent && this.elements.noSelection) {
      this.elements.promptContent.classList.add('displayNone');
      this.elements.noSelection.classList.remove('displayNone');
    }
  }

  loadPromptData(prompt) {
    if (!prompt) return;

    const fields = ['inputTitle', 'inputUrl', 'inputPrompt', 'inputTarget'];
    const values = [prompt.title, prompt.url, prompt.prompt, prompt.target];

    fields.forEach((field, index) => {
      if (this.elements[field]) {
        this.elements[field].value = values[index] || '';
      }
    });

    this.checkForChanges();
  }

  async openPrompt(id) {
    const prompt = await this.getPromptById(id);
    if (!prompt) return;

    this.showPromptContent();
    this.selectedPromptId = id;
    this.loadPromptData(prompt);
    await this.renderSidebar();
  }

  /**
   * Form Validation and Change Detection
   */
  async checkForChanges() {
    if (this.selectedPromptId === -1) return;

    const originalPrompt = await this.getPromptById(this.selectedPromptId);
    if (!originalPrompt) return;

    const currentValues = this.getCurrentFormValues();
    const hasChanges = this.hasFormChanged(originalPrompt, currentValues);

    this.updateTargetVisibility(currentValues.target);
    this.updateSaveButton(hasChanges);
  }

  getCurrentFormValues() {
    return {
      title: this.elements.inputTitle?.value || '',
      url: this.elements.inputUrl?.value || '',
      prompt: this.elements.inputPrompt?.value || '',
      target: this.elements.inputTarget?.value || '1'
    };
  }

  hasFormChanged(original, current) {
    return (
      current.title !== original.title ||
      current.url !== original.url ||
      current.prompt !== original.prompt ||
      current.target !== original.target
    );
  }

  updateTargetVisibility(targetValue) {
    const isAllWebsites = targetValue === "2";
    const isDomain = targetValue === "0";
    const elementsToToggle = [this.elements.targetUrlTitle, this.elements.inputUrl];
    
    elementsToToggle.forEach(element => {
      if (element) {
        element.classList.toggle('displayNone', isAllWebsites);
      }
    });

    if (this.elements.inputPrompt) {
      this.elements.inputPrompt.style.height = isAllWebsites ? "202px" : "144px";
    }

    // When domain is selected, extract just the domain from the URL
    if (isDomain && this.elements.inputUrl && this.elements.inputUrl.value) {
      const currentUrl = this.elements.inputUrl.value;
      const domainOnly = this.extractDomain(currentUrl);
      if (domainOnly && domainOnly !== currentUrl) {
        this.elements.inputUrl.value = domainOnly;
      }
    }
  }

  updateSaveButton(hasChanges) {
    if (this.elements.btnSave) {
      this.elements.btnSave.classList.toggle('btn-disabled', !hasChanges);
    }
  }

  /**
   * Sidebar Rendering
   */
  async renderSidebar() {
    if (!this.elements.sidebarContent) return;

    const db = await this.getDatabase() || [];
    
    this.elements.sidebarContent.innerHTML = db.map(prompt => {
      const isSelected = prompt.id === this.selectedPromptId;
      const selectedClass = isSelected ? ' prompt-item-selected' : '';
      const clickHandler = isSelected ? '' : ` data-prompt-id="${prompt.id}"`;
      
      return `
        <div class="prompt-item${selectedClass}" id="prompt-item-${prompt.id}"${clickHandler}>
          <span>${this.escapeHtml(prompt.title)}</span>
        </div>
      `;
    }).join('');

    this.attachSidebarEvents();
  }

  attachSidebarEvents() {
    const promptItems = this.elements.sidebarContent?.querySelectorAll('[data-prompt-id]');
    if (!promptItems) return;

    promptItems.forEach(item => {
      const promptId = parseInt(item.dataset.promptId);
      item.addEventListener('click', () => this.openPrompt(promptId));
    });
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Event Handlers
   */
  async handleSave() {
    if (this.elements.btnSave?.classList.contains('btn-disabled')) return;

    const formValues = this.getCurrentFormValues();
    if (await this.updatePrompt(this.selectedPromptId, formValues)) {
      await this.renderSidebar();
      await this.checkForChanges();
    }
  }

  async handleAdd() {
    const newPrompt = await this.addPrompt({
      title: "New Prompt",
      url: this.currentTabUrl,
      prompt: "",
      target: "1"
    });

    if (newPrompt) {
      this.showPromptContent();
    }
  }

  async handleDelete() {
    if (this.selectedPromptId === -1) return;

    if (await this.deletePrompt(this.selectedPromptId)) {
      this.selectedPromptId = -1;
      this.showNoSelection();
      await this.renderSidebar();
    }
  }

  async handleDuplicate() {
    if (this.selectedPromptId === -1) return;

    const duplicatedPrompt = await this.duplicatePrompt(this.selectedPromptId);
    if (duplicatedPrompt) {
      this.showPromptContent();
    }
  }

  /**
   * Event Listener Setup
   */
  attachEventListeners() {
    // Form change detection
    const formFields = ['inputTitle', 'inputUrl', 'inputPrompt'];
    formFields.forEach(field => {
      this.elements[field]?.addEventListener('input', () => this.checkForChanges());
    });
    
    this.elements.inputTarget?.addEventListener('change', () => this.checkForChanges());

    // Button handlers
    this.elements.btnSave?.addEventListener('click', () => this.handleSave());
    this.elements.btnAdd?.addEventListener('click', () => this.handleAdd());
    this.elements.btnDelete?.addEventListener('click', () => this.handleDelete());
    this.elements.btnDuplicate?.addEventListener('click', () => this.handleDuplicate());
  }
}

// Initialize the application when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new PromptinPopup());
} else {
  new PromptinPopup();
}