const form = document.querySelector("#prompt-form");
const output = document.querySelector("#prompt-output");
const copyButton = document.querySelector("#copy-button");
const copyStatus = document.querySelector("#copy-status");
const resetButton = document.querySelector("#reset-button");
const clearHistoryButton = document.querySelector("#clear-history");
const historyList = document.querySelector("#history-list");
const qualityScore = document.querySelector("#quality-score");
const qualityMeterFill = document.querySelector("#quality-meter-fill");
const qualityTip = document.querySelector("#quality-tip");

const fallbackText = "Remplissez le formulaire puis cliquez sur « Générer mon prompt ».";
const historyStorageKey = "prompt-studio-history";
const maxHistoryItems = 5;

const templateGuidance = {
  marketing: {
    role: "Tu es un expert en marketing, copywriting et stratégie de conversion.",
    focus: "Mets l'accent sur la promesse, les bénéfices, les objections, la preuve et l'appel à l'action.",
  },
  strategy: {
    role: "Tu es un consultant senior en stratégie, organisation et priorisation.",
    focus: "Mets l'accent sur le diagnostic, les options, les risques, les critères de décision et les prochaines actions.",
  },
  coding: {
    role: "Tu es un développeur senior pédagogue, attentif à la robustesse et à la maintenabilité.",
    focus: "Mets l'accent sur les hypothèses techniques, les étapes d'implémentation, les cas limites, les tests et la sécurité.",
  },
  learning: {
    role: "Tu es un formateur expert qui rend les notions complexes simples et actionnables.",
    focus: "Mets l'accent sur la progression pédagogique, les exemples, les exercices et les erreurs fréquentes.",
  },
  analysis: {
    role: "Tu es un analyste rigoureux, capable de synthétiser l'information et de comparer des options.",
    focus: "Mets l'accent sur les critères d'analyse, les sources à vérifier, les compromis et les conclusions nuancées.",
  },
  creative: {
    role: "Tu es un directeur créatif spécialisé en idéation, storytelling et formats engageants.",
    focus: "Mets l'accent sur l'originalité, les angles narratifs, les variantes et les détails sensoriels.",
  },
};

function readValue(formData, key, fallback = "") {
  return (formData.get(key) || fallback).toString().trim();
}

function getHistory() {
  try {
    return JSON.parse(localStorage.getItem(historyStorageKey)) || [];
  } catch {
    return [];
  }
}

function saveHistory(items) {
  localStorage.setItem(historyStorageKey, JSON.stringify(items.slice(0, maxHistoryItems)));
}

function summarizePrompt(prompt) {
  return prompt.replace(/\s+/g, " ").trim().slice(0, 110);
}

function renderHistory() {
  const items = getHistory();
  historyList.innerHTML = "";

  if (items.length === 0) {
    const emptyItem = document.createElement("li");
    emptyItem.className = "history-list__empty";
    emptyItem.textContent = "Aucun prompt généré pour le moment.";
    historyList.append(emptyItem);
    return;
  }

  items.forEach((item, index) => {
    const listItem = document.createElement("li");
    const button = document.createElement("button");
    const title = document.createElement("strong");
    const summary = document.createElement("span");

    title.textContent = item.title || `Prompt ${index + 1}`;
    summary.textContent = summarizePrompt(item.prompt);
    button.type = "button";
    button.append(title, summary);
    button.addEventListener("click", () => {
      output.textContent = item.prompt;
      updateQuality(item.score, "Prompt restauré depuis l'historique.");
      copyStatus.textContent = "";
    });

    listItem.append(button);
    historyList.append(listItem);
  });
}

function addToHistory(prompt, title, score) {
  const nextHistory = [
    {
      prompt,
      title: title || "Prompt sans titre",
      score,
      createdAt: new Date().toISOString(),
    },
    ...getHistory(),
  ];

  saveHistory(nextHistory);
  renderHistory();
}

function scorePrompt(formData) {
  const checks = [
    readValue(formData, "objective").length >= 18,
    readValue(formData, "audience").length >= 4,
    readValue(formData, "context").length >= 12,
    readValue(formData, "constraints").length >= 4,
    readValue(formData, "mustHave").length >= 4,
  ];

  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}

function getQualityTip(score) {
  if (score >= 90) {
    return "Excellent : votre prompt contient un objectif, du contexte et des critères d'exécution précis.";
  }

  if (score >= 60) {
    return "Bon départ : ajoutez des contraintes ou des éléments indispensables pour réduire les réponses génériques.";
  }

  if (score >= 30) {
    return "À améliorer : précisez l'audience, le contexte et les critères de réussite attendus.";
  }

  return "Ajoutez un objectif clair pour évaluer votre prompt.";
}

function updateQuality(score, customTip = "") {
  qualityScore.textContent = `${score}%`;
  qualityMeterFill.style.width = `${score}%`;
  qualityTip.textContent = customTip || getQualityTip(score);
}

function buildPrompt(formData) {
  const template = readValue(formData, "template", "marketing");
  const objective = readValue(formData, "objective");
  const audience = readValue(formData, "audience", "l'audience cible");
  const tone = readValue(formData, "tone");
  const format = readValue(formData, "format");
  const language = readValue(formData, "language");
  const context = readValue(formData, "context", "Aucun contexte supplémentaire fourni.");
  const constraints = readValue(formData, "constraints", "Aucune contrainte particulière.");
  const mustHave = readValue(formData, "mustHave", "Aucun élément indispensable précisé.");
  const guidance = templateGuidance[template] || templateGuidance.marketing;

  return `${guidance.role}

Mission : ${objective}

Audience cible : ${audience}
Ton à adopter : ${tone}
Langue de réponse : ${language}
Format attendu : ${format}

Contexte :
${context}

Éléments indispensables :
${mustHave}

Contraintes :
${constraints}

Angle de travail :
${guidance.focus}

Consignes de réponse :
1. Commence par reformuler brièvement l'objectif pour confirmer ta compréhension.
2. Pose jusqu'à 3 questions uniquement si des informations bloquantes manquent ; sinon, avance avec des hypothèses explicites.
3. Propose une réponse directement exploitable, concrète et adaptée à l'audience.
4. Structure clairement le contenu avec des titres, des étapes, des listes ou un tableau selon le format demandé.
5. Ajoute des exemples précis lorsque cela renforce la qualité du résultat.
6. Termine par une courte section « Améliorations possibles » avec 3 pistes pour itérer.`;
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const formData = new FormData(form);
  const prompt = buildPrompt(formData);
  const score = scorePrompt(formData);

  output.textContent = prompt;
  copyStatus.textContent = "";
  updateQuality(score);
  addToHistory(prompt, readValue(formData, "objective").slice(0, 48), score);
});

copyButton.addEventListener("click", async () => {
  const text = output.textContent.trim();

  if (!text || text === fallbackText) {
    copyStatus.textContent = "Générez d'abord un prompt à copier.";
    return;
  }

  try {
    await navigator.clipboard.writeText(text);
    copyStatus.textContent = "Prompt copié dans le presse-papiers.";
  } catch {
    copyStatus.textContent = "Copie impossible automatiquement : sélectionnez le texte manuellement.";
  }
});

resetButton.addEventListener("click", () => {
  form.reset();
  output.textContent = fallbackText;
  copyStatus.textContent = "";
  updateQuality(0);
});

clearHistoryButton.addEventListener("click", () => {
  saveHistory([]);
  renderHistory();
});

renderHistory();
