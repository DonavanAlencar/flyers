/**
 * Utilitários gerais da aplicação
 */

// Calcula hash SHA-256 de um blob (opcional, para validação)
async function calculateHash(blob) {
    const buffer = await blob.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Converte File para Image
function fileToImage(file) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const url = URL.createObjectURL(file);
        
        img.onload = () => {
            URL.revokeObjectURL(url);
            resolve(img);
        };
        
        img.onerror = () => {
            URL.revokeObjectURL(url);
            reject(new Error('Erro ao carregar imagem'));
        };
        
        img.src = url;
    });
}

// Converte Canvas para Blob JPG
function canvasToJPGBlob(canvas, quality = 0.9) {
    return new Promise((resolve) => {
        canvas.toBlob((blob) => {
            resolve(blob);
        }, 'image/jpeg', quality);
    });
}

// Download de blob
function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Valida dimensões do canvas
function validateCanvas(canvas) {
    return canvas.width > 0 && canvas.height > 0;
}

// Limita valor entre min e max
function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

// Calcula escala para manter proporção
function calculateScale(sourceWidth, sourceHeight, targetWidth, targetHeight, mode = 'contain') {
    const sourceRatio = sourceWidth / sourceHeight;
    const targetRatio = targetWidth / targetHeight;
    
    let scale;
    
    if (mode === 'contain') {
        // Mantém a proporção, garantindo que caiba dentro
        scale = Math.min(targetWidth / sourceWidth, targetHeight / sourceHeight);
    } else if (mode === 'cover') {
        // Preenche todo o espaço, pode cortar
        scale = Math.max(targetWidth / sourceWidth, targetHeight / sourceHeight);
    } else {
        scale = 1;
    }
    
    return scale;
}

// Converte coordenadas do mouse para coordenadas do canvas
function getCanvasCoordinates(canvas, event) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    return {
        x: (event.clientX - rect.left) * scaleX,
        y: (event.clientY - rect.top) * scaleY
    };
}

// Debounce function
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Logger simples (pode ser expandido)
const logger = {
    log: (...args) => console.log('[Flyers]', ...args),
    error: (...args) => console.error('[Flyers]', ...args),
    warn: (...args) => console.warn('[Flyers]', ...args),
};

export {
    calculateHash,
    fileToImage,
    canvasToJPGBlob,
    downloadBlob,
    validateCanvas,
    clamp,
    calculateScale,
    getCanvasCoordinates,
    debounce,
    logger
};

