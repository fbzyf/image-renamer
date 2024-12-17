const CONFIG = {
    // 替换为你的 DeepSeek API key
    DEEPSEEK_API_KEY: 'YOUR_DEEPSEEK_API_KEY',
    
    // API 配置
    API_ENDPOINT: 'https://api.deepseek.com/v1/chat/completions',
    
    // OCR 配置
    OCR_LANGUAGES: ['chi_sim', 'eng', 'chi_tra'],  // 支持的语言
    OCR_CONFIDENCE_THRESHOLD: 0.65,                 // OCR 置信度阈值
    
    // 文件处理配置
    MAX_FILE_SIZE: 5 * 1024 * 1024,     // 最大文件大小（5MB）
    SUPPORTED_FORMATS: [
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/bmp',
        'image/webp'
    ],
    
    // AI 请求配置
    AI_MODEL: "deepseek-chat",
    AI_TEMPERATURE: 0.7,
    MAX_TOKENS: 50,
    
    // 文件名配置
    MAX_FILENAME_LENGTH: 50,            // 最大文件名长度
    FALLBACK_NAME: '未识别内容'         // 识别失败时的默认名称
}; 