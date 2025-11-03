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

        // 1.5. Limpa a área do nome no template ANTES de desenhar foto e label (remove nome que vem no PNG)
        // Faz isso antes para garantir que o nome do template PNG seja removido completamente
        if (labelEditor && labelEditor.getText()) {
            this.clearNameArea(labelEditor);
        }

        // 2. Desenha a foto (com máscara aplicada)
        if (photoHandler && photoHandler.hasPhoto()) {
            photoHandler.renderToCanvas(this.ctx, this.canvas.width, this.canvas.height);
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
     * Usa técnica agressiva para remover texto em múltiplas posições possíveis
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
        
        // Para o template OURO, o nome pode estar no canto superior esquerdo da faixa amarela
        // Mas também pode haver texto duplicado mais à direita. Limpamos uma área bem maior
        const marginX = Math.max(150, textWidth * 0.8); // Margem horizontal bem generosa (até 80% do texto)
        const marginY = Math.max(100, textHeight * 2); // Margem vertical também generosa
        
        // Primeira área: onde o label está posicionado
        const clearX1 = Math.max(0, labelData.x - marginX);
        const clearY1 = Math.max(0, labelData.y - marginY);
        const clearWidth1 = Math.min(this.canvas.width - clearX1, textWidth + (marginX * 2));
        const clearHeight1 = Math.min(this.canvas.height - clearY1, textHeight + (marginY * 2));
        
        // Segunda área: mais à direita (caso haja duplicação)
        // No template OURO, pode haver texto também à direita da faixa amarela
        const clearX2 = Math.max(0, this.canvas.width * 0.4); // Começa em 40% da largura
        const clearY2 = Math.max(0, labelData.y - marginY);
        const clearWidth2 = Math.min(this.canvas.width - clearX2, this.canvas.width * 0.5);
        const clearHeight2 = clearHeight1;
        
        // Método agressivo: usa destination-out diretamente (remove pixels completamente)
        // Limpa ambas as áreas possíveis onde o texto pode estar
        this.ctx.globalCompositeOperation = 'destination-out';
        
        // Primeira área: posição do label
        this.ctx.fillStyle = 'rgba(255, 255, 255, 1.0)';
        this.ctx.fillRect(clearX1, clearY1, clearWidth1, clearHeight1);
        this.ctx.fillRect(clearX1, clearY1, clearWidth1, clearHeight1); // Duplica para garantir
        
        // Segunda área: possível duplicação à direita
        this.ctx.fillRect(clearX2, clearY2, clearWidth2, clearHeight2);
        this.ctx.fillRect(clearX2, clearY2, clearWidth2, clearHeight2); // Duplica para garantir
        
        // Restaura modo de composição normal
        this.ctx.globalCompositeOperation = 'source-over';
        
        // Amostra cor de fundo da primeira área para preencher
        const sampleSize = 10;
        let rSum = 0, gSum = 0, bSum = 0, aSum = 0, sampleCount = 0;
        
        // Amostra pixels ao redor da primeira área
        for (let x = clearX1 - sampleSize; x < clearX1 + clearWidth1 + sampleSize; x += sampleSize) {
            if (x >= 0 && x < this.canvas.width) {
                if (clearY1 - sampleSize >= 0) {
                    const pixelData = this.ctx.getImageData(x, clearY1 - sampleSize, 1, 1);
                    rSum += pixelData.data[0];
                    gSum += pixelData.data[1];
                    bSum += pixelData.data[2];
                    aSum += pixelData.data[3];
                    sampleCount++;
                }
                if (clearY1 + clearHeight1 + sampleSize < this.canvas.height) {
                    const pixelData = this.ctx.getImageData(x, clearY1 + clearHeight1 + sampleSize, 1, 1);
                    rSum += pixelData.data[0];
                    gSum += pixelData.data[1];
                    bSum += pixelData.data[2];
                    aSum += pixelData.data[3];
                    sampleCount++;
                }
            }
        }
        
        // Preenche as áreas limpas com a cor de fundo amostrada
        if (sampleCount > 0) {
            const avgR = Math.round(rSum / sampleCount);
            const avgG = Math.round(gSum / sampleCount);
            const avgB = Math.round(bSum / sampleCount);
            const avgA = Math.round(aSum / sampleCount) / 255;
            
            this.ctx.fillStyle = `rgba(${avgR}, ${avgG}, ${avgB}, ${avgA})`;
            this.ctx.fillRect(clearX1, clearY1, clearWidth1, clearHeight1);
            this.ctx.fillRect(clearX2, clearY2, clearWidth2, clearHeight2);
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

