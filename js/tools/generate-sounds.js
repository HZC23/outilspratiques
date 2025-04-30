/**
 * Script pour générer les sons du métronome
 * À exécuter dans la console du navigateur pour générer les fichiers audio
 */

// Configuration des sons à générer
const sounds = {
    click: {
        normal: { frequency: 800, duration: 0.02, type: 'sine' },
        accent: { frequency: 1000, duration: 0.03, type: 'sine' }
    },
    wood: {
        normal: { frequency: 600, duration: 0.03, type: 'triangle', noise: 0.2 },
        accent: { frequency: 800, duration: 0.04, type: 'triangle', noise: 0.2 }
    },
    digital: {
        normal: { frequency: 800, duration: 0.02, type: 'square', decay: 'fast' },
        accent: { frequency: 1200, duration: 0.03, type: 'square', decay: 'fast' }
    },
    bell: {
        normal: { frequency: 1000, duration: 0.05, type: 'sine', harmonics: true },
        accent: { frequency: 1500, duration: 0.07, type: 'sine', harmonics: true }
    }
};

// Fonction pour générer un son
function generateSound(options) {
    return new Promise((resolve) => {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const duration = options.duration || 0.02;
        const sampleRate = audioContext.sampleRate;
        const buffer = audioContext.createBuffer(1, sampleRate * duration, sampleRate);
        const data = buffer.getChannelData(0);
        
        // Fonction principale pour générer la forme d'onde
        for (let i = 0; i < buffer.length; i++) {
            const t = i / sampleRate;
            let val = 0;
            
            // Différentes formes d'onde selon le type
            if (options.type === 'sine') {
                val = Math.sin(2 * Math.PI * options.frequency * t);
            } else if (options.type === 'square') {
                val = Math.sin(2 * Math.PI * options.frequency * t) > 0 ? 0.7 : -0.7;
            } else if (options.type === 'triangle') {
                val = Math.asin(Math.sin(2 * Math.PI * options.frequency * t)) * 2 / Math.PI;
            }
            
            // Ajouter des harmoniques pour le son de cloche
            if (options.harmonics) {
                val += Math.sin(2 * Math.PI * options.frequency * 1.5 * t) * 0.3;
                val += Math.sin(2 * Math.PI * options.frequency * 2 * t) * 0.2;
                val = val / 1.5; // Normaliser
            }
            
            // Ajouter un peu de bruit pour le son de bois
            if (options.noise) {
                val += (Math.random() * 2 - 1) * options.noise;
            }
            
            // Appliquer l'enveloppe d'amplitude
            let envelope;
            if (options.decay === 'fast') {
                envelope = Math.pow(1 - t / duration, 2); // Décroissance exponentielle rapide
            } else {
                envelope = 1 - t / duration; // Décroissance linéaire
            }
            
            data[i] = val * envelope;
        }
        
        // Créer un élément audio pour le prévisualiser et télécharger
        const source = audioContext.createBufferSource();
        source.buffer = buffer;
        source.connect(audioContext.destination);
        
        // Convertir en WAV pour le téléchargement
        const wavBuffer = bufferToWave(buffer, 0, buffer.length);
        const blob = new Blob([wavBuffer], { type: 'audio/wav' });
        const url = URL.createObjectURL(blob);
        
        // Jouer le son
        source.start();
        
        resolve({
            buffer,
            url,
            download: () => {
                const a = document.createElement('a');
                a.href = url;
                a.download = `${options.name}.wav`;
                a.click();
            }
        });
    });
}

// Fonction pour convertir un AudioBuffer en WAV (format de fichier audio)
function bufferToWave(buffer, offset, length) {
    const numOfChannels = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const format = 1; // PCM
    const bitDepth = 16;
    
    const bytesPerSample = bitDepth / 8;
    const blockAlign = numOfChannels * bytesPerSample;
    
    const dataSize = length * blockAlign;
    const headerSize = 44;
    const totalSize = headerSize + dataSize;
    
    const arrayBuffer = new ArrayBuffer(totalSize);
    const view = new DataView(arrayBuffer);
    
    // RIFF identifier
    writeString(view, 0, 'RIFF');
    // file length minus RIFF identifier length and file description length
    view.setUint32(4, totalSize - 8, true);
    // RIFF type
    writeString(view, 8, 'WAVE');
    // format chunk identifier
    writeString(view, 12, 'fmt ');
    // format chunk length
    view.setUint32(16, 16, true);
    // sample format (raw)
    view.setUint16(20, format, true);
    // channel count
    view.setUint16(22, numOfChannels, true);
    // sample rate
    view.setUint32(24, sampleRate, true);
    // byte rate (sample rate * block align)
    view.setUint32(28, sampleRate * blockAlign, true);
    // block align (channel count * bytes per sample)
    view.setUint16(32, blockAlign, true);
    // bits per sample
    view.setUint16(34, bitDepth, true);
    // data chunk identifier
    writeString(view, 36, 'data');
    // data chunk length
    view.setUint32(40, dataSize, true);

    // Write the PCM samples
    const channelData = [];
    for (let i = 0; i < numOfChannels; i++) {
        channelData[i] = buffer.getChannelData(i);
    }

    let offset2 = 0;
    let sample = 0;
    for (let i = 0; i < length; i++) {
        for (let channel = 0; channel < numOfChannels; channel++) {
            // clamp to [-1.0, 1.0]
            sample = Math.max(-1, Math.min(1, channelData[channel][offset + i]));
            // convert to 16-bit signed integer
            sample = Math.floor(sample * 32767);
            
            // write 16-bit sample
            view.setInt16(44 + offset2, sample, true);
            offset2 += bytesPerSample;
        }
    }

    return arrayBuffer;
}

function writeString(view, offset, string) {
    for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
    }
}

// Fonction pour générer et télécharger tous les sons
async function generateAllSounds() {
    for (const [type, variants] of Object.entries(sounds)) {
        for (const [variant, options] of Object.entries(variants)) {
            const soundOptions = {
                ...options,
                name: `${type}_${variant}`
            };
            
            try {
                const sound = await generateSound(soundOptions);
                console.log(`Son généré: ${soundOptions.name}`);
                sound.download();
                // Attendre un peu entre chaque téléchargement
                await new Promise(resolve => setTimeout(resolve, 500));
            } catch (error) {
                console.error(`Erreur lors de la génération du son ${soundOptions.name}:`, error);
            }
        }
    }
}

// Pour générer et télécharger tous les sons, exécuter cette fonction dans la console:
// generateAllSounds();

// Pour générer et télécharger un seul son, utiliser cette syntaxe:
// generateSound({ frequency: 1000, duration: 0.03, type: 'sine', name: 'click_accent' }).then(sound => sound.download()); 