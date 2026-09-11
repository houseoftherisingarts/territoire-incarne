// Fabrique un jeton de connexion Firebase (custom token) pour un compte du site, afin que
// Playwright ouvre /admin ou /client avec de vraies données. Signature par IAM signJwt sur le
// compte de service App Engine : le compte gcloud actif doit porter
// roles/iam.serviceAccountTokenCreator sur ce compte de service. Sortie : le jeton, valable 1 h.
//   node scripts/qa/admin-jeton.mjs houseoftherisingarts@gmail.com > /tmp/jeton-admin.txt
import { execSync } from 'node:child_process';
const [,, email = 'houseoftherisingarts@gmail.com'] = process.argv;
const P = 'territoireincarne-80bb9';
const TOK = execSync('gcloud auth print-access-token', { encoding: 'utf8' }).trim();
const H = { Authorization: `Bearer ${TOK}`, 'Content-Type': 'application/json', 'x-goog-user-project': P };
const post = (url, body) => fetch(url, { method: 'POST', headers: H, body: JSON.stringify(body) }).then((r) => r.json());
const lk = await post(`https://identitytoolkit.googleapis.com/v1/projects/${P}/accounts:lookup`, { email: [email] });
const uid = lk.users?.[0]?.localId;
if (!uid) { console.error('compte introuvable', JSON.stringify(lk.error || lk).slice(0, 200)); process.exit(1); }
const SA = `${P}@appspot.gserviceaccount.com`;
const now = Math.floor(Date.now() / 1000);
const payload = { iss: SA, sub: SA, aud: 'https://identitytoolkit.googleapis.com/google.identity.identitytoolkit.v1.IdentityToolkit', iat: now, exp: now + 3600, uid };
const r = await post(`https://iamcredentials.googleapis.com/v1/projects/-/serviceAccounts/${SA}:signJwt`, { payload: JSON.stringify(payload) });
if (!r.signedJwt) { console.error('signJwt refusé', JSON.stringify(r.error).slice(0, 200)); process.exit(1); }
process.stdout.write(r.signedJwt);
