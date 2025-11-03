/**
 * Engine de carregamento e gerenciamento de templates
 */

import { getTemplateConfig, templateExists } from './template-map.js';
import { logger } from './utils.js';

class TemplateEngine {
    constructor() {
        this.currentTemplate = null;
        this.templateImage = null;
        this.config = null;
    }

    /**
     * Faz uma cópia rasa segura da configuração do template
     */
    cloneConfig(config) {
        if (!config) return null;
        try {
            return JSON.parse(JSON.stringify(config));
        } catch (error) {
            logger.warn('Não foi possível clonar configuração via JSON, usando fallback', error);
            return { ...config };
        }
    }

    /**
     * Carrega uma imagem de template
     */
    async loadTemplate(templateName) {
        if (!templateExists(templateName)) {
            logger.error(`Template "${templateName}" não encontrado`);
            throw new Error(`Template "${templateName}" não existe`);
        }

        const config = getTemplateConfig(templateName);
        if (!config) {
            throw new Error(`Configuração do template "${templateName}" não encontrada`);
        }

        // Trabalha sempre com uma cópia para evitar mutações no mapa original
        const configCopy = this.cloneConfig(config);

        return new Promise((resolve, reject) => {
            const img = new Image();
            
            img.onload = () => {
                this.templateImage = img;
                this.config = this.prepareConfigForImage(templateName, configCopy, img);
                this.currentTemplate = templateName;
                
                logger.log(`Template "${templateName}" carregado: ${img.naturalWidth}x${img.naturalHeight}`);
                resolve({ image: img, config: this.config });
            };
            
            img.onerror = () => {
                logger.error(`Erro ao carregar template: ${configCopy.imagePath}`);
                reject(new Error(`Não foi possível carregar o template: ${configCopy.imagePath}`));
            };
            
            img.src = configCopy.imagePath;
        });
    }

    /**
     * Ajusta configuração (máscara, presets, dimensões) com base na imagem real
     */
    prepareConfigForImage(templateName, config, img) {
        if (!config) return null;

        const naturalWidth = img.naturalWidth;
        const naturalHeight = img.naturalHeight;

        const baseWidth = config.canvasBaseSize?.width || naturalWidth;
        const baseHeight = config.canvasBaseSize?.height || naturalHeight;

        const scaleX = naturalWidth / baseWidth;
        const scaleY = naturalHeight / baseHeight;
        const needsScaling = Math.abs(scaleX - 1) > 0.001 || Math.abs(scaleY - 1) > 0.001;

        const preparedConfig = {
            ...config,
            canvasBaseSize: {
                width: naturalWidth,
                height: naturalHeight
            }
        };

        if (config.photoMask) {
            preparedConfig.photoMask = needsScaling
                ? this.scaleMask(config.photoMask, scaleX, scaleY)
                : { ...config.photoMask };
        }

        if (config.namePreset) {
            preparedConfig.namePreset = needsScaling
                ? this.scaleNamePreset(config.namePreset, scaleX, scaleY)
                : { ...config.namePreset };
        }

        const autoMask = this.computePhotoMaskFromImage(img);
        if (autoMask) {
            preparedConfig.photoMask = autoMask;
            logger.log(`Máscara auto detectada para "${templateName}":`, autoMask);
        } else if (preparedConfig.photoMask) {
            preparedConfig.photoMask = this.clampMaskToCanvas(
                preparedConfig.photoMask,
                naturalWidth,
                naturalHeight
            );
        } else {
            logger.warn(`Template "${templateName}" sem máscara detectável; usando canvas completo.`);
            preparedConfig.photoMask = {
                type: 'rect',
                x: 0,
                y: 0,
                width: naturalWidth,
                height: naturalHeight
            };
        }

        return preparedConfig;
    }

    /**
     * Escala máscara retangular segundo fatores fornecidos
     */
    scaleMask(mask, scaleX, scaleY) {
        if (!mask) return null;

        const scaled = {
            ...mask,
            x: (mask.x || 0) * scaleX,
            y: (mask.y || 0) * scaleY,
            width: (mask.width || 0) * scaleX,
            height: (mask.height || 0) * scaleY
        };

        // Garantir valores finitos
        for (const key of ['x', 'y', 'width', 'height']) {
            if (!Number.isFinite(scaled[key])) {
                scaled[key] = 0;
            }
        }

        return scaled;
    }

    /**
     * Escala preset do nome (posições e tamanhos de fonte)
     */
    scaleNamePreset(preset, scaleX, scaleY) {
        if (!preset) return null;

        const scaled = {
            ...preset,
            x: (preset.x || 0) * scaleX,
            y: (preset.y || 0) * scaleY
        };

        const scaleFont = (value) => {
            if (typeof value !== 'number') return value;
            return Math.max(1, value * scaleY);
        };

        scaled.fontSize = scaleFont(preset.fontSize);
        if (typeof preset.minFontSize === 'number') {
            scaled.minFontSize = scaleFont(preset.minFontSize);
        }
        if (typeof preset.maxFontSize === 'number') {
            scaled.maxFontSize = scaleFont(preset.maxFontSize);
        }

        if (typeof preset.letterSpacing === 'string' && preset.letterSpacing.endsWith('px')) {
            const numeric = parseFloat(preset.letterSpacing);
            if (!Number.isNaN(numeric)) {
                const scaledSpacing = numeric * scaleX;
                scaled.letterSpacing = `${Math.max(0, Math.round(scaledSpacing * 100) / 100)}px`;
            }
        }

        return scaled;
    }

    /**
     * Ajusta máscara para garantir que fique dentro do canvas
     */
    clampMaskToCanvas(mask, width, height) {
        if (!mask) return null;

        const x = Math.max(0, Math.min(mask.x, width));
        const y = Math.max(0, Math.min(mask.y, height));
        const maxWidth = width - x;
        const maxHeight = height - y;

        return {
            ...mask,
            x,
            y,
            width: Math.max(0, Math.min(mask.width, maxWidth)),
            height: Math.max(0, Math.min(mask.height, maxHeight))
        };
    }

    /**
     * Identifica automaticamente a área transparente do template para usar como máscara
     */
    computePhotoMaskFromImage(
        image,
        {
            baseAlphaThreshold = 10,
            extendedAlphaThreshold = 220,
            rowCoverageRatio = 0.6,
            minPixelThreshold = 500
        } = {}
    ) {
        try {
            const width = image.naturalWidth;
            const height = image.naturalHeight;

            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = width;
            tempCanvas.height = height;

            const tempCtx = tempCanvas.getContext('2d', { willReadFrequently: true });
            tempCtx.drawImage(image, 0, 0, width, height);

            const { data } = tempCtx.getImageData(0, 0, width, height);

            let baseMinX = width;
            let baseMinY = height;
            let baseMaxX = -1;
            let baseMaxY = -1;
            let baseCount = 0;

            let softMinX = width;
            let softMinY = height;
            let softMaxX = -1;
            let softMaxY = -1;
            let softCount = 0;

            const softRowCounts = new Array(height).fill(0);

            for (let y = 0; y < height; y++) {
                for (let x = 0; x < width; x++) {
                    const offset = (y * width + x) * 4;
                    const alpha = data[offset + 3];

                    if (alpha <= extendedAlphaThreshold) {
                        softCount++;
                        softRowCounts[y]++;

                        if (x < softMinX) softMinX = x;
                        if (y < softMinY) softMinY = y;
                        if (x > softMaxX) softMaxX = x;
                        if (y > softMaxY) softMaxY = y;

                        if (alpha <= baseAlphaThreshold) {
                            baseCount++;
                            if (x < baseMinX) baseMinX = x;
                            if (y < baseMinY) baseMinY = y;
                            if (x > baseMaxX) baseMaxX = x;
                            if (y > baseMaxY) baseMaxY = y;
                        }
                    }
                }
            }

            const hasSoftArea = softCount >= minPixelThreshold;
            const hasBaseArea = baseCount >= minPixelThreshold / 3; // menos pixels totalmente transparentes

            if (!hasSoftArea && !hasBaseArea) {
                return null;
            }

            let finalMinX;
            let finalMinY;
            let finalMaxX;
            let finalMaxY;

            if (hasBaseArea) {
                finalMinX = baseMinX;
                finalMinY = baseMinY;
                finalMaxX = baseMaxX;
                finalMaxY = baseMaxY;
            } else {
                finalMinX = softMinX;
                finalMinY = softMinY;
                finalMaxX = softMaxX;
                finalMaxY = softMaxY;
            }

            const rowCoverageThreshold = Math.max(1, Math.floor(width * rowCoverageRatio));

            for (let y = finalMinY - 1; y >= 0; y--) {
                if (softRowCounts[y] >= rowCoverageThreshold) {
                    finalMinY = y;
                } else {
                    break;
                }
            }

            for (let y = finalMaxY + 1; y < height; y++) {
                if (softRowCounts[y] >= rowCoverageThreshold) {
                    finalMaxY = y;
                } else {
                    break;
                }
            }

            finalMinX = Math.max(0, finalMinX);
            finalMinY = Math.max(0, finalMinY);
            finalMaxX = Math.min(width - 1, finalMaxX);
            finalMaxY = Math.min(height - 1, finalMaxY);

            const recomputeBounds = { minX: width, minY: height, maxX: -1, maxY: -1 };
            for (let y = finalMinY; y <= finalMaxY; y++) {
                for (let x = 0; x < width; x++) {
                    const alpha = data[(y * width + x) * 4 + 3];
                    if (alpha <= extendedAlphaThreshold) {
                        if (x < recomputeBounds.minX) recomputeBounds.minX = x;
                        if (x > recomputeBounds.maxX) recomputeBounds.maxX = x;
                        if (y < recomputeBounds.minY) recomputeBounds.minY = y;
                        if (y > recomputeBounds.maxY) recomputeBounds.maxY = y;
                    }
                }
            }

            if (recomputeBounds.maxX < recomputeBounds.minX || recomputeBounds.maxY < recomputeBounds.minY) {
                return null;
            }

            const padding = 2;
            const paddedX = Math.max(0, recomputeBounds.minX - padding);
            const paddedY = Math.max(0, recomputeBounds.minY - padding);
            const paddedWidth = Math.min(
                width - paddedX,
                recomputeBounds.maxX - recomputeBounds.minX + 1 + padding * 2
            );
            const paddedHeight = Math.min(
                height - paddedY,
                recomputeBounds.maxY - recomputeBounds.minY + 1 + padding * 2
            );

            return {
                type: 'rect',
                x: paddedX,
                y: paddedY,
                width: paddedWidth,
                height: paddedHeight
            };
        } catch (error) {
            logger.warn('Falha ao calcular máscara automática do template:', error);
            return null;
        }
    }

    /**
     * Obtém a configuração do template atual
     */
    getCurrentConfig() {
        return this.config;
    }

    /**
     * Obtém a imagem do template atual
     */
    getCurrentImage() {
        return this.templateImage;
    }

    /**
     * Obtém o nome do template atual
     */
    getCurrentTemplateName() {
        return this.currentTemplate;
    }

    /**
     * Obtém a máscara de foto (bounding box) do template atual
     */
    getPhotoMask() {
        if (!this.config) return null;
        return this.config.photoMask;
    }

    /**
     * Obtém os presets do nome do template atual
     */
    getNamePreset() {
        if (!this.config) return null;
        return this.config.namePreset;
    }

    /**
     * Verifica se o template atual usa frase
     */
    usesPhrase() {
        return this.config?.usesPhrase || false;
    }
}

export default TemplateEngine;
