import React from 'react';
import './TermsPage.css';

function TermsPage() {
  return (
    <div className="terms-page">
      <div className="terms-container">
        <h1 className="terms-main-title">Conditions Générales d'Utilisation</h1>

        <section className="terms-section">
          <h2>1. Objet</h2>
          <p>
            Bana Frites est une plateforme numérique destinée aux jeunes, proposant l'envoi de
            messages anonymes, un système de mise en relation (matching), et des jeux interactifs.
          </p>
        </section>

        <section className="terms-section">
          <h2>2. Âge minimum</h2>
          <p>
            L'inscription est réservée aux personnes âgées de 18 ans et plus. En vous inscrivant,
            vous certifiez avoir l'âge requis.
          </p>
        </section>

        <section className="terms-section">
          <h2>3. Contenu et comportement des utilisateurs</h2>
          <p>
            Vous vous engagez à ne pas publier ou envoyer de contenu illégal, harcelant,
            menaçant, à caractère sexuel envers des mineurs, ou portant atteinte aux droits
            d'autrui. Bana Frites se réserve le droit de suspendre tout compte ne respectant
            pas ces règles.
          </p>
        </section>

        <section className="terms-section">
          <h2>4. Paiements</h2>
          <p>
            Certaines fonctionnalités (révélation d'identité, options premium) sont payantes,
            traitées via notre prestataire de paiement SasPay. Les paiements sont non
            remboursables une fois le service rendu, sauf erreur technique avérée.
          </p>
        </section>

        <section className="terms-section">
          <h2>5. Anonymat et responsabilité</h2>
          <p>
            Bana Frites permet l'envoi de messages anonymes. L'éditeur ne peut être tenu
            responsable du contenu envoyé par les utilisateurs entre eux, mais coopérera avec
            les autorités compétentes en cas de signalement d'abus grave.
          </p>
        </section>

        <section className="terms-section">
          <h2>6. Données personnelles</h2>
          <p>
            Les données collectées (nom, email, date de naissance) sont utilisées uniquement
            pour le fonctionnement du service, stockées via Firebase (Google). Elles ne sont
            pas vendues à des tiers.
          </p>
        </section>

        <section className="terms-section">
          <h2>7. Droit applicable</h2>
          <p>
            Les présentes conditions sont régies par le droit de la République Démocratique
            du Congo.
          </p>
        </section>

        <section className="terms-section">
          <h2>8. Contact</h2>
          <p>
            Pour toute question concernant ces conditions ou pour signaler un abus, vous
            pouvez nous contacter :
            <br />
            Téléphone : +243 977 092 549
            <br />
            Email : optisitedigital@gmail.com
          </p>
        </section>
      </div>
    </div>
  );
}

export default TermsPage;
