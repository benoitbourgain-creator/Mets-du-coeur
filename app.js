
/* =================================
   METS DU CŒUR – APPLICATION
================================= */

// Initialisation de l'application
document.addEventListener("DOMContentLoaded", () => {

    console.log("Mets du cœur : application initialisée ❤️");

    // Date du jour
    afficherDate();

    // Initialisation des compteurs
    actualiserTableauDeBord();

    // Activation du service worker
    enregistrerServiceWorker();

});


// =================================
// DATE DU JOUR
// =================================

function afficherDate() {

    const zoneDate = document.querySelector("#current-date");

    if (!zoneDate) return;

    const aujourdHui = new Date();

    zoneDate.textContent = aujourdHui.toLocaleDateString("fr-FR", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric"
    });
}


// =================================
// TABLEAU DE BORD
// =================================

function actualiserTableauDeBord() {

    const commandes = JSON.parse(
        localStorage.getItem("mets-coeur-commandes") || "[]"
    );

    const plats = JSON.parse(
        localStorage.getItem("mets-coeur-production") || "[]"
    );

    const compteurCommandes = document.querySelector("#orders-count");
    const compteurPlats = document.querySelector("#meals-count");

    if (compteurCommandes) {
        compteurCommandes.textContent = commandes.length;
    }

    if (compteurPlats) {
        compteurPlats.textContent = plats.reduce(
            (total, plat) => total + Number(plat.quantite || 0),
            0
        );
    }
}


// =================================
// SERVICE WORKER
// =================================

function enregistrerServiceWorker() {

    if ("serviceWorker" in navigator) {

        navigator.serviceWorker.register("./sw.js")
            .then(() => {
                console.log("Application prête pour le mode hors ligne.");
            })
            .catch((erreur) => {
                console.error("Erreur Service Worker :", erreur);
            });

    }

}
