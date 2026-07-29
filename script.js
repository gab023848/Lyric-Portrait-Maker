document.addEventListener('DOMContentLoaded', () => {
  // Elements
  const imageInput = document.getElementById('imageInput');
  const imageDrop = document.getElementById('imageDrop');
  const imageDropText = document.getElementById('imageDropText');
  
  const lyricsInput = document.getElementById('lyricsInput');
  const portraitFrame = document.getElementById('portraitFrame');
  const portraitText = document.getElementById('portraitText');
  const statusText = document.getElementById('statusText');
  const captionText = document.getElementById('captionText');

  const audioInput = document.getElementById('audioInput');
  const audioDrop = document.getElementById('audioDrop');
  const audioDropText = document.getElementById('audioDropText');
  const audioPlayer = document.getElementById('audioPlayer');
  const loopToggle = document.getElementById('loopToggle');

  const fontSize = document.getElementById('fontSize');
  const lineHeight = document.getElementById('lineHeight');
  const letterSpacing = document.getElementById('letterSpacing');
  const contrast = document.getElementById('contrast');
  const filterSelect = document.getElementById('filterSelect');
  const exportFormatSelect = document.getElementById('exportFormatSelect');
  const downloadBtn = document.getElementById('downloadBtn');

  // Value Display Elements
  const fontSizeVal = document.getElementById('fontSizeVal');
  const lineHeightVal = document.getElementById('lineHeightVal');
  const letterSpacingVal = document.getElementById('letterSpacingVal');
  const contrastVal = document.getElementById('contrastVal');

  let currentImageSrc = null;

  // --- 1. TEXT REPETITION & UPDATE ---
  function updateText() {
    const rawText = lyricsInput.value.trim() || "AllenKalboAllenKalboAllenKalbo";
    const outputText = rawText.replace(/\s+/g, '') || "AllenKalboAllenKalboAllenKalbo";
    
    // Update caption preview with the first line
    const firstLine = rawText.split('\n')[0];
    captionText.textContent = `— ${firstLine} —`;

    if (!currentImageSrc) {
      portraitText.textContent = "Your text portrait will appear here once you add a photo and some words.";
      return;
    }

    // Repeat text so it fills out the frame without spaces
    const repeatedText = outputText.repeat(120);
    portraitText.textContent = repeatedText;
  }

  // --- 2. IMAGE UPLOAD HANDLING ---
  function handleImage(file) {
    if (!file || !file.type.startsWith('image/')) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      currentImageSrc = e.target.result;
      const previewImg = new Image();
      previewImg.src = currentImageSrc;
      previewImg.onload = () => {
        portraitFrame.classList.toggle('landscape', previewImg.width > previewImg.height);
        portraitText.style.backgroundImage = `url('${currentImageSrc}')`;
        portraitFrame.classList.remove('empty');
        statusText.textContent = file.name;
        imageDropText.textContent = `Loaded: ${file.name}`;
        updateText();
      };
    };
    reader.readAsDataURL(file);
  }

  imageInput.addEventListener('change', (e) => handleImage(e.target.files[0]));
  setupDragAndDrop(imageDrop, handleImage);

  // --- 3. AUDIO PLAYER HANDLING ---
  audioInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('audio/')) {
      const audioUrl = URL.createObjectURL(file);
      audioPlayer.src = audioUrl;
      audioPlayer.style.display = 'block';
      audioDropText.textContent = `Loaded: ${file.name}`;
    }
  });

  loopToggle.addEventListener('change', (e) => {
    audioPlayer.loop = e.target.checked;
  });

  setupDragAndDrop(audioDrop, (file) => {
    audioInput.files = createFileList(file);
    audioInput.dispatchEvent(new Event('change'));
  });

  // --- 4. CONTROLS & FINE TUNING ---
  function updateStyles() {
    const fs = fontSize.value;
    portraitText.style.fontSize = `${fs}px`;
    fontSizeVal.textContent = `${fs}px`;

    const lh = (lineHeight.value / 100).toFixed(2);
    portraitText.style.lineHeight = lh;
    lineHeightVal.textContent = lh;

    const ls = letterSpacing.value;
    portraitText.style.letterSpacing = `${ls}px`;
    letterSpacingVal.textContent = `${ls}px`;

    const ct = contrast.value;
    contrastVal.textContent = `${ct}%`;
    const selectedFilter = filterSelect.value;
    
    portraitText.style.filter = `contrast(${ct}%) ${selectedFilter !== 'none' ? selectedFilter : ''}`;
  }

  [fontSize, lineHeight, letterSpacing, contrast, filterSelect].forEach(input => {
    input.addEventListener('input', updateStyles);
  });

  lyricsInput.addEventListener('focus', () => {
    letterSpacing.disabled = true;
  });
  lyricsInput.addEventListener('blur', () => {
    letterSpacing.disabled = false;
  });

  lyricsInput.addEventListener('input', updateText);

  // --- 5. DOWNLOAD MANAGER ---
  downloadBtn.addEventListener('click', () => {
    if (!currentImageSrc) {
      alert("Please upload a photo first!");
      return;
    }

    const format = exportFormatSelect.value;

    if (format === 'png') {
      downloadAsPNG();
    } else if (format === 'html') {
      downloadAsHTML();
    }
  });

  // Option A: Download as PNG Image
  function downloadAsPNG() {
    downloadBtn.textContent = "Generating image...";
    downloadBtn.disabled = true;

    const frameRect = portraitFrame.getBoundingClientRect();
    const scale = 2; 
    const width = frameRect.width * scale;
    const height = frameRect.height * scale;

    const mainCanvas = document.createElement('canvas');
    mainCanvas.width = width;
    mainCanvas.height = height;
    const mainCtx = mainCanvas.getContext('2d');

    mainCtx.fillStyle = "#000000";
    mainCtx.fillRect(0, 0, width, height);

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = currentImageSrc;

    img.onload = () => {
      const imgCanvas = document.createElement('canvas');
      imgCanvas.width = width;
      imgCanvas.height = height;
      const imgCtx = imgCanvas.getContext('2d');

      const selectedFilter = filterSelect.value;
      const ct = contrast.value;
      imgCtx.filter = `contrast(${ct}%) ${selectedFilter !== 'none' ? selectedFilter : ''}`;

      const imgRatio = img.width / img.height;
      const canvasRatio = width / height;
      let renderW, renderH, offsetX, offsetY;

      if (imgRatio > canvasRatio) {
        renderH = height;
        renderW = height * imgRatio;
        offsetX = (width - renderW) / 2;
        offsetY = 0;
      } else {
        renderW = width;
        renderH = width / imgRatio;
        offsetX = 0;
        offsetY = (height - renderH) / 2;
      }

      imgCtx.drawImage(img, offsetX, offsetY, renderW, renderH);

      const textCanvas = document.createElement('canvas');
      textCanvas.width = width;
      textCanvas.height = height;
      const textCtx = textCanvas.getContext('2d');

      const fontPx = parseFloat(fontSize.value) * scale;
      const lineH = (parseFloat(lineHeight.value) / 100) * fontPx;
      const letterSp = parseFloat(letterSpacing.value) * scale;

      textCtx.font = `600 ${fontPx}px "IBM Plex Mono", monospace`;
      textCtx.fillStyle = "#ffffff";
      textCtx.textBaseline = "top";

      const padding = 16 * scale;
      let x = padding;
      let y = padding;

      const words = portraitText.textContent.split(' ');

      for (let i = 0; i < words.length; i++) {
        const word = words[i] + " ";
        let wordWidth = 0;
        for (let char of word) {
          wordWidth += textCtx.measureText(char).width + letterSp;
        }

        if (x + wordWidth > width - padding && x > padding) {
          x = padding;
          y += lineH;
        }

        if (y + fontPx > height - padding) break;

        for (let char of word) {
          textCtx.fillText(char, x, y);
          x += textCtx.measureText(char).width + letterSp;
        }
      }

      textCtx.globalCompositeOperation = 'source-in';
      textCtx.drawImage(imgCanvas, 0, 0);

      mainCtx.drawImage(textCanvas, 0, 0);

      const link = document.createElement('a');
      link.download = 'made-by-gab-lyric-portrait.png';
      link.href = mainCanvas.toDataURL('image/png');
      link.click();

      downloadBtn.textContent = "Download Portrait";
      downloadBtn.disabled = false;
    };

    img.onerror = () => {
      alert("Failed to render image. Please try another photo.");
      downloadBtn.textContent = "Download Portrait";
      downloadBtn.disabled = false;
    };
  }

  // Option B: Download as HTML/CSS Code File
  function downloadAsHTML() {
    const fs = fontSize.value;
    const lh = (lineHeight.value / 100).toFixed(2);
    const ls = letterSpacing.value;
    const ct = contrast.value;
    const selectedFilter = filterSelect.value;
    const textContent = portraitText.textContent;

    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Lyric Portrait Output</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@600&display=swap" rel="stylesheet">
  <style>
    body {
      background-color: #0f1115;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      margin: 0;
      padding: 20px;
      box-sizing: border-box;
    }
    .portrait-frame {
      width: 100%;
      max-width: 500px;
      aspect-ratio: 4 / 5;
      background-color: #000;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 10px 30px rgba(0,0,0,0.5);
    }
    .portrait-text {
      width: 100%;
      height: 100%;
      padding: 1rem;
      box-sizing: border-box;
      word-break: break-word;
      white-space: pre-wrap;
      overflow: hidden;
      background-image: url('${currentImageSrc}');
      background-size: cover;
      background-position: center;
      background-repeat: no-repeat;
      -webkit-background-clip: text;
      background-clip: text;
      color: transparent;
      font-family: 'IBM Plex Mono', monospace;
      font-weight: 600;
      font-size: ${fs}px;
      line-height: ${lh};
      letter-spacing: ${ls}px;
      filter: contrast(${ct}%) ${selectedFilter !== 'none' ? selectedFilter : ''};
    }
  </style>
</head>
<body>
  <div class="portrait-frame">
    <div class="portrait-text">${textContent}</div>
  </div>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const link = document.createElement('a');
    link.download = 'lyric-portrait.html';
    link.href = URL.createObjectURL(blob);
    link.click();
    URL.revokeObjectURL(link.href);
  }

  // --- HELPER FUNCTIONS ---
  function setupDragAndDrop(element, callback) {
    ['dragenter', 'dragover'].forEach(eventName => {
      element.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        element.style.borderColor = 'var(--accent-color)';
      }, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
      element.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        element.style.borderColor = 'var(--border-color)';
      }, false);
    });

    element.addEventListener('drop', (e) => {
      const dt = e.dataTransfer;
      const files = dt.files;
      if (files.length > 0) callback(files[0]);
    });
  }

  function createFileList(file) {
    const dt = new DataTransfer();
    dt.items.add(file);
    return dt.files;
  }

  // Initial setup
  updateStyles();
});