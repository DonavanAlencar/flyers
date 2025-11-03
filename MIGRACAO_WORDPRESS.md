# Procedimento Técnico - Migração para WordPress

## 📋 Informações do Projeto

- **Projeto**: Gerador de Flyers Standalone
- **Origem**: `/home/donavan/projetos/flyers/`
- **Destino WordPress**: `sistemagigantes.com.br/flyers`
- **Servidor**: `/home/sistemagigantes/public_html/`
- **Tecnologias**: HTML/CSS/JS puro (ES6 modules)

---

## 🎯 Objetivo

Migrar a aplicação standalone de geração de flyers para o WordPress, disponibilizando-a em `https://sistemagigantes.com.br/flyers`.

---

## 📦 Pré-requisitos

- Acesso SSH ao servidor WordPress
- Acesso ao diretório `/home/sistemagigantes/public_html/`
- Permissões para criar diretórios e arquivos
- Backup completo do ambiente atual (recomendado)

---

## 🔄 Passo 1: Backup do Ambiente Atual

### 1.1. Criar Backup do Diretório Destino (se já existir)

```bash
# Conectar ao servidor WordPress via SSH
ssh sistemagigantes@[IP_DO_SERVIDOR]

# Criar diretório de backup com timestamp
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/home/sistemagigantes/backups/flyers_migration_${TIMESTAMP}"
mkdir -p "$BACKUP_DIR"

# Se o diretório flyers já existir, fazer backup
if [ -d "/home/sistemagigantes/public_html/flyers" ]; then
    cp -r /home/sistemagigantes/public_html/flyers "$BACKUP_DIR/"
    echo "Backup criado em: $BACKUP_DIR"
fi
```

### 1.2. Backup via cPanel (Alternativa)

Se tiver acesso ao cPanel:
1. Acesse "Gerenciador de Arquivos"
2. Navegue até `public_html/`
3. Se existir pasta `flyers`, compacte e baixe como backup

---

## 📂 Passo 2: Preparar Arquivos no Servidor Local (WSL)

### 2.1. Verificar Estrutura dos Arquivos

```bash
# No WSL, verificar estrutura
cd /home/donavan/projetos/flyers
ls -la
tree -L 3 || find . -type f | head -30
```

### 2.2. Criar Arquivo .htaccess para WordPress

Criar arquivo `.htaccess` na raiz do projeto flyers para otimizações:

```bash
cat > /home/donavan/projetos/flyers/.htaccess << 'EOF'
# Configurações para Gerador de Flyers
<IfModule mod_headers.c>
    # Cache para assets estáticos (1 hora)
    <FilesMatch "\.(css|js|png|jpg|jpeg|gif|svg|woff|woff2|ttf|eot)$">
        Header set Cache-Control "public, max-age=3600"
    </FilesMatch>
    
    # Sem cache para HTML (sempre buscar versão mais recente)
    <FilesMatch "\.(html|htm)$">
        Header set Cache-Control "no-cache, no-store, must-revalidate"
        Header set Pragma "no-cache"
        Header set Expires "0"
    </FilesMatch>
    
    # CORS para módulos ES6 (se necessário)
    Header set Access-Control-Allow-Origin "*"
    Header set Access-Control-Allow-Methods "GET, POST, OPTIONS"
</IfModule>

# Gzip compression para melhor performance
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/html text/plain text/xml text/css text/javascript application/javascript application/json
</IfModule>

# Proteção básica
<FilesMatch "\.(htaccess|htpasswd|ini|log|sh|sql)$">
    Order Allow,Deny
    Deny from all
</FilesMatch>
EOF
```

---

## 🚀 Passo 3: Transferir Arquivos para o Servidor

### 3.1. Método 1: Via SCP/SFTP (Recomendado)

#### No WSL/Linux:

```bash
# Compactar o projeto
cd /home/donavan/projetos
tar -czf flyers.tar.gz flyers/

# Transferir via SCP
scp flyers.tar.gz sistemagigantes@[IP_DO_SERVIDOR]:/tmp/

# Conectar ao servidor e extrair
ssh sistemagigantes@[IP_DO_SERVIDOR]
cd /tmp
tar -xzf flyers.tar.gz
```

#### No servidor WordPress:

```bash
# Criar diretório de destino
mkdir -p /home/sistemagigantes/public_html/flyers

# Copiar arquivos (ajustar caminho conforme necessário)
cp -r /tmp/flyers/* /home/sistemagigantes/public_html/flyers/

# Ajustar permissões
chmod -R 755 /home/sistemagigantes/public_html/flyers
find /home/sistemagigantes/public_html/flyers -type f -exec chmod 644 {} \;
find /home/sistemagigantes/public_html/flyers -type d -exec chmod 755 {} \;

# Limpar arquivo temporário
rm -f /tmp/flyers.tar.gz
```

### 3.2. Método 2: Via FTP/SFTP (FileZilla/WinSCP)

1. **Conectar via SFTP/FTP**:
   - Host: IP do servidor ou `sistemagigantes.com.br`
   - Usuário: `sistemagigantes`
   - Porta: 22 (SFTP) ou 21 (FTP)

2. **Navegar até**: `/home/sistemagigantes/public_html/`

3. **Criar pasta**: `flyers` (se não existir)

4. **Upload de arquivos**:
   - Upload de TODA a pasta `flyers` do WSL para `public_html/flyers/`
   - Manter estrutura de pastas:
     ```
     flyers/
     ├── index.html
     ├── .htaccess
     ├── assets/
     │   ├── css/
     │   ├── js/
     │   └── templates/
     └── README.md
     ```

### 3.3. Método 3: Via Git (Se o repositório estiver configurado)

```bash
# No servidor WordPress
cd /home/sistemagigantes/public_html/
git clone https://github.com/DonavanAlencar/flyers.git flyers
# Ou atualizar se já existe
cd flyers && git pull origin main
```

---

## ⚙️ Passo 4: Configurar no WordPress

### 4.1. Criar Página no WordPress (Opcional)

Se quiser que a aplicação seja acessível via página do WordPress:

1. **Acessar Admin WordPress**: `https://sistemagigantes.com.br/wp-admin`

2. **Criar Nova Página**:
   - Nome: "Gerador de Flyers" ou "Flyers"
   - Slug: `flyers` (ou deixar automático)
   - Template: Usar shortcode ou iframe (ver opções abaixo)

### 4.2. Opção A: Shortcode (Recomendado)

Criar MU-Plugin para redirecionar `/flyers` para a aplicação standalone:

```bash
# Criar arquivo MU-Plugin
cat > /home/sistemagigantes/public_html/wp-content/mu-plugins/wp-flyers-redirect.php << 'EOF'
<?php
/**
 * Plugin Name: Flyers App Redirect
 * Description: Redireciona /flyers para aplicação standalone
 * Version: 1.0.0
 * Author: Sistemas Gigantes
 */

// Hook para interceptar requisições a /flyers
add_action('init', function() {
    $request_uri = $_SERVER['REQUEST_URI'];
    
    // Verifica se a requisição é para /flyers (com ou sem barra)
    if (preg_match('#^/flyers/?$#', $request_uri)) {
        $flyers_path = ABSPATH . 'flyers/index.html';
        
        // Se o arquivo existe, serve diretamente
        if (file_exists($flyers_path)) {
            // Limpa qualquer output anterior
            if (ob_get_level()) {
                ob_end_clean();
            }
            
            // Define headers apropriados
            header('Content-Type: text/html; charset=UTF-8');
            header('Cache-Control: no-cache, must-revalidate');
            
            // Serve o arquivo
            readfile($flyers_path);
            exit;
        }
    }
}, 1);
EOF

# Ajustar permissões
chmod 644 /home/sistemagigantes/public_html/wp-content/mu-plugins/wp-flyers-redirect.php
```

### 4.3. Opção B: Rewrite Rules (Alternativa)

Editar `.htaccess` do WordPress (em `public_html/.htaccess`):

```apache
# Adicionar ANTES da seção # BEGIN WordPress

# Redirecionar /flyers para aplicação standalone
RewriteEngine On
RewriteBase /
RewriteRule ^flyers/?$ /flyers/index.html [L]
RewriteRule ^flyers/(.+)$ /flyers/$1 [L]

# BEGIN WordPress
```

**⚠️ ATENÇÃO**: Fazer backup do `.htaccess` antes de editar!

```bash
cp /home/sistemagigantes/public_html/.htaccess /home/sistemagigantes/public_html/.htaccess.backup-$(date +%Y%m%d)
```

---

## 🌐 Passo 5: Configurar Cloudflare (Se Aplicável)

Se o site usa Cloudflare, configurar regras de cache:

### 5.1. Cache Rule para `/flyers/*`

1. Acesse **Cloudflare Dashboard** → **Rules** → **Cache Rules**

2. **Criar Nova Regra**:
   - **Nome**: `Flyers App - Bypass Cache`
   - **When**: `URI starts with "/flyers"`
   - **Then**: `Cache Level: Bypass`

### 5.2. Page Rules (Alternativa)

1. Acesse **Cloudflare Dashboard** → **Rules** → **Page Rules**

2. **Criar Regra**:
   - URL: `sistemagigantes.com.br/flyers*`
   - Settings:
     - Cache Level: Bypass
     - Browser Cache TTL: Respect Existing Headers

---

## ✅ Passo 6: Validações e Testes

### 6.1. Verificar Estrutura de Arquivos

```bash
# No servidor WordPress
cd /home/sistemagigantes/public_html/flyers
ls -la
tree -L 3 || find . -maxdepth 3 -type f | head -20

# Verificar se templates estão presentes
ls -lh assets/templates/ | wc -l  # Deve mostrar 16 ou mais arquivos
```

### 6.2. Verificar Permissões

```bash
# Verificar permissões
find /home/sistemagigantes/public_html/flyers -type f -not -perm 644
find /home/sistemagigantes/public_html/flyers -type d -not -perm 755

# Corrigir se necessário
chmod -R 755 /home/sistemagigantes/public_html/flyers
find /home/sistemagigantes/public_html/flyers -type f -exec chmod 644 {} \;
```

### 6.3. Testar Acesso

1. **Acessar URL**: `https://sistemagigantes.com.br/flyers`

2. **Verificar Console do Navegador** (F12):
   - Abrir aba "Console"
   - Verificar erros 404 ou CORS
   - Verificar se módulos ES6 carregam corretamente

3. **Testar Funcionalidades**:
   - [ ] Template carrega corretamente
   - [ ] Upload de foto funciona
   - [ ] Drag & drop da label funciona
   - [ ] Download JPG funciona
   - [ ] Sem erros no console

### 6.4. Verificar Logs (Se houver problemas)

```bash
# Verificar logs do Apache/Nginx
tail -f /var/log/apache2/error.log
# Ou
tail -f /var/log/nginx/error.log

# Verificar logs do WordPress
tail -f /home/sistemagigantes/public_html/wp-content/debug.log
```

---

## 🔧 Passo 7: Ajustes Finais

### 7.1. Ajustar Caminhos Relativos (Se Necessário)

Se houver problemas com caminhos, verificar se os imports em `assets/js/app.js` estão corretos:

```javascript
// Devem ser relativos, exemplo:
import TemplateEngine from './template-engine.js';
```

### 7.2. Verificar HTTPS/SSL

Se o site usa HTTPS (recomendado), verificar se:
- Certificado SSL está válido
- Recursos carregam via HTTPS (sem mixed content)

### 7.3. Otimização de Performance

```bash
# Verificar tamanho dos templates
du -sh /home/sistemagigantes/public_html/flyers/assets/templates/

# Se necessário, otimizar imagens (ferramentas externas)
# Exemplo com ImageMagick:
# convert assets/templates/OURO.png -quality 85 -strip assets/templates/OURO.png
```

---

## 🐛 Troubleshooting

### Problema: Erro 404 ao acessar `/flyers`

**Solução**:
1. Verificar se pasta existe: `ls -la /home/sistemagigantes/public_html/flyers/`
2. Verificar permissões: `chmod -R 755 /home/sistemagigantes/public_html/flyers`
3. Verificar `.htaccess` do WordPress (pode estar bloqueando)

### Problema: Módulos ES6 não carregam (erro CORS ou 404)

**Solução**:
1. Verificar se arquivos JS estão em `assets/js/`
2. Verificar se `.htaccess` tem headers CORS
3. Verificar console do navegador para erros específicos

### Problema: Templates não carregam

**Solução**:
1. Verificar se PNGs estão em `assets/templates/`
2. Verificar permissões dos arquivos: `chmod 644 assets/templates/*.png`
3. Verificar console do navegador (Network tab) para ver qual template está falhando

### Problema: Cache do Cloudflare

**Solução**:
1. Criar regra de bypass para `/flyers/*` (ver Passo 5)
2. Fazer Purge Cache no Cloudflare: Dashboard → Caching → Purge Everything
3. Ou usar versionamento nos arquivos JS (já implementado: `?v=2.0.1`)

### Problema: Conflito com plugins WordPress

**Solução**:
1. Desativar plugins de cache temporariamente para testar
2. Se necessário, adicionar exceção no plugin de cache para `/flyers/*`

---

## 📋 Checklist de Migração

- [ ] Backup do ambiente atual criado
- [ ] Arquivos transferidos para servidor WordPress
- [ ] Estrutura de pastas verificada
- [ ] Permissões configuradas corretamente
- [ ] Arquivo `.htaccess` criado em `/flyers/`
- [ ] MU-Plugin de redirecionamento criado (se usar Opção A)
- [ ] Rewrite rules configuradas no `.htaccess` do WordPress (se usar Opção B)
- [ ] Regras do Cloudflare configuradas (se aplicável)
- [ ] Acesso via `https://sistemagigantes.com.br/flyers` testado
- [ ] Console do navegador verificado (sem erros)
- [ ] Funcionalidades testadas:
  - [ ] Upload de foto
  - [ ] Edição de label
  - [ ] Download JPG
  - [ ] Todos os templates carregam

---

## 🔄 Rollback (Em caso de problemas)

Se necessário reverter a migração:

```bash
# Restaurar backup
TIMESTAMP="[DATA_DO_BACKUP]"  # Exemplo: 20250102_143000
BACKUP_DIR="/home/sistemagigantes/backups/flyers_migration_${TIMESTAMP}"

if [ -d "$BACKUP_DIR" ]; then
    rm -rf /home/sistemagigantes/public_html/flyers
    cp -r "$BACKUP_DIR/flyers" /home/sistemagigantes/public_html/
    echo "Rollback concluído"
else
    echo "Backup não encontrado: $BACKUP_DIR"
fi
```

---

## 📞 Suporte

- **Documentação**: Ver `README.md` no projeto
- **Repositório**: https://github.com/DonavanAlencar/flyers
- **Versão**: v3.0.0 - Render local (html5 canvas)

---

## 📝 Notas Importantes

1. **Não há PHP envolvido**: A aplicação é 100% client-side (HTML/CSS/JS)

2. **Sem banco de dados**: Não é necessário criar tabelas ou configurações no MySQL

3. **Performance**: Os templates PNG podem ser grandes (2MB+ total), considerar CDN no futuro se necessário

4. **Segurança**: A aplicação roda no cliente, não processa dados sensíveis no servidor

5. **Atualizações futuras**: Para atualizar, basta substituir os arquivos na pasta `/flyers/`

---

**Última atualização**: 2025-01-02  
**Versão do documento**: 1.0.0

