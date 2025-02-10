class TikTokScriptGenerator {
    constructor() {
        this.apiKey = localStorage.getItem('openRouterApiKey') || '';
        this.toneStyle = null;
        this.outputLanguage = null;
        this.initializeElements();
        this.setupEventListeners();
    }

    initializeElements() {
        this.productDescription = document.getElementById('productDescription');
        this.videoLength = document.getElementById('videoLength');
        this.lengthValue = document.getElementById('lengthValue');
        this.apiKeyInput = document.getElementById('apiKey');
        this.generateButton = document.getElementById('generateButton');
        this.progressBar = document.querySelector('.progress-bar');
        this.progress = document.querySelector('.progress');
        this.themeToggle = document.getElementById('themeToggle');
        this.toneStyle = document.getElementById('toneStyle');
        this.outputLanguage = document.getElementById('outputLanguage');
        
        // Set stored API key if exists
        if (this.apiKey) {
            this.apiKeyInput.value = this.apiKey;
        }
    }

    setupEventListeners() {
        this.videoLength.addEventListener('input', () => {
            this.lengthValue.textContent = `${this.videoLength.value}s`;
        });

        document.getElementById('saveApiKey').addEventListener('click', () => {
            this.saveApiKey();
        });

        document.getElementById('resetApiKey').addEventListener('click', () => {
            this.resetApiKey();
        });

        this.generateButton.addEventListener('click', () => {
            this.generateScripts();
        });

        this.themeToggle.addEventListener('click', () => {
            this.toggleTheme();
        });
    }

    saveApiKey() {
        const key = this.apiKeyInput.value.trim();
        if (key) {
            this.apiKey = key;
            localStorage.setItem('openRouterApiKey', key);
            alert('API key saved successfully!');
        }
    }

    resetApiKey() {
        this.apiKey = '';
        this.apiKeyInput.value = '';
        localStorage.removeItem('openRouterApiKey');
        alert('API key reset successfully!');
    }

    toggleTheme() {
        document.body.classList.toggle('dark-theme');
        this.themeToggle.textContent = document.body.classList.contains('dark-theme') ? '☀️' : '🌙';
    }

    async generateScripts() {
        if (!this.apiKey) {
            alert('Please enter an OpenRouter API key first!');
            return;
        }

        const description = this.productDescription.value.trim();
        if (!description) {
            alert('Please enter a product description!');
            return;
        }

        this.showProgress();
        
        try {
            await this.generateScript(description);
        } catch (error) {
            console.error('Error generating scripts:', error);
            alert('Error generating scripts. Please try again.');
        }

        this.hideProgress();
    }

    async generateScript(description) {
        const prompt = this.createPrompt(description);
        
        try {
            const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`
                },
                body: JSON.stringify({
                    model: 'google/learnlm-1.5-pro-experimental:free',
                    messages: [{ role: 'user', content: prompt }]
                })
            });

            const data = await response.json();
            this.displayScript(data.choices[0].message.content);
        } catch (error) {
            throw error;
        }
    }

    parseScriptSegments(content) {
        const segments = {
            hookHeadline: '',
            hook: '',
            problem: '',
            solution: '',
            cta: '',
            seo: '',
            caption: '',
            hashtags: ''
        };

        // Log the raw content for debugging
        console.log('Raw content:', content);

        try {
            // Extract content between the markers
            const scriptContent = content.split('===== START OF SCRIPT =====')[1]?.split('===== END OF SCRIPT =====')[0] || content;
            
            // Split into sections
            const sections = scriptContent.split(/\n(?=[A-Z]+:)/);
            
            sections.forEach(section => {
                const trimmedSection = section.trim();
                if (!trimmedSection) return;

                // Match each section more precisely
                const sectionMatches = {
                    'HOOK HEADLINE:': 'hookHeadline',
                    'HOOK:': 'hook',
                    'PROBLEM:': 'problem',
                    'SOLUTION:': 'solution',
                    'CTA:': 'cta',
                    'SEO:': 'seo',
                    'CAPTION:': 'caption',
                    'HASHTAGS:': 'hashtags'
                };

                for (const [header, key] of Object.entries(sectionMatches)) {
                    if (trimmedSection.toUpperCase().startsWith(header)) {
                        let content = trimmedSection.substring(header.length).trim();
                        content = this.cleanContent(content);
                        segments[key] = content || `[No ${key} content provided]`;
                        break;
                    }
                }
            });

            // Log the parsed segments for debugging
            console.log('Parsed segments:', segments);

            return segments;
        } catch (error) {
            console.error('Error parsing content:', error);
            return segments;
        }
    }

    cleanContent(content) {
        return content
            .replace(/^\[|\]$/g, '')    // Remove square brackets
            .replace(/^[-*•]/g, '')     // Remove bullet points
            .replace(/^["']|["']$/g, '') // Remove quotes
            .replace(/^content:/i, '')   // Remove "content:" prefix
            .trim();
    }

    createPrompt(description) {
        const videoLength = this.videoLength.value;
        const style = this.toneStyle.value;
        const language = this.outputLanguage.value;
        
        const languagePrompt = language === 'malay' ? 
            'Write the script in Bahasa Malaysia. Make it sound natural and conversational, not like a direct translation.' :
            'Write the script in English. Make it sound natural and conversational.';

        return `Create a TikTok script with the following specifications. Use this EXACT format with no deviations:

Product/Service: ${description}
Duration: ${videoLength} seconds
Style: ${style}
Language: ${languagePrompt}

===== START OF SCRIPT =====

HOOK HEADLINE:
[Write a short, attention-grabbing title that creates curiosity or promises value]

HOOK:
[Create a powerful 1-3 second opening that immediately grabs attention. Consider these hook types:
- Shocking statement or statistic
- Controversial or unexpected opening
- Direct question to viewer
- "Wait until you see this" moment
- Pattern interrupt
The hook must stop the scroll and make viewers want to keep watching. Be specific and compelling.]

PROBLEM:
[Describe the main problem or pain point]

SOLUTION:
[Present how the product solves the problem]

CTA:
[Add compelling call to action]

SEO:
[List 5-7 relevant keywords for TikTok search]

CAPTION:
[Write engaging caption]

HASHTAGS:
[Add 5 relevant trending hashtags]

===== END OF SCRIPT =====

Important: 
1. The hook must be extremely compelling and work within the first 1-3 seconds
2. Use pattern interrupts or curiosity gaps to stop the scroll
3. Keep the exact section headers as shown above
4. Include content for ALL sections
5. Make it conversational and authentic`;
    }

    displayScript(content) {
        const scriptContainer = document.querySelector('.script-variant');
        scriptContainer.classList.remove('hidden');
        
        // Parse the content into segments
        const segments = this.parseScriptSegments(content);
        
        // Update each segment with proper formatting
        Object.keys(segments).forEach(key => {
            const element = document.getElementById(`${key}Content`);
            if (element) {
                let formattedContent = segments[key];
                
                // Special formatting for hashtags
                if (key === 'hashtags') {
                    formattedContent = formattedContent
                        .split(/\s+/)
                        .filter(tag => tag.startsWith('#'))
                        .join(' ');
                    if (!formattedContent) {
                        formattedContent = '#tiktok #viral #trending #fyp #foryou';
                    }
                }
                
                element.textContent = formattedContent;
            }
        });
        
        // Setup copy button for formatted content
        const copyButton = scriptContainer.querySelector('.copy-button');
        const formattedFullContent = this.getFormattedFullContent(segments);
        
        // Remove old event listeners
        copyButton.replaceWith(copyButton.cloneNode(true));
        const newCopyButton = scriptContainer.querySelector('.copy-button');
        newCopyButton.addEventListener('click', () => this.copyToClipboard(formattedFullContent, newCopyButton));
    }

    getFormattedFullContent(segments) {
        return `🎥 TikTok Script

📌 Hook Headline:
${segments.hookHeadline}

📣 Hook:
${segments.hook}

❗ Problem:
${segments.problem}

✨ Solution:
${segments.solution}

👉 Call to Action:
${segments.cta}

🔍 SEO Keywords:
${segments.seo}

📝 Caption:
${segments.caption}

🏷️ Hashtags:
${segments.hashtags}`;
    }

    async copyToClipboard(text, button) {
        try {
            await navigator.clipboard.writeText(text);
            const originalText = button.innerHTML;
            button.innerHTML = '<span class="copy-icon">✅</span><span class="copy-text">Copied!</span>';
            button.classList.add('copied');
            
            setTimeout(() => {
                button.innerHTML = originalText;
                button.classList.remove('copied');
            }, 2000);
        } catch (err) {
            console.error('Failed to copy text: ', err);
            alert('Failed to copy to clipboard');
        }
    }

    showProgress() {
        this.progressBar.classList.remove('hidden');
        this.progress.style.width = '0%';
        this.generateButton.disabled = true;
        
        // Simulate progress
        let width = 0;
        const interval = setInterval(() => {
            if (width >= 90) {
                clearInterval(interval);
            }
            width += 5;
            this.progress.style.width = `${width}%`;
        }, 200);
    }

    hideProgress() {
        this.progress.style.width = '100%';
        setTimeout(() => {
            this.progressBar.classList.add('hidden');
            this.generateButton.disabled = false;
        }, 500);
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    new TikTokScriptGenerator();
}); 