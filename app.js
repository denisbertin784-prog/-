const form = document.querySelector("#prompt-form");
const output = document.querySelector("#prompt-output");
const copyButton = document.querySelector("#copy-button");
const copyStatus = document.querySelector("#copy-status");

const fallbackText = "Remplissez le formulaire puis cliquez sur « Générer mon prompt ».";

function readValue(formData, key, fallback = "") {
  return (formData.get(key) || fallback).toString().trim();
}

function buildPrompt(formData) {
  const objective = readValue(formData, "objective");
  const audience = readValue(formData, "audience", "l'audience cible");
  const tone = readValue(formData, "tone");
  const format = readValue(formData, "format");
  const language = readValue(formData, "language");
  const context = readValue(formData, "context", "Aucun contexte supplémentaire fourni.");
  const constraints = readValue(formData, "constraints", "Aucune contrainte particulière.");

  return `Tu es un expert en création de contenu et en stratégie.

Mission : ${objective}

Audience cible : ${audience}
Ton à adopter : ${tone}
Langue de réponse : ${language}
Format attendu : ${format}

Contexte :
${context}

Contraintes :
${constraints}

Consignes de réponse :
1. Commence par reformuler brièvement l'objectif pour confirmer ta compréhension.
2. Propose une réponse directement exploitable, concrète et adaptée à l'audience.
3. Structure clairement le contenu avec des titres, des étapes ou des listes si utile.
4. Ajoute des exemples précis lorsque cela renforce la qualité du résultat.
5. Termine par 3 questions d'amélioration pour affiner encore la réponse.`;
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const formData = new FormData(form);
  output.textContent = buildPrompt(formData);
  copyStatus.textContent = "";
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
