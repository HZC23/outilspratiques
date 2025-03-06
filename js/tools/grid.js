import { Utils } from '../utils.js';

/**
 * Gestionnaire du générateur de grilles
 */
export const GridManager = {
    state: {
        type: 'table', // table | calendar | schedule | checklist | kanban
        options: {
            rows: 5,
            columns: 5,
            cellWidth: 100,
            cellHeight: 50,
            headerRow: true,
            headerColumn: false,
            borders: true,
            alternateColors: false,
            responsive: true,
            format: 'html' // html | markdown | csv
        },
        data: [],
        history: []
    },

    // Configuration des types de grilles
    types: {
        table: {
            name: 'Tableau',
            description: 'Tableau simple avec en-têtes optionnels',
            defaultData: (rows, cols) => {
                const data = [];
                for (let i = 0; i < rows; i++) {
                    const row = [];
                    for (let j = 0; j < cols; j++) {
                        row.push(i === 0 ? `Colonne ${j + 1}` : '');
                    }
                    data.push(row);
                }
                return data;
            }
        },
        calendar: {
            name: 'Calendrier',
            description: 'Calendrier mensuel avec jours de la semaine',
            defaultData: () => {
                const now = new Date();
                const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
                const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
                const startOffset = firstDay.getDay();
                const days = lastDay.getDate();
                
                const data = [
                    ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']
                ];

                let week = Array(7).fill('');
                let dayCount = 1;

                // Remplit les jours du mois
                for (let i = startOffset; i < days + startOffset; i++) {
                    week[i % 7] = dayCount.toString();
                    if (i % 7 === 6 || dayCount === days) {
                        data.push([...week]);
                        week = Array(7).fill('');
                    }
                    dayCount++;
                }

                return data;
            }
        },
        schedule: {
            name: 'Planning',
            description: 'Planning hebdomadaire avec heures',
            defaultData: () => {
                const hours = [];
                for (let i = 8; i <= 18; i++) {
                    hours.push(`${i}:00`);
                }

                const data = [
                    ['Heure', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi']
                ];

                hours.forEach(hour => {
                    data.push([hour, '', '', '', '', '']);
                });

                return data;
            }
        },
        checklist: {
            name: 'Liste de contrôle',
            description: 'Liste de tâches avec cases à cocher',
            defaultData: (rows) => {
                const data = [
                    ['☐', 'Tâche', 'Priorité', 'État']
                ];

                for (let i = 1; i < rows; i++) {
                    data.push(['☐', '', 'Normale', 'À faire']);
                }

                return data;
            }
        },
        kanban: {
            name: 'Kanban',
            description: 'Tableau Kanban avec colonnes de progression',
            defaultData: () => {
                return [
                    ['À faire', 'En cours', 'Terminé'],
                    ['Tâche 1', '', ''],
                    ['Tâche 2', '', ''],
                    ['Tâche 3', '', ''],
                    ['Tâche 4', '', '']
                ];
            }
        }
    },

    /**
     * Initialise le générateur
     */
    init() {
        this.loadState();
        this.setupListeners();
        this.generate();
    },

    /**
     * Charge l'état sauvegardé
     */
    loadState() {
        const savedState = Utils.loadFromStorage('gridState', {
            type: 'table',
            options: this.state.options,
            history: []
        });

        this.state = { ...this.state, ...savedState };
    },

    /**
     * Configure les écouteurs d'événements
     */
    setupListeners() {
        // Type de grille
        document.getElementById('gridType')?.addEventListener('change', (e) => {
            this.updateType(e.target.value);
        });

        // Dimensions
        document.getElementById('gridRows')?.addEventListener('input', (e) => {
            this.updateOption('rows', parseInt(e.target.value, 10));
        });

        document.getElementById('gridColumns')?.addEventListener('input', (e) => {
            this.updateOption('columns', parseInt(e.target.value, 10));
        });

        // Options d'affichage
        document.getElementById('gridCellWidth')?.addEventListener('input', (e) => {
            this.updateOption('cellWidth', parseInt(e.target.value, 10));
        });

        document.getElementById('gridCellHeight')?.addEventListener('input', (e) => {
            this.updateOption('cellHeight', parseInt(e.target.value, 10));
        });

        document.getElementById('gridHeaderRow')?.addEventListener('change', (e) => {
            this.updateOption('headerRow', e.target.checked);
        });

        document.getElementById('gridHeaderColumn')?.addEventListener('change', (e) => {
            this.updateOption('headerColumn', e.target.checked);
        });

        document.getElementById('gridBorders')?.addEventListener('change', (e) => {
            this.updateOption('borders', e.target.checked);
        });

        document.getElementById('gridAlternateColors')?.addEventListener('change', (e) => {
            this.updateOption('alternateColors', e.target.checked);
        });

        document.getElementById('gridResponsive')?.addEventListener('change', (e) => {
            this.updateOption('responsive', e.target.checked);
        });

        // Format de sortie
        document.getElementById('gridFormat')?.addEventListener('change', (e) => {
            this.updateOption('format', e.target.value);
        });

        // Boutons d'action
        document.getElementById('generateGrid')?.addEventListener('click', () => {
            this.generate();
        });

        document.getElementById('copyGrid')?.addEventListener('click', () => {
            this.copyGrid();
        });

        // Édition des cellules
        document.getElementById('gridOutput')?.addEventListener('input', (e) => {
            if (e.target.tagName === 'TD') {
                const row = e.target.parentElement.rowIndex;
                const col = e.target.cellIndex;
                this.updateCell(row, col, e.target.textContent);
            }
        });

        // Raccourcis clavier
        document.addEventListener('keydown', (e) => {
            if (!this.isGridGeneratorVisible()) return;

            if (e.ctrlKey && e.key === 'Enter') {
                e.preventDefault();
                this.generate();
            }
        });
    },

    /**
     * Vérifie si le générateur est visible
     */
    isGridGeneratorVisible() {
        const generator = document.getElementById('gridTool');
        return generator?.style.display !== 'none';
    },

    /**
     * Met à jour le type de grille
     */
    updateType(type) {
        if (!this.types[type]) return;

        this.state.type = type;
        this.generate();
        this.saveState();
    },

    /**
     * Met à jour une option
     */
    updateOption(option, value) {
        this.state.options[option] = value;
        this.generate();
        this.saveState();
    },

    /**
     * Met à jour une cellule
     */
    updateCell(row, col, value) {
        if (!this.state.data[row] || !this.state.data[row][col]) return;
        
        this.state.data[row][col] = value;
        this.saveState();
    },

    /**
     * Génère la grille
     */
    generate() {
        // Initialise les données selon le type
        const type = this.types[this.state.type];
        this.state.data = type.defaultData(
            this.state.options.rows,
            this.state.options.columns
        );

        // Génère le HTML
        let html = '';
        const classes = [
            'grid-table',
            this.state.options.borders ? 'with-borders' : '',
            this.state.options.alternateColors ? 'alternate-colors' : '',
            this.state.options.responsive ? 'responsive' : ''
        ].filter(Boolean).join(' ');

        html = `<table class="${classes}" style="min-width: ${this.state.options.cellWidth * this.state.options.columns}px">`;

        this.state.data.forEach((row, i) => {
            const isHeader = (i === 0 && this.state.options.headerRow);
            html += '<tr>';
            row.forEach((cell, j) => {
                const isHeaderCell = isHeader || (j === 0 && this.state.options.headerColumn);
                const tag = isHeaderCell ? 'th' : 'td';
                const style = `min-width: ${this.state.options.cellWidth}px; height: ${this.state.options.cellHeight}px`;
                html += `<${tag} style="${style}" contenteditable="true">${cell}</${tag}>`;
            });
            html += '</tr>';
        });

        html += '</table>';

        // Met à jour l'affichage
        this.updateDisplay(html);

        // Ajoute à l'historique
        this.addToHistory();
    },

    /**
     * Copie la grille dans le format choisi
     */
    copyGrid() {
        let output = '';

        switch (this.state.options.format) {
            case 'html':
                output = document.getElementById('gridOutput')?.innerHTML || '';
                break;

            case 'markdown':
                output = this.toMarkdown();
                break;

            case 'csv':
                output = this.toCsv();
                break;
        }

        if (!output) return;

        Utils.copyToClipboard(output)
            .then(() => Utils.showNotification('Grille copiée !', 'success'))
            .catch(() => Utils.showNotification('Erreur lors de la copie', 'error'));
    },

    /**
     * Convertit la grille en Markdown
     */
    toMarkdown() {
        let markdown = '';
        
        this.state.data.forEach((row, i) => {
            markdown += '| ' + row.join(' | ') + ' |\n';
            
            if (i === 0 && this.state.options.headerRow) {
                markdown += '| ' + row.map(() => '---').join(' | ') + ' |\n';
            }
        });

        return markdown;
    },

    /**
     * Convertit la grille en CSV
     */
    toCsv() {
        return this.state.data
            .map(row => row
                .map(cell => {
                    cell = cell.replace(/"/g, '""');
                    return /[,"\n]/.test(cell) ? `"${cell}"` : cell;
                })
                .join(',')
            )
            .join('\n');
    },

    /**
     * Ajoute la grille à l'historique
     */
    addToHistory() {
        this.state.history.unshift({
            type: this.state.type,
            data: JSON.parse(JSON.stringify(this.state.data)),
            timestamp: new Date().toISOString()
        });

        // Limite la taille de l'historique
        if (this.state.history.length > 10) {
            this.state.history.pop();
        }

        this.updateHistoryDisplay();
        this.saveState();
    },

    /**
     * Met à jour l'affichage
     */
    updateDisplay(html) {
        const output = document.getElementById('gridOutput');
        if (output) {
            output.innerHTML = html;
        }
    },

    /**
     * Met à jour l'affichage de l'historique
     */
    updateHistoryDisplay() {
        const container = document.getElementById('gridHistory');
        if (!container) return;

        container.innerHTML = this.state.history
            .map(entry => `
                <div class="history-item" onclick="gridManager.useHistoryEntry(${this.state.history.indexOf(entry)})">
                    <div class="history-preview">
                        <table class="mini-grid">
                            ${entry.data.slice(0, 3).map(row => `
                                <tr>
                                    ${row.slice(0, 3).map(cell => `
                                        <td>${cell}</td>
                                    `).join('')}
                                </tr>
                            `).join('')}
                        </table>
                    </div>
                    <div class="history-meta">
                        <span class="history-type">
                            ${this.types[entry.type].name}
                        </span>
                        <span class="history-date">
                            ${new Date(entry.timestamp).toLocaleString('fr-FR')}
                        </span>
                    </div>
                </div>
            `)
            .join('');
    },

    /**
     * Utilise une entrée de l'historique
     */
    useHistoryEntry(index) {
        const entry = this.state.history[index];
        if (!entry) return;

        this.state.type = entry.type;
        this.state.data = JSON.parse(JSON.stringify(entry.data));
        
        // Met à jour les champs
        const typeSelect = document.getElementById('gridType');
        if (typeSelect) typeSelect.value = entry.type;

        this.generate();
    },

    /**
     * Sauvegarde l'état
     */
    saveState() {
        Utils.saveToStorage('gridState', {
            type: this.state.type,
            options: this.state.options,
            history: this.state.history
        });
    },

    /**
     * Nettoie les ressources
     */
    destroy() {
        this.saveState();
    }
}; 