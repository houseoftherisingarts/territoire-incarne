// Garde de déploiement : un dépôt sale ne se déploie pas (un déploiement emporte tout l'arbre de
// travail, même ce que personne n'a commité), puis build et prérendu des pages.
import { execSync } from 'node:child_process';

const sale = execSync('git status --porcelain', { encoding: 'utf8' }).trim();
if (sale) {
  console.error('predeploy : le dépôt a des changements non commités. Committez ou remisez avant de déployer.\n' + sale);
  process.exit(1);
}
execSync('npm run build', { stdio: 'inherit' });
execSync('node scripts/prerender-meta.mjs', { stdio: 'inherit' });
