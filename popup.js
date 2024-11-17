document.addEventListener('DOMContentLoaded', function() {
  const startButton = document.getElementById('startRecord');
  const resultDiv = document.getElementById('result');
  const translatedDiv = document.getElementById('translatedResult');
  const copyButton = document.getElementById('copy');
  const translateButton = document.getElementById('translate');
  const langSelect = document.getElementById('langSelect');
  let recognition = null;
  let isRecording = false;

  // Initialiser la reconnaissance vocale
  function initializeRecognition() {
    if (!recognition && 'webkitSpeechRecognition' in window) {
      recognition = new webkitSpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = langSelect.value;

      recognition.onstart = function() {
        console.log('La reconnaissance vocale a démarré');
        resultDiv.textContent = 'Écoute en cours...';
      };

      recognition.onresult = function(event) {
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }

        if (finalTranscript !== '') {
          resultDiv.textContent = finalTranscript;
        } else if (interimTranscript !== '') {
          resultDiv.textContent = interimTranscript;
        }
      };

      recognition.onerror = function(event) {
        console.error('Erreur de reconnaissance:', event.error);
        if (event.error === 'not-allowed') {
          resultDiv.textContent = 'Erreur: Veuillez autoriser l\'accès au microphone';
        } else {
          resultDiv.textContent = 'Erreur: ' + event.error;
        }
        stopRecording();
      };

      recognition.onend = function() {
        console.log('La reconnaissance vocale s\'est arrêtée');
        if (isRecording) {
          recognition.start();
        }
      };
    }
  }

  // Fonction de traduction
  async function translateText(text, targetLang = 'en') {
    try {
      const response = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`);
      const data = await response.json();
      return data[0][0][0];
    } catch (error) {
      console.error('Erreur de traduction:', error);
      return 'Erreur de traduction';
    }
  }

  // Événement de traduction
  translateButton.addEventListener('click', async function() {
    const textToTranslate = resultDiv.textContent;
    if (textToTranslate && textToTranslate !== 'Écoute en cours...') {
      translateButton.disabled = true;
      translateButton.textContent = 'Traduction en cours...';
      
      const translatedText = await translateText(textToTranslate);
      translatedDiv.textContent = translatedText;
      
      translateButton.disabled = false;
      translateButton.textContent = 'Traduire en anglais';
    }
  });

  // Événement de changement de langue
  langSelect.addEventListener('change', function() {
    if (recognition) {
      recognition.lang = langSelect.value;
      if (isRecording) {
        recognition.stop();
        recognition.start();
      }
    }
  });

  // Vérifier et demander les permissions du microphone
  async function checkMicrophonePermission() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      return true;
    } catch (err) {
      console.error('Erreur de permission microphone:', err);
      resultDiv.textContent = 'Erreur: Veuillez autoriser l\'accès au microphone';
      return false;
    }
  }

  startButton.addEventListener('click', async function() {
    if (!isRecording) {
      const hasPermission = await checkMicrophonePermission();
      if (!hasPermission) return;

      initializeRecognition();

      if (recognition) {
        try {
          startRecording();
        } catch (err) {
          console.error('Erreur au démarrage:', err);
          resultDiv.textContent = 'Erreur au démarrage de l\'enregistrement';
        }
      } else {
        resultDiv.textContent = 'La reconnaissance vocale n\'est pas supportée dans ce navigateur';
      }
    } else {
      stopRecording();
    }
  });

  copyButton.addEventListener('click', function() {
    const originalText = resultDiv.textContent;
    const translatedText = translatedDiv.textContent;
    const textToCopy = translatedText ? `${originalText}\n\nTraduction:\n${translatedText}` : originalText;
    
    if (textToCopy && textToCopy !== 'Écoute en cours...') {
      navigator.clipboard.writeText(textToCopy).then(() => {
        copyButton.textContent = 'Copié !';
        setTimeout(() => {
          copyButton.textContent = 'Copier le texte';
        }, 2000);
      });
    }
  });

  function startRecording() {
    recognition.start();
    isRecording = true;
    startButton.textContent = 'Arrêter l\'enregistrement';
    startButton.classList.add('recording');
  }

  function stopRecording() {
    if (recognition) {
      recognition.stop();
    }
    isRecording = false;
    startButton.textContent = 'Commencer l\'enregistrement';
    startButton.classList.remove('recording');
  }
}); 