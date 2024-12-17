class ImageRenamer {
    constructor() {
        // 直接使用全局配置
        if (!window.CONFIG) {
            console.error('配置未加载，使用默认配置');
            window.CONFIG = {
                BASE_PATH: '/image-renamer',
                // ... 其他默认配置
            };
        }
        
        this.config = window.CONFIG;
        this.basePath = this.config.BASE_PATH;
        this.uploadArea = document.getElementById('uploadArea');
        this.fileInput = document.getElementById('fileInput');
        this.previewArea = document.getElementById('previewArea');
        this.downloadBtn = document.getElementById('downloadAll');
        
        this.images = [];
        this.initEventListeners();
        this.setupOfflineSupport();
        this.validateConfig();
    }

    initEventListeners() {
        // 点击上传
        this.uploadArea.addEventListener('click', () => this.fileInput.click());
        
        // 文件选择
        this.fileInput.addEventListener('change', (e) => this.handleFiles(e.target.files));
        
        // 拖拽上传
        this.uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            this.uploadArea.style.background = '#F5F5F7';
        });
        
        this.uploadArea.addEventListener('dragleave', () => {
            this.uploadArea.style.background = 'white';
        });
        
        this.uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            this.uploadArea.style.background = 'white';
            this.handleFiles(e.dataTransfer.files);
        });

        // 下载按钮
        this.downloadBtn.addEventListener('click', () => this.downloadAll());

        // 添加清除按钮事件
        const clearBtn = document.getElementById('clearAll');
        clearBtn.addEventListener('click', () => this.clearAll());
        
        // 在开发环境下添加测试按钮
        if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
            this.addTestButton();
        }
    }

    setupOfflineSupport() {
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', async () => {
                try {
                    const swPath = './sw.js';
                    const registration = await navigator.serviceWorker.register(swPath, {
                        scope: './'
                    });
                    console.log('ServiceWorker ���册成功:', registration.scope);
                    this.showOfflineReady();
                } catch (err) {
                    console.error('ServiceWorker 注册失败:', err);
                    // 添加详细错误信息
                    if (err.name === 'TypeError') {
                        console.warn('提示：请确保 sw.js 文件存在且可访问');
                        console.warn('当前路径:', './sw.js');
                    }
                }
            });
        }
    }

    showOfflineReady() {
        const notice = document.createElement('div');
        notice.className = 'offline-ready';
        notice.textContent = '应用已可离线使用';
        document.body.appendChild(notice);
        
        setTimeout(() => {
            notice.classList.add('show');
        }, 100);

        setTimeout(() => {
            notice.classList.remove('show');
        }, 3000);
    }

    validateConfig() {
        if (!this.config.DEEPSEEK_API_KEY || this.config.DEEPSEEK_API_KEY === 'YOUR_DEEPSEEK_API_KEY') {
            console.warn('未配置 DeepSeek API Key，将使用本地文件名生成');
            this.useLocalNaming = true;
        }
    }

    async handleFiles(files) {
        if (!files || files.length === 0) {
            this.showNotification('请选择图片文件', 'warning');
            return;
        }

        const imageFiles = Array.from(files).filter(file => {
            // 检查文件类型
            const isSupported = file.type.startsWith('image/') && 
                this.config.SUPPORTED_FORMATS.includes(file.type);
            
            // 获取文件扩展名
            const extension = file.name.split('.').pop().toLowerCase();
            
            // 检查特殊格式
            const isJpeg = this.config.JPEG_EXTENSIONS.includes(extension);
            
            return isSupported || (file.type === 'image/jpeg' && isJpeg);
        });
        
        if (imageFiles.length === 0) {
            this.showNotification('请上传支持的图片格式：JPG/JPEG, PNG, GIF, BMP, WebP', 'error');
            return;
        }
        
        // 检查文件大小
        const oversizedFiles = imageFiles.filter(file => file.size > this.config.MAX_FILE_SIZE);
        if (oversizedFiles.length > 0) {
            this.showNotification(`${oversizedFiles.length} 个文件超过大小限制 (5MB)`, 'warning');
            return;
        }

        this.downloadBtn.disabled = false;
        const clearBtn = document.getElementById('clearAll');
        if (clearBtn) clearBtn.disabled = false;
        
        for (const file of imageFiles) {
            const imageData = {
                file,
                originalName: file.name,
                newName: '',
                preview: await this.createPreview(file)
            };
            
            this.images.push(imageData);
            this.displayPreview(imageData);
            
            // 开始处理图片
            this.processImage(imageData);
        }
    }

    async createPreview(file) {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.readAsDataURL(file);
        });
    }

    displayPreview(imageData) {
        const element = document.createElement('div');
        element.className = 'preview-item';
        element.innerHTML = `
            <img src="${imageData.preview}" alt="预览图">
            <p>原件名：${imageData.originalName}</p>
            <p class="new-name">处理中...</p>
        `;
        this.previewArea.appendChild(element);
        imageData.element = element;
    }

    async processImage(imageData) {
        try {
            // 更新处理状态
            this.updatePreviewStatus(imageData, '正在识别文字...');

            // 使用 Tesseract.js 进行 OCR，添加方向检测
            const result = await Tesseract.recognize(
                imageData.preview,
                this.config.OCR_LANGUAGES.join('+'),
                { 
                    logger: m => {
                        if (m.status === 'recognizing text') {
                            this.updatePreviewStatus(imageData, `识别中: ${Math.round(m.progress * 100)}%`);
                        }
                    },
                    // 添加方向检测和自动旋转
                    tessedit_pageseg_mode: Tesseract.PSM.AUTO_OSD,
                    preserve_interword_spaces: '1',
                    textord_tabfind_vertical_text: '1',
                    textord_tabfind_vertical_horizontal_mix: '1'
                }
            );

            // 检查识别置信度
            if (result.data.confidence < this.config.OCR_CONFIDENCE_THRESHOLD) {
                this.updatePreviewStatus(imageData, '识别质量较低，建议重新上传清晰图片', 'warning');
                return;
            }

            const text = result.data.text.trim();
            
            // 根据配置决定使用 AI 还是本地命名
            let newName;
            if (this.useLocalNaming) {
                newName = this.generateSimpleFileName(text);
                this.updatePreview(imageData, newName);
            } else {
                this.updatePreviewStatus(imageData, '正在生成智能文件名...');
                newName = await this.generateAIFileName(text, imageData.originalName);
                this.updatePreview(imageData, newName);
            }
            
        } catch (error) {
            console.error('处理图片失败:', error);
            this.updatePreviewStatus(imageData, '处理失败，请重试', 'error');
        }
    }

    async generateAIFileName(text, originalName) {
        try {
            const response = await fetch(this.config.API_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.config.DEEPSEEK_API_KEY}`
                },
                body: JSON.stringify({
                    model: this.config.AI_MODEL,
                    messages: [{
                        role: "user",
                        content: `请根据以下图片中识别出的文本内容，生成一个简短的、有意义的文件名（不超过${this.config.MAX_FILENAME_LENGTH}个字符，不要包含特殊字符）。
                        原文名：${originalName}
                        识别的文本内容：${text}`
                    }],
                    temperature: this.config.AI_TEMPERATURE,
                    max_tokens: this.config.MAX_TOKENS
                })
            });

            if (!response.ok) {
                throw new Error(`API 请求失败: ${response.status}`);
            }

            const data = await response.json();
            if (data.choices && data.choices[0] && data.choices[0].message) {
                return data.choices[0].message.content.trim();
            }
            
            throw new Error('API 响应格式错误');
        } catch (error) {
            console.error('AI 文件名生成失败:', error);
            this.showNotification('AI 命名失败，使用本地命名', 'warning');
            return this.generateSimpleFileName(text);
        }
    }

    generateSimpleFileName(text) {
        const words = text.split(/\s+/).filter(w => w.length > 0);
        const name = words.slice(0, 3).join('-');
        return name || this.config.FALLBACK_NAME;
    }

    updatePreviewStatus(imageData, status, type = 'info') {
        const statusElement = imageData.element.querySelector('.new-name');
        statusElement.textContent = status;
        statusElement.className = `new-name status-${type}`;
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.classList.add('show');
        }, 100);

        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    updatePreview(imageData, newName) {
        imageData.newName = newName;
        this.updatePreviewStatus(imageData, `新文件名：${newName}`, 'info');
    }

    async downloadAll() {
        if (this.images.length === 0) {
            this.showNotification('没有可下载的文件', 'warning');
            return;
        }

        try {
            this.downloadBtn.disabled = true;
            this.downloadBtn.textContent = '正在准备下载...';

            for (const imageData of this.images) {
                if (!imageData.newName) {
                    continue; // 跳过未处理完成的图片
                }

                const extension = imageData.file.name.split('.').pop();
                const newFileName = `${imageData.newName}.${extension}`;
                
                // 创建 Blob 对象
                const response = await fetch(imageData.preview);
                const blob = await response.blob();
                
                // 创建下载链接
                const link = document.createElement('a');
                link.href = URL.createObjectURL(blob);
                link.download = this.sanitizeFileName(newFileName);
                
                // 触发下载
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                
                // 清理 URL 对象
                URL.revokeObjectURL(link.href);

                // 短暂延迟，避免浏览器阻止多个下载
                await new Promise(resolve => setTimeout(resolve, 500));
            }

            this.showNotification('所有文件下载完成', 'info');
        } catch (error) {
            console.error('下载失败:', error);
            this.showNotification('下载过程中出现错误', 'error');
        } finally {
            this.downloadBtn.disabled = false;
            this.downloadBtn.textContent = '批量下载';
        }
    }

    sanitizeFileName(fileName) {
        // 先分离文件名和扩展名
        const lastDot = fileName.lastIndexOf('.');
        const name = lastDot > -1 ? fileName.slice(0, lastDot) : fileName;
        const ext = lastDot > -1 ? fileName.slice(lastDot) : '';

        // 处理文件名
        const cleanName = name
            .replace(/[<>:"/\\|?*\x00-\x1F]/g, '-') // 移除不安全的字符
            .replace(/^\.+/, '') // 移除开头的点
            .replace(/^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])$/i, '_$1') // 处理 Windows 保留文件名
            .slice(0, this.config.MAX_FILENAME_LENGTH); // 限制长度

        return cleanName + ext;
    }

    clearAll() {
        this.images = [];
        this.previewArea.innerHTML = '';
        this.downloadBtn.disabled = true;
        this.showNotification('已清除所有图片', 'info');
    }

    // 添加测试按钮
    addTestButton() {
        const testBtn = document.createElement('button');
        testBtn.textContent = '测试图片';
        testBtn.className = 'test-btn';
        testBtn.onclick = () => this.loadTestImage();
        this.uploadArea.appendChild(testBtn);
    }

    async loadTestImage() {
        try {
            // 加载测试图片
            const response = await fetch(this.basePath + '/test.jpg');
            const blob = await response.blob();
            const file = new File([blob], 'test.jpg', { type: 'image/jpeg' });
            
            this.handleFiles([file]);
            this.showNotification('测试图片加载成功', 'info');
        } catch (error) {
            console.error('测试图片加载失败:', error);
            this.showNotification('测试图片加载失败', 'error');
        }
    }

    // 在类的最后添加测试方法
    async runTests() {
        console.log('开始测试...');
        
        // 测试配置加载
        console.log('测试配置:', this.config);
        
        // 测试文件名清理
        const testNames = [
            'test<>:"/\\|?*.txt',
            '.hidden.txt',
            'CON.txt',
            'a'.repeat(100) + '.txt',
            '测试文件名.jpg',
            '..dangerous.exe',
            'COM1.dll',
            'file with spaces.doc'
        ];
        
        console.log('文件名清理测试:');
        testNames.forEach(name => {
            console.log(`${name} -> ${this.sanitizeFileName(name)}`);
        });
        
        // 测试文件类型验证
        const testTypes = [
            'image/jpeg',
            'image/png',
            'image/gif',
            'image/webp',
            'application/pdf',
            'text/plain'
        ];
        
        console.log('\n文件类型验证测试:');
        testTypes.forEach(type => {
            const isSupported = this.config.SUPPORTED_FORMATS.includes(type);
            console.log(`${type}: ${isSupported ? '支持' : '不支持'}`);
        });
        
        // 测试文件大小验证
        const testSizes = [
            1024 * 1024,      // 1MB
            5 * 1024 * 1024,  // 5MB
            6 * 1024 * 1024,  // 6MB
            10 * 1024 * 1024  // 10MB
        ];
        
        console.log('\n文件大小验证测试:');
        testSizes.forEach(size => {
            const isValid = size <= this.config.MAX_FILE_SIZE;
            console.log(`${(size / (1024 * 1024)).toFixed(1)}MB: ${isValid ? '允许' : '超出制'}`);
        });
        
        // 测试 OCR 功能
        if (this.images.length > 0) {
            console.log('\nOCR 测试结果:', await this.testOCR(this.images[0]));
        } else {
            console.log('\n未上传图片，跳过 OCR 测试');
        }
        
        console.log('\n测试完成');
    }

    async testOCR(imageData) {
        try {
            const result = await Tesseract.recognize(
                imageData.preview,
                this.config.OCR_LANGUAGES.join('+')
            );
            return {
                text: result.data.text,
                confidence: result.data.confidence
            };
        } catch (error) {
            return { error: error.message };
        }
    }

    // 添加 JPEG 文件检查方法
    isJpegFile(file) {
        // 检查文件头部字节
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const arr = new Uint8Array(e.target.result);
                // JPEG 文件头: FF D8 FF
                const isJpeg = arr[0] === 0xFF && arr[1] === 0xD8 && arr[2] === 0xFF;
                resolve(isJpeg);
            };
            // 只读取前几个字节
            const blob = file.slice(0, 3);
            reader.readAsArrayBuffer(blob);
        });
    }
}

// 等待 DOM 和配置都加载完成
window.addEventListener('DOMContentLoaded', () => {
    if (!window.CONFIG) {
        console.error('配置未加载，应用初始化失败');
        return;
    }
    window.app = new ImageRenamer();
}); 