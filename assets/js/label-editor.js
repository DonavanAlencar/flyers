/**
 * Editor de label do nome (drag, resize, propriedades)
 */

import { clamp, logger } from './utils.js';

class LabelEditor {
    constructor() {
        this.labelData = {
            x: 0,
            y: 0,
            fontSize: 48,
            letterSpacing: '2px',
            color: '#FFFFFF',
            fontWeight: '700',
            fontFamily: 'Arial, sans-serif',
            textTransform: 'uppercase',
            text: ''
        };
        
        this.originalPreset = null;
        this.isDragging = false;
        this.isResizing = false;
        this.dragStart = { x: 0, y: 0 };
        this.resizeStart = { x: 0, y: 0, fontSize: 0 };
        this.canvasWidth = 0;
        this.canvasHeight = 0;
    }

    /**
     * Inicializa com preset do template
     */
    initializeFromPreset(preset, canvasWidth, canvasHeight) {
        this.originalPreset = { ...preset };
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;
        
        this.labelData = {
            x: preset.x,
            y: preset.y,
            fontSize: preset.fontSize,
            minFontSize: preset.minFontSize,
            maxFontSize: preset.maxFontSize,
            letterSpacing: preset.letterSpacing,
            color: preset.color,
            fontWeight: preset.fontWeight,
            fontFamily: preset.fontFamily,
            textTransform: preset.textTransform,
            text: ''
        };
        
        logger.log('Label inicializada:', this.labelData);
    }

    /**
     * Define o texto da label (mantém o case original)
     */
    setText(text) {
        // Mantém o texto como digitado (não força uppercase)
        this.labelData.text = text;
    }

    /**
     * Obtém o texto atual
     */
    getText() {
        return this.labelData.text;
    }

    /**
     * Move a label (drag)
     */
    moveTo(x, y) {
        // Limita dentro dos bounds do canvas
        const minX = 0;
        const maxX = this.canvasWidth;
        const minY = 0;
        const maxY = this.canvasHeight;
        
        this.labelData.x = clamp(x, minX, maxX);
        this.labelData.y = clamp(y, minY, maxY);
    }

    /**
     * Move relativo à posição atual
     */
    moveBy(deltaX, deltaY) {
        this.moveTo(this.labelData.x + deltaX, this.labelData.y + deltaY);
    }

    /**
     * Ajusta font-size (com limites)
     */
    setFontSize(size) {
        const min = this.labelData.minFontSize || 12;
        const max = this.labelData.maxFontSize || 100;
        this.labelData.fontSize = clamp(size, min, max);
    }

    /**
     * Aumenta font-size
     */
    increaseFontSize(delta = 2) {
        this.setFontSize(this.labelData.fontSize + delta);
    }

    /**
     * Diminui font-size
     */
    decreaseFontSize(delta = 2) {
        this.setFontSize(this.labelData.fontSize - delta);
    }

    /**
     * Reseta para preset original
     */
    reset() {
        if (this.originalPreset) {
            this.labelData.x = this.originalPreset.x;
            this.labelData.y = this.originalPreset.y;
            this.labelData.fontSize = this.originalPreset.fontSize;
            this.labelData.color = this.originalPreset.color;
            this.labelData.letterSpacing = this.originalPreset.letterSpacing;
            this.labelData.fontWeight = this.originalPreset.fontWeight;
        }
    }

    /**
     * Inicia drag
     */
    startDrag(x, y) {
        this.isDragging = true;
        this.dragStart = { x: x - this.labelData.x, y: y - this.labelData.y };
    }

    /**
     * Atualiza drag
     */
    updateDrag(x, y) {
        if (!this.isDragging) return;
        this.moveTo(x - this.dragStart.x, y - this.dragStart.y);
    }

    /**
     * Finaliza drag
     */
    endDrag() {
        this.isDragging = false;
    }

    /**
     * Inicia resize
     */
    startResize(x, y, initialFontSize) {
        this.isResizing = true;
        this.resizeStart = { 
            x, 
            y, 
            fontSize: initialFontSize || this.labelData.fontSize 
        };
    }

    /**
     * Atualiza resize baseado no movimento do mouse
     */
    updateResize(currentX, currentY) {
        if (!this.isResizing) return;
        
        // Calcula distância do ponto inicial
        const deltaX = currentX - this.resizeStart.x;
        const deltaY = currentY - this.resizeStart.y;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        
        // Ajusta font-size proporcionalmente (pode ajustar a sensibilidade)
        const scaleFactor = 1 + (distance / 100);
        const newFontSize = this.resizeStart.fontSize * scaleFactor;
        this.setFontSize(newFontSize);
    }

    /**
     * Finaliza resize
     */
    endResize() {
        this.isResizing = false;
    }

    /**
     * Renderiza a label no canvas
     */
    renderToCanvas(ctx) {
        if (!this.labelData.text) return;

        ctx.save();

        // Configura estilo de texto
        ctx.font = `${this.labelData.fontWeight} ${this.labelData.fontSize}px ${this.labelData.fontFamily}`;
        ctx.fillStyle = this.labelData.color;
        ctx.textBaseline = 'top';
        ctx.textAlign = 'left';

        // Renderiza o texto mantendo o case original (sem uppercase forçado)
        const text = this.labelData.text;
        
        // Letter spacing não é suportado diretamente no canvas, então renderiza caractere por caractere
        const letterSpacing = parseFloat(this.labelData.letterSpacing) || 0;
        let currentX = this.labelData.x;
        
        if (letterSpacing !== 0) {
            // Renderiza cada caractere separadamente com espaçamento
            for (let i = 0; i < text.length; i++) {
                ctx.fillText(text[i], currentX, this.labelData.y);
                // Mede a largura do caractere e adiciona o letterSpacing
                const metrics = ctx.measureText(text[i]);
                currentX += metrics.width + letterSpacing;
            }
        } else {
            // Sem letter spacing, renderiza normalmente (mantém case original)
            ctx.fillText(text, currentX, this.labelData.y);
        }

        ctx.restore();
    }

    /**
     * Verifica se um ponto está dentro da label (para detectar cliques)
     */
    isPointInside(x, y) {
        if (!this.labelData.text) return false;

        // Cria um canvas temporário para medir o texto
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        tempCtx.font = `${this.labelData.fontWeight} ${this.labelData.fontSize}px ${this.labelData.fontFamily}`;
        
        const metrics = tempCtx.measureText(this.labelData.text);
        const textWidth = metrics.width;
        const textHeight = this.labelData.fontSize;

        const labelX = this.labelData.x;
        const labelY = this.labelData.y;

        return (
            x >= labelX &&
            x <= labelX + textWidth &&
            y >= labelY &&
            y <= labelY + textHeight
        );
    }

    /**
     * Obtém dados da label
     */
    getLabelData() {
        return { ...this.labelData };
    }

    /**
     * Define dados da label (para restore de estado)
     */
    setLabelData(data) {
        Object.assign(this.labelData, data);
    }
}

export default LabelEditor;

