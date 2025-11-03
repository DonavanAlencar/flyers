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

        return new Promise((resolve, reject) => {
            const img = new Image();
            
            img.onload = () => {
                this.templateImage = img;
                this.config = config;
                this.currentTemplate = templateName;
                
                // Ajusta canvasBaseSize se a imagem tiver dimensões diferentes
                if (img.naturalWidth !== config.canvasBaseSize.width || 
                    img.naturalHeight !== config.canvasBaseSize.height) {
                    logger.log(`Template ${templateName}: dimensões reais (${img.naturalWidth}x${img.naturalHeight}) diferem da config`);
                    // Atualiza para dimensões reais
                    config.canvasBaseSize.width = img.naturalWidth;
                    config.canvasBaseSize.height = img.naturalHeight;
                }
                
                logger.log(`Template "${templateName}" carregado: ${img.naturalWidth}x${img.naturalHeight}`);
                resolve({ image: img, config });
            };
            
            img.onerror = () => {
                logger.error(`Erro ao carregar template: ${config.imagePath}`);
                reject(new Error(`Não foi possível carregar o template: ${config.imagePath}`));
            };
            
            img.src = config.imagePath;
        });
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

