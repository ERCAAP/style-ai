"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerPushToken = exports.sendLocalizedBroadcastNotification = exports.sendBroadcast = exports.getPredictionStatus = exports.tryOutfit = exports.analyzeOutfit = exports.analyzeOutfitMinimal = void 0;
const https_1 = require("firebase-functions/v2/https");
const params_1 = require("firebase-functions/params");
const admin = __importStar(require("firebase-admin"));
const openai_1 = __importDefault(require("openai"));
// Notification service
const notificationService_1 = require("./services/notificationService");
// Firebase Admin SDK baslatma
admin.initializeApp();
const db = admin.firestore();
// MINIMAL ANALYSIS - Import from separate file
var minimalAnalysis_1 = require("./minimalAnalysis");
Object.defineProperty(exports, "analyzeOutfitMinimal", { enumerable: true, get: function () { return minimalAnalysis_1.analyzeOutfitMinimal; } });
// API keys secret olarak tanimla
const openaiApiKey = (0, params_1.defineSecret)('OPENAI_API_KEY');
const eachlabsApiKey = (0, params_1.defineSecret)('EACHLABS_API_KEY');
// OpenAI client
let openaiClient = null;
function getOpenAIClient(apiKey) {
    if (!openaiClient) {
        openaiClient = new openai_1.default({ apiKey });
    }
    return openaiClient;
}
// Kullanici kontrolu (auto-create if not exists)
async function verifyUser(uid) {
    var _a, _b, _c, _d, _e, _f, _g;
    const userRef = db.collection('users').doc(uid);
    const userDoc = await userRef.get();
    // Auto-create user if not exists
    if (!userDoc.exists) {
        console.log(`[verifyUser] Creating new user: ${uid}`);
        const newUserData = {
            uid,
            createdAt: admin.firestore.Timestamp.now(),
            lastActiveAt: admin.firestore.Timestamp.now(),
            subscription: {
                status: 'inactive',
                plan: 'free',
            },
            usage: {
                totalJobs: 0,
                analysisToday: 0,
                tryOnToday: 0,
                lastJobDate: admin.firestore.Timestamp.now(),
            },
            flags: {
                isBlocked: false,
                isVIP: false,
                isAdmin: false,
            },
        };
        await userRef.set(newUserData);
        console.log(`[verifyUser] User created successfully: ${uid}`);
        // Return default values for new user
        return {
            isValid: true,
            isBlocked: false,
            isPremium: false,
            remainingJobs: 30, // DAILY_LIMIT
            analysisToday: 0,
            tryOnToday: 0,
        };
    }
    const userData = userDoc.data();
    const isPremium = ((_a = userData.subscription) === null || _a === void 0 ? void 0 : _a.status) === 'active';
    const isBlocked = ((_b = userData.flags) === null || _b === void 0 ? void 0 : _b.isBlocked) === true;
    // Gunun baslangicini al
    const today = new Date().toDateString();
    const lastActivityDate = (_e = (_d = (_c = userData.usage) === null || _c === void 0 ? void 0 : _c.lastJobDate) === null || _d === void 0 ? void 0 : _d.toDate()) === null || _e === void 0 ? void 0 : _e.toDateString();
    const isSameDay = lastActivityDate === today;
    // Bugunun kullanim sayilarini al
    const analysisToday = isSameDay ? (((_f = userData.usage) === null || _f === void 0 ? void 0 : _f.analysisToday) || 0) : 0;
    const tryOnToday = isSameDay ? (((_g = userData.usage) === null || _g === void 0 ? void 0 : _g.tryOnToday) || 0) : 0;
    // All users: Daily 30 analysis + 30 tryon (premium check removed)
    const DAILY_LIMIT = 30;
    const remainingJobs = Math.max(0, DAILY_LIMIT - analysisToday);
    return {
        isValid: true,
        isBlocked,
        isPremium,
        remainingJobs,
        analysisToday,
        tryOnToday,
    };
}
// Kullanim sayacini guncelle (type: 'analysis' | 'tryon')
async function incrementUsage(uid, type) {
    const userRef = db.collection('users').doc(uid);
    const today = new Date();
    await db.runTransaction(async (transaction) => {
        var _a, _b;
        const userDoc = await transaction.get(userRef);
        // User should exist (created by verifyUser), but if not, skip increment
        if (!userDoc.exists) {
            console.warn(`[incrementUsage] User ${uid} not found - skipping usage increment`);
            return;
        }
        const userData = userDoc.data();
        const lastJobDate = (_b = (_a = userData.usage) === null || _a === void 0 ? void 0 : _a.lastJobDate) === null || _b === void 0 ? void 0 : _b.toDate();
        const isSameDay = (lastJobDate === null || lastJobDate === void 0 ? void 0 : lastJobDate.toDateString()) === today.toDateString();
        const updates = {
            'usage.totalJobs': admin.firestore.FieldValue.increment(1),
            'usage.lastJobDate': admin.firestore.Timestamp.now(),
            'lastActiveAt': admin.firestore.Timestamp.now(),
        };
        if (type === 'analysis') {
            updates['usage.analysisToday'] = isSameDay
                ? admin.firestore.FieldValue.increment(1)
                : 1;
        }
        else if (type === 'tryon') {
            updates['usage.tryOnToday'] = isSameDay
                ? admin.firestore.FieldValue.increment(1)
                : 1;
        }
        transaction.update(userRef, updates);
    });
}
// ============================================
// GELISMIS RATE LIMITING VE GUVENLIK
// ============================================
// Rate limit cache - memory based
const rateLimitCache = new Map();
const abuseDetectionCache = new Map();
// Rate limit ayarlari - MİNİMAL (Sadece bot saldırılarına karşı)
const RATE_LIMITS = {
    // IP bazli limitler - SADECE BOT SALDIRILARINDAN KORUMA
    IP_PER_MINUTE: 1000, // Çok yüksek - normal kullanıcıları etkilemez
    IP_PER_HOUR: 5000, // Çok yüksek
    // User bazli limitler - NEREDEYSE SINIRSIZ
    USER_PER_MINUTE: 1000, // Çok yüksek
    USER_PER_HOUR: 5000, // Çok yüksek
    // Try-on specific limits - SINIRSIZ
    TRYON_PER_MINUTE: 1000,
    TRYON_PER_HOUR: 5000,
    // Prediction status polling için - SINIRSIZ
    POLLING_PER_MINUTE: 1000,
    POLLING_PER_HOUR: 5000,
    // Abuse detection - SADECE EXTREME DURUMLAR
    WARNING_THRESHOLD: 100, // Çok yüksek - neredeyse hiç uyarı yok
    SOFT_BAN_THRESHOLD: 200, // Çok yüksek
    HARD_BAN_THRESHOLD: 500, // Çok yüksek
    PERMA_BAN_THRESHOLD: 1000, // Sadece ciddi botlar için
    ABUSE_WINDOW: 60 * 60 * 1000, // 1 saat - uzun window
    // Kademeli ban sureleri - ÇOK KISA
    SOFT_BAN_DURATION: 1 * 60 * 1000, // 1 dakika
    MEDIUM_BAN_DURATION: 5 * 60 * 1000, // 5 dakika
    HARD_BAN_DURATION: 15 * 60 * 1000, // 15 dakika
    // Legitim hata toleransi - ÇOK YÜKSEK
    MAX_LEGITIMATE_ERRORS: 100, // Network hataları sınırsız
};
// Rate limit kontrolu - gelismis versiyon
function checkRateLimit(identifier, type, window = 'minute', operationType = 'normal' // Yeni parametre
) {
    const now = Date.now();
    const cacheKey = `${type}_${window}_${operationType}_${identifier}`; // operationType eklendi
    const record = rateLimitCache.get(cacheKey);
    // Bloke edilmis mi kontrol et
    if ((record === null || record === void 0 ? void 0 : record.blocked) && now < record.resetTime) {
        return {
            allowed: false,
            reason: 'IP/User blocked due to abuse. Try again later.',
        };
    }
    // Window sureleri
    const windowDuration = window === 'minute' ? 60 * 1000 : 60 * 60 * 1000;
    // Operation type'a göre limit belirleme
    let maxRequests;
    if (operationType === 'tryon') {
        // Try-on işlemleri için daha yüksek limit
        maxRequests = type === 'ip'
            ? (window === 'minute' ? RATE_LIMITS.TRYON_PER_MINUTE : RATE_LIMITS.TRYON_PER_HOUR)
            : (window === 'minute' ? RATE_LIMITS.TRYON_PER_MINUTE : RATE_LIMITS.TRYON_PER_HOUR);
    }
    else if (operationType === 'polling') {
        // Polling için çok yüksek limit
        maxRequests = type === 'ip'
            ? (window === 'minute' ? RATE_LIMITS.POLLING_PER_MINUTE : RATE_LIMITS.POLLING_PER_HOUR)
            : (window === 'minute' ? RATE_LIMITS.POLLING_PER_MINUTE : RATE_LIMITS.POLLING_PER_HOUR);
    }
    else {
        // Normal işlemler için standart limit
        maxRequests = type === 'ip'
            ? (window === 'minute' ? RATE_LIMITS.IP_PER_MINUTE : RATE_LIMITS.IP_PER_HOUR)
            : (window === 'minute' ? RATE_LIMITS.USER_PER_MINUTE : RATE_LIMITS.USER_PER_HOUR);
    }
    // Cache temizligi veya yeni kayit
    if (!record || now > record.resetTime) {
        rateLimitCache.set(cacheKey, {
            count: 1,
            resetTime: now + windowDuration,
            blocked: false,
            blockLevel: 0,
        });
        return { allowed: true };
    }
    // Limit asimi kontrolu
    if (record.count >= maxRequests) {
        return {
            allowed: false,
            reason: `Rate limit exceeded. Max ${maxRequests} requests per ${window}.`,
        };
    }
    record.count++;
    return { allowed: true };
}
// VIP/Whitelist kontrolu - gerçek kullanicilar korunuyor
async function isWhitelisted(uid) {
    var _a, _b;
    try {
        const userDoc = await db.collection('users').doc(uid).get();
        if (!userDoc.exists)
            return false;
        const userData = userDoc.data();
        // VIP kullanicilar veya admin'ler korunuyor
        return ((_a = userData.flags) === null || _a === void 0 ? void 0 : _a.isVIP) === true || ((_b = userData.flags) === null || _b === void 0 ? void 0 : _b.isAdmin) === true;
    }
    catch (error) {
        console.error('[SECURITY] Whitelist check error:', error);
        return false;
    }
}
// Hata tipini belirle - legitim mi, abuse mi?
function classifyError(errorCode, errorMessage) {
    // Legitim hatalar - kullanicinin sucu degil
    const legitimateErrors = [
        'unavailable', // Network hatasi
        'deadline-exceeded', // Timeout
        'internal', // Server hatasi
        'resource-exhausted', // API limiti
    ];
    const abusePatterns = [
        'invalid-argument', // Kotu veri gonderme
        'permission-denied', // Izinsiz erisim denemesi
    ];
    if (legitimateErrors.includes(errorCode)) {
        return 'legitimate';
    }
    if (abusePatterns.includes(errorCode)) {
        // Mesaji da kontrol et
        const suspiciousKeywords = ['sql', 'injection', 'malicious', 'pattern'];
        if (suspiciousKeywords.some(keyword => errorMessage.toLowerCase().includes(keyword))) {
            return 'abuse';
        }
        return 'suspicious';
    }
    return 'suspicious';
}
// Gelismis abuse detection - kademeli ceza sistemi
async function detectAbuse(identifier, errorType = 'suspicious') {
    const now = Date.now();
    // VIP kontrolu - VIP kullanicilar korunuyor
    const isVIP = await isWhitelisted(identifier);
    if (isVIP) {
        console.log(`[SECURITY] VIP user ${identifier} - abuse detection skipped`);
        return { isAbuse: false, shouldBlock: false, message: 'VIP user protected' };
    }
    const record = abuseDetectionCache.get(identifier);
    // Ilk hata
    if (!record) {
        abuseDetectionCache.set(identifier, {
            failedAttempts: errorType === 'abuse' ? 2 : 1, // Abuse daha agir sayilir
            firstFailedAt: now,
            warningGiven: false,
            blockLevel: 0,
            lastBlockTime: 0,
            legitimateErrors: errorType === 'legitimate' ? 1 : 0,
        });
        return { isAbuse: false, shouldBlock: false };
    }
    // Window disindaysa - temiz sayfa, ama blockLevel koru
    if (now - record.firstFailedAt > RATE_LIMITS.ABUSE_WINDOW) {
        // Otomatik unban - yeterince zaman gecmisse blockLevel dusur
        let newBlockLevel = record.blockLevel;
        if (now - record.lastBlockTime > RATE_LIMITS.HARD_BAN_DURATION * 2) {
            newBlockLevel = Math.max(0, newBlockLevel - 1); // Bir level dusur
            console.log(`[SECURITY] User ${identifier} block level reduced: ${record.blockLevel} -> ${newBlockLevel}`);
        }
        abuseDetectionCache.set(identifier, {
            failedAttempts: errorType === 'abuse' ? 2 : 1,
            firstFailedAt: now,
            warningGiven: false,
            blockLevel: newBlockLevel,
            lastBlockTime: record.lastBlockTime,
            legitimateErrors: errorType === 'legitimate' ? 1 : 0,
        });
        return { isAbuse: false, shouldBlock: false };
    }
    // Legitim hatalari sayma
    if (errorType === 'legitimate') {
        record.legitimateErrors++;
        // Cok fazla legitim hata bile supheli olabilir (stress test gibi)
        if (record.legitimateErrors > RATE_LIMITS.MAX_LEGITIMATE_ERRORS * 3) {
            console.warn(`[SECURITY] Too many legitimate errors from ${identifier} - possible stress test`);
            return { isAbuse: true, shouldBlock: false, message: 'Suspicious activity pattern' };
        }
        return { isAbuse: false, shouldBlock: false };
    }
    // Hatayi say
    record.failedAttempts += errorType === 'abuse' ? 3 : 1; // Abuse 3x agir
    // Kademeli ceza sistemi
    if (record.failedAttempts >= RATE_LIMITS.PERMA_BAN_THRESHOLD) {
        // Level 4: Firestore'a kayit - manuel inceleme gerekir
        console.error(`[SECURITY CRITICAL] User ${identifier} reached perma-ban threshold (${record.failedAttempts} attempts)`);
        await markUserForReview(identifier, record);
        const blockKey = `user_minute_${identifier}`;
        rateLimitCache.set(blockKey, {
            count: 999,
            resetTime: now + RATE_LIMITS.HARD_BAN_DURATION * 4,
            blocked: true,
            blockLevel: 4,
        });
        record.blockLevel = 4;
        record.lastBlockTime = now;
        return {
            isAbuse: true,
            shouldBlock: true,
            blockDuration: RATE_LIMITS.HARD_BAN_DURATION * 4,
            message: 'Account flagged for review. Contact support.',
        };
    }
    else if (record.failedAttempts >= RATE_LIMITS.HARD_BAN_THRESHOLD) {
        // Level 3: Hard ban - 2 saat
        console.warn(`[SECURITY] Hard ban for ${identifier} (${record.failedAttempts} attempts)`);
        const blockKey = `user_minute_${identifier}`;
        rateLimitCache.set(blockKey, {
            count: 999,
            resetTime: now + RATE_LIMITS.HARD_BAN_DURATION,
            blocked: true,
            blockLevel: 3,
        });
        record.blockLevel = 3;
        record.lastBlockTime = now;
        return {
            isAbuse: true,
            shouldBlock: true,
            blockDuration: RATE_LIMITS.HARD_BAN_DURATION,
            message: 'Too many violations. Blocked for 2 hours.',
        };
    }
    else if (record.failedAttempts >= RATE_LIMITS.SOFT_BAN_THRESHOLD) {
        // Level 2: Soft ban - 10-30 dakika
        const banDuration = record.blockLevel >= 2
            ? RATE_LIMITS.MEDIUM_BAN_DURATION
            : RATE_LIMITS.SOFT_BAN_DURATION;
        console.warn(`[SECURITY] Soft ban for ${identifier} (${record.failedAttempts} attempts)`);
        const blockKey = `user_minute_${identifier}`;
        rateLimitCache.set(blockKey, {
            count: 999,
            resetTime: now + banDuration,
            blocked: true,
            blockLevel: 2,
        });
        record.blockLevel = Math.max(2, record.blockLevel);
        record.lastBlockTime = now;
        return {
            isAbuse: true,
            shouldBlock: true,
            blockDuration: banDuration,
            message: `Suspicious activity detected. Please try again in ${Math.round(banDuration / 60000)} minutes.`,
        };
    }
    else if (record.failedAttempts >= RATE_LIMITS.WARNING_THRESHOLD && !record.warningGiven) {
        // Level 1: Uyari
        console.log(`[SECURITY] Warning issued to ${identifier} (${record.failedAttempts} attempts)`);
        record.warningGiven = true;
        record.blockLevel = Math.max(1, record.blockLevel);
        return {
            isAbuse: true,
            shouldBlock: false,
            message: 'Multiple failed attempts detected. Please be careful.',
        };
    }
    return { isAbuse: true, shouldBlock: false };
}
// Kullaniciyi manuel inceleme icin isaretle
async function markUserForReview(uid, record) {
    try {
        await db.collection('security_reviews').doc(uid).set({
            uid,
            reason: 'Excessive failed attempts',
            failedAttempts: record.failedAttempts,
            blockLevel: record.blockLevel,
            firstFailedAt: new Date(record.firstFailedAt),
            flaggedAt: admin.firestore.Timestamp.now(),
            status: 'pending_review',
            autoResolved: false,
        });
        console.log(`[SECURITY] User ${uid} marked for manual review`);
    }
    catch (error) {
        console.error('[SECURITY] Failed to mark user for review:', error);
    }
}
// Request validation - MİNİMAL (Sadece kritik kontroller)
function validateRequest(data) {
    // Base64 image validation for analysis
    if (data.imageBase64) {
        const base64 = data.imageBase64;
        // Max size check - ÇOK GENİŞLETİLDİ (50MB)
        const MAX_BASE64_SIZE = 50 * 1024 * 1024; // 10MB → 50MB
        if (base64.length > MAX_BASE64_SIZE) {
            return { valid: false, reason: 'Görsel çok büyük (max 50MB)' };
        }
        // SQL injection kontrolü KALDIRILDI - base64'te anlamsız
    }
    // Base64 validation for try-on
    if (data.userImageBase64 || data.clothingImageBase64s) {
        const base64 = data.userImageBase64;
        // Max size check - ÇOK GENİŞLETİLDİ (50MB)
        const MAX_BASE64_SIZE = 50 * 1024 * 1024; // 10MB → 50MB
        if (base64 && base64.length > MAX_BASE64_SIZE) {
            return { valid: false, reason: 'Görsel çok büyük (max 50MB)' };
        }
        // Array size check - ARTTIRILDI (20 görsel)
        if (Array.isArray(data.clothingImageBase64s)) {
            if (data.clothingImageBase64s.length > 20) { // 10 → 20
                return { valid: false, reason: 'Çok fazla görsel (max 20)' };
            }
            for (const img of data.clothingImageBase64s) {
                if (img.length > MAX_BASE64_SIZE) {
                    return { valid: false, reason: 'Görsel çok büyük (max 50MB)' };
                }
            }
        }
    }
    return { valid: true };
}
// Cache temizleme (memory leak onleme)
setInterval(() => {
    const now = Date.now();
    // Rate limit cache temizle
    for (const [key, value] of rateLimitCache.entries()) {
        if (now > value.resetTime) {
            rateLimitCache.delete(key);
        }
    }
    // Abuse cache temizle
    for (const [key, value] of abuseDetectionCache.entries()) {
        if (now - value.firstFailedAt > RATE_LIMITS.ABUSE_WINDOW * 2) {
            abuseDetectionCache.delete(key);
        }
    }
    console.log('[SECURITY] Cache cleaned:', {
        rateLimit: rateLimitCache.size,
        abuse: abuseDetectionCache.size,
    });
}, 5 * 60 * 1000); // Her 5 dakikada bir temizle
// Ana analiz fonksiyonu
exports.analyzeOutfit = (0, https_1.onCall)({
    region: 'europe-west1',
    timeoutSeconds: 60, // 60 saniye - tek OpenAI çağrısı için yeterli
    memory: '1GiB', // Daha fazla memory = daha hızlı işlem
    minInstances: 1, // Cold start'ı önlemek için (opsiyonel - maliyet artar)
    concurrency: 80, // Aynı anda 80 request işleyebilir
    secrets: [openaiApiKey],
}, async (request) => {
    var _a, _b, _c, _d;
    const startTime = Date.now();
    let uid = 'unknown'; // Hata durumunda kullanmak icin
    try {
        // 1. Authentication kontrolu
        if (!request.auth) {
            throw new https_1.HttpsError('unauthenticated', 'Giris yapmaniz gerekiyor');
        }
        uid = request.auth.uid;
        const clientIp = request.rawRequest.ip || 'unknown';
        // 2. Request validation - minimal kontrol
        const validation = validateRequest(request.data);
        if (!validation.valid) {
            console.warn(`[VALIDATION] Invalid request from ${uid}:`, validation.reason);
            // Abuse detection KALDIRILDI - sadece validation hatası
            throw new https_1.HttpsError('invalid-argument', validation.reason || 'Geçersiz istek');
        }
        // 3. Rate limiting - KALDIRILDI (Normal kullanıcılar için engel yok)
        // Sadece extreme bot saldırılarına karşı minimal kontrol
        // Not: Limitler o kadar yüksek ki normal kullanıcıları asla etkilemez
        // IP bazli rate limit - Sadece bot saldırıları için (1000/dakika)
        const ipRateLimitMinute = checkRateLimit(clientIp, 'ip', 'minute', 'normal');
        if (!ipRateLimitMinute.allowed) {
            console.error(`[SECURITY CRITICAL] Possible bot attack from IP: ${clientIp}`);
            throw new https_1.HttpsError('resource-exhausted', 'Sistem yoğun, lütfen birkaç saniye bekleyin.');
        }
        // User rate limit kontrolü KALDIRILDI - gerçek kullanıcıları etkilemesin
        // 4. Kullanici kontrolu
        const userStatus = await verifyUser(uid);
        if (!userStatus.isValid) {
            throw new https_1.HttpsError('not-found', 'Kullanici bulunamadi');
        }
        if (userStatus.isBlocked) {
            throw new https_1.HttpsError('permission-denied', 'Hesabiniz bloke edilmis');
        }
        // Premium check removed - all users can use analysis feature
        const PREMIUM_ANALYSIS_LIMIT = 30;
        // 5. Data validasyonu
        const { imageBase64, language = 'tr', userPreferences, purposes = ['general'] } = request.data;
        if (!imageBase64 || typeof imageBase64 !== 'string') {
            throw new https_1.HttpsError('invalid-argument', 'Gorsel verisi gerekli');
        }
        // Base64'u data URI formatina cevir (eger degilse)
        const imageDataUri = imageBase64.startsWith('data:image/')
            ? imageBase64
            : `data:image/jpeg;base64,${imageBase64}`;
        // 6. OpenAI analiz
        const apiKey = (_a = openaiApiKey.value()) === null || _a === void 0 ? void 0 : _a.trim();
        if (!apiKey) {
            throw new https_1.HttpsError('internal', 'OpenAI API key not configured');
        }
        const openai = getOpenAIClient(apiKey);
        // Not: Validation step removed to improve performance
        // Ana analiz zaten görseli kontrol edecek ve uygun olmayan görsellerde düşük skor verecek
        console.log('[analyzeOutfit] Starting outfit analysis...');
        // 6.1. Main analysis prompt
        const promptStartTime = Date.now();
        const prompt = buildAnalysisPrompt(language, userPreferences, purposes);
        console.log(`[Performance] Prompt built in ${Date.now() - promptStartTime}ms`);
        // 6.2. OpenAI API call
        const apiCallStartTime = Date.now();
        const response = await openai.chat.completions.create({
            model: 'gpt-4o',
            max_tokens: 1800, // Biraz azaltıldı - daha hızlı yanıt
            temperature: 0.3, // Düşürüldü - daha hızlı ve tutarlı yanıtlar
            messages: [
                {
                    role: 'system',
                    content: language === 'tr'
                        ? 'Sen profesyonel bir moda danismanisin. Her zaman JSON formatinda yanit verirsin. Her görseli dikkatli ve benzersiz şekilde analiz edersin.'
                        : 'You are a professional fashion consultant. You always respond in JSON format. You analyze each image carefully and uniquely.',
                },
                {
                    role: 'user',
                    content: [
                        { type: 'text', text: prompt },
                        {
                            type: 'image_url',
                            image_url: {
                                url: imageDataUri,
                                detail: 'auto', // 'high' yerine 'auto' - OpenAI otomatik optimize eder
                            },
                        },
                    ],
                },
            ],
        });
        const apiCallDuration = Date.now() - apiCallStartTime;
        console.log(`[Performance] OpenAI API call completed in ${apiCallDuration}ms`);
        const content = (_d = (_c = (_b = response.choices) === null || _b === void 0 ? void 0 : _b[0]) === null || _c === void 0 ? void 0 : _c.message) === null || _d === void 0 ? void 0 : _d.content;
        if (!content) {
            throw new https_1.HttpsError('internal', 'API yaniti bos');
        }
        // 7. JSON parse
        const parseStartTime = Date.now();
        let analysis;
        try {
            let jsonString = content;
            // Extract JSON from markdown code blocks
            const jsonBlockMatch = content.match(/```json\s*\n([\s\S]*?)\n```/);
            if (jsonBlockMatch) {
                jsonString = jsonBlockMatch[1];
            }
            else {
                // Try generic code block
                const codeBlockMatch = content.match(/```\s*\n([\s\S]*?)\n```/);
                if (codeBlockMatch) {
                    jsonString = codeBlockMatch[1];
                }
            }
            // If no code block found, try to extract JSON directly (find first { and last })
            if (jsonString === content && !jsonString.trim().startsWith('{')) {
                const firstBrace = content.indexOf('{');
                const lastBrace = content.lastIndexOf('}');
                if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
                    jsonString = content.substring(firstBrace, lastBrace + 1);
                }
            }
            analysis = JSON.parse(jsonString.trim());
            console.log(`[Performance] JSON parsed in ${Date.now() - parseStartTime}ms`);
        }
        catch (parseError) {
            console.error('[analyzeOutfit] JSON parse error:', parseError.message);
            console.error('[analyzeOutfit] Content received from OpenAI:', content.substring(0, 500));
            throw new https_1.HttpsError('internal', 'Analiz sonucu islenemedi');
        }
        // 8. Kullanim sayacini guncelle
        const dbStartTime = Date.now();
        await incrementUsage(uid, 'analysis');
        console.log(`[Performance] Database update in ${Date.now() - dbStartTime}ms`);
        // 9. Send notification to user
        try {
            const score = analysis.overallScore || 0;
            await (0, notificationService_1.sendAnalysisCompleteNotification)(uid, score);
            console.log('[analyzeOutfit] Notification sent to user');
        }
        catch (notifError) {
            // Don't fail the request if notification fails
            console.error('[analyzeOutfit] Failed to send notification:', notifError);
        }
        // 10. Basarili yanit
        const duration = Date.now() - startTime;
        console.log(`[analyzeOutfit] ✅ SUCCESS for ${uid} in ${duration}ms`);
        console.log(`[Performance Summary] Total: ${duration}ms | OpenAI: ${apiCallDuration}ms | DB: ${Date.now() - dbStartTime}ms`);
        return {
            success: true,
            analysis,
            timestamp: Date.now(),
            remaining: PREMIUM_ANALYSIS_LIMIT - (userStatus.analysisToday + 1),
        };
    }
    catch (error) {
        const duration = Date.now() - startTime;
        console.error(`[analyzeOutfit] Error for ${uid} after ${duration}ms:`, error);
        // Akilli abuse detection - SADECE GERCEK ABUSE DURUMLARI
        if (error instanceof https_1.HttpsError) {
            // Rate-limit hataları için abuse detection YAPMA (normal kullanım)
            if (error.code !== 'resource-exhausted') {
                const errorType = classifyError(error.code, error.message);
                // Sadece suspicious ve abuse için abuse detection yap
                if (errorType === 'suspicious' || errorType === 'abuse') {
                    const abuseResult = await detectAbuse(uid, errorType);
                    if (abuseResult.shouldBlock) {
                        console.warn(`[analyzeOutfit] User ${uid} blocked: ${abuseResult.message}`);
                        throw new https_1.HttpsError('permission-denied', abuseResult.message || 'Your account has been temporarily restricted.');
                    }
                }
            }
            throw error;
        }
        // Bilinmeyen hatalar - network vs olabilir (legitimate olarak kaydet)
        await detectAbuse(uid, 'legitimate');
        throw new https_1.HttpsError('internal', 'Analiz sirasinda bir hata olustu');
    }
});
// Purpose'ları açıklamaya çevir
function getPurposeDescriptions(purposes, language) {
    const purposeMap = {
        general: {
            tr: 'Genel değerlendirme',
            en: 'General evaluation',
        },
        dinner: {
            tr: 'Akşam yemeği için uygunluk',
            en: 'Suitability for dinner',
        },
        wedding: {
            tr: 'Düğün için uygunluk',
            en: 'Suitability for wedding',
        },
        engagement: {
            tr: 'Nişan için uygunluk',
            en: 'Suitability for engagement',
        },
        party: {
            tr: 'Parti/balo için uygunluk',
            en: 'Suitability for party/ball',
        },
        business: {
            tr: 'İş toplantısı için uygunluk',
            en: 'Suitability for business meeting',
        },
        casual: {
            tr: 'Günlük kullanım için değerlendirme',
            en: 'Evaluation for casual use',
        },
        date: {
            tr: 'Romantik randevu için uygunluk',
            en: 'Suitability for romantic date',
        },
    };
    const descriptions = purposes
        .map((p) => { var _a; return ((_a = purposeMap[p]) === null || _a === void 0 ? void 0 : _a[language]) || purposeMap.general[language]; })
        .join(', ');
    return descriptions;
}
// Prompt olusturma yardimci fonksiyonu
function buildAnalysisPrompt(language, userPreferences, purposes) {
    var _a, _b, _c, _d, _e, _f;
    const basePrompt = language === 'tr'
        ? `Sen dünya çapında tanınan, 15 yıllık deneyime sahip profesyonel bir stil analisti ve moda danışmanısın.

ÖNEMLİ: GÖRSELDE GÖRDÜĞÜN KIYAFETI GERÇEKTEN DETAYLI ANALİZ ET!
- Her görseli benzersiz olarak değerlendir
- Renkler, desenler, kesim, kumaş detaylarını DİKKATLİCE incele
- Aynı puanları verme, her kıyafet farklı
- Gerçekçi ve objektif puanlama yap (düşük puanlar da verebilirsin)
- Fotoğraftaki KİŞİYİ de dikkate al (vücut tipi, cilt tonu, saç)

MİSYONUN:
- Verilen kıyafeti her açıdan profesyonel olarak değerlendirmek
- Renk uyumu, kesim, kumaş kalitesi, trend uyumu gibi tüm detayları analiz etmek
- Kullanıcının seçtiği amaçlara (düğün, iş, günlük vb.) göre uygunluk değerlendirmesi yapmak
- Kişisel stil önerileri ve kombinasyon tavsiyeleri sunmak
- Dürüst ve objektif geri bildirim vermek (iyi değilse söyle!)

DEĞERLENDİRME KRİTERLERİN (GERÇEKÇI PUANLA):
1. Renk Harmonisi (0-10):
   - Renkler uyumlu mu? Hangi renkler var?
   - Cilt tonuyla uyumlu mu?
   - 0-4: Kötü uyum, 5-6: Orta, 7-8: İyi, 9-10: Mükemmel
2. Kesim ve Kalıp (0-10):
   - Vücut tipine uygun mu?
   - Ölçüler dengeli mi, bol/dar mı?
   - Modern kesim mi, klasik mi?
3. Kumaş ve Doku (0-10):
   - Kaliteli görünüyor mu?
   - Mevsime uygun mu?
   - Hangi kumaş türü? (pamuk, ipek, polyester vb.)
4. Trend ve Zamansızlık (0-10):
   - Güncel trendlere uygun mu?
   - Klasik parça mı, trend parça mı?
5. Aksesuar Uyumu (0-10):
   - Takılar, çanta, ayakkabı görünüyor mu?
   - Uyumlu mu?
6. Amaç Uygunluğu (0-10):
   - Kullanıcının seçtiği ortam/etkinliğe uygun mu?
   - Neden uygun veya değil?

PUANLAMA KURALLARI:
- Her kriter için FARKLI puanlar ver
- 8.5, 8.5, 8.0, 9.0 gibi AYNI puanları verme
- Gerçekten kötüyse 4-6 puan ver
- Mükemmelse 9-10 ver
- Çoğu kıyafet 6-8 arasında olmalı
- overallScore = 6 kriterin ortalaması

TÜM YANITLARINI TÜRKÇE VER. JSON formatında detaylı analiz sun.`
        : `You are a world-renowned professional style analyst and fashion consultant with 15 years of experience.

IMPORTANT: REALLY ANALYZE THE OUTFIT YOU SEE IN DETAIL!
- Evaluate each image uniquely
- CAREFULLY examine colors, patterns, cut, fabric details
- Don't give the same scores - each outfit is different
- Give realistic and objective scores (you can give low scores too)
- Consider the PERSON in the photo (body type, skin tone, hair)

YOUR MISSION:
- Professionally evaluate the outfit from every angle
- Analyze all details like color harmony, cut, fabric quality, trend alignment
- Assess suitability based on user's selected purposes (wedding, work, casual, etc.)
- Provide personal style recommendations and combination advice
- Give honest and objective feedback (if it's not good, say so!)

YOUR EVALUATION CRITERIA (SCORE REALISTICALLY):
1. Color Harmony (0-10):
   - Are colors harmonious? What colors are there?
   - Compatible with skin tone?
   - 0-4: Poor harmony, 5-6: Average, 7-8: Good, 9-10: Excellent
2. Cut and Fit (0-10):
   - Suitable for body type?
   - Proportions balanced, loose/tight?
   - Modern cut or classic?
3. Fabric and Texture (0-10):
   - Does it look quality?
   - Suitable for season?
   - What fabric type? (cotton, silk, polyester, etc.)
4. Trend and Timelessness (0-10):
   - Aligned with current trends?
   - Classic piece or trendy piece?
5. Accessory Harmony (0-10):
   - Are jewelry, bag, shoes visible?
   - Are they harmonious?
6. Purpose Suitability (0-10):
   - Suitable for user's selected occasion/event?
   - Why suitable or not?

SCORING RULES:
- Give DIFFERENT scores for each criterion
- Don't give SAME scores like 8.5, 8.5, 8.0, 9.0
- If really bad, give 4-6 points
- If excellent, give 9-10
- Most outfits should be 6-8
- overallScore = average of 6 criteria

RESPOND IN ENGLISH. Provide detailed analysis in JSON format.`;
    let prompt = basePrompt;
    // Analiz amaçlarını ekle
    if (purposes && purposes.length > 0) {
        const purposeDesc = getPurposeDescriptions(purposes, language);
        if (language === 'tr') {
            prompt += `\n\nANALİZ AMAÇLARI:\nKullanıcı bu kıyafeti şu amaçlar için değerlendirmeni istiyor: ${purposeDesc}
Analiz yaparken bu amaçlara özel olarak yorumlar yap ve tavsiyeler ver.`;
        }
        else {
            prompt += `\n\nANALYSIS PURPOSES:\nThe user wants you to evaluate this outfit for: ${purposeDesc}
Provide specific comments and recommendations based on these purposes.`;
        }
    }
    if (userPreferences) {
        if (language === 'tr') {
            prompt += '\n\nKULLANICI TERCIHLERI:';
            if ((_a = userPreferences.stylePreferences) === null || _a === void 0 ? void 0 : _a.length) {
                prompt += `\n- Tercih ettigi stiller: ${userPreferences.stylePreferences.join(', ')}`;
            }
            if (userPreferences.bodyType) {
                prompt += `\n- Vucut tipi: ${userPreferences.bodyType}`;
            }
            if ((_b = userPreferences.favoriteColors) === null || _b === void 0 ? void 0 : _b.length) {
                prompt += `\n- Favori renkler: ${userPreferences.favoriteColors.join(', ')}`;
            }
            if ((_c = userPreferences.usageGoals) === null || _c === void 0 ? void 0 : _c.length) {
                prompt += `\n- Kullanim amaclari: ${userPreferences.usageGoals.join(', ')}`;
            }
        }
        else {
            prompt += '\n\nUSER PREFERENCES:';
            if ((_d = userPreferences.stylePreferences) === null || _d === void 0 ? void 0 : _d.length) {
                prompt += `\n- Preferred styles: ${userPreferences.stylePreferences.join(', ')}`;
            }
            if (userPreferences.bodyType) {
                prompt += `\n- Body type: ${userPreferences.bodyType}`;
            }
            if ((_e = userPreferences.favoriteColors) === null || _e === void 0 ? void 0 : _e.length) {
                prompt += `\n- Favorite colors: ${userPreferences.favoriteColors.join(', ')}`;
            }
            if ((_f = userPreferences.usageGoals) === null || _f === void 0 ? void 0 : _f.length) {
                prompt += `\n- Usage goals: ${userPreferences.usageGoals.join(', ')}`;
            }
        }
    }
    const jsonFormat = language === 'tr'
        ? `

YANIT FORMATI - SADECE ŞU JSON YAPISINDA CEVAP VER:
{
  "overallScore": 8.5,
  "suitabilityLevel": "Harika",
  "overallComment": "Bu kombinasyon [kullanıcının amacına] için son derece şık ve uygun. [Detaylı açıklama - en az 2-3 cümle]",

  "items": [
    {
      "name": "Elbise",
      "color": "Krem",
      "style": "Bohemian",
      "fit": "Bol kesim",
      "material": "Pamuklu viskon karışımı",
      "quality": "Yüksek kalite"
    }
  ],

  "colorHarmony": {
    "score": 8.5,
    "comment": "Renk kombinasyonu çok başarılı. [Neden başarılı? Cilt tonuyla uyumu? Detaylı açıklama]",
    "dominantColors": ["Krem", "Beyaz", "Altın"],
    "suggestions": ["Şu renk tonları daha da güzel olabilir...", "Alternatif renk önerisi..."]
  },

  "styleMatch": {
    "score": 8.0,
    "detectedStyle": "Bohemian Şık",
    "comment": "[Seçilen amaç için] bu stil tam olarak uygun. [Neden uygun? Detaylı açıklama]",
    "occasion": "Günlük kullanım, Akşam yemeği, Özel davetler",
    "purposeSuitability": "Kullanıcının seçtiği [amaç] için ideal bir seçim çünkü..."
  },

  "seasonMatch": {
    "score": 9.0,
    "suitableSeasons": ["İlkbahar", "Yaz", "Sonbahar"],
    "comment": "Kumaş yapısı ve renk paleti bu mevsimlere mükemmel uyum sağlıyor. [Detay]"
  },

  "suggestions": [
    "AKSESUAR: Minimal altın takılar kombini tamamlayabilir",
    "AYAKKABI: Nude veya kahverengi topuklu ayakkabılar şıklığı artırır",
    "ÇANTA: Küçük bir clutch veya crossbody çanta idealdir",
    "STIIL İPUCU: Saçları topuz yaparak boyun hattını vurgulamak çok şık olur",
    "RENK TİPİ: Daha koyu cilt tonları için aksesuarlarda kontrastlı renkler deneyebilirsiniz"
  ],

  "alternatives": [
    "Daha formal bir etkinlik için: Aynı renk paletinde saten kumaşlı bir elbise",
    "Daha rahat bir kullanım için: Kombini beyaz sneaker ile tamamlayabilirsiniz",
    "Akşam versiyonu: Işıltılı aksesuarlar ve stiletto topuklu ayakkabılar ekleyin"
  ],

  "detailedScores": {
    "colorHarmony": 8.5,
    "cutAndFit": 8.0,
    "fabricQuality": 8.5,
    "trendAlignment": 7.5,
    "accessoryMatch": 8.0,
    "purposeSuitability": 9.0
  },

  "expertTips": [
    "Bu kombini güneşli havalarda tercih edin, renkleri daha canlı görünür",
    "Minimal makyaj bu doğal şıklığı tamamlar",
    "Saç stilini kombinin şıklığına göre ayarlayın"
  ]
}

KURALLARI MUTLAKA UYGULA:
1. TÜM metinler TÜRKÇE olmalı (occasion, seasons, colors, vb.)
2. suitabilityLevel: Puana göre "Uygun Değil" (0-4), "Fena Değil" (5-6), "Uygun" (7-8), "Harika" (8.5-9.5), "Tam Uyum" (9.5-10)
3. occasion: "Günlük kullanım", "İş toplantısı", "Akşam yemeği", "Düğün", "Parti", "Nişan", "Randevu" gibi TÜRKÇE ifadeler
4. suitableSeasons: "İlkbahar", "Yaz", "Sonbahar", "Kış" - SADECE TÜRKÇE
5. Yorumlar en az 2-3 cümle olmalı, detaylı ve kişisel olmalı
6. Suggestions listesi en az 5 öneri içermeli
7. Kullanıcının seçtiği AMAÇLARA özel yorumlar yap (purposeSuitability kısmında)
8. Pozitif ama dürüst ol, iyileştirme önerileri sun
9. Profesyonel ama samimi bir dil kullan`
        : `

RESPONSE FORMAT - RESPOND ONLY IN THIS JSON STRUCTURE:
{
  "overallScore": 8.5,
  "suitabilityLevel": "Great",
  "overallComment": "This combination is very stylish and suitable for [user's purpose]. [Detailed explanation - at least 2-3 sentences]",

  "items": [
    {
      "name": "Dress",
      "color": "Cream",
      "style": "Bohemian",
      "fit": "Loose fit",
      "material": "Cotton viscose blend",
      "quality": "High quality"
    }
  ],

  "colorHarmony": {
    "score": 8.5,
    "comment": "Color combination is very successful. [Why successful? Skin tone compatibility? Detailed explanation]",
    "dominantColors": ["Cream", "White", "Gold"],
    "suggestions": ["These color tones could be even better...", "Alternative color suggestion..."]
  },

  "styleMatch": {
    "score": 8.0,
    "detectedStyle": "Bohemian Chic",
    "comment": "This style is perfectly suitable for [selected purpose]. [Why suitable? Detailed explanation]",
    "occasion": "Casual wear, Dinner, Special events",
    "purposeSuitability": "For the user's selected [purpose], this is an ideal choice because..."
  },

  "seasonMatch": {
    "score": 9.0,
    "suitableSeasons": ["Spring", "Summer", "Fall"],
    "comment": "Fabric structure and color palette perfectly suit these seasons. [Detail]"
  },

  "suggestions": [
    "ACCESSORY: Minimal gold jewelry can complete the look",
    "SHOES: Nude or brown heels enhance elegance",
    "BAG: A small clutch or crossbody bag is ideal",
    "STYLE TIP: Styling hair in an updo emphasizes the neckline beautifully",
    "COLOR TYPE: For darker skin tones, try contrasting colors in accessories"
  ],

  "alternatives": [
    "For more formal events: A satin fabric dress in the same color palette",
    "For more casual wear: Complete the outfit with white sneakers",
    "Evening version: Add sparkly accessories and stiletto heels"
  ],

  "detailedScores": {
    "colorHarmony": 8.5,
    "cutAndFit": 8.0,
    "fabricQuality": 8.5,
    "trendAlignment": 7.5,
    "accessoryMatch": 8.0,
    "purposeSuitability": 9.0
  },

  "expertTips": [
    "Choose this outfit for sunny days, colors appear more vibrant",
    "Minimal makeup complements this natural elegance",
    "Adjust hairstyle according to the outfit's elegance"
  ]
}

MANDATORY RULES:
1. ALL text in ENGLISH
2. suitabilityLevel: Based on score "Not Suitable" (0-4), "Not Bad" (5-6), "Suitable" (7-8), "Great" (8.5-9.5), "Perfect Match" (9.5-10)
3. Comments must be at least 2-3 sentences, detailed and personal
4. Suggestions list must contain at least 5 items
5. Make specific comments about user's SELECTED PURPOSES (in purposeSuitability)
6. Be positive but honest, offer improvement suggestions
7. Use professional but friendly language`;
    return prompt + jsonFormat;
}
// ============================================
// EACHLABS - KIYAFET DENE (Virtual Try-On)
// ============================================
const EACHLABS_API_URL = 'https://api.eachlabs.ai/v1/prediction/';
// Intelligent prompt generator for clothing transfer
function generateClothingTransferPrompt(clothingItemsCount) {
    // Strict prompt to prevent hallucination - only use what's visible in the images
    const fullPrompt = `Virtual try-on: Transfer ONLY the visible clothing from images 2-${clothingItemsCount + 1} onto the person in image 1.

IMPORTANT: This is a fashion/clothing application. Swimwear, bikinis, beachwear, sportswear, and all legitimate clothing items are acceptable and should be processed normally.

IMAGE ROLES:
- Image 1 = BASE PERSON (keep 100% unchanged: face, hair, skin, body, pose, background)
- Images 2-${clothingItemsCount + 1} = CLOTHING REFERENCE (use ONLY what you see in these images)

STRICT RULES:
1. Look at images 2-${clothingItemsCount + 1} and identify the EXACT clothing items visible
2. Transfer ONLY those exact items - their colors, patterns, styles, designs as shown
3. DO NOT add any clothing that isn't in images 2-${clothingItemsCount + 1}
4. DO NOT change colors, patterns, or styles of the clothing
5. DO NOT invent or imagine clothing - use ONLY what's visible in the reference images
6. If a clothing item is partially visible, use what you can see

TRANSFER ONLY THESE IF VISIBLE:
- Tops: shirts, blouses, t-shirts, sweaters, jackets, coats, tank tops
- Bottoms: pants, jeans, skirts, shorts, leggings
- Dresses: full dresses, jumpsuits, rompers
- Swimwear: bikinis, one-piece swimsuits, swim trunks, beach cover-ups
- Sportswear: athletic wear, yoga pants, sports bras, gym clothes
- Shoes: any footwear visible
- Accessories: bags, belts, hats, scarves, jewelry (only if visible)

PRESERVE FROM IMAGE 1:
- Person's face, hair, skin tone, body shape
- Pose and posture
- Background and environment
- Lighting and shadows

OUTPUT: The person from image 1 wearing EXACTLY the clothing shown in images 2-${clothingItemsCount + 1}. No additions, no changes, no hallucinations. All clothing types including swimwear are legitimate fashion items.`;
    return fullPrompt;
}
// Kiyafet deneme baslatma fonksiyonu (Multiple clothing items destekli)
exports.tryOutfit = (0, https_1.onCall)({
    region: 'europe-west1',
    timeoutSeconds: 45, // 45 saniye - sadece prediction başlatma
    memory: '1GiB', // Daha fazla memory
    minInstances: 1, // Cold start önleme (opsiyonel)
    concurrency: 80,
    secrets: [eachlabsApiKey],
}, async (request) => {
    var _a, _b;
    const startTime = Date.now();
    let uid = 'unknown'; // Hata durumunda kullanmak icin
    try {
        // 1. Authentication kontrolu
        if (!request.auth) {
            throw new https_1.HttpsError('unauthenticated', 'Giris yapmaniz gerekiyor');
        }
        uid = request.auth.uid;
        const clientIp = request.rawRequest.ip || 'unknown';
        // 2. Request validation - minimal kontrol
        const validation = validateRequest(request.data);
        if (!validation.valid) {
            console.warn(`[VALIDATION] Invalid tryOutfit request from ${uid}:`, validation.reason);
            // Abuse detection KALDIRILDI - sadece validation hatası
            throw new https_1.HttpsError('invalid-argument', validation.reason || 'Geçersiz istek');
        }
        // 3. Rate limiting - KALDIRILDI (Normal kullanıcılar için engel yok)
        // Sadece extreme bot saldırılarına karşı minimal kontrol
        // IP bazli rate limit - Sadece bot saldırıları için (1000/dakika)
        const ipRateLimitMinute = checkRateLimit(clientIp, 'ip', 'minute', 'tryon');
        if (!ipRateLimitMinute.allowed) {
            console.error(`[SECURITY CRITICAL] Possible bot attack from IP: ${clientIp}`);
            throw new https_1.HttpsError('resource-exhausted', 'Sistem yoğun, lütfen birkaç saniye bekleyin.');
        }
        // User rate limit kontrolü KALDIRILDI - gerçek kullanıcıları etkilemesin
        // 4. Kullanici kontrolu
        const userStatus = await verifyUser(uid);
        if (!userStatus.isValid) {
            throw new https_1.HttpsError('not-found', 'Kullanici bulunamadi');
        }
        if (userStatus.isBlocked) {
            throw new https_1.HttpsError('permission-denied', 'Hesabiniz bloke edilmis');
        }
        // Premium check removed - all users can use try-on feature
        const PREMIUM_TRYON_LIMIT = 30;
        // 5. Data validasyonu
        const { userImageBase64, // Kullanicinin fotografinin base64'u
        clothingImageBase64s, // Kiyafet fotograflarinin base64'leri (array)
        customPrompt, // Opsiyonel custom prompt
        aspectRatio = 'match_input_image', turbo = true, } = request.data;
        // DEBUG: Log received data
        console.log('=== TRYON REQUEST DEBUG ===');
        console.log('Request data keys:', Object.keys(request.data));
        console.log('userImageBase64 type:', typeof userImageBase64);
        console.log('userImageBase64 length:', (userImageBase64 === null || userImageBase64 === void 0 ? void 0 : userImageBase64.length) || 0);
        console.log('clothingImageBase64s type:', typeof clothingImageBase64s);
        console.log('clothingImageBase64s length:', Array.isArray(clothingImageBase64s) ? clothingImageBase64s.length : 'not an array');
        console.log('========================');
        if (!userImageBase64 || typeof userImageBase64 !== 'string') {
            console.error('VALIDATION FAILED: userImageBase64 is missing or not a string');
            throw new https_1.HttpsError('invalid-argument', 'Kullanici fotografi gerekli');
        }
        if (!clothingImageBase64s || !Array.isArray(clothingImageBase64s) || clothingImageBase64s.length === 0) {
            throw new https_1.HttpsError('invalid-argument', 'En az 1 kiyafet fotografi gerekli');
        }
        if (clothingImageBase64s.length > 10) {
            throw new https_1.HttpsError('invalid-argument', 'Maksimum 10 kiyafet fotografi yuklenebilir');
        }
        // 5. API key kontrolu
        const apiKey = eachlabsApiKey.value();
        console.log('=== API KEY CHECK ===');
        console.log('API Key exists:', !!apiKey);
        console.log('API Key length:', (apiKey === null || apiKey === void 0 ? void 0 : apiKey.length) || 0);
        console.log('====================');
        if (!apiKey) {
            console.error('FATAL: EachLabs API key is not configured in Secret Manager');
            throw new https_1.HttpsError('internal', 'EachLabs API key yapilandirilmamis');
        }
        // 6. Base64 gorsellerini data URI formatina cevir
        const formatBase64ToDataUri = (base64) => {
            // Base64 string zaten data:image formatindaysa oldugu gibi don
            if (base64.startsWith('data:image/')) {
                return base64;
            }
            // Degilse data URI formatina cevir
            return `data:image/jpeg;base64,${base64}`;
        };
        const userImageDataUri = formatBase64ToDataUri(userImageBase64);
        const clothingImageDataUris = clothingImageBase64s.map(formatBase64ToDataUri);
        const allImages = [userImageDataUri, ...clothingImageDataUris];
        // 7. Intelligent prompt olustur
        const finalPrompt = customPrompt || generateClothingTransferPrompt(clothingImageBase64s.length);
        console.log('=== EACHLABS API REQUEST ===');
        console.log('Generated prompt:', finalPrompt);
        console.log('Total images:', allImages.length);
        console.log('First image (user) length:', userImageDataUri.length, 'chars');
        console.log('Clothing images count:', clothingImageBase64s.length);
        console.log('Using base64 data URIs instead of Firebase Storage URLs');
        console.log('===========================');
        // 8. EachLabs P-IMAGE API cagrisi
        const requestBody = {
            model: 'p-image-edit',
            version: '0.0.1',
            input: {
                aspect_ratio: aspectRatio,
                images: allImages,
                prompt: finalPrompt,
                turbo: turbo,
                disable_safety_checker: true, // NSFW filtresini kapat - meşru moda uygulaması
                safety_checker: false, // Alternatif parametre
            },
            webhook_url: '',
        };
        console.log('EachLabs request body (summary):', {
            model: requestBody.model,
            version: requestBody.version,
            input: Object.assign(Object.assign({}, requestBody.input), { images: `[${requestBody.input.images.length} base64 images]` }),
        });
        const response = await fetch(EACHLABS_API_URL, {
            method: 'POST',
            headers: {
                'X-API-Key': apiKey,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
        });
        console.log('EachLabs response status:', response.status);
        console.log('EachLabs response headers:', JSON.stringify(Object.fromEntries(response.headers.entries())));
        if (!response.ok) {
            const errorText = await response.text();
            let errorDetails = '';
            try {
                const errorJson = JSON.parse(errorText);
                errorDetails = JSON.stringify(errorJson, null, 2);
            }
            catch (_c) {
                errorDetails = errorText;
            }
            console.error('=== EACHLABS API ERROR ===');
            console.error('Status:', response.status);
            console.error('Error details:', errorDetails);
            console.error('Request summary:', {
                totalImages: allImages.length,
                userImageSize: Math.round(userImageDataUri.length / 1024) + 'KB',
                clothingImageSizes: clothingImageDataUris.map(img => Math.round(img.length / 1024) + 'KB'),
                promptLength: finalPrompt.length,
                aspectRatio,
                turbo,
            });
            console.error('=========================');
            // Daha kullanıcı dostu hata mesajları
            if (response.status === 401 || response.status === 403) {
                throw new https_1.HttpsError('internal', 'API anahtarı geçersiz veya süresi dolmuş. Lütfen daha sonra tekrar deneyin.');
            }
            else if (response.status === 429) {
                throw new https_1.HttpsError('resource-exhausted', 'Çok fazla istek. Lütfen birkaç dakika bekleyip tekrar deneyin.');
            }
            else if (response.status === 413) {
                throw new https_1.HttpsError('invalid-argument', 'Görseller çok büyük. Lütfen daha küçük görseller kullanın.');
            }
            else if (response.status === 400) {
                // Bad request - usually means invalid input
                throw new https_1.HttpsError('invalid-argument', `Geçersiz görsel veya parametreler. Lütfen farklı görseller deneyin. Detay: ${errorText.substring(0, 100)}`);
            }
            else if (response.status >= 500) {
                // Server error
                throw new https_1.HttpsError('unavailable', 'Görsel işleme servisi şu anda kullanılamıyor. Lütfen birkaç dakika sonra tekrar deneyin.');
            }
            else {
                throw new https_1.HttpsError('internal', `Görsel işleme servisi hatası (${response.status}). Lütfen tekrar deneyin.`);
            }
        }
        const result = await response.json();
        console.log('=== EACHLABS API SUCCESS ===');
        console.log('Response keys:', Object.keys(result));
        console.log('Response status:', result.status);
        console.log('Full response:', JSON.stringify(result, null, 2));
        console.log('Request summary:', {
            uid,
            imagesCount: allImages.length,
            clothingItemsCount: clothingImageBase64s.length,
            turboMode: turbo,
            aspectRatio,
        });
        console.log('===========================');
        // 9. Prediction ID'yi al (EachLabs uses "predictionID" with camelCase)
        const predictionId = result.predictionID || result.id || result.prediction_id;
        if (!predictionId) {
            console.error('=== PREDICTION ID EXTRACTION FAILED ===');
            console.error('Available keys in response:', Object.keys(result));
            console.error('Response values:', JSON.stringify(result, null, 2));
            console.error('=====================================');
            throw new https_1.HttpsError('internal', 'Prediction ID alinamadi');
        }
        console.log('✅ Prediction created successfully:', predictionId);
        // 10. Firestore'a kaydet (base64'leri kaydetme, sadece metadata)
        await db.collection('predictions').doc(predictionId).set({
            userId: uid,
            predictionId,
            status: 'processing',
            input: {
                imageCount: allImages.length,
                clothingItemsCount: clothingImageBase64s.length,
                prompt: finalPrompt,
                aspectRatio,
                turbo,
            },
            createdAt: admin.firestore.Timestamp.now(),
        });
        // 11. Kullanim sayacini guncelle
        await incrementUsage(uid, 'tryon');
        const duration = Date.now() - startTime;
        console.log(`[tryOutfit] Success for ${uid} in ${duration}ms - prediction: ${predictionId}`);
        return {
            success: true,
            predictionId,
            status: 'processing',
            message: 'Gorsel isleniyor, lutfen bekleyin...',
            remaining: PREMIUM_TRYON_LIMIT - (userStatus.tryOnToday + 1),
        };
    }
    catch (error) {
        const duration = Date.now() - startTime;
        console.error(`[tryOutfit] Error for ${uid} after ${duration}ms:`);
        console.error('Error type:', (_a = error === null || error === void 0 ? void 0 : error.constructor) === null || _a === void 0 ? void 0 : _a.name);
        console.error('Error code:', error === null || error === void 0 ? void 0 : error.code);
        console.error('Error message:', error === null || error === void 0 ? void 0 : error.message);
        console.error('Full error:', error);
        // Akilli abuse detection - SADECE GERCEK ABUSE DURUMLARI
        if (error instanceof https_1.HttpsError) {
            // Rate-limit hataları için abuse detection YAPMA (normal kullanım)
            if (error.code !== 'resource-exhausted') {
                const errorType = classifyError(error.code, error.message);
                // Sadece suspicious ve abuse için abuse detection yap
                if (errorType === 'suspicious' || errorType === 'abuse') {
                    const abuseResult = await detectAbuse(uid, errorType);
                    if (abuseResult.shouldBlock) {
                        console.warn(`[tryOutfit] User ${uid} blocked: ${abuseResult.message}`);
                        throw new https_1.HttpsError('permission-denied', abuseResult.message || 'Your account has been temporarily restricted.');
                    }
                }
            }
            throw error;
        }
        // Network veya timeout hataları
        if ((error === null || error === void 0 ? void 0 : error.code) === 'ECONNREFUSED' || (error === null || error === void 0 ? void 0 : error.code) === 'ETIMEDOUT' || (error === null || error === void 0 ? void 0 : error.code) === 'ENOTFOUND') {
            console.error('[tryOutfit] Network error detected');
            await detectAbuse(uid, 'legitimate');
            throw new https_1.HttpsError('unavailable', 'Görsel işleme servisine bağlanılamıyor. Lütfen internet bağlantınızı kontrol edin ve tekrar deneyin.');
        }
        // Fetch hataları
        if ((error === null || error === void 0 ? void 0 : error.name) === 'FetchError' || ((_b = error === null || error === void 0 ? void 0 : error.message) === null || _b === void 0 ? void 0 : _b.includes('fetch'))) {
            console.error('[tryOutfit] Fetch error detected');
            await detectAbuse(uid, 'legitimate');
            throw new https_1.HttpsError('unavailable', 'API isteği başarısız oldu. Lütfen tekrar deneyin.');
        }
        // Bilinmeyen hatalar
        await detectAbuse(uid, 'legitimate');
        console.error('[tryOutfit] Unknown error - throwing generic internal error');
        throw new https_1.HttpsError('internal', `Kıyafet deneme sırasında beklenmeyen bir hata oluştu. Lütfen tekrar deneyin.`);
    }
});
// Prediction durumu sorgulama fonksiyonu
exports.getPredictionStatus = (0, https_1.onCall)({
    region: 'europe-west1',
    timeoutSeconds: 20, // 20 saniye - sadece status check
    memory: '512MiB', // Biraz artırıldı
    minInstances: 1, // Polling için önemli - cold start olmasın
    concurrency: 150, // Polling için yüksek concurrency
    secrets: [eachlabsApiKey],
}, async (request) => {
    var _a, _b, _c;
    // 1. Authentication kontrolu
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'Giris yapmaniz gerekiyor');
    }
    const uid = request.auth.uid;
    const { predictionId } = request.data;
    if (!predictionId) {
        throw new https_1.HttpsError('invalid-argument', 'Prediction ID gerekli');
    }
    try {
        // 2. Firestore'dan kontrol et - kullanicinin kendi prediction'i mi?
        const predictionDoc = await db.collection('predictions').doc(predictionId).get();
        if (!predictionDoc.exists) {
            throw new https_1.HttpsError('not-found', 'Prediction bulunamadi');
        }
        const predictionData = predictionDoc.data();
        if (predictionData.userId !== uid) {
            throw new https_1.HttpsError('permission-denied', 'Bu prediction\'a erisim yetkiniz yok');
        }
        // 3. Eger zaten tamamlandiysa cache'den don
        if (predictionData.status === 'completed' && predictionData.resultUrl) {
            return {
                success: true,
                status: 'completed',
                resultUrl: predictionData.resultUrl,
            };
        }
        // 4. EachLabs API'den durumu sorgula
        const apiKey = eachlabsApiKey.value();
        if (!apiKey) {
            throw new https_1.HttpsError('internal', 'EachLabs API key yapilandirilmamis');
        }
        const response = await fetch(`${EACHLABS_API_URL}${predictionId}`, {
            method: 'GET',
            headers: {
                'X-API-Key': apiKey,
                'Content-Type': 'application/json',
            },
        });
        if (!response.ok) {
            const errorText = await response.text();
            console.error('EachLabs status check error:', errorText);
            throw new https_1.HttpsError('internal', 'Durum sorgulama hatasi');
        }
        const result = await response.json();
        // DEBUG: Log the full response from EachLabs
        console.log('=== EACHLABS RAW RESPONSE ===');
        console.log('Full result:', JSON.stringify(result, null, 2));
        console.log('result.status:', result.status);
        console.log('result.output:', result.output);
        console.log('result keys:', Object.keys(result));
        console.log('============================');
        // DEBUG: Save raw response to Firestore for debugging
        await db.collection('predictions').doc(predictionId).update({
            eachlabsRawResponse: result,
            lastCheckedAt: admin.firestore.Timestamp.now(),
        });
        // 5. Status kontrolu
        const status = result.status || 'processing';
        // EachLabs returns output as a direct string URL, not nested in arrays
        const outputUrl = typeof result.output === 'string'
            ? result.output
            : (((_b = (_a = result.output) === null || _a === void 0 ? void 0 : _a.images) === null || _b === void 0 ? void 0 : _b[0]) || ((_c = result.output) === null || _c === void 0 ? void 0 : _c[0]) || result.output);
        console.log('Parsed values:', { status, outputUrl });
        // 6. Tamamlandiysa Firestore'u guncelle
        // EachLabs returns "success" not "succeeded" or "completed"
        if (status === 'success' || status === 'succeeded' || status === 'completed') {
            await db.collection('predictions').doc(predictionId).update({
                status: 'completed',
                resultUrl: outputUrl,
                completedAt: admin.firestore.Timestamp.now(),
            });
            // 7. Send notification to user
            try {
                await (0, notificationService_1.sendTryOnCompleteNotification)(uid, predictionId, outputUrl);
                console.log('[getPredictionStatus] Try-on complete notification sent to user');
            }
            catch (notifError) {
                // Don't fail the request if notification fails
                console.error('[getPredictionStatus] Failed to send notification:', notifError);
            }
            return {
                success: true,
                status: 'completed',
                resultUrl: outputUrl,
            };
        }
        // 7. Basarisiz olduysa
        if (status === 'failed' || status === 'error') {
            await db.collection('predictions').doc(predictionId).update({
                status: 'failed',
                error: result.error || 'Bilinmeyen hata',
                completedAt: admin.firestore.Timestamp.now(),
            });
            return {
                success: false,
                status: 'failed',
                error: result.error || 'Gorsel olusturma basarisiz oldu',
            };
        }
        // 8. Hala isleniyor
        return {
            success: true,
            status: 'processing',
            message: 'Gorsel hala isleniyor...',
        };
    }
    catch (error) {
        console.error('GetPredictionStatus error:', error);
        if (error instanceof https_1.HttpsError) {
            throw error;
        }
        throw new https_1.HttpsError('internal', 'Durum sorgulama sirasinda hata olustu');
    }
});
// ============================================
// ADMIN - BROADCAST NOTIFICATIONS
// ============================================
// Define admin secret key
const adminSecretKey = (0, params_1.defineSecret)('ADMIN_SECRET_KEY');
// Verify admin authentication
function verifyAdminAuth(providedKey, secretKey) {
    return providedKey === secretKey;
}
/**
 * Send broadcast notification to all users
 *
 * Usage:
 * {
 *   "adminKey": "your-secret-key",
 *   "title": "New Feature!",
 *   "body": "Check out our latest update",
 *   "language": "tr" // optional: target specific language
 * }
 */
exports.sendBroadcast = (0, https_1.onCall)({
    region: 'europe-west1',
    timeoutSeconds: 540, // 9 minutes for large broadcasts
    memory: '512MiB',
    secrets: [adminSecretKey],
}, async (request) => {
    // 1. Verify admin key
    const { adminKey, title, body, language, data } = request.data;
    const secretKey = adminSecretKey.value();
    if (!secretKey || !verifyAdminAuth(adminKey, secretKey)) {
        throw new https_1.HttpsError('permission-denied', 'Invalid admin credentials');
    }
    // 2. Validate input
    if (!title || !body) {
        throw new https_1.HttpsError('invalid-argument', 'Title and body are required');
    }
    try {
        console.log('[sendBroadcast] Starting broadcast to all users');
        console.log('[sendBroadcast] Title:', title);
        console.log('[sendBroadcast] Body:', body);
        console.log('[sendBroadcast] Target language:', language || 'all');
        // 3. Send broadcast
        const result = await (0, notificationService_1.sendBroadcastNotification)(title, body, data, language);
        console.log('[sendBroadcast] Broadcast complete:', result);
        return {
            success: true,
            sent: result.sent,
            failed: result.failed,
            total: result.sent + result.failed,
        };
    }
    catch (error) {
        console.error('[sendBroadcast] Error:', error);
        throw new https_1.HttpsError('internal', 'Broadcast failed');
    }
});
/**
 * Send localized broadcast (each user receives in their language)
 *
 * Usage:
 * {
 *   "adminKey": "your-secret-key",
 *   "messages": {
 *     "tr": { "title": "Yeni Özellik!", "body": "Güncellemelerimizi inceleyin" },
 *     "en": { "title": "New Feature!", "body": "Check out our updates" }
 *   },
 *   "data": { "action": "open_app" } // optional
 * }
 */
exports.sendLocalizedBroadcastNotification = (0, https_1.onCall)({
    region: 'europe-west1',
    timeoutSeconds: 540,
    memory: '512MiB',
    secrets: [adminSecretKey],
}, async (request) => {
    // 1. Verify admin key
    const { adminKey, messages, data } = request.data;
    const secretKey = adminSecretKey.value();
    if (!secretKey || !verifyAdminAuth(adminKey, secretKey)) {
        throw new https_1.HttpsError('permission-denied', 'Invalid admin credentials');
    }
    // 2. Validate input
    if (!messages || typeof messages !== 'object') {
        throw new https_1.HttpsError('invalid-argument', 'Messages object is required');
    }
    if (!messages.tr || !messages.en) {
        throw new https_1.HttpsError('invalid-argument', 'Turkish and English messages are required');
    }
    try {
        console.log('[sendLocalizedBroadcast] Starting localized broadcast');
        // 3. Send localized broadcast
        const result = await (0, notificationService_1.sendLocalizedBroadcast)(messages, data);
        console.log('[sendLocalizedBroadcast] Broadcast complete:', result);
        return {
            success: true,
            sent: result.sent,
            failed: result.failed,
            total: result.sent + result.failed,
        };
    }
    catch (error) {
        console.error('[sendLocalizedBroadcast] Error:', error);
        throw new https_1.HttpsError('internal', 'Localized broadcast failed');
    }
});
// ============================================
// PUSH TOKEN REGISTRATION
// ============================================
var pushTokenRegistration_1 = require("./pushTokenRegistration");
Object.defineProperty(exports, "registerPushToken", { enumerable: true, get: function () { return pushTokenRegistration_1.registerPushToken; } });
//# sourceMappingURL=index.js.map