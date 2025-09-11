const fs = require('fs');
const path = require('path');

class ApiDocGenerator {
    constructor(routesPath) {
        this.routesPath = routesPath;
        this.routes = [];
    }

    // Scanner les fichiers de routes et extraire les informations
    scanRoutes() {
        this.routes = [];
        const apiPath = path.join(this.routesPath, 'api');

        if (!fs.existsSync(apiPath)) {
            return this.routes;
        }

        const routeFiles = fs.readdirSync(apiPath).filter(file => file.endsWith('.js'));

        routeFiles.forEach(file => {
            const filePath = path.join(apiPath, file);
            const method = path.basename(file, '.js').toUpperCase();

            try {
                const content = fs.readFileSync(filePath, 'utf8');
                const routeInfo = this.parseRouteFile(content, method);

                if (routeInfo.length > 0) {
                    this.routes.push(...routeInfo);
                }
            } catch (error) {
                console.warn(`Erreur lors de la lecture de ${file}:`, error.message);
            }
        });

        return this.routes;
    }

    // Parser un fichier de route pour extraire les informations
    parseRouteFile(content, defaultMethod) {
        const routes = [];

        // Si le fichier est vide ou ne contient pas de routes, on retourne vide
        if (!content.trim() || !content.includes('router.')) {
            return routes;
        }

        // Regex pour capturer les définitions de routes
        const routeRegex = /router\.(get|post|put|delete|patch)\s*\(\s*['"`]([^'"`]+)['"`]\s*,/gi;
        let match;

        while ((match = routeRegex.exec(content)) !== null) {
            const method = match[1].toUpperCase();
            const path = match[2];

            // Extraire les paramètres du body si c'est une route POST/PUT/PATCH
            const bodyParams = this.extractBodyParams(content, path);
            const pathParams = this.extractPathParams(path);

            routes.push({
                method,
                path,
                fullPath: `/api${path}`,
                bodyParams,
                pathParams,
                description: this.generateDescription(method, path)
            });
        }

        return routes;
    }

    // Extraire les paramètres du body depuis le destructuring
    extractBodyParams(content, routePath) {
        const params = [];

        // Chercher les destructuring du req.body
        const bodyRegex = /const\s*{\s*([^}]+)\s*}\s*=\s*req\.body/g;
        let match;

        while ((match = bodyRegex.exec(content)) !== null) {
            const paramStr = match[1];
            const paramNames = paramStr.split(',').map(p => p.trim().replace(/\s*:\s*\w+/g, ''));

            paramNames.forEach(param => {
                if (param && !params.find(p => p.name === param)) {
                    params.push({
                        name: param,
                        type: 'string',
                        required: true // On peut améliorer ça plus tard
                    });
                }
            });
        }

        return params;
    }

    // Extraire les paramètres d'URL
    extractPathParams(path) {
        const params = [];
        const paramRegex = /:(\w+)/g;
        let match;

        while ((match = paramRegex.exec(path)) !== null) {
            params.push({
                name: match[1],
                type: 'string',
                required: true
            });
        }

        return params;
    }

    // Générer une description automatique
    generateDescription(method, path) {
        const resourceMatch = path.match(/\/(\w+)/);
        const resource = resourceMatch ? resourceMatch[1] : 'ressource';

        switch (method) {
            case 'POST':
                return `Créer un(e) nouveau/nouvelle ${resource}`;
            case 'GET':
                if (path.includes(':id')) {
                    return `Récupérer un(e) ${resource} par ID`;
                }
                return `Récupérer tous les ${resource}s`;
            case 'PUT':
                return `Modifier un(e) ${resource} existant(e)`;
            case 'PATCH':
                return `Mettre à jour partiellement un(e) ${resource}`;
            case 'DELETE':
                return `Supprimer un(e) ${resource}`;
            default:
                return `Opération ${method} sur ${resource}`;
        }
    }

    // Générer le HTML de documentation
    generateHTML() {
        const routes = this.scanRoutes();

        return `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SushiCore API Documentation</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #f8f9fa;
            line-height: 1.6;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
        }
        
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 2rem;
            border-radius: 12px;
            margin-bottom: 2rem;
            text-align: center;
        }
        
        .header h1 {
            font-size: 2.5rem;
            margin-bottom: 0.5rem;
        }
        
        .header p {
            opacity: 0.9;
            font-size: 1.1rem;
        }

        .stats {
            background: rgba(255,255,255,0.1);
            padding: 1rem;
            border-radius: 8px;
            margin-top: 1rem;
        }
        
        .endpoint-section {
            background: white;
            border-radius: 12px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            margin-bottom: 1.5rem;
            overflow: hidden;
        }
        
        .endpoint-header {
            padding: 1rem 1.5rem;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: space-between;
            border-bottom: 1px solid #eee;
        }
        
        .endpoint-header:hover {
            background: #f8f9fa;
        }
        
        .method {
            padding: 0.3rem 0.8rem;
            border-radius: 6px;
            font-weight: bold;
            font-size: 0.85rem;
            text-transform: uppercase;
            min-width: 70px;
            text-align: center;
        }
        
        .method.post { background: #28a745; color: white; }
        .method.get { background: #007bff; color: white; }
        .method.put { background: #ffc107; color: black; }
        .method.patch { background: #17a2b8; color: white; }
        .method.delete { background: #dc3545; color: white; }
        
        .endpoint-path {
            font-family: 'Courier New', monospace;
            font-weight: bold;
            margin-left: 1rem;
        }
        
        .endpoint-content {
            padding: 1.5rem;
            display: none;
        }
        
        .endpoint-content.active {
            display: block;
        }
        
        .form-group {
            margin-bottom: 1rem;
        }
        
        .form-group label {
            display: block;
            margin-bottom: 0.5rem;
            font-weight: 500;
            color: #333;
        }
        
        .form-group input,
        .form-group textarea {
            width: 100%;
            padding: 0.75rem;
            border: 2px solid #e9ecef;
            border-radius: 8px;
            font-size: 1rem;
            transition: border-color 0.3s;
        }
        
        .form-group input:focus,
        .form-group textarea:focus {
            outline: none;
            border-color: #667eea;
        }
        
        .form-group textarea {
            min-height: 120px;
            font-family: 'Courier New', monospace;
        }
        
        .btn {
            background: #667eea;
            color: white;
            border: none;
            padding: 0.75rem 1.5rem;
            border-radius: 8px;
            cursor: pointer;
            font-size: 1rem;
            font-weight: 500;
            transition: background 0.3s;
        }
        
        .btn:hover {
            background: #5a6fd8;
        }
        
        .btn:disabled {
            background: #ccc;
            cursor: not-allowed;
        }
        
        .btn.delete {
            background: #dc3545;
        }
        
        .btn.delete:hover {
            background: #c82333;
        }
        
        .response {
            margin-top: 1.5rem;
            padding: 1rem;
            background: #f8f9fa;
            border-radius: 8px;
            border-left: 4px solid #667eea;
        }
        
        .response h4 {
            margin-bottom: 0.5rem;
            color: #333;
        }
        
        .response-status {
            display: inline-block;
            padding: 0.2rem 0.5rem;
            border-radius: 4px;
            font-size: 0.85rem;
            font-weight: bold;
            margin-bottom: 0.5rem;
        }
        
        .status-success {
            background: #d4edda;
            color: #155724;
        }
        
        .status-error {
            background: #f8d7da;
            color: #721c24;
        }
        
        .response-body {
            background: #2d3748;
            color: #e2e8f0;
            padding: 1rem;
            border-radius: 6px;
            font-family: 'Courier New', monospace;
            font-size: 0.9rem;
            white-space: pre-wrap;
            overflow-x: auto;
        }
        
        .loading {
            display: none;
            color: #667eea;
            font-style: italic;
        }
        
        .arrow {
            transition: transform 0.3s;
        }
        
        .arrow.rotated {
            transform: rotate(180deg);
        }
        
        .description {
            color: #666;
            font-style: italic;
            margin-left: auto;
            margin-right: 1rem;
        }

        .refresh-btn {
            background: #28a745;
            color: white;
            border: none;
            padding: 0.5rem 1rem;
            border-radius: 6px;
            cursor: pointer;
            font-size: 0.9rem;
            margin-left: 1rem;
        }

        .refresh-btn:hover {
            background: #218838;
        }

        .no-routes {
            text-align: center;
            padding: 3rem;
            color: #666;
        }

        .params-info {
            background: #f8f9fa;
            padding: 1rem;
            border-radius: 6px;
            margin-bottom: 1rem;
            border-left: 3px solid #007bff;
        }

        .param-item {
            margin-bottom: 0.5rem;
        }

        .param-name {
            font-family: 'Courier New', monospace;
            background: #e9ecef;
            padding: 0.2rem 0.4rem;
            border-radius: 3px;
            font-weight: bold;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🍣 SushiCore API</h1>
            <p>Documentation générée automatiquement</p>
            <div class="stats">
                📡 <strong>${routes.length}</strong> routes détectées
                <button class="refresh-btn" onclick="location.reload()">🔄 Actualiser</button>
            </div>
        </div>
        
        ${routes.length === 0 ? this.generateNoRoutesHTML() : routes.map((route, index) => this.generateRouteHTML(route, index)).join('')}
    </div>
    
    <script>
        function toggleEndpoint(endpointId) {
            const content = document.getElementById(\`content-\${endpointId}\`);
            const arrow = document.getElementById(\`arrow-\${endpointId}\`);
            
            content.classList.toggle('active');
            arrow.classList.toggle('rotated');
        }
        
        async function makeRequest(event, method, path, endpointId) {
            event.preventDefault();
            
            const form = event.target;
            const responseDiv = document.getElementById(\`response-\${endpointId}\`);
            const btnText = form.querySelector('.btn-text');
            const loading = form.querySelector('.loading');
            const btn = form.querySelector('.btn');
            
            // Show loading state
            btnText.style.display = 'none';
            loading.style.display = 'inline';
            btn.disabled = true;
            
            try {
                const formData = new FormData(form);
                const data = {};
                
                // Convert FormData to regular object, excluding empty values
                for (let [key, value] of formData.entries()) {
                    if (value.trim() !== '') {
                        data[key] = value;
                    }
                }
                
                // Replace path parameters
                let finalPath = path;
                Object.keys(data).forEach(key => {
                    if (finalPath.includes(\`:\${key}\`)) {
                        finalPath = finalPath.replace(\`:\${key}\`, data[key]);
                        delete data[key];
                    }
                });
                
                const options = {
                    method: method,
                    headers: {
                        'Content-Type': 'application/json',
                    }
                };
                
                if (method !== 'GET' && method !== 'DELETE' && Object.keys(data).length > 0) {
                    options.body = JSON.stringify(data);
                }
                
                const response = await fetch(finalPath, options);
                const result = await response.text();
                
                let parsedResult;
                try {
                    parsedResult = JSON.parse(result);
                } catch {
                    parsedResult = result;
                }
                
                displayResponse(responseDiv, response.status, parsedResult);
                
            } catch (error) {
                displayResponse(responseDiv, 0, {
                    error: 'Erreur de connexion',
                    message: error.message,
                    details: 'Assurez-vous que votre serveur est en cours d\\'exécution sur le bon port.'
                });
            } finally {
                // Reset loading state
                btnText.style.display = 'inline';
                loading.style.display = 'none';
                btn.disabled = false;
            }
        }
        
        function displayResponse(responseDiv, status, data) {
            const isSuccess = status >= 200 && status < 300;
            const statusClass = isSuccess ? 'status-success' : 'status-error';
            
            responseDiv.innerHTML = \`
                <div class="response">
                    <h4>Réponse</h4>
                    <div class="response-status \${statusClass}">
                        \${status === 0 ? 'Erreur de connexion' : \`HTTP \${status}\`}
                    </div>
                    <div class="response-body">\${JSON.stringify(data, null, 2)}</div>
                </div>
            \`;
        }
        
        // Auto-expand the first endpoint on load
        document.addEventListener('DOMContentLoaded', function() {
            const firstEndpoint = document.querySelector('[id^="content-"]');
            if (firstEndpoint) {
                const id = firstEndpoint.id.replace('content-', '');
                toggleEndpoint(id);
            }
        });
    </script>
</body>
</html>`;
    }

    generateNoRoutesHTML() {
        return `
            <div class="no-routes">
                <h3>🔍 Aucune route détectée</h3>
                <p>Créez vos fichiers de routes dans <code>core/routes/api/</code></p>
                <p>Exemple: <code>POST.js</code>, <code>GET.js</code>, etc.</p>
            </div>
        `;
    }

    generateRouteHTML(route, index) {
        const endpointId = `${route.method.toLowerCase()}-${index}`;
        const hasPathParams = route.pathParams.length > 0;
        const hasBodyParams = route.bodyParams.length > 0;

        return `
        <div class="endpoint-section">
            <div class="endpoint-header" onclick="toggleEndpoint('${endpointId}')">
                <div style="display: flex; align-items: center;">
                    <span class="method ${route.method.toLowerCase()}">${route.method}</span>
                    <span class="endpoint-path">${route.fullPath}</span>
                </div>
                <span class="description">${route.description}</span>
                <span class="arrow" id="arrow-${endpointId}">▼</span>
            </div>
            <div class="endpoint-content" id="content-${endpointId}">
                <form onsubmit="makeRequest(event, '${route.method}', '${route.fullPath}', '${endpointId}')">
                    
                    ${hasPathParams ? `
                    <div class="params-info">
                        <h4>📋 Paramètres d'URL requis</h4>
                        ${route.pathParams.map(param => `
                            <div class="param-item">
                                <span class="param-name">${param.name}</span> - ${param.type}
                            </div>
                        `).join('')}
                    </div>
                    ` : ''}
                    
                    ${route.pathParams.map(param => `
                        <div class="form-group">
                            <label for="${endpointId}-${param.name}">${param.name} *</label>
                            <input type="text" id="${endpointId}-${param.name}" name="${param.name}" required placeholder="Ex: 60f1b2b3c8d4a5b6c7d8e9f0">
                        </div>
                    `).join('')}
                    
                    ${hasBodyParams ? `
                    <div class="params-info">
                        <h4>📝 Paramètres du body</h4>
                        ${route.bodyParams.map(param => `
                            <div class="param-item">
                                <span class="param-name">${param.name}</span> - ${param.type} ${param.required ? '(requis)' : '(optionnel)'}
                            </div>
                        `).join('')}
                    </div>
                    ` : ''}
                    
                    ${route.bodyParams.map(param => `
                        <div class="form-group">
                            <label for="${endpointId}-${param.name}">${param.name} ${param.required ? '*' : ''}</label>
                            ${param.name.includes('content') ?
                `<textarea id="${endpointId}-${param.name}" name="${param.name}" ${param.required ? 'required' : ''} placeholder="Ex: ${this.getPlaceholder(param.name)}"></textarea>` :
                `<input type="text" id="${endpointId}-${param.name}" name="${param.name}" ${param.required ? 'required' : ''} placeholder="Ex: ${this.getPlaceholder(param.name)}">`
            }
                        </div>
                    `).join('')}
                    
                    <button type="submit" class="btn ${route.method === 'DELETE' ? 'delete' : ''}">
                        <span class="btn-text">${this.getButtonText(route.method)} ${route.method === 'DELETE' ? '⚠️' : ''}</span>
                        <span class="loading">Traitement en cours...</span>
                    </button>
                </form>
                
                <div id="response-${endpointId}"></div>
            </div>
        </div>`;
    }

    getPlaceholder(paramName) {
        const placeholders = {
            'title': 'Ma première note',
            'tag': 'personnel, travail, idée',
            'content': 'Contenu de votre note...',
            'name': 'Mon nom',
            'email': 'exemple@email.com',
            'id': '60f1b2b3c8d4a5b6c7d8e9f0'
        };
        return placeholders[paramName.toLowerCase()] || `Valeur pour ${paramName}`;
    }

    getButtonText(method) {
        const texts = {
            'POST': 'Créer',
            'GET': 'Récupérer',
            'PUT': 'Modifier',
            'PATCH': 'Mettre à jour',
            'DELETE': 'Supprimer'
        };
        return texts[method] || 'Exécuter';
    }
}

module.exports = ApiDocGenerator;
