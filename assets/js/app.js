/**
 * Aplicação principal - Controlador central
 */

import TemplateEngine from './template-engine.js';
import PhotoHandler from './photo-handler.js';
import LabelEditor from './label-editor.js';
import CanvasRenderer from './canvas-renderer.js';
import { logger } from './utils.js';

class FlyersApp {
    constructor() {
        // Módulos principais
        this.templateEngine = new TemplateEngine();
        this.photoHandler = new PhotoHandler();
        this.labelEditor = new LabelEditor();
        this.canvasRenderer = null;
        
        // Estado da aplicação
        this.currentTemplateName = 'OURO';
        this.isLoading = false;
        this.previewGenerated = false;
        
        // Elementos DOM
        this.initDOMElements();
        
        // Event listeners
        this.setupEventListeners();
        
        // Inicializa canvas renderer após DOM estar pronto
        try {
            this.canvasRenderer = new CanvasRenderer('preview-canvas');
        } catch (error) {
            logger.error('Erro ao inicializar canvas:', error);
            // Tenta novamente após um pequeno delay
            setTimeout(() => {
                this.canvasRenderer = new CanvasRenderer('preview-canvas');
                this.loadTemplate('OURO');
            }, 100);
            return;
        }
        
        // Carrega template inicial
        this.loadTemplate('OURO');
    }

    initDOMElements() {
        // Inputs
        this.nomeInput = document.getElementById('nome-input');
        this.templateSelect = document.getElementById('template-select');
        this.photoInput = document.getElementById('photo-input');
        
        // Info display
        this.templateInfo = document.getElementById('template-info');
        this.fileName = document.getElementById('file-name');
        
        // Controles
        this.photoControls = document.getElementById('photo-controls');
        this.labelControls = document.getElementById('label-controls');
        this.zoomInBtn = document.getElementById('zoom-in-btn');
        this.zoomOutBtn = document.getElementById('zoom-out-btn');
        this.resetPhotoBtn = document.getElementById('reset-photo-btn');
        this.fontIncreaseBtn = document.getElementById('font-increase-btn');
        this.fontDecreaseBtn = document.getElementById('font-decrease-btn');
        this.resetLabelBtn = document.getElementById('reset-label-btn');
        
        // Botões de ação
        this.generatePreviewBtn = document.getElementById('generate-preview-btn');
        this.downloadJpgBtn = document.getElementById('download-jpg-btn');
        
        // Canvas e overlay
        this.previewCanvas = document.getElementById('preview-canvas');
        this.labelOverlay = document.getElementById('label-overlay');
        this.labelBox = document.getElementById('label-box');
        this.labelText = document.getElementById('label-text');
    }

    setupEventListeners() {
        // Seleção de template
        this.templateSelect.addEventListener('change', (e) => {
            this.loadTemplate(e.target.value);
        });

        // Input de nome
        this.nomeInput.addEventListener('input', (e) => {
            const text = e.target.value; // Mantém o case original
            this.labelEditor.setText(text);
            
            // Mostra/esconde controles da label
            if (text.length > 0) {
                this.labelControls.style.display = 'block';
                this.updateLabelPreview();
            } else {
                this.labelControls.style.display = 'none';
            }
        });

        // Upload de foto
        this.photoInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (file) {
                await this.handlePhotoUpload(file);
            }
        });

        // Controles de foto
        this.zoomInBtn.addEventListener('click', () => {
            this.photoHandler.applyZoom(0.1);
            this.generatePreview();
        });
        
        this.zoomOutBtn.addEventListener('click', () => {
            this.photoHandler.applyZoom(-0.1);
            this.generatePreview();
        });
        
        this.resetPhotoBtn.addEventListener('click', () => {
            this.photoHandler.resetTransform();
            this.generatePreview();
        });

        // Controles de label
        this.fontIncreaseBtn.addEventListener('click', () => {
            this.labelEditor.increaseFontSize(2);
            this.updateLabelPreview();
            this.generatePreview();
        });
        
        this.fontDecreaseBtn.addEventListener('click', () => {
            this.labelEditor.decreaseFontSize(2);
            this.updateLabelPreview();
            this.generatePreview();
        });
        
        this.resetLabelBtn.addEventListener('click', () => {
            this.labelEditor.reset();
            this.updateLabelPreview();
            this.generatePreview();
        });

        // Botões principais
        this.generatePreviewBtn.addEventListener('click', () => {
            this.generatePreview();
        });
        
        this.downloadJpgBtn.addEventListener('click', async () => {
            await this.downloadJPG();
        });

        // Atalhos de teclado
        document.addEventListener('keydown', (e) => {
            this.handleKeyboard(e);
        });

        // Drag da foto no canvas
        this.setupCanvasDrag();
        
        // Drag da label
        this.setupLabelDrag();
    }

    async loadTemplate(templateName) {
        try {
            this.isLoading = true;
            this.currentTemplateName = templateName;
            
            logger.log(`Carregando template: ${templateName}`);
            
            const { image, config } = await this.templateEngine.loadTemplate(templateName);
            
            // Configura canvas
            const canvasSize = config.canvasBaseSize;
            this.canvasRenderer.setCanvasSize(canvasSize.width, canvasSize.height);
            
            // Ajusta tamanho visual do canvas
            const container = this.previewCanvas.parentElement;
            this.canvasRenderer.fitToContainer(
                container.clientWidth - 40,
                container.clientHeight - 40,
                canvasSize.width,
                canvasSize.height
            );
            
            // Atualiza máscara da foto
            const mask = this.templateEngine.getPhotoMask();
            if (mask) {
                this.photoHandler.setMask(mask);
            }
            
            // Inicializa label editor com preset
            const namePreset = this.templateEngine.getNamePreset();
            if (namePreset) {
                this.labelEditor.initializeFromPreset(
                    namePreset,
                    canvasSize.width,
                    canvasSize.height
                );
            }
            
            // Atualiza UI
            this.templateInfo.textContent = `Template: ${templateName}`;
            this.templateSelect.value = templateName;
            
            // Se já tem foto e nome, gera preview
            if (this.photoHandler.hasPhoto() || this.nomeInput.value) {
                await this.generatePreview();
            } else {
                // Desenha apenas o template
                await this.canvasRenderer.render(
                    image,
                    null,
                    null
                );
            }
            
            // Esconde controles se template OURO não usa frase
            // (futuro: remover campo frase se necessário)
            
        } catch (error) {
            logger.error('Erro ao carregar template:', error);
            alert(`Erro ao carregar template: ${error.message}`);
        } finally {
            this.isLoading = false;
        }
    }

    async handlePhotoUpload(file) {
        try {
            this.fileName.textContent = file.name;
            await this.photoHandler.loadPhoto(file);
            
            // Mostra controles de foto
            this.photoControls.style.display = 'block';
            
            // Atualiza máscara se necessário (isso já chama fitPhotoToMask automaticamente)
            const mask = this.templateEngine.getPhotoMask();
            if (mask) {
                this.photoHandler.setMask(mask);
            } else {
                // Se não há máscara ainda, tenta ajustar depois que o template carregar
                // Mas normalmente a máscara já está definida ao carregar template
                this.photoHandler.fitPhotoToMask();
            }
            
            // Gera preview automático após ajustar foto
            await this.generatePreview();
            
        } catch (error) {
            logger.error('Erro ao fazer upload da foto:', error);
            alert(`Erro ao carregar foto: ${error.message}`);
            this.fileName.textContent = 'Nenhum arquivo escolhido';
        }
    }

    async generatePreview() {
        try {
            const templateImage = this.templateEngine.getCurrentImage();
            if (!templateImage) {
                logger.warn('Template ainda não carregado');
                return;
            }
            
            await this.canvasRenderer.render(
                templateImage,
                this.photoHandler,
                this.labelEditor
            );
            
            this.previewGenerated = true;
            this.downloadJpgBtn.disabled = false;
            
        } catch (error) {
            logger.error('Erro ao gerar preview:', error);
            alert(`Erro ao gerar preview: ${error.message}`);
        }
    }

    updateLabelPreview() {
        const text = this.labelEditor.getText();
        // Mantém o case original do texto
        this.labelText.textContent = text || 'Nome do Participante';
        
        // Atualiza estilo conforme label editor
        const labelData = this.labelEditor.getLabelData();
        this.labelText.style.fontSize = `${labelData.fontSize}px`;
        this.labelText.style.fontWeight = labelData.fontWeight;
        this.labelText.style.color = labelData.color;
        this.labelText.style.letterSpacing = labelData.letterSpacing;
        
        // Calcula posição (relativa ao canvas)
        const canvasRect = this.previewCanvas.getBoundingClientRect();
        const overlayRect = this.labelOverlay.getBoundingClientRect();
        const scaleX = canvasRect.width / this.canvasRenderer.canvas.width;
        const scaleY = canvasRect.height / this.canvasRenderer.canvas.height;
        
        const labelData_current = this.labelEditor.getLabelData();
        const labelX = labelData_current.x * scaleX;
        const labelY = labelData_current.y * scaleY;
        
        this.labelBox.style.left = `${labelX}px`;
        this.labelBox.style.top = `${labelY}px`;
        
        // Mostra overlay se há texto
        if (text) {
            this.labelOverlay.style.display = 'block';
        }
    }

    setupCanvasDrag() {
        let isDragging = false;
        let startX, startY;
        
        this.previewCanvas.addEventListener('mousedown', (e) => {
            if (this.photoHandler.hasPhoto()) {
                isDragging = true;
                const rect = this.previewCanvas.getBoundingClientRect();
                // Converte coordenadas do mouse para coordenadas do canvas
                const scaleX = this.canvasRenderer.canvas.width / rect.width;
                const scaleY = this.canvasRenderer.canvas.height / rect.height;
                
                startX = (e.clientX - rect.left) * scaleX;
                startY = (e.clientY - rect.top) * scaleY;
                
                // Passa coordenadas do canvas diretamente
                this.photoHandler.startDrag(startX, startY);
            }
        });
        
        this.previewCanvas.addEventListener('mousemove', (e) => {
            if (isDragging && this.photoHandler.hasPhoto()) {
                const rect = this.previewCanvas.getBoundingClientRect();
                // Converte coordenadas do mouse para coordenadas do canvas
                const scaleX = this.canvasRenderer.canvas.width / rect.width;
                const scaleY = this.canvasRenderer.canvas.height / rect.height;
                
                const currentX = (e.clientX - rect.left) * scaleX;
                const currentY = (e.clientY - rect.top) * scaleY;
                
                // Passa coordenadas do canvas diretamente
                this.photoHandler.updateDrag(currentX, currentY);
                this.generatePreview();
            }
        });
        
        this.previewCanvas.addEventListener('mouseup', () => {
            if (isDragging) {
                isDragging = false;
                this.photoHandler.endDrag();
            }
        });
        
        this.previewCanvas.addEventListener('mouseleave', () => {
            if (isDragging) {
                isDragging = false;
                this.photoHandler.endDrag();
            }
        });
    }

    setupLabelDrag() {
        let isDragging = false;
        let startX, startY;
        
        this.labelBox.addEventListener('mousedown', (e) => {
            e.stopPropagation();
            isDragging = true;
            
            const rect = this.labelOverlay.getBoundingClientRect();
            startX = e.clientX - rect.left;
            startY = e.clientY - rect.top;
            
            const labelData = this.labelEditor.getLabelData();
            this.labelEditor.startDrag(startX, startY);
            
            this.labelBox.classList.add('dragging');
        });
        
        document.addEventListener('mousemove', (e) => {
            if (isDragging) {
                const rect = this.labelOverlay.getBoundingClientRect();
                const canvasRect = this.previewCanvas.getBoundingClientRect();
                
                const scaleX = this.canvasRenderer.canvas.width / canvasRect.width;
                const scaleY = this.canvasRenderer.canvas.height / canvasRect.height;
                
                const currentX = (e.clientX - rect.left) * scaleX;
                const currentY = (e.clientY - rect.top) * scaleY;
                
                this.labelEditor.updateDrag(currentX, currentY);
                this.updateLabelPreview();
                this.generatePreview();
            }
        });
        
        document.addEventListener('mouseup', () => {
            if (isDragging) {
                isDragging = false;
                this.labelEditor.endDrag();
                this.labelBox.classList.remove('dragging');
            }
        });
        
        // Resize handle
        const resizeHandle = this.labelBox.querySelector('.resize-handle');
        if (resizeHandle) {
            resizeHandle.addEventListener('mousedown', (e) => {
                e.stopPropagation();
                const labelData = this.labelEditor.getLabelData();
                this.labelEditor.startResize(e.clientX, e.clientY, labelData.fontSize);
                
                const onMouseMove = (e) => {
                    this.labelEditor.updateResize(e.clientX, e.clientY);
                    this.updateLabelPreview();
                    this.generatePreview();
                };
                
                const onMouseUp = () => {
                    document.removeEventListener('mousemove', onMouseMove);
                    document.removeEventListener('mouseup', onMouseUp);
                    this.labelEditor.endResize();
                };
                
                document.addEventListener('mousemove', onMouseMove);
                document.addEventListener('mouseup', onMouseUp);
            });
        }
    }

    handleKeyboard(e) {
        // Ignora se estiver digitando em um input
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') {
            return;
        }
        
        // Movimento da label com setas
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
            if (this.labelEditor.getText()) {
                e.preventDefault();
                const step = e.shiftKey ? 10 : 5;
                
                switch (e.key) {
                    case 'ArrowUp':
                        this.labelEditor.moveBy(0, -step);
                        break;
                    case 'ArrowDown':
                        this.labelEditor.moveBy(0, step);
                        break;
                    case 'ArrowLeft':
                        this.labelEditor.moveBy(-step, 0);
                        break;
                    case 'ArrowRight':
                        this.labelEditor.moveBy(step, 0);
                        break;
                }
                
                this.updateLabelPreview();
                this.generatePreview();
            }
        }
        
        // Zoom de fonte com Ctrl/Cmd +/-
        if ((e.ctrlKey || e.metaKey) && (e.key === '+' || e.key === '=' || e.key === '-')) {
            if (this.labelEditor.getText()) {
                e.preventDefault();
                if (e.key === '+' || e.key === '=') {
                    this.labelEditor.increaseFontSize(2);
                } else {
                    this.labelEditor.decreaseFontSize(2);
                }
                this.updateLabelPreview();
                this.generatePreview();
            }
        }
    }

    async downloadJPG() {
        try {
            if (!this.previewGenerated) {
                await this.generatePreview();
            }
            
            const templateName = this.currentTemplateName.toLowerCase().replace(/\s+/g, '-');
            const nome = this.nomeInput.value.substring(0, 20).toLowerCase().replace(/\s+/g, '-') || 'sem-nome';
            const filename = `flyer-${templateName}-${nome}.jpg`;
            
            await this.canvasRenderer.downloadJPG(filename);
            
        } catch (error) {
            logger.error('Erro ao fazer download:', error);
            alert(`Erro ao fazer download: ${error.message}`);
        }
    }
}

// Inicializa aplicação quando DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    logger.log('Inicializando aplicação Flyers...');
    window.flyersApp = new FlyersApp();
});

