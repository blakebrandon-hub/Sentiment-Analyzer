let model;
const THRESHOLD = 0.9;

async function loadModel() {
  try {
    model = await toxicity.load(THRESHOLD);
    console.log("Toxicity model loaded.");
    document.getElementById("loadingSpinner").style.display = "none";
    document.getElementById("analyzeBtn").disabled = false;
  } catch (err) {
    console.error("Model load failed:", err);
    alert("Failed to load AI model. Check your internet and refresh the page.");
  }
}

async function analyzeMessage() {
  const text = document.getElementById("messageInput").value.trim();
  if (!text) return;

  const words = text.split(/\s+/);
  let chunkCount = 4;
  if (words.length <= 4) chunkCount = 1;
  else if (words.length <= 8) chunkCount = 2;
  else if (words.length <= 12) chunkCount = 3;

  const chunkSize = Math.ceil(words.length / chunkCount);
  const parts = [];
  for (let i = 0; i < chunkCount; i++) {
    const chunk = words.slice(i * chunkSize, (i + 1) * chunkSize).join(" ");
    if (chunk) parts.push(chunk);
  }

  const predictionsList = await Promise.all(parts.map(p => model.classify([p])));

  const toxicLabels = new Set();

  predictionsList.forEach(predictions => {
    predictions.forEach(pred => {
      if (pred.results[0].match) {
        toxicLabels.add(pred.label);
      }
    });
  });

  // Update UI
  const resultDiv = document.getElementById("result");
  const verdictEl = document.getElementById("verdict");

  if (toxicLabels.size === 0) {
 
    verdictEl.textContent = "✅ No toxicity detected";
    resultDiv.className = "alert alert-success mt-4";
  } else {
    const labels = Array.from(toxicLabels)
      .map(label => label.replace(/_/g, ' '))
      .map(label => label.charAt(0).toUpperCase() + label.slice(1));

    verdictEl.textContent = `⚠️ Detected: ${labels.join(', ')}`;
    resultDiv.className = "alert alert-danger mt-4";
  }

  resultDiv.classList.remove("d-none");
}

// Load the model on page load
loadModel();
