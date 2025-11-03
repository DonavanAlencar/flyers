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
     * Ajusta zoom e pan para encaixar a foto na máscara (centralizada e cobrindo toda a área)
     */
    fitPhotoToMask() {
        if (!this.photoImage || !this.mask) return;

        const maskWidth = this.mask.width;
        const maskHeight = this.mask.height;
        const photoWidth = this.photoImage.width;
        const photoHeight = this.photoImage.height;

        // Calcula zoom para preencher a máscara completamente (cover mode)
        // Garante que a foto cubra toda a máscara, usando a maior escala necessária
        const scaleX = maskWidth / photoWidth;
        const scaleY = maskHeight / photoHeight;
        // Usa o maior scale para garantir que cubra completamente (cover mode)
        // Adiciona uma pequena margem (2%) para garantir que não haja bordas vazias
        this.zoom = Math.max(scaleX, scaleY) * 1.02;
        
        // Calcula dimensões escaladas
        const scaledWidth = photoWidth * this.zoom;
        const scaledHeight = photoHeight * this.zoom;
        
        // Centraliza a foto dentro da máscara
        // panX e panY são relativos ao canto superior esquerdo da máscara (0,0)
        // Para centralizar: posição = (largura_máscara - largura_foto_escalada) / 2
        this.panX = (maskWidth - scaledWidth) / 2;
        this.panY = (maskHeight - scaledHeight) / 2;
        
        // Garante que pan nunca seja positivo (foto sempre cobre toda a máscara)
        // Se a foto for maior que a máscara em ambas dimensões, centraliza
        if (scaledWidth > maskWidth) {
            this.panX = Math.min(0, (maskWidth - scaledWidth) / 2);
        } else {
            this.panX = (maskWidth - scaledWidth) / 2;
        }
        
        if (scaledHeight > maskHeight) {
            this.panY = Math.min(0, (maskHeight - scaledHeight) / 2);
        } else {
            this.panY = (maskHeight - scaledHeight) / 2;
        }
        
        // Aplica constraints para garantir que está dentro dos limites
        this.constrainPan();
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
     * Em cover mode, a foto deve sempre cobrir toda a máscara
     */
    constrainPan() {
        if (!this.mask || !this.photoImage) return;

        const scaledWidth = this.photoImage.width * this.zoom;
        const scaledHeight = this.photoImage.height * this.zoom;

        // Em cover mode, os limites são:
        // - A foto pode ir até a borda esquerda/superior (pan = 0)
        // - Mas não pode sair da borda direita/inferior (pan máximo = máscara - foto escalada)
        // Garante que a foto sempre cobre toda a máscara
        const maxPanX = 0;
        const minPanX = Math.min(0, this.mask.width - scaledWidth);
        const maxPanY = 0;
        const minPanY = Math.min(0, this.mask.height - scaledHeight);

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

        // Aplica clipping na área da máscara para garantir que a foto não ultrapasse os limites
        ctx.beginPath();
        ctx.rect(maskX, maskY, maskW, maskH);
        ctx.clip();

        // Calcula dimensões escaladas da foto
        const photoW = this.photoImage.width * this.zoom;
        const photoH = this.photoImage.height * this.zoom;

        // Calcula posição da foto dentro da máscara (considerando pan relativo à máscara)
        const photoX = maskX + this.panX;
        const photoY = maskY + this.panY;

        // Desenha a foto (o clipping garante que só aparece dentro da máscara)
        ctx.drawImage(
            this.photoImage,
            0, 0, // Source x, y (coordenadas da imagem original)
            this.photoImage.width, // Source width
            this.photoImage.height, // Source height
            photoX, // Destination x (dentro do canvas)
            photoY, // Destination y (dentro do canvas)
            photoW, // Destination width (escalada)
            photoH  // Destination height (escalada)
        );

        // Restaura estado do contexto
        ctx.restore();
    }

    /**
     * Inicia drag da foto (para pan)
     * x, y são coordenadas do mouse no canvas
     */
    startDrag(x, y) {
        if (!this.mask) return;
        
        this.isDragging = true;
        // Salva o pan inicial e posição do mouse
        this.dragStart = { 
            panX: this.panX, 
            panY: this.panY,
            mouseX: x,
            mouseY: y
        };
    }

    /**
     * Atualiza drag da foto
     * x, y são coordenadas do mouse no canvas
     */
    updateDrag(x, y) {
        if (!this.isDragging || !this.mask) return;
        
        // Calcula o delta do movimento do mouse
        const deltaX = x - this.dragStart.mouseX;
        const deltaY = y - this.dragStart.mouseY;
        
        // Aplica o delta ao pan (movimento direto)
        this.panX = this.dragStart.panX + deltaX;
        this.panY = this.dragStart.panY + deltaY;
        
        // Aplica constraints para manter foto dentro da máscara
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

