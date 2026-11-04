import { formatCurrency } from './formatters';
import type { Transaction } from '../types/banking';

/**
 * Textes des notifications et confirmations (style SMS de confirmation Mobile Money) :
 * un titre court qui dit ce qui s'est passé, puis le montant, la contrepartie, le canal,
 * les frais et le nouveau solde quand il est connu.
 */

const fcfa = (n: number) => formatCurrency(n, 'XOF');

/** Nom de la contrepartie sans le numéro (« Fatou Sow · +221… » → « Fatou Sow »). */
const party = (s?: string) => (s ?? '').split(' · ')[0].trim();

/** Libellé court de l'opération, utilisé dans l'historique. */
export function operationLabel(tx: Transaction): string {
  const via = tx.paymentMethod ? ` · ${tx.paymentMethod}` : '';
  switch (tx.type) {
    case 'transfer_in':
      return `Reçu${via}`;
    case 'salary':
      return 'Virement reçu';
    case 'deposit':
      return `Dépôt${via}`;
    case 'transfer_out':
      return `Envoyé${via}`;
    case 'withdrawal':
      return tx.code ? 'Retrait chez un agent' : `Retrait${via}`;
    case 'card_payment':
    case 'pos':
      return 'Paiement par carte';
    case 'bill':
      return 'Facture';
    case 'topup':
      return 'Crédit téléphonique';
    case 'subscription':
      return 'Abonnement';
    default:
      return tx.subtitle;
  }
}

export interface OperationMessage {
  title: string;
  body: string;
  details: string;
}

export function operationMessage(tx: Transaction, newBalance?: number): OperationMessage {
  const amount = fcfa(Math.abs(tx.amount));
  const fee = tx.amount < 0 && tx.fee ? ` Frais : ${fcfa(tx.fee)}.` : '';
  const balance = newBalance !== undefined ? ` Nouveau solde : ${fcfa(newBalance)}.` : '';
  const ref = ` Réf. ${tx.reference}.`;
  const via = tx.paymentMethod ? ` via ${tx.paymentMethod}` : '';

  if (tx.status === 'failed') {
    const body =
      tx.amount > 0
        ? `Le transfert de ${amount} de ${party(tx.sender) || tx.title} n'a pas abouti.`
        : `Votre opération de ${amount} (${tx.title}) n'a pas abouti. Aucun montant n'a été débité.`;
    return { title: 'Opération échouée', body, details: body + ref };
  }

  let title: string;
  let body: string;
  switch (tx.type) {
    case 'transfer_in':
    case 'salary':
      title = 'Argent reçu';
      body = `Vous avez reçu ${amount} de ${party(tx.sender) || tx.title}${via}.`;
      break;
    case 'deposit':
      title = 'Dépôt effectué';
      body = `${amount} ont été déposés sur votre compte${via}.`;
      break;
    case 'transfer_out':
      title = 'Envoi effectué';
      body = `Vous avez envoyé ${amount} à ${party(tx.recipient) || tx.title}${via}.`;
      break;
    case 'withdrawal':
      title = 'Retrait effectué';
      body = tx.code ? `Retrait de ${amount} chez un agent. Code : ${tx.code} (valable 24 h).` : `Vous avez retiré ${amount}${via}.`;
      break;
    case 'card_payment':
    case 'pos':
      title = 'Paiement accepté';
      body = `Achat de ${amount} chez ${tx.title}.`;
      break;
    case 'bill':
      title = 'Facture payée';
      body = `Votre facture ${tx.title} de ${amount} est réglée.`;
      break;
    case 'topup':
      title = 'Recharge effectuée';
      body = `${amount} de crédit envoyés au ${tx.subtitle}.`;
      break;
    case 'subscription':
      title = 'Abonnement payé';
      body = `${tx.title} : ${amount} prélevés.`;
      break;
    default:
      title = 'Opération effectuée';
      body = `${tx.title} : ${amount}.`;
  }
  return { title, body: body + fee + balance, details: body + fee + balance + ref };
}
