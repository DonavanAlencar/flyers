/**
 * Mapa de configuração dos templates
 * Define máscaras, presets de texto e propriedades de cada template
 */

const TEMPLATE_MAP = {
    'OURO': {
        imagePath: 'assets/templates/OURO.png',
        canvasBaseSize: { width: 1200, height: 1600 }, // Dimensões assumidas (ajustar conforme PNG real)
        photoMask: {
            type: 'rect',
            // Área preta central do template OURO
            // Valores em coordenadas do canvas base (width: 1200, height: 1600)
            x: 200,
            y: 350,
            width: 800,
            height: 700
        },
        namePreset: {
            // Posição inicial: canto superior esquerdo da faixa amarela
            x: 50,
            y: 50,
            fontSize: 48,
            minFontSize: 24,
            maxFontSize: 72,
            fontWeight: '700',
            color: '#FFFFFF',
            letterSpacing: '2px',
            fontFamily: 'Arial, sans-serif',
            textTransform: 'uppercase'
        },
        // Template OURO não usa frase
        usesPhrase: false
    },
    
    'VIP5000': {
        imagePath: 'assets/templates/VIP5000.png',
        canvasBaseSize: { width: 1200, height: 1600 },
        photoMask: {
            type: 'rect',
            x: 250,
            y: 300,
            width: 700,
            height: 800
        },
        namePreset: {
            x: 100,
            y: 100,
            fontSize: 42,
            minFontSize: 20,
            maxFontSize: 64,
            fontWeight: '700',
            color: '#000000',
            letterSpacing: '1.5px',
            fontFamily: 'Arial, sans-serif',
            textTransform: 'uppercase'
        },
        usesPhrase: true
    },
    
    'DIAMANTE': {
        imagePath: 'assets/templates/DIAMANTE.png',
        canvasBaseSize: { width: 1200, height: 1600 },
        photoMask: {
            type: 'rect',
            x: 200,
            y: 350,
            width: 800,
            height: 700
        },
        namePreset: {
            x: 100,
            y: 80,
            fontSize: 44,
            minFontSize: 22,
            maxFontSize: 68,
            fontWeight: '700',
            color: '#FFFFFF',
            letterSpacing: '2px',
            fontFamily: 'Arial, sans-serif',
            textTransform: 'uppercase'
        },
        usesPhrase: true
    },
    
    'SAFIRA': {
        imagePath: 'assets/templates/SAFIRA.png',
        canvasBaseSize: { width: 1200, height: 1600 },
        photoMask: {
            type: 'rect',
            x: 220,
            y: 340,
            width: 760,
            height: 720
        },
        namePreset: {
            x: 80,
            y: 90,
            fontSize: 46,
            minFontSize: 24,
            maxFontSize: 70,
            fontWeight: '700',
            color: '#FFFFFF',
            letterSpacing: '1.8px',
            fontFamily: 'Arial, sans-serif',
            textTransform: 'uppercase'
        },
        usesPhrase: true
    },
    
    // Templates adicionais com configuração padrão (podem ser refinados)
    'VIP4000': {
        imagePath: 'assets/templates/VIP4000.png',
        canvasBaseSize: { width: 1200, height: 1600 },
        photoMask: { type: 'rect', x: 250, y: 300, width: 700, height: 800 },
        namePreset: {
            x: 100, y: 100, fontSize: 40, minFontSize: 20, maxFontSize: 60,
            fontWeight: '700', color: '#000000', letterSpacing: '1.5px',
            fontFamily: 'Arial, sans-serif', textTransform: 'uppercase'
        },
        usesPhrase: true
    },
    
    'VIP3000': {
        imagePath: 'assets/templates/VIP3000.png',
        canvasBaseSize: { width: 1200, height: 1600 },
        photoMask: { type: 'rect', x: 250, y: 300, width: 700, height: 800 },
        namePreset: {
            x: 100, y: 100, fontSize: 38, minFontSize: 20, maxFontSize: 58,
            fontWeight: '700', color: '#000000', letterSpacing: '1.5px',
            fontFamily: 'Arial, sans-serif', textTransform: 'uppercase'
        },
        usesPhrase: true
    },
    
    'VIP2000': {
        imagePath: 'assets/templates/VIP2000.png',
        canvasBaseSize: { width: 1200, height: 1600 },
        photoMask: { type: 'rect', x: 250, y: 300, width: 700, height: 800 },
        namePreset: {
            x: 100, y: 100, fontSize: 36, minFontSize: 20, maxFontSize: 56,
            fontWeight: '700', color: '#000000', letterSpacing: '1.5px',
            fontFamily: 'Arial, sans-serif', textTransform: 'uppercase'
        },
        usesPhrase: true
    },
    
    'VIP1000': {
        imagePath: 'assets/templates/VIP1000.png',
        canvasBaseSize: { width: 1200, height: 1600 },
        photoMask: { type: 'rect', x: 250, y: 300, width: 700, height: 800 },
        namePreset: {
            x: 100, y: 100, fontSize: 34, minFontSize: 20, maxFontSize: 54,
            fontWeight: '700', color: '#000000', letterSpacing: '1.5px',
            fontFamily: 'Arial, sans-serif', textTransform: 'uppercase'
        },
        usesPhrase: true
    },
    
    'RECRUTAMENTO': {
        imagePath: 'assets/templates/RECRUTAMENTO.png',
        canvasBaseSize: { width: 1200, height: 1600 },
        photoMask: { type: 'rect', x: 200, y: 350, width: 800, height: 700 },
        namePreset: {
            x: 100, y: 80, fontSize: 42, minFontSize: 22, maxFontSize: 64,
            fontWeight: '700', color: '#FFFFFF', letterSpacing: '2px',
            fontFamily: 'Arial, sans-serif', textTransform: 'uppercase'
        },
        usesPhrase: true
    },
    
    'VENDAS': {
        imagePath: 'assets/templates/VENDAS.png',
        canvasBaseSize: { width: 1200, height: 1600 },
        photoMask: { type: 'rect', x: 200, y: 350, width: 800, height: 700 },
        namePreset: {
            x: 100, y: 80, fontSize: 42, minFontSize: 22, maxFontSize: 64,
            fontWeight: '700', color: '#FFFFFF', letterSpacing: '2px',
            fontFamily: 'Arial, sans-serif', textTransform: 'uppercase'
        },
        usesPhrase: true
    },
    
    'DUPLO DIAMANTE 100%': {
        imagePath: 'assets/templates/DUPLO DIAMANTE 100%.png',
        canvasBaseSize: { width: 1200, height: 1600 },
        photoMask: { type: 'rect', x: 200, y: 350, width: 800, height: 700 },
        namePreset: {
            x: 100, y: 80, fontSize: 44, minFontSize: 24, maxFontSize: 68,
            fontWeight: '700', color: '#FFFFFF', letterSpacing: '2px',
            fontFamily: 'Arial, sans-serif', textTransform: 'uppercase'
        },
        usesPhrase: true
    },
    
    'DUPLO DIAMANTE 50%': {
        imagePath: 'assets/templates/DUPLO DIAMANTE 50%.png',
        canvasBaseSize: { width: 1200, height: 1600 },
        photoMask: { type: 'rect', x: 200, y: 350, width: 800, height: 700 },
        namePreset: {
            x: 100, y: 80, fontSize: 44, minFontSize: 24, maxFontSize: 68,
            fontWeight: '700', color: '#FFFFFF', letterSpacing: '2px',
            fontFamily: 'Arial, sans-serif', textTransform: 'uppercase'
        },
        usesPhrase: true
    },
    
    'TRIPLO DIAMANTE': {
        imagePath: 'assets/templates/TRIPLO DIAMANTE.png',
        canvasBaseSize: { width: 1200, height: 1600 },
        photoMask: { type: 'rect', x: 200, y: 350, width: 800, height: 700 },
        namePreset: {
            x: 100, y: 80, fontSize: 46, minFontSize: 24, maxFontSize: 70,
            fontWeight: '700', color: '#FFFFFF', letterSpacing: '2px',
            fontFamily: 'Arial, sans-serif', textTransform: 'uppercase'
        },
        usesPhrase: true
    },
    
    'PRATA': {
        imagePath: 'assets/templates/PRATA.png',
        canvasBaseSize: { width: 1200, height: 1600 },
        photoMask: { type: 'rect', x: 200, y: 350, width: 800, height: 700 },
        namePreset: {
            x: 100, y: 80, fontSize: 40, minFontSize: 22, maxFontSize: 62,
            fontWeight: '700', color: '#FFFFFF', letterSpacing: '1.8px',
            fontFamily: 'Arial, sans-serif', textTransform: 'uppercase'
        },
        usesPhrase: true
    },
    
    'MASTER': {
        imagePath: 'assets/templates/MASTER.png',
        canvasBaseSize: { width: 1200, height: 1600 },
        photoMask: { type: 'rect', x: 200, y: 350, width: 800, height: 700 },
        namePreset: {
            x: 100, y: 80, fontSize: 38, minFontSize: 20, maxFontSize: 58,
            fontWeight: '700', color: '#FFFFFF', letterSpacing: '1.5px',
            fontFamily: 'Arial, sans-serif', textTransform: 'uppercase'
        },
        usesPhrase: true
    },
    
    'CONSULTOR': {
        imagePath: 'assets/templates/CONSULTOR.png',
        canvasBaseSize: { width: 1200, height: 1600 },
        photoMask: { type: 'rect', x: 200, y: 350, width: 800, height: 700 },
        namePreset: {
            x: 100, y: 80, fontSize: 36, minFontSize: 20, maxFontSize: 56,
            fontWeight: '700', color: '#FFFFFF', letterSpacing: '1.5px',
            fontFamily: 'Arial, sans-serif', textTransform: 'uppercase'
        },
        usesPhrase: true
    }
};

// Função helper para obter configuração de template
function getTemplateConfig(templateName) {
    return TEMPLATE_MAP[templateName] || null;
}

// Função helper para validar se template existe
function templateExists(templateName) {
    return templateName in TEMPLATE_MAP;
}

export { TEMPLATE_MAP, getTemplateConfig, templateExists };

