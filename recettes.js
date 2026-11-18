
/* =========================================
   METS DU CŒUR – MOTEUR DU CARNET DE RECETTES
========================================= */

const STORAGE_KEY = "mets-coeur-recettes";

let recetteEnModification = null;

// Récupération des recettes enregistrées
function chargerRecettes() {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    } catch {
        return [];
    }
}

let recettes = chargerRecettes();


// =========================================
// OUTILS
// =========================================

function sauvegarderRecettes() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(recettes));
}

function formaterEuros(valeur) {
    return Number(valeur).toLocaleString("fr-FR", {
        style: "currency",
        currency: "EUR"
    });
}

function securiserTexte(texte) {
    return String(texte).replace(/[&<>"']/g, caractere => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
    })[caractere]);
}


// =========================================
// GESTION DES INGREDIENTS
// =========================================

function ajouterIngredient(donnees = {}) {

    const liste = document.querySelector("#ingredients-list");

    const ligne = document.createElement("div");
    ligne.className = "ingredient-row";

    ligne.innerHTML = `
        <div class="field">
            <label>Ingrédient</label>
            <input type="text"
                class="ingredient-name"
                placeholder="Ex : Viande de bœuf"
                value="${securiserTexte(donnees.nom || "")}"
                required>
        </div>

        <div class="field">
            <label>Quantité</label>
            <input type="number"
                class="ingredient-quantity"
                min="0.001" step="any"
                value="${donnees.quantite ?? ""}"
                placeholder="Ex : 2"
                required>
        </div>

        <div class="field">
            <label>Unité</label>
            <select class="ingredient-unit">
                <option value="kg">kg</option>
                <option value="g">g</option>
                <option value="L">L</option>
                <option value="ml">ml</option>
                <option value="unité">Unité</option>
            </select>
        </div>

        <div class="field">
            <label>Prix par unité (€)</label>
            <input type="number"
                class="ingredient-price"
                min="0" step="0.001"
                value="${donnees.prixUnitaire ?? ""}"
                placeholder="Ex : 12.50"
                required>
        </div>

        <div>
            <label class="ingredient-total">0,00 €</label>
            <button type="button"
                class="delete-ingredient"
                aria-label="Supprimer cet ingrédient">✕</button>
        </div>
    `;

    liste.appendChild(ligne);

    if (donnees.unite) {
        ligne.querySelector(".ingredient-unit").value = donnees.unite;
    }

    ligne.querySelectorAll("input").forEach(input => {
        input.addEventListener("input", calculerCouts);
    });

    ligne.querySelector(".delete-ingredient")
        .addEventListener("click", () => {
            ligne.remove();
            calculerCouts();
        });

    calculerCouts();
}


// =========================================
// CALCUL DES COUTS
// =========================================

function recupererIngredients() {

    const lignes = document.querySelectorAll(".ingredient-row");

    return Array.from(lignes).map(ligne => ({
        nom: ligne.querySelector(".ingredient-name").value.trim(),
        quantite: Number(ligne.querySelector(".ingredient-quantity").value),
        unite: ligne.querySelector(".ingredient-unit").value,
        prixUnitaire: Number(ligne.querySelector(".ingredient-price").value)
    }));
}

function calculerCouts() {

    let total = 0;

    document.querySelectorAll(".ingredient-row").forEach(ligne => {

        const quantite = Number(
            ligne.querySelector(".ingredient-quantity").value
        );

        const prix = Number(
            ligne.querySelector(".ingredient-price").value
        );

        const cout = quantite * prix;

        total += cout;

        ligne.querySelector(".ingredient-total").textContent =
            formaterEuros(cout);
    });

    const portions = Math.max(
        1,
        Number(document.querySelector("#recipe-portions").value) || 1
    );

    document.querySelector("#total-cost").textContent =
        formaterEuros(total);

    document.querySelector("#portion-cost").textContent =
        formaterEuros(total / portions);

    return total;
}


// =========================================
// ENREGISTREMENT D'UNE RECETTE
// =========================================

function enregistrerRecette(event) {

    event.preventDefault();

    const nom = document.querySelector("#recipe-name").value.trim();
    const categorie = document.querySelector("#recipe-category").value;
    const portions = Number(document.querySelector("#recipe-portions").value);
    const notes = document.querySelector("#recipe-notes").value.trim();

    const ingredients = recupererIngredients();

    if (!nom || !categorie || portions < 1 || ingredients.length === 0) {
        alert("Merci de compléter les informations de la recette.");
        return;
    }

    const ingredientInvalide = ingredients.some(ingredient =>
        !ingredient.nom ||
        !Number.isFinite(ingredient.quantite) ||
        ingredient.quantite <= 0 ||
        !Number.isFinite(ingredient.prixUnitaire) ||
        ingredient.prixUnitaire < 0
    );

    if (ingredientInvalide) {
        alert("Vérifie les quantités et les prix de tes ingrédients.");
        return;
    }

    const coutTotal = calculerCouts();

    const recette = {
        id: recetteEnModification ||
            (crypto.randomUUID ? crypto.randomUUID() : String(Date.now())),
        nom,
        categorie,
        portions,
        notes,
        ingredients,
        coutTotal,
        coutPortion: coutTotal / portions,
        dateModification: new Date().toISOString()
    };

    if (recetteEnModification) {
        recettes = recettes.map(ancienne =>
            ancienne.id === recetteEnModification ? recette : ancienne
        );
    } else {
        recettes.push(recette);
    }

    sauvegarderRecettes();
    afficherRecettes();
    reinitialiserFormulaire();

    alert("Recette enregistrée avec succès ! ❤️");
}


// =========================================
// AFFICHAGE DES RECETTES
// =========================================

function afficherRecettes() {

    const liste = document.querySelector("#recipe-list");
    const compteur = document.querySelector("#recipe-count");

    compteur.textContent = recettes.length;

    if (recettes.length === 0) {
        liste.innerHTML = `
            <p class="empty-message">
                Aucune recette enregistrée pour le moment.
            </p>
        `;
        return;
    }

    liste.innerHTML = recettes.map(recette => `

        <article class="recipe-card">

            <h3>${securiserTexte(recette.nom)}</h3>

            <p>Catégorie : ${securiserTexte(recette.categorie)}</p>

            <p>Portions : ${recette.portions}</p>

            <p>Ingrédients : ${recette.ingredients.length}</p>

            <p>Coût total :
                <strong>${formaterEuros(recette.coutTotal)}</strong>
            </p>

            <p>Coût par portion :
                <strong>${formaterEuros(recette.coutPortion)}</strong>
            </p>

            <div class="recipe-card-actions">

                <button type="button"
                    onclick="modifierRecette('${recette.id}')">
                    Modifier
                </button>

                <button type="button"
                    onclick="supprimerRecette('${recette.id}')">
                    Supprimer
                </button>

            </div>

        </article>

    `).join("");
}


// =========================================
// MODIFICATION D'UNE RECETTE
// =========================================

function modifierRecette(id) {

    const recette = recettes.find(item => item.id === id);

    if (!recette) return;

    recetteEnModification = id;

    document.querySelector("#recipe-name").value = recette.nom;
    document.querySelector("#recipe-category").value = recette.categorie;
    document.querySelector("#recipe-portions").value = recette.portions;
    document.querySelector("#recipe-notes").value = recette.notes || "";

    document.querySelector("#ingredients-list").innerHTML = "";

    recette.ingredients.forEach(ingredient => {
        ajouterIngredient(ingredient);
    });

    calculerCouts();

    document.querySelector(".recipe-form-section")
        .scrollIntoView({ behavior: "smooth" });
}


// =========================================
// SUPPRESSION D'UNE RECETTE
// =========================================

function supprimerRecette(id) {

    const recette = recettes.find(item => item.id === id);

    if (!recette) return;

    if (!confirm(`Supprimer la recette "${recette.nom}" ?`)) {
        return;
    }

    recettes = recettes.filter(item => item.id !== id);

    sauvegarderRecettes();
    afficherRecettes();

    if (recetteEnModification === id) {
        reinitialiserFormulaire();
    }
}


// =========================================
// REINITIALISATION DU FORMULAIRE
// =========================================

function reinitialiserFormulaire() {

    document.querySelector("#recipe-form").reset();

    document.querySelector("#ingredients-list").innerHTML = "";

    recetteEnModification = null;

    ajouterIngredient();

    calculerCouts();
}


// =========================================
// INITIALISATION
// =========================================

document.addEventListener("DOMContentLoaded", () => {

    document.querySelector("#add-ingredient")
        .addEventListener("click", () => ajouterIngredient());

    document.querySelector("#recipe-form")
        .addEventListener("submit", enregistrerRecette);

    document.querySelector("#recipe-portions")
        .addEventListener("input", calculerCouts);

    ajouterIngredient();

    afficherRecettes();

});
