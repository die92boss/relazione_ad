const inputField = document.getElementById('cmd-input');
const outputDiv = document.getElementById('output');
const promptSpan = document.querySelector('.prompt');

let currentPath = 'C:\\Relazione';

const filesystem = {
    'C:\\': ['Relazione', 'Users', 'Windows', 'Program Files'],
    'C:\\Relazione': ['index.html', 'style.css', 'script.js', 'images'],
    'C:\\Relazione\\images': ['esxi_architecture.png', 'add_roles.png', 'create_user.png'],
    'C:\\Users': ['Utente'],
    'C:\\Users\\Utente': ['Desktop', 'Documents', 'Downloads'],
    'C:\\Users\\Utente\\Desktop': ['relazione_AD'],
    'C:\\Windows': ['System32', 'SysWOW64'],
    'C:\\Windows\\System32': [],
    'C:\\Windows\\SysWOW64': [],
    'C:\\Program Files': ['VMware', 'Windows Server'],
    'C:\\Program Files\\VMware': ['VMware Tools'],
    'C:\\Program Files\\Windows Server': [],
};

const dirEntries = new Set([
    'Relazione', 'Users', 'Windows', 'Program Files', 'images',
    'Utente', 'Desktop', 'Documents', 'Downloads', 'System32', 'SysWOW64',
    'VMware', 'Windows Server', 'relazione_AD', 'VMware Tools',
]);

const commandHistory = [];
let historyIndex = -1;

function getPromptText() {
    return `PS ${currentPath}>`;
}

function updatePromptDisplay() {
    promptSpan.textContent = getPromptText() + ' ';
}

function resolvePath(target) {
    const t = target.trim().replace(/\//g, '\\');
    if (t === '.' || t === '') return currentPath;
    if (t === '..') {
        const parts = currentPath.split('\\');
        if (parts.length <= 2) return 'C:\\';
        parts.pop();
        return parts.join('\\');
    }
    if (t === '\\' || t.toLowerCase() === 'c:\\') return 'C:\\';
    if (/^[a-zA-Z]:\\/.test(t)) return t;
    return currentPath === 'C:\\' ? `C:\\${t}` : `${currentPath}\\${t}`;
}

document.addEventListener('click', function () {
    inputField.focus();
});

inputField.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') {
        const fullCmd = inputField.value.trim();

        if (fullCmd !== '') {
            if (commandHistory[commandHistory.length - 1] !== fullCmd) {
                commandHistory.push(fullCmd);
            }
            historyIndex = commandHistory.length;
        }

        inputField.value = '';
        printOutput(`${getPromptText()} ${fullCmd}`);

        if (fullCmd !== '') {
            processCommand(fullCmd);
        }

        scrollToBottom();

    } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (commandHistory.length > 0 && historyIndex > 0) {
            historyIndex--;
            inputField.value = commandHistory[historyIndex];
        }
    } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (commandHistory.length > 0 && historyIndex < commandHistory.length - 1) {
            historyIndex++;
            inputField.value = commandHistory[historyIndex];
        } else {
            historyIndex = commandHistory.length;
            inputField.value = '';
        }
    }
});

function processCommand(input) {
    const parts = input.trim().split(/\s+/);
    const cmd = parts[0].toLowerCase();
    const args = parts.slice(1);
    const argStr = args.join(' ');

    // --- Guide content commands ---
    if (cmd === 'help') {
        const el = document.getElementById('content-help');
        if (el) printOutput(el.innerHTML, true);
        return;
    }
    if (cmd === 'vmware') {
        const el = document.getElementById('content-vmware');
        if (el) printOutput(el.innerHTML, true);
        return;
    }
    if (cmd === 'ad-ds') {
        const el = document.getElementById('content-ad-ds');
        if (el) printOutput(el.innerHTML, true);
        return;
    }
    if (cmd === 'utenti') {
        const el = document.getElementById('content-utenti');
        if (el) printOutput(el.innerHTML, true);
        return;
    }

    // --- Shell: clear ---
    if (cmd === 'clear' || cmd === 'cls') {
        outputDiv.innerHTML = '';
        return;
    }

    // --- Shell: reset ---
    if (cmd === 'reset') {
        window.location.reload();
        return;
    }

    // --- Shell: theme/color ---
    if (cmd === 'theme' || cmd === 'color') {
        document.body.className = '';
        document.documentElement.className = '';
        let themeName = 'Default (PowerShell Blu)';
        if (argStr === '1') {
            document.body.classList.add('theme-1');
            document.documentElement.classList.add('theme-1');
            themeName = '1 (Nero CMD)';
        } else if (argStr === '2') {
            document.body.classList.add('theme-2');
            document.documentElement.classList.add('theme-2');
            themeName = '2 (Ubuntu Purple)';
        } else if (argStr === '3') {
            document.body.classList.add('theme-3');
            document.documentElement.classList.add('theme-3');
            themeName = '3 (Matrix Hacker)';
        } else if (argStr === '4') {
            document.body.classList.add('theme-4');
            document.documentElement.classList.add('theme-4');
            themeName = '4 (Retro Ambra)';
        } else if (argStr) {
            printOutput(`<span class="error">Tema '${argStr}' non trovato. Usa: theme 1, theme 2, theme 3, theme 4.</span>\n\n`, true);
            return;
        }
        printOutput(`Colore del terminale impostato su: ${themeName}\n\n`);
        return;
    }

    // --- Shell: echo / Write-Output ---
    if (cmd === 'echo' || cmd === 'write-output') {
        const text = argStr.replace(/^["']|["']$/g, '');
        printOutput((text || '') + '\n\n');
        return;
    }

    // --- Shell: pwd / Get-Location ---
    if (cmd === 'pwd' || cmd === 'get-location' || cmd === 'gl') {
        printOutput(`\nPath\n----\n${currentPath}\n\n`);
        return;
    }

    // --- Shell: cd / Set-Location ---
    if (cmd === 'cd' || cmd === 'set-location' || cmd === 'sl') {
        if (!argStr || argStr === '~') {
            currentPath = 'C:\\Users\\Utente';
            updatePromptDisplay();
            printOutput('');
            return;
        }
        const newPath = resolvePath(argStr);
        if (filesystem.hasOwnProperty(newPath)) {
            currentPath = newPath;
            updatePromptDisplay();
            printOutput('');
        } else {
            printOutput(`<span class="error">Set-Location: Impossibile trovare il percorso '${newPath}' perché non esiste.</span>\n\n`, true);
        }
        return;
    }

    // --- Shell: dir / ls / Get-ChildItem ---
    if (cmd === 'dir' || cmd === 'ls' || cmd === 'get-childitem' || cmd === 'gci') {
        const target = argStr ? resolvePath(argStr) : currentPath;
        const entries = filesystem[target];
        if (entries === undefined) {
            printOutput(`<span class="error">Get-ChildItem: Impossibile trovare il percorso '${target}'.</span>\n\n`, true);
            return;
        }
        const now = new Date();
        const d = now.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' });
        const t = now.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
        let out = `\n\n    Directory: ${target}\n\n`;
        out += `Mode          LastWriteTime         Length  Name\n`;
        out += `----          -------------         ------  ----\n`;
        if (entries.length === 0) {
            out += '(directory vuota)\n';
        } else {
            for (const entry of entries) {
                const isDir = dirEntries.has(entry);
                const mode = isDir ? 'd----' : '-a---';
                const size = isDir ? '         ' : String(Math.floor(Math.random() * 8000 + 500)).padStart(9);
                out += `${mode.padEnd(14)}${d} ${t}  ${size}  ${entry}\n`;
            }
        }
        out += '\n';
        printOutput(out);
        return;
    }

    // --- Shell: whoami ---
    if (cmd === 'whoami') {
        printOutput(`relazione-dc\\utente\n\n`);
        return;
    }

    // --- Shell: hostname ---
    if (cmd === 'hostname') {
        printOutput(`RELAZIONE-DC\n\n`);
        return;
    }

    // --- Shell: date / Get-Date ---
    if (cmd === 'date' || cmd === 'get-date') {
        const now = new Date();
        const str = now.toLocaleString('it-IT', {
            weekday: 'long', year: 'numeric', month: 'long',
            day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit',
        });
        printOutput(`\n${str}\n\n`);
        return;
    }

    // --- Shell: ver / $PSVersionTable ---
    if (cmd === 'ver' || cmd === '$psversiontable') {
        printOutput(
`
Name                           Value
----                           -----
PSVersion                      5.1.26100.0
PSEdition                      Desktop
PSCompatibleVersions           {1.0, 2.0, 3.0, 4.0, 5.0, 5.1}
BuildVersion                   10.0.26100.0
CLRVersion                     4.0.30319.42000
WSManStackVersion              3.0
PSRemotingProtocolVersion      2.3
SerializationVersion           1.1.0.1

`);
        return;
    }

    // --- Shell: ipconfig ---
    if (cmd === 'ipconfig') {
        printOutput(
`
Configurazione IP di Windows

Scheda Ethernet Ethernet0:

   Suffisso DNS specifico per connessione . : ad.local
   Indirizzo IPv4. . . . . . . . . . . . . : 192.168.1.10
   Subnet mask . . . . . . . . . . . . . . : 255.255.255.0
   Gateway predefinito . . . . . . . . . . : 192.168.1.1

Scheda Ethernet vEthernet (Default Switch):

   Suffisso DNS specifico per connessione . :
   Indirizzo IPv4. . . . . . . . . . . . . : 172.24.160.1
   Subnet mask . . . . . . . . . . . . . . : 255.255.240.0
   Gateway predefinito . . . . . . . . . . :

`);
        return;
    }

    // --- Shell: systeminfo ---
    if (cmd === 'systeminfo') {
        printOutput(
`
Nome host:                        RELAZIONE-DC
Sistema operativo:                Microsoft Windows Server 2022 Standard
Versione SO:                      10.0.20348 Build 20348
Produttore SO:                    Microsoft Corporation
Configurazione SO:                Server membro
Proprietario originale:           Utente
Data di installazione:            15/09/2025, 09:30:00
Ora di avvio:                     29/04/2026, 08:00:00
Produttore sistema:               VMware, Inc.
Modello sistema:                  VMware Virtual Platform
Tipo sistema:                     x64-based PC
Processore/i:                     Intel(R) Core(TM) i7-10700 CPU @ 2.90GHz
Directory di Windows:             C:\\Windows
Directory di sistema:             C:\\Windows\\System32
Fuso orario:                      (UTC+01:00) Roma, Amsterdam, Berlino
Memoria fisica totale:            8.192 MB
Memoria fisica disponibile:       3.754 MB

`);
        return;
    }

    // --- Shell: ping ---
    if (cmd === 'ping') {
        const target = argStr || '127.0.0.1';
        const ms = () => Math.floor(Math.random() * 6 + 10);
        const t = [ms(), ms(), ms(), ms()];
        printOutput(
`
Esecuzione di Ping ${target} con 32 byte di dati:
Risposta da ${target}: byte=32 durata=${t[0]}ms TTL=128
Risposta da ${target}: byte=32 durata=${t[1]}ms TTL=128
Risposta da ${target}: byte=32 durata=${t[2]}ms TTL=128
Risposta da ${target}: byte=32 durata=${t[3]}ms TTL=128

Statistiche Ping per ${target}:
    Pacchetti: Inviati = 4, Ricevuti = 4, Persi = 0 (0% persi),
Tempo approssimativo percorso andata/ritorno in millisecondi:
    Minimo = ${Math.min(...t)}ms, Massimo = ${Math.max(...t)}ms, Medio = ${Math.round(t.reduce((a, b) => a + b) / 4)}ms

`);
        return;
    }

    // --- Shell: history / Get-History ---
    if (cmd === 'history' || cmd === 'get-history') {
        if (commandHistory.length === 0) {
            printOutput('\n(nessun comando nella cronologia)\n\n');
            return;
        }
        let out = '\n  Id  CommandLine\n  --  -----------\n';
        commandHistory.forEach((c, i) => {
            out += `  ${String(i + 1).padStart(2)}  ${c}\n`;
        });
        out += '\n';
        printOutput(out);
        return;
    }

    // --- Guide window ---
    if (cmd === 'guide' || cmd === 'start-guide') {
        printOutput('\nAvvio Guida Relazione...\n\n');
        window.openGuide();
        return;
    }

    // --- Unknown command ---
    printOutput(`<span class="error">${parts[0]} : Termine '${parts[0]}' non riconosciuto come nome di cmdlet, funzione, programma eseguibile o file script.\nControllare l'ortografia del nome o verificare che il percorso sia incluso e corretto, quindi riprovare.</span>\n\n`, true);
}

function printOutput(text, isHtml = false) {
    const div = document.createElement('div');
    if (isHtml) {
        div.innerHTML = text;
    } else {
        div.textContent = text;
    }
    outputDiv.appendChild(div);
}

function scrollToBottom() {
    window.scrollTo(0, document.body.scrollHeight);
}

window.executeCommand = function (cmd) {
    if (commandHistory[commandHistory.length - 1] !== cmd) {
        commandHistory.push(cmd);
    }
    historyIndex = commandHistory.length;
    printOutput(`${getPromptText()} ${cmd}`);
    processCommand(cmd);
    scrollToBottom();
    inputField.focus();
};

// Initialize prompt display
updatePromptDisplay();

// Initialize Lucide icons
if (window.lucide) lucide.createIcons();

// ================================================================
// Guide Window
// ================================================================
(function () {
    const win = document.getElementById('guide-window');
    const titlebar = document.getElementById('gw-titlebar');

    let isDragging = false, dragOX = 0, dragOY = 0;
    let isMaximized = false, isMinimized = false;
    let savedLeft = '', savedTop = '';

    function centerWindow() {
        win.style.transform = 'none';
        win.style.left = Math.max(0, (window.innerWidth  - 860) / 2) + 'px';
        win.style.top  = Math.max(0, (window.innerHeight - 560) / 2) + 'px';
    }

    window.openGuide = function () {
        if (!isMaximized) centerWindow();
        win.style.display = 'flex';
    };

    document.getElementById('gw-btn-close').addEventListener('click', function () {
        win.style.display = 'none';
        win.classList.remove('gw-maximized', 'gw-minimized');
        isMaximized = false;
        isMinimized = false;
    });

    document.getElementById('gw-btn-min').addEventListener('click', function () {
        isMinimized = !isMinimized;
        win.classList.toggle('gw-minimized', isMinimized);
    });

    document.getElementById('gw-btn-max').addEventListener('click', toggleMaximize);

    titlebar.addEventListener('dblclick', function (e) {
        if (e.target.classList.contains('gw-btn')) return;
        toggleMaximize();
    });

    function toggleMaximize() {
        if (isMinimized) return;
        isMaximized = !isMaximized;
        if (isMaximized) {
            savedLeft = win.style.left;
            savedTop  = win.style.top;
            win.classList.add('gw-maximized');
        } else {
            win.classList.remove('gw-maximized');
            win.style.left = savedLeft;
            win.style.top  = savedTop;
        }
    }

    // Drag
    titlebar.addEventListener('mousedown', function (e) {
        if (isMaximized || e.target.classList.contains('gw-btn')) return;
        isDragging = true;
        const r = win.getBoundingClientRect();
        dragOX = e.clientX - r.left;
        dragOY = e.clientY - r.top;
        e.preventDefault();
    });

    document.addEventListener('mousemove', function (e) {
        if (!isDragging) return;
        let l = Math.max(0, Math.min(e.clientX - dragOX, window.innerWidth  - win.offsetWidth));
        let t = Math.max(0, Math.min(e.clientY - dragOY, window.innerHeight - 32));
        win.style.left = l + 'px';
        win.style.top  = t + 'px';
    });

    document.addEventListener('mouseup', function () {
        isDragging = false;
        isResizing = false;
    });

    // Resize
    const resizeHandle = document.getElementById('gw-resize');
    let isResizing = false, resizeStartX = 0, resizeStartY = 0, startW = 0, startH = 0;

    resizeHandle.addEventListener('mousedown', function (e) {
        if (isMaximized) return;
        isResizing = true;
        resizeStartX = e.clientX;
        resizeStartY = e.clientY;
        startW = win.offsetWidth;
        startH = win.offsetHeight;
        e.preventDefault();
        e.stopPropagation();
    });

    document.addEventListener('mousemove', function (e) {
        if (!isResizing) return;
        const newW = Math.max(480, startW + (e.clientX - resizeStartX));
        const newH = Math.max(320, startH + (e.clientY - resizeStartY));
        win.style.width  = newW + 'px';
        win.style.height = newH + 'px';
    });

    // Section switching
    const navItems = win.querySelectorAll('.gw-nav');
    const sections = win.querySelectorAll('.gw-section');
    const statusEl = document.getElementById('gw-status');

    navItems.forEach(function (item) {
        item.addEventListener('click', function () {
            navItems.forEach(n => n.classList.remove('active'));
            item.classList.add('active');
            sections.forEach(s => { s.style.display = 'none'; });
            const sec = document.getElementById('gws-' + item.getAttribute('data-sec'));
            if (sec) sec.style.display = 'block';
            if (statusEl) {
                statusEl.textContent = item.querySelector('span:last-child').textContent;
            }
        });
    });
})();
