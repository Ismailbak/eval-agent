const pptxgen = require("pptxgenjs");
const path = require("path");
const sharp = require("sharp");
const React = require("react");
const RS = require("react-dom/server");
const fa = require("react-icons/fa");
const { applyTheme } = require("C:/Users/DELL/.claude/skills/synced/7d70812e-e8b4-45db-b711-cfcbb2a23eec_4a5b2866-b17b-4c3d-86ec-8be41008b18c/pptx/scripts/apply_theme.js");

const HEX = { dark: "0F6B43", green: "168A57", light: "E3F3EA", ink: "1B2420", muted: "5F6B65", amber: "B7791F", red: "8C2A22", mint: "9CC9B1", line: "DCDFDC" };
const THEME = {
  name: "EMSI Evaluation",
  headFontFace: "Cambria",
  bodyFontFace: "Calibri",
  colors: {
    dk1: HEX.ink, lt1: "FFFFFF", dk2: HEX.dark, lt2: HEX.light,
    accent1: HEX.green, accent2: HEX.dark, accent3: HEX.amber, accent4: HEX.red, accent5: HEX.muted, accent6: HEX.mint,
    hlink: HEX.green, folHlink: HEX.muted,
  },
};

const OUT = path.join(__dirname, "EMSI_Evaluation_Supports_Cours.pptx");
const SH = (n) => path.join(__dirname, "shots", n);
const LOGO = path.join(__dirname, "..", "frontend", "public", "emsi-logo.png");

async function icon(name, color) {
  const svg = RS.renderToStaticMarkup(React.createElement(fa[name], { color: "#" + color, size: 256 }));
  const buf = await sharp(Buffer.from(svg)).resize(256, 256, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer();
  return "image/png;base64," + buf.toString("base64");
}

(async () => {
  const pres = new pptxgen();
  pres.layout = "LAYOUT_16x9"; // 10 x 5.625
  pres.title = "Évaluation intelligente des supports de cours";
  pres.theme = { headFontFace: THEME.headFontFace, bodyFontFace: THEME.bodyFontFace };
  const C = pres.SchemeColor;
  const W = 10;

  // ---------- layouts ----------
  pres.defineSlideMaster({
    title: "TITRE_SOMBRE",
    background: { color: C.text2 },
    objects: [
      { placeholder: { options: { name: "title", type: "title", x: 0.6, y: 1.75, w: 5.6, h: 1.7, fontSize: 34, bold: true, color: C.background1, valign: "top", margin: 0 }, text: "" } },
    ],
  });
  pres.defineSlideMaster({
    title: "CONTENU",
    background: { color: C.background1 },
    objects: [
      { placeholder: { options: { name: "title", type: "title", x: 0.6, y: 0.35, w: 8.8, h: 0.75, fontSize: 34, bold: true, color: C.text2, valign: "middle", margin: 0 }, text: "" } },
      { text: { text: "EMSI  ·  Évaluation des supports de cours", options: { x: 0.6, y: 5.2, w: 5, h: 0.25, fontSize: 10, color: C.accent5, margin: 0 } } },
    ],
    slideNumber: { x: 9.0, y: 5.2, w: 0.4, h: 0.25, fontSize: 10, color: C.accent5, align: "right" },
  });

  // ---------- helpers ----------
  const shadow = () => ({ type: "outer", color: "000000", opacity: 0.14, blur: 8, offset: 2, angle: 90 });
  const content = (title, section) => {
    const s = pres.addSlide({ masterName: "CONTENU", sectionTitle: section });
    s.addText(title, { placeholder: "title" });
    return s;
  };
  const circleIcon = (s, x, y, d, data, fill, name) => {
    s.addShape(pres.shapes.OVAL, { x, y, w: d, h: d, fill: { color: fill }, line: { color: fill, width: 0 }, objectName: name + " cercle" });
    const p = d * 0.27;
    s.addImage({ data, x: x + p, y: y + p, w: d - 2 * p, h: d - 2 * p, objectName: name + " icône" });
  };
  const shot = (s, file, x, y, w, name) => {
    const h = (w * 810) / 1440;
    s.addShape(pres.shapes.RECTANGLE, { x: x - 0.04, y: y - 0.04, w: w + 0.08, h: h + 0.08, fill: { color: C.background1 }, line: { color: "DCDFDC", width: 0.75 }, shadow: shadow(), objectName: name + " cadre" });
    s.addImage({ path: SH(file), x, y, w, h, altText: name, objectName: name });
    return h;
  };
  const caption = (s, text, x, y, w) => s.addText(text, { x, y, w, h: 0.3, fontSize: 12, color: C.accent5, italic: true, margin: 0, isTextBox: true });
  const bullets = (items, o = {}) => items.map((t, i) => ({ text: t, options: { bullet: true, breakLine: i < items.length - 1, paraSpaceAfter: o.gap ?? 6 } }));

  const ic = {};
  for (const [k, [n, c]] of Object.entries({
    prof: ["FaChalkboardTeacher", "FFFFFF"], coord: ["FaUserTie", "FFFFFF"], robot: ["FaRobot", "FFFFFF"],
    layers: ["FaLayerGroup", "FFFFFF"], clock: ["FaClock", "FFFFFF"], balance: ["FaBalanceScale", "FFFFFF"],
    search: ["FaSearch", "FFFFFF"], key: ["FaKey", "FFFFFF"], ppt: ["FaFilePowerpoint", "FFFFFF"], history: ["FaHistory", "FFFFFF"],
    server: ["FaServer", "FFFFFF"], sitemap: ["FaSitemap", "FFFFFF"], file: ["FaFileAlt", "FFFFFF"], brain: ["FaBrain", "FFFFFF"], cloud: ["FaCloud", "FFFFFF"], lock: ["FaLock", "FFFFFF"], plug: ["FaPlug", "FFFFFF"], users: ["FaUsers", "FFFFFF"], tools: ["FaTools", "FFFFFF"],
  })) ic[k] = await icon(n, c);

  // ============ 1. Titre ============
  {
    pres.addSection({ title: "Introduction" });
    const s = pres.addSlide({ masterName: "TITRE_SOMBRE", sectionTitle: "Introduction" });
    s.addImage({ path: LOGO, x: 0.6, y: 0.55, w: 3.0, h: 3.0 * 345 / 1590, altText: "Logo EMSI", objectName: "Logo EMSI" });
    s.addText("Évaluation intelligente des supports de cours", { placeholder: "title" });
    s.addText("Une plateforme pour les professeurs et les coordinateurs", { x: 0.6, y: 3.6, w: 5.4, h: 0.6, fontSize: 18, color: C.background2, margin: 0, isTextBox: true });
    s.addText("Présentation de l'application  ·  Novembre 2026", { x: 0.6, y: 4.85, w: 5.4, h: 0.3, fontSize: 12, color: C.accent6, margin: 0, isTextBox: true });
    s.addChart(pres.charts.DOUGHNUT, [{ name: "Score", labels: ["Conforme", "Restant"], values: [78, 22] }], {
      x: 6.0, y: 0.9, w: 3.6, h: 3.6, holeSize: 74, chartColors: ["FFFFFF", "2C8A62"], showLegend: false, showLabel: false, showValue: false, showPercent: false,
      dataBorder: { pt: 0, color: "0F6B43" }, objectName: "Jauge décorative",
    });
    s.addText([{ text: "78", options: { fontSize: 54, bold: true, color: C.background1, fontFace: "Cambria" } }, { text: " %", options: { fontSize: 22, color: C.background2 } }],
      { x: 6.0, y: 2.05, w: 3.6, h: 0.9, align: "center", valign: "middle", margin: 0, isTextBox: true });
    s.addText("CONFORME AU SYLLABUS", { x: 6.0, y: 2.85, w: 3.6, h: 0.3, align: "center", fontSize: 11, bold: true, color: C.accent6, charSpacing: 3, margin: 0, isTextBox: true });
    s.addNotes("Bonjour à toutes et à tous. Je vous présente une application web qui aide les coordinateurs à vérifier que les supports de cours proposés par les professeurs respectent le syllabus du module. Le score affiché à droite est celui d'un vrai cas de test que nous verrons plus loin.");
  }

  // ============ 2. Contexte ============
  {
    pres.addSection({ title: "Contexte et solution" });
    const s = content("Le défi : évaluer à grande échelle", "Contexte et solution");
    const rows = [
      [ic.layers, "Des supports hétérogènes", "Structure, niveau de détail et format varient d'un enseignant à l'autre."],
      [ic.clock, "Une revue manuelle longue", "Chaque coordinateur relit chaque support face au descriptif du module."],
      [ic.balance, "Un retour tardif", "Les écarts sont repérés tard, parfois après le début du semestre."],
    ];
    rows.forEach(([d, h, t], i) => {
      const y = 1.5 + i * 1.18;
      circleIcon(s, 0.6, y + 0.08, 0.7, d, C.accent1, "Contexte " + (i + 1));
      s.addText(h, { x: 1.55, y, w: 4.3, h: 0.35, fontSize: 18, bold: true, color: C.text1, margin: 0, isTextBox: true });
      s.addText(t, { x: 1.55, y: y + 0.38, w: 4.3, h: 0.7, fontSize: 14, color: C.accent5, margin: 0, valign: "top", isTextBox: true });
    });
    s.addShape(pres.shapes.RECTANGLE, { x: 6.2, y: 1.5, w: 3.2, h: 3.4, fill: { color: C.background2 }, line: { color: C.background2, width: 0 }, objectName: "Encadré question" });
    s.addText("Comment garantir que chaque support respecte le syllabus, sans alourdir le travail des coordinateurs ?", {
      x: 6.45, y: 1.75, w: 2.7, h: 2.9, fontSize: 20, italic: true, fontFace: "Cambria", color: C.text2, valign: "middle", margin: 0, isTextBox: true,
    });
    s.addNotes("Aujourd'hui, la vérification de conformité est manuelle. Les supports sont hétérogènes, la relecture est longue et les écarts sont souvent détectés tard. La question centrale : comment garantir la conformité au syllabus sans surcharger les coordinateurs ?");
  }

  // ============ 3. Solution ============
  {
    const s = content("Une plateforme, deux espaces", "Contexte et solution");
    const cols = [
      { x: 0.6, ic: ic.prof, t: "Espace professeur", fill: C.background2, tc: C.text2, bc: C.text1, items: ["Dépose un support (PDF, DOCX, TXT)", "Choisit le module concerné", "Suit le statut et les retours"] },
      { x: 3.65, ic: ic.robot, t: "Agent d'évaluation", fill: C.accent1, tc: C.background1, bc: C.background1, items: ["Lit le support déposé", "Le compare aux critères du syllabus", "Produit score, preuves et suggestions"] },
      { x: 6.7, ic: ic.coord, t: "Espace coordinateur", fill: C.background2, tc: C.text2, bc: C.text1, items: ["Définit syllabus et critères", "Lance l'évaluation", "Valide ou demande des corrections"] },
    ];
    cols.forEach((c, i) => {
      s.addShape(pres.shapes.RECTANGLE, { x: c.x, y: 1.45, w: 2.7, h: 3.45, fill: { color: c.fill }, line: { color: c.fill, width: 0 }, shadow: i === 1 ? shadow() : undefined, objectName: c.t + " carte" });
      circleIcon(s, c.x + 0.25, 1.7, 0.7, c.ic, i === 1 ? C.accent2 : C.accent1, c.t);
      s.addText(c.t, { x: c.x + 0.25, y: 2.5, w: 2.25, h: 0.4, fontSize: 18, bold: true, color: c.tc, margin: 0, isTextBox: true });
      s.addText(bullets(c.items, { gap: 8 }), { x: c.x + 0.25, y: 3.0, w: 2.25, h: 1.8, fontSize: 14, color: c.bc, margin: 0, valign: "top", isTextBox: true });
    });
    [3.32, 6.37].forEach((x, i) => s.addShape(pres.shapes.RIGHT_ARROW, { x, y: 3.0, w: 0.3, h: 0.3, fill: { color: C.accent5 }, line: { color: C.accent5, width: 0 }, objectName: "Flèche " + (i + 1) }));
    s.addNotes("La plateforme propose deux interfaces. Le professeur dépose son support. Le coordinateur définit les critères issus du syllabus et lance l'agent d'évaluation, qui compare le support aux critères et produit un rapport détaillé. Le coordinateur garde la décision finale.");
  }

  // ============ 4. Parcours ============
  {
    const s = content("Le parcours d'un support", "Contexte et solution");
    const steps = [
      ["1", "Syllabus", "Coordinateur", "Critères, poids et seuil de validation"],
      ["2", "Dépôt", "Professeur", "Fichier, module et notes"],
      ["3", "Analyse", "Agent IA", "Score, preuves, suggestions"],
      ["4", "Décision", "Coordinateur", "Valider ou demander des corrections"],
      ["5", "Retour", "Professeur", "Statut et commentaire visibles"],
    ];
    const x0 = 0.6, step = 1.78;
    s.addShape(pres.shapes.LINE, { x: x0 + 0.4, y: 1.95, w: step * 4, h: 0, line: { color: HEX.mint, width: 2 }, objectName: "Ligne du parcours" });
    steps.forEach(([n, t, who, d], i) => {
      const x = x0 + i * step;
      s.addShape(pres.shapes.OVAL, { x, y: 1.55, w: 0.8, h: 0.8, fill: { color: i === 2 ? C.accent2 : C.accent1 }, line: { color: C.background1, width: 3 }, objectName: "Étape " + n });
      s.addText(n, { x, y: 1.55, w: 0.8, h: 0.8, align: "center", valign: "middle", fontSize: 24, bold: true, color: C.background1, fontFace: "Cambria", margin: 0, isTextBox: true });
      s.addText(t, { x: x - 0.2, y: 2.5, w: 1.2, h: 0.35, fontSize: 18, bold: true, color: C.text1, align: "center", margin: 0, isTextBox: true });
      s.addText(who.toUpperCase(), { x: x - 0.25, y: 2.88, w: 1.3, h: 0.25, fontSize: 10, bold: true, color: C.accent1, align: "center", charSpacing: 1, margin: 0, isTextBox: true });
      s.addText(d, { x: x - 0.3, y: 3.2, w: 1.4, h: 0.8, fontSize: 12, color: C.accent5, align: "center", valign: "top", margin: 0, isTextBox: true });
    });
    s.addText("Statuts d'une soumission", { x: 0.6, y: 4.3, w: 2.2, h: 0.35, fontSize: 14, bold: true, color: C.text2, margin: 0, valign: "middle", isTextBox: true });
    [["soumis", "EEF3F9", "254A7A"], ["évalué", "FAF4E4", "7A5C12"], ["validé", "E3F3EA", "0F6B43"], ["à corriger", "F8EBE9", "8C2A22"]].forEach(([t, bg, fg], i) => {
      s.addShape(pres.shapes.RECTANGLE, { x: 2.9 + i * 1.5, y: 4.3, w: 1.3, h: 0.35, fill: { color: bg }, line: { color: fg, width: 0.75 }, objectName: "Badge " + t });
      s.addText(t, { x: 2.9 + i * 1.5, y: 4.3, w: 1.3, h: 0.35, align: "center", valign: "middle", fontSize: 12, bold: true, color: fg, margin: 0, isTextBox: true });
    });
    s.addNotes("Le parcours en cinq étapes : le coordinateur définit le syllabus, le professeur dépose son support, l'agent l'analyse, le coordinateur décide, et le professeur reçoit le retour. Chaque soumission passe par quatre statuts : soumis, évalué, validé ou à corriger.");
  }

  // ============ 5. Accueil ============
  {
    pres.addSection({ title: "Démonstration" });
    const s = content("Accueil et connexion", "Démonstration");
    shot(s, "02_login.png", 0.6, 1.5, 5.3, "Capture de la page de connexion");
    shot(s, "01_splash.png", 6.35, 1.5, 3.05, "Capture de l'écran de démarrage");
    caption(s, "Écran de démarrage avec le logo EMSI", 6.35, 3.3, 3.05);
    s.addText(bullets(["Page scindée : présentation de l'école et formulaire", "Deux profils : professeur et coordinateur"], { gap: 6 }), { x: 6.35, y: 3.75, w: 3.05, h: 1.2, fontSize: 14, color: C.text1, margin: 0, valign: "top", isTextBox: true });
    caption(s, "Page de connexion : valeurs de l'école à gauche, formulaire à droite", 0.6, 4.4, 5.3);
    s.addNotes("L'application s'ouvre sur un écran de démarrage avec le logo de l'école, puis sur une page de connexion divisée en deux : à gauche la présentation de l'école, de l'application et de ses valeurs, à droite le formulaire. Des comptes de démonstration permettent de tester les deux profils.");
  }

  // ============ 6. Espace professeur ============
  {
    const s = content("Espace professeur", "Démonstration");
    shot(s, "03_prof_list.png", 0.6, 1.45, 4.25, "Capture de la liste des supports du professeur");
    shot(s, "04_prof_new.png", 5.15, 1.45, 4.25, "Capture du formulaire de dépôt");
    caption(s, "Suivi de mes supports et de leur statut", 0.6, 3.95, 4.25);
    caption(s, "Dépôt d'un support : titre, module, notes, fichier", 5.15, 3.95, 4.25);
    s.addText("Le professeur ne voit que ses propres soumissions, et suit leur évolution jusqu'à la décision.", { x: 0.6, y: 4.45, w: 8.8, h: 0.5, fontSize: 14, color: C.text1, margin: 0, valign: "top", isTextBox: true });
    s.addNotes("Côté professeur : une liste de ses supports avec leur statut, et un formulaire de dépôt simple. Il choisit le module, ajoute des notes pour le coordinateur et joint son fichier. Il ne voit que ses propres soumissions.");
  }

  // ============ 7. Espace coordinateur ============
  {
    const s = content("Espace coordinateur", "Démonstration");
    shot(s, "05_coord_list.png", 0.6, 1.45, 4.25, "Capture de la boîte de réception du coordinateur");
    shot(s, "06_syllabus.png", 5.15, 1.45, 4.25, "Capture de la page des syllabus");
    caption(s, "Boîte de réception filtrable par statut", 0.6, 3.95, 4.25);
    caption(s, "Syllabus et critères, repliables", 5.15, 3.95, 4.25);
    s.addText("Le coordinateur voit toutes les soumissions, lance l'évaluation, décide, et peut supprimer une soumission.", { x: 0.6, y: 4.45, w: 8.8, h: 0.5, fontSize: 14, color: C.text1, margin: 0, valign: "top", isTextBox: true });
    s.addNotes("Le coordinateur dispose d'une boîte de réception filtrable par statut, et d'une page dédiée aux syllabus. Chaque syllabus présente ses critères dans une section repliable. Le coordinateur est le seul à pouvoir lancer l'évaluation, décider, ou supprimer une soumission.");
  }

  // ============ 8. Syllabus ============
  {
    const s = content("Du descriptif aux critères", "Démonstration");
    const steps = [
      ["Importer", "Le coordinateur dépose le descriptif de module (.docx)."],
      ["Générer", "Un brouillon de critères est créé : titres, mots-clés, pondération."],
      ["Ajuster", "Le coordinateur corrige, pondère et enregistre le syllabus."],
    ];
    steps.forEach(([t, d], i) => {
      const y = 1.5 + i * 1.12;
      s.addShape(pres.shapes.OVAL, { x: 0.6, y: y + 0.05, w: 0.55, h: 0.55, fill: { color: C.accent1 }, line: { color: C.accent1, width: 0 }, objectName: "Numéro " + (i + 1) });
      s.addText(String(i + 1), { x: 0.6, y: y + 0.05, w: 0.55, h: 0.55, align: "center", valign: "middle", fontSize: 20, bold: true, color: C.background1, fontFace: "Cambria", margin: 0, isTextBox: true });
      s.addText(t, { x: 1.35, y, w: 3.8, h: 0.35, fontSize: 18, bold: true, color: C.text1, margin: 0, isTextBox: true });
      s.addText(d, { x: 1.35, y: y + 0.38, w: 3.8, h: 0.65, fontSize: 14, color: C.accent5, margin: 0, valign: "top", isTextBox: true });
    });
    [["3", "modules disponibles"], ["16", "critères pour M352"], ["100", "pondération totale"]].forEach(([n, l], i) => {
      const x = 5.6 + (i % 2) * 1.95, y = 1.5 + Math.floor(i / 2) * 1.75;
      s.addShape(pres.shapes.RECTANGLE, { x, y, w: 1.8, h: 1.55, fill: { color: C.background2 }, line: { color: C.background2, width: 0 }, objectName: "Chiffre " + l });
      s.addText(n, { x, y: y + 0.15, w: 1.8, h: 0.85, align: "center", valign: "middle", fontSize: 44, bold: true, color: C.accent1, fontFace: "Cambria", margin: 0, isTextBox: true });
      s.addText(l, { x: x + 0.1, y: y + 1.0, w: 1.6, h: 0.45, align: "center", valign: "top", fontSize: 12, color: C.text1, margin: 0, isTextBox: true });
    });
    s.addText(bullets(["M352 Ponts et béton précontraint", "M214 Bases de données", "M121 Mécanique des sols"], { gap: 4 }), { x: 7.65, y: 3.3, w: 1.85, h: 1.45, fontSize: 12, color: C.text1, margin: 0, valign: "top", isTextBox: true });
    s.addNotes("Le coordinateur peut importer le descriptif de module au format Word. L'application génère un brouillon de critères à partir du contenu : titres, mots-clés, pondération. Le coordinateur relit, ajuste et enregistre. Trois modules sont disponibles dans la démonstration : le vrai descriptif M352 et deux modules fictifs.");
  }

  // ============ 9. Agent ============
  {
    const s = content("L'agent à l'œuvre", "Démonstration");
    shot(s, "07_analysis.png", 0.6, 1.5, 5.6, "Capture de l'animation d'analyse");
    const st = ["Lecture du document", "Extraction du texte", "Mise en correspondance avec le syllabus", "Notation critère par critère", "Synthèse et recommandations"];
    st.forEach((t, i) => {
      const y = 1.5 + i * 0.62;
      s.addShape(pres.shapes.OVAL, { x: 6.6, y: y + 0.03, w: 0.38, h: 0.38, fill: { color: C.accent1 }, line: { color: C.accent1, width: 0 }, objectName: "Pastille " + (i + 1) });
      s.addText(String(i + 1), { x: 6.6, y: y + 0.03, w: 0.38, h: 0.38, align: "center", valign: "middle", fontSize: 14, bold: true, color: C.background1, margin: 0, isTextBox: true });
      s.addText(t, { x: 7.1, y: y - 0.05, w: 2.3, h: 0.55, fontSize: 14, color: C.text1, valign: "middle", margin: 0, isTextBox: true });
    });
    caption(s, "Une animation guidée rend l'analyse lisible pour l'utilisateur", 0.6, 4.45, 5.6);
    s.addNotes("Quand le coordinateur lance l'évaluation, une animation montre les cinq étapes de l'analyse : lecture, extraction, mise en correspondance avec le syllabus, notation critère par critère, et synthèse. Les scores des critères défilent en direct. Avec un agent plus lent, cette animation rendra l'attente compréhensible.");
  }

  // ============ 10. Résultat ============
  {
    const s = content("Un résultat lisible et actionnable", "Démonstration");
    shot(s, "08_result.png", 0.6, 1.5, 5.6, "Capture du résultat d'évaluation");
    const pts = [
      ["Score global", "Jauge animée et seuil de validation du module."],
      ["Détail par critère", "Score, preuves détectées et suggestion."],
      ["Décision", "Le coordinateur valide ou demande des corrections, avec commentaire."],
    ];
    pts.forEach(([t, d], i) => {
      const y = 1.5 + i * 1.1;
      s.addText(t, { x: 6.6, y, w: 2.8, h: 0.35, fontSize: 18, bold: true, color: C.text2, margin: 0, isTextBox: true });
      s.addText(d, { x: 6.6, y: y + 0.37, w: 2.8, h: 0.75, fontSize: 14, color: C.text1, margin: 0, valign: "top", isTextBox: true });
    });
    s.addNotes("Le résultat affiche le score global dans une jauge, un résumé, puis le détail critère par critère avec les preuves trouvées et une suggestion. Le coordinateur peut ensuite valider ou demander des corrections en laissant un commentaire que le professeur verra.");
  }

  // ============ 11. Cas réel ============
  {
    const s = content("Cas réel : module M352", "Démonstration");
    s.addChart(pres.charts.DOUGHNUT, [{ name: "Score", labels: ["Conforme", "Restant"], values: [78, 22] }], {
      x: 0.6, y: 1.4, w: 3.3, h: 3.3, holeSize: 72, chartColors: [HEX.green, HEX.line], showLegend: false, showLabel: false, showValue: false, showPercent: false,
      dataBorder: { pt: 0, color: "FFFFFF" }, objectName: "Jauge M352",
    });
    s.addText([{ text: "78", options: { fontSize: 48, bold: true, color: C.text1, fontFace: "Cambria" } }, { text: " %", options: { fontSize: 20, color: C.accent5 } }],
      { x: 0.6, y: 2.35, w: 3.3, h: 0.9, align: "center", valign: "middle", margin: 0, isTextBox: true });
    s.addText("Conforme (seuil 70 %)", { x: 0.6, y: 4.6, w: 3.3, h: 0.3, align: "center", fontSize: 14, bold: true, color: C.accent1, margin: 0, isTextBox: true });
    [["127", "diapositives analysées"], ["10 027", "mots lus"], ["16", "critères évalués"]].forEach(([n, l], i) => {
      const x = 4.4 + i * 1.7;
      s.addShape(pres.shapes.RECTANGLE, { x, y: 1.5, w: 1.55, h: 1.5, fill: { color: C.background2 }, line: { color: C.background2, width: 0 }, objectName: "Chiffre " + l });
      s.addText(n, { x, y: 1.6, w: 1.55, h: 0.75, align: "center", valign: "middle", fontSize: 30, bold: true, color: C.accent1, fontFace: "Cambria", margin: 0, isTextBox: true });
      s.addText(l, { x: x + 0.08, y: 2.35, w: 1.39, h: 0.55, align: "center", valign: "top", fontSize: 12, color: C.text1, margin: 0, isTextBox: true });
    });
    s.addText("Le support « Dimensionnement des ponts » est jugé conforme. L'agent signale toutefois l'absence de termes comme « compétence » et « bibliographie » : des pistes concrètes pour le professeur.", {
      x: 4.4, y: 3.3, w: 5.0, h: 1.5, fontSize: 16, color: C.text1, margin: 0, valign: "top", isTextBox: true,
    });
    s.addNotes("Test réel avec le descriptif du module M352 et un cours de dimensionnement des ponts de 127 diapositives. L'agent lit environ 10 000 mots, évalue 16 critères et donne 78 %, donc conforme au seuil de 70 %. Il signale aussi des éléments absents, comme la bibliographie et la mention des compétences.");
  }

  // ============ 12. Architecture ============
  {
    pres.addSection({ title: "Technique, limites et perspectives" });
    const s = content("Architecture technique", "Technique, limites et perspectives");
    const boxes = [
      ["Interface", "React + Vite", "Espaces professeur et coordinateur"],
      ["API", "FastAPI (Python)", "Rôles, soumissions, syllabus"],
      ["Données", "SQLite + fichiers", "Utilisateurs, critères, évaluations"],
      ["Évaluateur", "Module interchangeable", "Une seule fonction : evaluate()"],
    ];
    boxes.forEach(([t, tech, d], i) => {
      const x = 0.6 + i * 2.25, last = i === 3;
      s.addShape(pres.shapes.RECTANGLE, { x, y: 1.6, w: 1.95, h: 2.2, fill: { color: last ? C.background1 : C.background2 }, line: { color: last ? C.accent1 : C.background2, width: last ? 2 : 0, dashType: last ? "dash" : "solid" }, objectName: t + " bloc" });
      s.addText(t.toUpperCase(), { x: x + 0.15, y: 1.75, w: 1.65, h: 0.3, fontSize: 11, bold: true, color: C.accent1, charSpacing: 2, margin: 0, isTextBox: true });
      s.addText(tech, { x: x + 0.15, y: 2.1, w: 1.65, h: 0.7, fontSize: 18, bold: true, color: C.text2, fontFace: "Cambria", margin: 0, valign: "top", isTextBox: true });
      s.addText(d, { x: x + 0.15, y: 2.85, w: 1.65, h: 0.85, fontSize: 12, color: C.text1, margin: 0, valign: "top", isTextBox: true });
      if (i < 3) s.addShape(pres.shapes.RIGHT_ARROW, { x: x + 1.99, y: 2.55, w: 0.22, h: 0.26, fill: { color: C.accent5 }, line: { color: C.accent5, width: 0 }, objectName: "Flèche " + (i + 1) });
    });
    s.addText("Remplacer le moteur d'évaluation ne change ni l'interface, ni les données : c'est le point d'extension prévu pour un agent basé sur un modèle de langage, hébergé dans le cloud ou exécuté localement.", {
      x: 0.6, y: 4.1, w: 8.8, h: 0.85, fontSize: 16, color: C.text1, margin: 0, valign: "top", isTextBox: true,
    });
    s.addNotes("L'architecture est volontairement simple : une interface React, une API FastAPI en Python, une base SQLite et un module d'évaluation. Ce dernier est isolé derrière une seule fonction. C'est le point d'extension qui permettra de brancher un vrai modèle de langage sans toucher au reste.");
  }

  // ============ 13. Limites ============
  {
    const s = content("Limites actuelles", "Technique, limites et perspectives");
    const lim = [
      [ic.search, "Évaluation par mots-clés", "La présence d'un terme ne prouve pas la couverture réelle du contenu."],
      [ic.ppt, "Formats limités", "PDF, DOCX et TXT seulement : ni PowerPoint, ni PDF scanné."],
      [ic.key, "Sécurité de démonstration", "Mots de passe en clair, sessions perdues au redémarrage."],
      [ic.file, "Import du syllabus heuristique", "Les mots-clés générés doivent être relus par le coordinateur."],
      [ic.history, "Pas de suivi dans le temps", "Ni versions, ni historique, ni notifications."],
      [ic.server, "Passage à l'échelle", "Base SQLite, serveur unique, pas de journal d'audit."],
    ];
    lim.forEach(([d, t, x], i) => {
      const cx = 0.6 + (i % 2) * 4.5, cy = 1.4 + Math.floor(i / 3 * 0 + (i >> 1)) * 1.2;
      circleIcon(s, cx, cy + 0.05, 0.62, d, C.accent3, "Limite " + (i + 1));
      s.addText(t, { x: cx + 0.8, y: cy, w: 3.6, h: 0.35, fontSize: 16, bold: true, color: C.text1, margin: 0, isTextBox: true });
      s.addText(x, { x: cx + 0.8, y: cy + 0.35, w: 3.6, h: 0.65, fontSize: 13, color: C.accent5, margin: 0, valign: "top", isTextBox: true });
    });
    s.addNotes("Soyons transparents sur les limites. L'agent actuel est un prototype : il repose sur des mots-clés et ne comprend pas le contenu. Les formats acceptés sont limités, la sécurité est celle d'une démonstration, l'import du syllabus est heuristique, il n'y a pas d'historique ni de notifications, et l'infrastructure n'est pas prévue pour un grand nombre d'utilisateurs.");
  }

  // ============ 14. Améliorations ============
  {
    const s = content("Comment progresser", "Technique, limites et perspectives");
    const head = (t) => ({ text: t, options: { bold: true, color: "FFFFFF", fill: { color: HEX.dark }, fontSize: 14 } });
    const row = (a, b) => [{ text: a, options: { bold: true, color: HEX.ink, fontSize: 14 } }, { text: b, options: { color: HEX.ink, fontSize: 14 } }];
    s.addTable([
      [head("Limite"), head("Amélioration envisagée")],
      row("Mots-clés", "Évaluateur à modèle de langage (cloud ou local), avec preuves citées (diapositive, page)"),
      row("Formats", "Support de PowerPoint, OCR pour les PDF scannés, découpage par chapitre"),
      row("Sécurité", "Reprise de l'authentification et des rôles de CampuSphere"),
      row("Syllabus", "Extraction complète du descriptif : volumes horaires, modalités, évaluation"),
      row("Suivi", "Versions, nouveau dépôt après correction, notifications, rapport PDF"),
      row("Échelle", "PostgreSQL, tâches asynchrones, journal d'audit, tests automatisés"),
    ], { x: 0.6, y: 1.4, w: 8.8, colW: [1.7, 7.1], rowH: 0.5, border: { type: "solid", pt: 0.75, color: HEX.line }, fill: { color: "FFFFFF" }, valign: "middle", margin: [0.04, 0.12, 0.04, 0.12], objectName: "Tableau des améliorations" });
    s.addNotes("Chaque limite a une réponse. La plus importante : remplacer le moteur à mots-clés par un modèle de langage qui lit le support et le syllabus ensemble et cite ses preuves. Ensuite, élargir les formats, sécuriser l'accès, enrichir l'import du syllabus, ajouter le suivi des versions et préparer le passage à l'échelle.");
  }


  // ============ 15. Agents cloud ou locaux ============
  {
    const s = content("Agents cloud ou locaux", "Technique, limites et perspectives");
    const cols = [
      { x: 0.6, ic: ic.cloud, t: "Agent cloud", sub: "Modèle de langage hébergé", pro: ["Qualité de raisonnement maximale", "Aucune infrastructure à gérer", "Mises à jour continues"], con: ["Supports envoyés à un service externe", "Coût à l'usage", "Dépend de la connexion"] },
      { x: 5.1, ic: ic.server, t: "Agent local", sub: "Modèle exécuté sur nos serveurs", pro: ["Les données restent dans l'établissement", "Coût maîtrisé", "Fonctionne hors ligne"], con: ["Qualité généralement inférieure", "Matériel dédié (GPU) à prévoir", "Maintenance à notre charge"] },
    ];
    cols.forEach((c) => {
      s.addShape(pres.shapes.RECTANGLE, { x: c.x, y: 1.4, w: 4.3, h: 2.95, fill: { color: C.background2 }, line: { color: C.background2, width: 0 }, objectName: c.t + " carte" });
      circleIcon(s, c.x + 0.25, 1.6, 0.65, c.ic, C.accent1, c.t);
      s.addText(c.t, { x: c.x + 1.1, y: 1.6, w: 3.0, h: 0.35, fontSize: 18, bold: true, color: C.text2, margin: 0, isTextBox: true });
      s.addText(c.sub, { x: c.x + 1.1, y: 1.95, w: 3.0, h: 0.3, fontSize: 12, color: C.accent5, margin: 0, isTextBox: true });
      s.addText("ATOUTS", { x: c.x + 0.25, y: 2.45, w: 1.8, h: 0.25, fontSize: 10, bold: true, color: C.accent1, charSpacing: 2, margin: 0, isTextBox: true });
      s.addText(bullets(c.pro, { gap: 3 }), { x: c.x + 0.25, y: 2.7, w: 1.85, h: 1.55, fontSize: 12, color: C.text1, margin: 0, valign: "top", isTextBox: true });
      s.addText("CONTRAINTES", { x: c.x + 2.2, y: 2.45, w: 1.9, h: 0.25, fontSize: 10, bold: true, color: C.accent3, charSpacing: 2, margin: 0, isTextBox: true });
      s.addText(bullets(c.con, { gap: 3 }), { x: c.x + 2.2, y: 2.7, w: 1.95, h: 1.55, fontSize: 12, color: C.text1, margin: 0, valign: "top", isTextBox: true });
    });
    s.addText("Même interface, même rapport : l'agent se choisit par module ou par établissement, sans rien changer pour le professeur ni le coordinateur.", {
      x: 0.6, y: 4.5, w: 8.8, h: 0.6, fontSize: 16, bold: true, color: C.text2, margin: 0, valign: "top", isTextBox: true,
    });
    s.addNotes("Nous proposons aussi des agents locaux. Un agent cloud offre la meilleure qualité mais envoie les supports à un service externe. Un agent local garde les données dans l'établissement et maîtrise les coûts, au prix d'une qualité souvent moindre et d'un matériel à prévoir. Comme l'évaluateur est interchangeable, le choix peut se faire par module ou par établissement.");
  }

  // ============ 16. Recommandation CampuSphere ============
  {
    const s = content("Recommandation : CampuSphere", "Technique, limites et perspectives");
    // schematic of the platform with the new module
    s.addShape(pres.shapes.RECTANGLE, { x: 0.6, y: 1.4, w: 4.6, h: 3.1, fill: { color: C.background2 }, line: { color: C.accent1, width: 1.5 }, objectName: "Plateforme CampuSphere" });
    s.addText("PLATEFORME CLOUD CAMPUSPHERE", { x: 0.85, y: 1.55, w: 4.1, h: 0.3, fontSize: 11, bold: true, color: C.accent1, charSpacing: 2, margin: 0, isTextBox: true });
    s.addText("Espace coordinateur", { x: 0.85, y: 1.88, w: 4.1, h: 0.35, fontSize: 18, bold: true, color: C.text2, fontFace: "Cambria", margin: 0, isTextBox: true });
    ["Fonctions existantes", "Fonctions existantes"].forEach((t, i) => {
      s.addShape(pres.shapes.RECTANGLE, { x: 0.85 + i * 2.1, y: 2.4, w: 1.95, h: 0.6, fill: { color: C.background1 }, line: { color: "DCDFDC", width: 0.75 }, objectName: "Module existant " + (i + 1) });
      s.addText(t, { x: 0.85 + i * 2.1, y: 2.4, w: 1.95, h: 0.6, align: "center", valign: "middle", fontSize: 12, color: C.accent5, margin: 0, isTextBox: true });
    });
    s.addShape(pres.shapes.RECTANGLE, { x: 0.85, y: 3.2, w: 4.05, h: 1.05, fill: { color: C.accent1 }, line: { color: C.accent1, width: 0 }, shadow: shadow(), objectName: "Nouveau module" });
    s.addText("NOUVEAU", { x: 1.05, y: 3.3, w: 1.5, h: 0.25, fontSize: 10, bold: true, color: C.background2, charSpacing: 2, margin: 0, isTextBox: true });
    s.addText("Évaluation des supports de cours", { x: 1.05, y: 3.58, w: 3.7, h: 0.5, fontSize: 18, bold: true, color: C.background1, fontFace: "Cambria", margin: 0, valign: "middle", isTextBox: true });
    const why = [
      [ic.plug, "Aucun nouvel outil", "Les coordinateurs restent dans la plateforme qu'ils utilisent déjà."],
      [ic.lock, "Socle déjà en place", "Authentification, rôles et hébergement sont repris, pas reconstruits."],
      [ic.tools, "Maintenance mutualisée", "Un seul déploiement, une seule équipe, une évolution commune."],
    ];
    why.forEach(([d, t, x], i) => {
      const y = 1.4 + i * 1.05;
      circleIcon(s, 5.6, y + 0.05, 0.6, d, C.accent1, "Raison " + (i + 1));
      s.addText(t, { x: 6.4, y, w: 3.0, h: 0.32, fontSize: 16, bold: true, color: C.text1, margin: 0, isTextBox: true });
      s.addText(x, { x: 6.4, y: y + 0.33, w: 3.0, h: 0.65, fontSize: 13, color: C.accent5, margin: 0, valign: "top", isTextBox: true });
    });
    s.addText("Le pari le plus sûr : intégrer cette option à CampuSphere.", { x: 0.6, y: 4.65, w: 8.8, h: 0.4, fontSize: 16, bold: true, color: C.text2, margin: 0, valign: "middle", isTextBox: true });
    s.addNotes("Notre recommandation : le pari le plus sûr est d'intégrer cette option dans la plateforme cloud CampuSphere, déjà réalisée pour le côté coordinateur. Les coordinateurs n'ont pas de nouvel outil à adopter, l'authentification, les rôles et l'hébergement existent déjà, et la maintenance est mutualisée. Points à valider avec l'équipe CampuSphere : comment les professeurs déposent leurs supports, et comment reprendre les modules et syllabus déjà présents. Le prototype actuel sert de démonstrateur fonctionnel pour cette intégration.");
  }

  // ============ 17. Feuille de route ============
  {
    const s = content("Feuille de route proposée", "Technique, limites et perspectives");
    const ph = [
      ["Court terme", "Fiabiliser l'agent", ["Intégration dans CampuSphere", "Évaluateur à modèle de langage", "Preuves citées par critère", "PowerPoint et OCR"]],
      ["Moyen terme", "Ancrer dans l'usage", ["Agent local en option", "Versions et nouveau dépôt", "Notifications par e-mail", "Rapport PDF exportable"]],
      ["Long terme", "Piloter la qualité", ["Tableaux de bord par département", "Comparaison entre modules", "Déploiement multi-écoles"]],
    ];
    ph.forEach(([t, sub, items], i) => {
      const x = 0.6 + i * 3.05;
      s.addShape(pres.shapes.RECTANGLE, { x, y: 1.45, w: 2.75, h: 3.45, fill: { color: i === 0 ? C.accent1 : C.background2 }, line: { color: i === 0 ? C.accent1 : C.background2, width: 0 }, shadow: i === 0 ? shadow() : undefined, objectName: t + " carte" });
      const fg = i === 0 ? C.background1 : C.text2, bg = i === 0 ? C.background1 : C.text1;
      s.addText(t.toUpperCase(), { x: x + 0.25, y: 1.65, w: 2.25, h: 0.3, fontSize: 11, bold: true, color: i === 0 ? C.background2 : C.accent1, charSpacing: 2, margin: 0, isTextBox: true });
      s.addText(sub, { x: x + 0.25, y: 2.0, w: 2.25, h: 0.45, fontSize: 18, bold: true, color: fg, fontFace: "Cambria", margin: 0, isTextBox: true });
      s.addText(bullets(items, { gap: 6 }), { x: x + 0.25, y: 2.65, w: 2.25, h: 2.1, fontSize: 14, color: bg, margin: 0, valign: "top", isTextBox: true });
    });
    s.addNotes("Voici une feuille de route proposée, à discuter. À court terme, fiabiliser l'agent. À moyen terme, intégrer l'outil aux usages de l'école avec le SSO, les versions et les notifications. À long terme, exploiter les données pour piloter la qualité pédagogique, éventuellement à l'échelle du groupe.");
  }

  // ============ 18. Conclusion ============
  {
    const s = pres.addSlide({ masterName: "TITRE_SOMBRE", sectionTitle: "Technique, limites et perspectives" });
    s.addImage({ path: LOGO, x: 0.6, y: 0.55, w: 2.6, h: 2.6 * 345 / 1590, altText: "Logo EMSI", objectName: "Logo EMSI" });
    s.addText("En résumé", { placeholder: "title" });
    s.addText(bullets(["Un gain de temps pour les coordinateurs", "Un retour rapide et transparent pour les professeurs", "Une intégration prévue dans CampuSphere, avec agents cloud ou locaux"], { gap: 10 }),
      { x: 0.6, y: 2.65, w: 5.4, h: 2.2, fontSize: 18, color: C.background1, margin: 0, valign: "top", isTextBox: true });
    s.addText("Merci", { x: 6.4, y: 1.9, w: 3.0, h: 0.9, fontSize: 48, bold: true, fontFace: "Cambria", color: C.background1, margin: 0, isTextBox: true });
    s.addText("Questions ?", { x: 6.4, y: 2.8, w: 3.0, h: 0.5, fontSize: 24, color: C.accent6, margin: 0, isTextBox: true });
    s.addNotes("Pour résumer : un gain de temps pour les coordinateurs, un retour rapide pour les professeurs, et une base prête à accueillir un agent d'évaluation plus puissant. Merci de votre attention, je suis prêt à répondre à vos questions.");
  }

  await pres.writeFile({ fileName: OUT });
  await applyTheme(OUT, THEME);
  console.log("written", OUT);
})();
