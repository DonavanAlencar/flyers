/**
 * Handler de upload, crop, zoom e pan da foto do participante
 */

import { fileToImage, clamp, calculateScale, logger } from './utils.js';

class PhotoHandler {
    constructor() {
        this.photoImage = null;
        this.photoFile = null;
        this.zoom = 1.0;
        this.panX = 0;
        this.panY = 0;
        this.mask = null;
        this.isDragging = false;
        this.dragStart = { x: 0, y: 0 };
    }

    /**
     * Carrega foto a partir de um arquivo
     */
    async loadPhoto(file) {
        try {
            this.photoFile = file;
            this.photoImage = await fileToImage(file);
            logger.log(`Foto carregada: ${this.photoImage.width}x${this.photoImage.height}`);
            
            // Reset zoom e pan
            this.resetTransform();
            
            return this.photoImage;
        } catch (error) {
            logger.error('Erro ao carregar foto:', error);
            throw error;
        }
    }

    /**
     * Define a máscara onde a foto deve aparecer
     */
    setMask(mask) {
        this.mask = mask;
        // Ajusta transformações iniciais para encaixar na máscara
        this.fitPhotoToMask();
    }

    /**
     * Ajusta zoom e pan para encaixar a foto na máscara
     */
    fitPhotoToMask() {
        if (!this.photoImage || !this.mask) return;

        const maskWidth = this.mask.width;
        const maskHeight = this.mask.height;
        const photoWidth = this.photoImage.width;
        const photoHeight = this.photoImage.height;

        // Calcula zoom para preencher a máscara (cover mode)
        this.zoom = calculateScale(photoWidth, photoHeight, maskWidth, maskHeight, 'cover');
        
        // Centraliza a foto
        this.panX = (maskWidth - photoWidth * this.zoom) / 2;
        this.panY = (maskHeight - photoHeight * this.zoom) / 2;
    }

    /**
     * Aplica zoom
     */
    applyZoom(delta, centerX = null, centerY = null) {
        if (!this.mask) return;

        const minZoom = 0.5;
        const maxZoom = 3.0;
        
        const oldZoom = this.zoom;
        this.zoom = clamp(this.zoom + delta, minZoom, maxZoom);

        // Se houver ponto central, ajusta pan para manter o ponto fixo
        if (centerX !== null && centerY !== null) {
            const maskCenterX = this.mask.x + this.mask.width / 2;
            const maskCenterY = this.mask.y + this.mask.height / 2;
            
            // Ajusta pan relativo ao centro
            const scaleFactor = this.zoom / oldZoom;
            this.panX = centerX - (centerX - this.panX) * scaleFactor;
            this.panY = centerY - (centerY - this.panY) * scaleFactor;
        }

        // Limita pan para manter foto dentro da máscara (aproximado)
        this.constrainPan();
    }

    /**
     * Aplica pan (movimento)
     */
    applyPan(deltaX, deltaY) {
        this.panX += deltaX;
        this.panY += deltaY;
        this.constrainPan();
    }

    /**
     * Limita o pan para manter a foto dentro dos limites da máscara
     */
    constrainPan() {
        if (!this.mask || !this.photoImage) return;

        const scaledWidth = this.photoImage.width * this.zoom;
        const scaledHeight = this.photoImage.height * this.zoom;

        // Limites: a foto deve cobrir toda a máscara (cover mode)
        const maxPanX = 0;
        const minPanX = this.mask.width - scaledWidth;
        const maxPanY = 0;
        const minPanY = this.mask.height - scaledHeight;

        this.panX = clamp(this.panX, minPanX, maxPanX);
        this.panY = clamp(this.panY, minPanY, maxPanY);
    }

    /**
     * Reseta transformações (zoom e pan)
     */
    resetTransform() {
        this.zoom = 1.0;
        this.panX = 0;
        this.panY = 0;
        if (this.mask) {
            this.fitPhotoToMask();
        }
    }

    /**
     * Renderiza a foto no canvas com máscara aplicada
     */
    renderToCanvas(ctx, canvasWidth, canvasHeight) {
        if (!this.photoImage || !this.mask) return;

        // Salva estado do contexto
        ctx.save();

        // Cria path da máscara
        const maskX = this.mask.x;
        const maskY = this.mask.y;
        const maskW = this.mask.width;
        const maskH = this.mask.height;

        // Aplica clipping na área da máscara
        ctx.beginPath();
        ctx.rect(maskX, maskY, maskW, maskH);
        ctx.clip();

        // Calcula posição e dimensões da foto escalada
        const photoX = maskX + this.panX;
        const photoY = maskY + this.panY;
        const photoW = this.photoImage.width * this.zoom;
        const photoH = this.photoImage.height * this.zoom;

        // Desenha a foto
        ctx.drawImage(
            this.photoImage,
            photoX,
            photoY,
            photoW,
            photoH
        );

        // Restaura estado do contexto
        ctx.restore();
    }

    /**
     * Inicia drag da foto (para pan)
     */
    startDrag(x, y) {
        this.isDragging = true;
        this.dragStart = { x: x - this.panX, y: y - this.panY };
    }

    /**
     * Atualiza drag da foto
     */
    updateDrag(x, y) {
        if (!this.isDragging) return;
        
        const maskX = this.mask ? this.mask.x : 0;
        const maskY = this.mask ? this.mask.y : 0;
        
        // Calcula pan relativo à máscara
        const relX = x - maskX;
        const relY = y - maskY;
        
        this.panX = relX - this.dragStart.x;
        this.panY = relY - this.dragStart.y;
        this.constrainPan();
    }

    /**
     * Finaliza drag
     */
    endDrag() {
        this.isDragging = false;
    }

    /**
     * Verifica se tem foto carregada
     */
    hasPhoto() {
        return this.photoImage !== null;
    }

    /**
     * Obtém dados da foto atual
     */
    getPhotoData() {
        return {
            image: this.photoImage,
            zoom: this.zoom,
            panX: this.panX,
            panY: this.panY
        };
    }
}

export default PhotoHandler;

