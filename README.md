# Gerador de Flyers - Sistemas Gigantes

Aplicação standalone (HTML/CSS/JS) para geração de flyers a partir de templates pré-definidos, com upload de foto, edição de label do nome e download em JPG.

## 🚀 Características

- **Zero dependências**: HTML/CSS/JS puro (ES6 modules)
- **16 templates** pré-configurados (VIP, Diamantes, Ouro, Prata, etc.)
- **Upload e manipulação de foto** com zoom/pan para enquadramento
- **Editor de label** com drag & drop e resize
- **Render em HTML5 Canvas** com máscaras automáticas
- **Download em JPG** com qualidade otimizada

## 📁 Estrutura do Projeto

```
flyers/
├── index.html              # Página principal
├── assets/
│   ├── css/
│   │   └── main.css        # Estilos
│   ├── js/
│   │   ├── app.js          # Controlador principal
│   │   ├── template-engine.js
│   │   ├── template-map.js
│   │   ├── photo-handler.js
│   │   ├── label-editor.js
│   │   ├── canvas-renderer.js
│   │   └── utils.js
│   └── templates/
│       ├── OURO.png
│       ├── VIP5000.png
│       └── ... (16 templates)
└── README.md
```

## 🏃 Como Usar Localmente

### Opção 1: Servidor HTTP simples (recomendado)

Como a aplicação usa ES6 modules, é necessário rodar em um servidor HTTP (não funciona abrindo diretamente o HTML).

**Python 3:**
```bash
cd /home/donavan/projetos/flyers
python3 -m http.server 8000
```
Acesse: http://localhost:8000

**Node.js (http-server):**
```bash
npx http-server -p 8000
```

**PHP:**
```bash
php -S localhost:8000
```

### Opção 2: Abrir diretamente no navegador

Alguns navegadores modernos permitem abrir arquivos locais com módulos, mas pode haver limitações de CORS. Use apenas para testes rápidos.

## 📝 Uso da Aplicação

1. **Selecione um template** no dropdown (padrão: OURO)
2. **Digite o nome** (máx. 37 caracteres, convertido para UPPERCASE)
3. **Faça upload da foto** do participante
4. **Ajuste a foto**:
   - Use botões +/- Zoom
   - Arraste a foto no preview para reposicionar
   - Botão "Resetar" para voltar ao padrão
5. **Ajuste a label do nome**:
   - Arraste a label no preview
   - Use o handle (canto inferior direito) para redimensionar
   - Botões ↑/↓ Fonte ou atalhos: Ctrl/Cmd +/-
   - Setas do teclado para mover (Shift para passo maior)
6. **Clique em "Gerar preview"** para atualizar
7. **Clique em "Baixar JPG"** para fazer download

### Atalhos de Teclado

- **Setas** (↑↓←→): Move a label do nome
- **Shift + Setas**: Move com passo maior
- **Ctrl/Cmd + +/-**: Aumenta/diminui fonte da label
- **Arrastar no canvas**: Move a foto (quando foto carregada)

## 🎨 Templates Disponíveis

1. VIP5000
2. VIP4000
3. VIP3000
4. VIP2000
5. VIP1000
6. RECRUTAMENTO
7. VENDAS
8. DUPLO DIAMANTE 100%
9. DUPLO DIAMANTE 50%
10. TRIPLO DIAMANTE
11. DIAMANTE
12. SAFIRA
13. **OURO** (padrão)
14. PRATA
15. MASTER
16. CONSULTOR

## ⚙️ Como Adicionar Novos Templates

1. **Adicione o PNG** do template em `assets/templates/`

2. **Edite `assets/js/template-map.js`** e adicione a configuração:

```javascript
'NOME_DO_TEMPLATE': {
    imagePath: 'assets/templates/NOME_DO_TEMPLATE.png',
    canvasBaseSize: { width: 1200, height: 1600 }, // Dimensões do PNG
    photoMask: {
        type: 'rect',
        x: 200,      // Posição X da área da foto (em pixels do canvas base)
        y: 350,      // Posição Y
        width: 800,  // Largura da máscara
        height: 700 // Altura da máscara
    },
    namePreset: {
        x: 50,           // Posição inicial X do nome
        y: 50,           // Posição inicial Y
        fontSize: 48,    // Tamanho inicial da fonte
        minFontSize: 24, // Tamanho mínimo
        maxFontSize: 72, // Tamanho máximo
        fontWeight: '700',
        color: '#FFFFFF',
        letterSpacing: '2px',
        fontFamily: 'Arial, sans-serif',
        textTransform: 'uppercase'
    },
    usesPhrase: false // true se o template usa campo "Frase"
}
```

3. **Adicione a opção** no `<select>` do `index.html`

4. **Validação**: Abra a aplicação, selecione o template e verifique se:
   - A máscara da foto está correta
   - A label do nome aparece na posição esperada
   - O download gera JPG corretamente

### Como descobrir as coordenadas da máscara

Use um editor de imagem (GIMP, Photoshop, etc.) para identificar:
- A área onde a foto deve aparecer
- As coordenadas X, Y, Width, Height dessa área (em pixels do template PNG)

## 🌐 Migração para WordPress

### Passo 1: Copiar arquivos

Copie todo o conteúdo da pasta `flyers/` para o WordPress:

```bash
# No servidor WordPress
cd /home/sistemagigantes/public_html/
mkdir -p flyers-app
cp -r /caminho/local/flyers/* flyers-app/
```

Ou via FTP/SFTP, copie todos os arquivos mantendo a estrutura de pastas.

### Passo 2: Criar index.php (opcional)

Se quiser usar PHP apenas para servir os assets (sem processamento):

```php
<?php
// flyers-app/index.php
?>
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Gerador de Flyers - Sistemas Gigantes</title>
    <link rel="stylesheet" href="assets/css/main.css">
</head>
<body>
    <!-- Conteúdo do index.html aqui -->
    <script type="module" src="assets/js/app.js"></script>
</body>
</html>
```

Ou simplesmente renomeie `index.html` para `index.php`.

### Passo 3: Configurar .htaccess (opcional)

Crie/edite `.htaccess` na pasta `flyers-app/`:

```apache
# Serve arquivos estáticos
<FilesMatch "\.(html|css|js|png|jpg|jpeg|gif|svg)$">
    Header set Cache-Control "public, max-age=3600"
</FilesMatch>

# Permite CORS se necessário (para módulos ES6)
<IfModule mod_headers.c>
    Header set Access-Control-Allow-Origin "*"
</IfModule>
```

### Passo 4: Configurar Cloudflare (se aplicável)

No painel do Cloudflare, crie uma **Cache Rule** para bypass do cache em `/flyers-app/*` ou desative cache para usuários logados:

- **Rule**: `URI contains "/flyers-app"`
- **Action**: `Bypass Cache`

Ou configure via **Page Rules**:
- URL: `sistemagigantes.com/flyers-app/*`
- Setting: `Cache Level: Bypass`

### Passo 5: Testar

Acesse: `https://sistemagigantes.com/flyers-app/` (ou `/flyers-app/index.html`)

Verifique:
- ✅ Templates carregam corretamente
- ✅ Upload de foto funciona
- ✅ Drag & resize da label funciona
- ✅ Download JPG funciona
- ✅ Sem erros no console do navegador

## 🐛 Troubleshooting

### Templates não carregam

- Verifique se os arquivos PNG estão em `assets/templates/`
- Verifique o caminho no `template-map.js` (deve ser relativo ao `index.html`)
- Verifique o console do navegador (F12) para erros 404

### Foto não aparece ou máscara incorreta

- Verifique as coordenadas da máscara no `template-map.js`
- Verifique as dimensões do canvas base (devem corresponder ao PNG)
- Use um editor de imagem para confirmar as coordenadas da área da foto

### Label não aparece ou não move

- Verifique se o campo "Nome" está preenchido
- Verifique se o template tem `namePreset` configurado
- Verifique o console do navegador para erros JavaScript

### Download não funciona

- Verifique se o preview foi gerado antes
- Verifique se o canvas tem conteúdo (dimensões > 0)
- Verifique se há bloqueador de pop-ups no navegador

### CORS errors (Cross-Origin)

- Certifique-se de rodar via servidor HTTP (não `file://`)
- Se no WordPress, verifique headers CORS no `.htaccess`

## 📋 Checklist de Testes

### Funcionalidades Básicas
- [ ] Carregar página → Layout 2 colunas exibido
- [ ] Selecionar template OURO → Template carrega
- [ ] Upload de foto → Foto aparece no preview
- [ ] Ajustar zoom (+/-) → Foto escala corretamente
- [ ] Arrastar foto no canvas → Foto se move
- [ ] Digitar nome (máx. 37) → Converte para UPPERCASE
- [ ] Arrastar label → Movimento suave
- [ ] Redimensionar label (handle) → Font-size ajusta
- [ ] Atalhos teclado (setas, Ctrl/Cmd +/-) → Funcionam
- [ ] Trocar template → Preview atualiza
- [ ] Clicar "Baixar JPG" → Download funciona

### Validações Técnicas
- [ ] Máscara aplicada (foto não invade bordas)
- [ ] Nome renderizado na posição correta
- [ ] Canvas final com dimensões corretas
- [ ] JPG gerado com qualidade adequada
- [ ] Sem erros no console

### Compatibilidade
- [ ] Chrome/Edge (últimas versões)
- [ ] Firefox (última versão)
- [ ] Safari (última versão)
- [ ] Layout responsivo (mobile/tablet)
- [ ] Acessibilidade (teclado/foco)

## 📄 Licença

Uso interno - Sistemas Gigantes

## 🔄 Versão

v3.0.0 - Render local (html5 canvas)

---

**Desenvolvido para**: Sistemas Gigantes  
**Tecnologias**: HTML5, CSS3, JavaScript (ES6+), Canvas API

