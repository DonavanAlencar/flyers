/**
 * Renderizador principal do canvas (composição final e download)
 */

import { canvasToJPGBlob, downloadBlob, validateCanvas, logger, calculateHash } from './utils.js';

class CanvasRenderer {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) {
            throw new Error(`Canvas com ID "${canvasId}" não encontrado`);
        }
        this.ctx = this.canvas.getContext('2d');
        this.renderVersion = '3.0.0';
    }

    /**
     * Configura o tamanho do canvas
     */
    setCanvasSize(width, height) {
        this.canvas.width = width;
        this.canvas.height = height;
        logger.log(`Canvas configurado: ${width}x${height}`);
    }

    /**
     * Renderiza a composição final (template + foto + label)
     */
    async render(templateImage, photoHandler, labelEditor) {
        if (!validateCanvas(this.canvas)) {
            throw new Error('Canvas inválido');
        }

        // Limpa o canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // 1. Desenha o template base
        if (templateImage) {
            this.ctx.drawImage(templateImage, 0, 0, this.canvas.width, this.canvas.height);
        }

        // 2. Desenha a foto (com máscara aplicada)
        if (photoHandler && photoHandler.hasPhoto()) {
            photoHandler.renderToCanvas(this.ctx, this.canvas.width, this.canvas.height);
        }

        // 2.5. Limpa a área do nome no template antes de desenhar a label (remove nome que vem no PNG)
        if (labelEditor && labelEditor.getText()) {
            this.clearNameArea(labelEditor);
        }

        // 3. Desenha a label do nome
        if (labelEditor && labelEditor.getText()) {
            labelEditor.renderToCanvas(this.ctx);
        }

        logger.log('Renderização concluída');
    }

    /**
     * Valida a renderização antes de permitir download
     */
    async validateRender() {
        const errors = [];

        // Valida canvas
        if (!validateCanvas(this.canvas)) {
            errors.push('Canvas inválido ou não renderizado');
        }

        // Valida dimensões
        if (this.canvas.width === 0 || this.canvas.height === 0) {
            errors.push('Canvas com dimensões inválidas');
        }

        // Verifica se há conteúdo (pelo menos alguns pixels não vazios)
        const imageData = this.ctx.getImageData(0, 0, Math.min(100, this.canvas.width), Math.min(100, this.canvas.height));
        const hasContent = imageData.data.some((value, index) => {
            // Ignora canal alpha, verifica se há pixels não transparentes
            return index % 4 !== 3 && value > 0;
        });

        if (!hasContent) {
            errors.push('Canvas parece estar vazio');
        }

        if (errors.length > 0) {
            logger.warn('Validação falhou:', errors);
            return { valid: false, errors };
        }

        return { valid: true, errors: [] };
    }

    /**
     * Gera e baixa o JPG final
     */
    async downloadJPG(filename = null) {
        try {
            // Valida renderização
            const validation = await this.validateRender();
            if (!validation.valid) {
                throw new Error(`Renderização inválida: ${validation.errors.join(', ')}`);
            }

            // Gera blob JPG
            const blob = await canvasToJPGBlob(this.canvas, 0.9);
            
            // Calcula hash (opcional, para log)
            const hash = await calculateHash(blob).catch(() => 'N/A');
            logger.log(`JPG gerado: ${blob.size} bytes, hash: ${hash.substring(0, 8)}...`);

            // Gera nome do arquivo
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
            const finalFilename = filename || `flyer-${timestamp}.jpg`;

            // Faz download
            downloadBlob(blob, finalFilename);
            
            logger.log(`Download iniciado: ${finalFilename}`);
            return { success: true, filename: finalFilename, size: blob.size, hash };
        } catch (error) {
            logger.error('Erro ao gerar/download JPG:', error);
            throw error;
        }
    }

    /**
     * Obtém dados do canvas como blob (sem download)
     */
    async getCanvasBlob(quality = 0.9) {
        return await canvasToJPGBlob(this.canvas, quality);
    }

    /**
     * Obtém o canvas element
     */
    getCanvas() {
        return this.canvas;
    }

    /**
     * Obtém o contexto do canvas
     */
    getContext() {
        return this.ctx;
    }

    /**
     * Limpa a área onde o nome será renderizado (remove o nome que vem no template PNG)
     * Usa técnica de "inpainting" simples: analisa a cor de fundo ao redor e preenche a área
     */
    clearNameArea(labelEditor) {
        if (!labelEditor) return;

        const labelData = labelEditor.getLabelData();
        if (!labelData.text) return;

        // Salva estado do contexto
        this.ctx.save();

        // Cria um canvas temporário para medir o texto
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        tempCtx.font = `${labelData.fontWeight} ${labelData.fontSize}px ${labelData.fontFamily}`;
        
        // Mede o texto para calcular a área a limpar
        const textMetrics = tempCtx.measureText(labelData.text);
        const textWidth = textMetrics.width;
        const textHeight = labelData.fontSize;
        
        // Calcula área expandida para limpar (com margem maior para capturar todo o texto original)
        const margin = 40; // Margem maior para garantir que pega todo o texto do template
        const clearX = Math.max(0, labelData.x - margin);
        const clearY = Math.max(0, labelData.y - margin);
        const clearWidth = Math.min(this.canvas.width - clearX, textWidth + (margin * 2));
        const clearHeight = Math.min(this.canvas.height - clearY, textHeight + (margin * 2));
        
        // Analisa a cor de fundo ao redor da área do texto (pega pixels das bordas)
        const sampleSize = 5;
        let rSum = 0, gSum = 0, bSum = 0, aSum = 0, sampleCount = 0;
        
        // Amostra pixels das bordas superior e inferior
        for (let x = clearX; x < clearX + clearWidth; x += sampleSize) {
            // Borda superior
            if (clearY - sampleSize >= 0) {
                const pixelData = this.ctx.getImageData(x, clearY - sampleSize, 1, 1);
                rSum += pixelData.data[0];
                gSum += pixelData.data[1];
                bSum += pixelData.data[2];
                aSum += pixelData.data[3];
                sampleCount++;
            }
            // Borda inferior
            if (clearY + clearHeight + sampleSize < this.canvas.height) {
                const pixelData = this.ctx.getImageData(x, clearY + clearHeight + sampleSize, 1, 1);
                rSum += pixelData.data[0];
                gSum += pixelData.data[1];
                bSum += pixelData.data[2];
                aSum += pixelData.data[3];
                sampleCount++;
            }
        }
        
        // Amostra pixels das bordas laterais
        for (let y = clearY; y < clearY + clearHeight; y += sampleSize) {
            // Borda esquerda
            if (clearX - sampleSize >= 0) {
                const pixelData = this.ctx.getImageData(clearX - sampleSize, y, 1, 1);
                rSum += pixelData.data[0];
                gSum += pixelData.data[1];
                bSum += pixelData.data[2];
                aSum += pixelData.data[3];
                sampleCount++;
            }
            // Borda direita
            if (clearX + clearWidth + sampleSize < this.canvas.width) {
                const pixelData = this.ctx.getImageData(clearX + clearWidth + sampleSize, y, 1, 1);
                rSum += pixelData.data[0];
                gSum += pixelData.data[1];
                bSum += pixelData.data[2];
                aSum += pixelData.data[3];
                sampleCount++;
            }
        }
        
        // Calcula cor média de fundo
        if (sampleCount > 0) {
            const avgR = Math.round(rSum / sampleCount);
            const avgG = Math.round(gSum / sampleCount);
            const avgB = Math.round(bSum / sampleCount);
            const avgA = Math.round(aSum / sampleCount) / 255;
            
            // Preenche a área com a cor de fundo média
            this.ctx.fillStyle = `rgba(${avgR}, ${avgG}, ${avgB}, ${avgA})`;
            this.ctx.fillRect(clearX, clearY, clearWidth, clearHeight);
        } else {
            // Fallback: usa destination-out se não conseguir amostrar
            this.ctx.globalCompositeOperation = 'destination-out';
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
            this.ctx.fillRect(clearX, clearY, clearWidth, clearHeight);
            this.ctx.globalCompositeOperation = 'source-over';
        }
        
        this.ctx.restore();
    }

    /**
     * Ajusta o tamanho do canvas para caber no container (mantendo proporção)
     */
    fitToContainer(containerWidth, containerHeight, templateWidth, templateHeight) {
        const scaleX = containerWidth / templateWidth;
        const scaleY = containerHeight / templateHeight;
        const scale = Math.min(scaleX, scaleY, 1); // Não aumenta além do tamanho original
        
        const displayWidth = templateWidth * scale;
        const displayHeight = templateHeight * scale;
        
        // Ajusta CSS (visual), mas mantém dimensões reais do canvas
        this.canvas.style.width = `${displayWidth}px`;
        this.canvas.style.height = `${displayHeight}px`;
        
        return { displayWidth, displayHeight, scale };
    }
}

export default CanvasRenderer;

