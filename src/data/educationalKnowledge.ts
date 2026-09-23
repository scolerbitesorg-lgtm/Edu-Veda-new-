/**
 * Edu Veda Intelligent Educational Knowledge Base & Pedagogical Responder
 * Provides comprehensive, high-yield educational explanations, formulas,
 * MCQs, and revision summaries across CBSE, State Boards, and competitive exams.
 */

export interface TopicKnowledge {
  keywords: string[];
  title: string;
  response: string;
}

export const EDUCATIONAL_TOPICS: TopicKnowledge[] = [
  // ==================== PHYSICS & SCIENCE ====================
  {
    keywords: ['newton', 'motion', 'law of motion', 'inertia', 'force'],
    title: "Newton's Three Laws of Motion",
    response: `### ⚡ Newton's Three Laws of Motion

1. **First Law (Law of Inertia):**
   - **Statement:** An object remains in a state of rest or of uniform motion in a straight line unless acted upon by an external unbalanced force.
   - **Inertia:** The natural tendency of objects to resist a change in their state of motion. Directly proportional to mass ($I \\propto m$).
   - **Real-Life Example:** When a bus starts suddenly, standing passengers jerk backward due to inertia of rest.

2. **Second Law (Law of Momentum):**
   - **Mathematical Formulation:**
     $$\\vec{F} = \\frac{d\\vec{p}}{dt} = m \\cdot \\vec{a}$$
     - $F$ = Force (Newton, N)
     - $m$ = Mass (kg)
     - $a$ = Acceleration ($m/s^2$)
   - **Real-Life Example:** A cricket fielder pulls his hands backward while catching a fast ball. This increases the contact time ($\\Delta t$), thereby reducing the impact force ($F = \\Delta p / \\Delta t$).

3. **Third Law (Action-Reaction):**
   - **Statement:** To every action, there is an equal and opposite reaction.
   - **Crucial Rule:** Action and reaction forces act on **two different bodies**, never on the same body, hence they never cancel each other out.
   - **Real-Life Example:** Rocket propulsion — hot exhaust gases rush downward (action), propelling the rocket upward (reaction).

🎯 **Board Exam Tip:** In numericals, always verify SI units first: Force in Newtons ($N$), mass in $kg$, acceleration in $m/s^2$.`,
  },
  {
    keywords: ['reflection', 'refraction', 'light', 'mirror', 'lens'],
    title: 'Light: Reflection & Refraction',
    response: `### 💡 Light: Reflection & Refraction

#### 1. Laws of Reflection:
- **First Law:** The incident ray, the normal to the mirror at the point of incidence, and the reflected ray all lie in the same plane.
- **Second Law:** The angle of incidence equals the angle of reflection ($\\angle i = \\angle r$).

#### 2. Spherical Mirrors:
- **Mirror Formula:**
  $$\\frac{1}{f} = \\frac{1}{v} + \\frac{1}{u}$$
- **Linear Magnification ($m$):**
  $$m = -\\frac{v}{u} = \\frac{h_i}{h_o}$$
- **Sign Convention (Cartesian):**
  - Object distance $u$ is **always negative**.
  - Focal length $f$: **Negative** for Concave mirror, **Positive** for Convex mirror.

#### 3. Refraction & Snell's Law:
$$\\frac{\\sin i}{\\sin r} = \\text{constant} = \\frac{n_2}{n_1} = n_{21}$$
- When light travels from **rarer to denser medium**, it bends **towards the normal**; from denser to rarer, it bends **away from the normal**.

#### 4. Lens Formula & Power:
$$\\frac{1}{f} = \\frac{1}{v} - \\frac{1}{u}, \\quad P = \\frac{1}{f \\text{ (in meters)}} \\text{ Dioptres (D)}$$

🎯 **Quick MCQ:** A convex mirror is used as a rear-view mirror in vehicles because it always produces an **erect, virtual, and diminished** image, providing a much wider field of view.`,
  },
  {
    keywords: ['electricity', 'ohm', 'current', 'voltage', 'resistance', 'circuit', 'joule'],
    title: "Electricity, Ohm's Law & Circuit Analysis",
    response: `### ⚡ Electricity & Circuits

#### 1. Electric Current & Potential Difference:
- **Current ($I$):** Rate of flow of electric charges.
  $$I = \\frac{Q}{t} \\quad (1\\text{ A} = 1\\text{ C/s})$$
- **Potential Difference ($V$):** Work done per unit charge.
  $$V = \\frac{W}{Q} \\quad (1\\text{ V} = 1\\text{ J/C})$$

#### 2. Ohm's Law:
At constant temperature, current through a conductor is directly proportional to the potential difference across its terminals:
$$V = I \\cdot R$$
- **Factors affecting Resistance ($R$):**
  $$R = \\rho \\frac{l}{A}$$
  - $l$ = length of conductor, $A$ = cross-sectional area, $\\rho$ = resistivity (unit: $\\Omega \\cdot m$).

#### 3. Combination of Resistors:
- **Series:** $R_{\\text{eq}} = R_1 + R_2 + R_3$ (Same current $I$, voltage divides).
- **Parallel:** $\\frac{1}{R_{\\text{eq}}} = \\frac{1}{R_1} + \\frac{1}{R_2} + \\frac{1}{R_3}$ (Same voltage $V$, current divides).

#### 4. Heating Effect of Current (Joule's Law):
$$H = I^2 R t = V I t = \\frac{V^2}{R} t$$
- **Electric Power ($P$):** $P = V I = I^2 R = \\frac{V^2}{R}$. SI unit is Watt ($W$).
- **Commercial Unit:** $1\\text{ kWh} = 3.6 \\times 10^6\\text{ Joules} = 1\\text{ unit}$.`,
  },
  {
    keywords: ['magnetic', 'solenoid', 'fleming', 'motor', 'generator'],
    title: 'Magnetic Effects of Electric Current',
    response: `### 🧲 Magnetic Effects of Electric Current

1. **Right-Hand Thumb Rule:**
   - Point your thumb in the direction of current; your curled fingers indicate the direction of circular magnetic field lines.

2. **Magnetic Field in a Solenoid:**
   - A long coil of many circular turns of insulated copper wire.
   - The magnetic field inside a long current-carrying solenoid is **uniform and parallel**.

3. **Fleming's Left-Hand Rule (Electric Motor):**
   - **Thumb:** Motion / Force ($F$)
   - **Forefinger:** Magnetic Field ($B$)
   - **Middle Finger:** Current ($I$)
   *(Mnemonic: **F**ather, **M**other, **C**hild = Force, Magnetic field, Current)*

4. **Electromagnetic Induction (Faraday's Law):**
   - Whenever the magnetic flux linked with a closed circuit changes, an electromotive force (EMF) and current are induced in the circuit.`,
  },

  // ==================== CHEMISTRY ====================
  {
    keywords: ['chemical reaction', 'equation', 'oxidation', 'reduction', 'redox', 'corrosion'],
    title: 'Chemical Reactions & Equations',
    response: `### 🧪 Chemical Reactions & Equations

#### 1. Five Major Types of Chemical Reactions:
1. **Combination Reaction:**
   - Two or more reactants combine to form a single product.
   - $\\text{CaO (Quicklime)} + \\text{H}_2\\text{O} \\rightarrow \\text{Ca(OH)}_2\\text{ (Slaked lime)} + \\text{Heat}$ (Exothermic)
2. **Decomposition Reaction:**
   - A single reactant breaks down into simpler products upon heating, light, or electricity.
   - $2\\text{FeSO}_4 \\xrightarrow{\\Delta} \\text{Fe}_2\\text{O}_3 + \\text{SO}_2 + \\text{SO}_3$
3. **Displacement Reaction:**
   - More reactive metal displaces a less reactive metal from its salt solution.
   - $\\text{Fe} + \\text{CuSO}_4\\text{ (blue)} \\rightarrow \\text{FeSO}_4\\text{ (pale green)} + \\text{Cu}$
4. **Double Displacement Reaction:**
   - Exchange of ions between reactants.
   - $\\text{Na}_2\\text{SO}_4 + \\text{BaCl}_2 \\rightarrow \\text{BaSO}_4\\downarrow\\text{ (white precipitate)} + 2\\text{NaCl}$
5. **Redox Reaction:**
   - **Oxidation:** Addition of oxygen or loss of electrons.
   - **Reduction:** Removal of oxygen or gain of electrons.
   - $\\text{CuO} + \\text{H}_2 \\xrightarrow{\\Delta} \\text{Cu} + \\text{H}_2\\text{O}$ (CuO is reduced to Cu; $\\text{H}_2$ is oxidized to $\\text{H}_2\\text{O}$).

#### 2. Corrosion & Rancidity:
- **Corrosion:** Oxidation of metals due to moisture and air ($Fe_2O_3 \\cdot xH_2O$ rust).
- **Rancidity:** Oxidation of fats and oils leading to foul smell and taste; prevented using antioxidants or nitrogen flush.`,
  },
  {
    keywords: ['acid', 'base', 'salt', 'ph scale', 'baking soda', 'bleaching powder', 'plaster of paris'],
    title: 'Acids, Bases and Salts',
    response: `### ⚗️ Acids, Bases & Salts

#### 1. Definitions & Indicators:
- **Acids:** Taste sour, turn blue litmus red, release $H^+$ ions in aqueous solution ($pH < 7$).
- **Bases:** Taste bitter, soapy touch, turn red litmus blue, release $OH^-$ ions in solution ($pH > 7$).
- **Neutralization:** $\\text{Acid} + \\text{Base} \\rightarrow \\text{Salt} + \\text{Water}$.

#### 2. Key High-Yield Chemical Salts in Class 10:
| Chemical Name | Common Name | Formula | Key Application |
|---|---|---|---|
| Calcium Hypochlorite | Bleaching Powder | $\\text{CaOCl}_2$ | Disinfectant for drinking water, bleaching textile |
| Sodium Hydrogen Carbonate | Baking Soda | $\\text{NaHCO}_3$ | Baking powder, fire extinguishers, antacid |
| Sodium Carbonate Decahydrate | Washing Soda | $\\text{Na}_2\\text{CO}_3 \\cdot 10\\text{H}_2\\text{O}$ | Glass, soap paper industries, removing permanent water hardness |
| Calcium Sulphate Hemihydrate | Plaster of Paris (POP) | $\\text{CaSO}_4 \\cdot \\frac{1}{2}\\text{H}_2\\text{O}$ | Fractured bone plaster, toys, statues |

💡 **Exam Tip:** On mixing POP with water, it rehydrates to form hard **Gypsum** ($\\text{CaSO}_4 \\cdot 2\\text{H}_2\\text{O}$).`,
  },
  {
    keywords: ['carbon', 'organic', 'hydrocarbon', 'alkane', 'alkene', 'alkyne', 'saponification', 'covalent'],
    title: 'Carbon and its Compounds',
    response: `### 🔬 Carbon & Its Compounds

#### 1. Unique Properties of Carbon:
- **Catenation:** Ability of carbon atoms to form strong covalent bonds with other carbon atoms forming long chains or rings.
- **Tetravalency:** Carbon has 4 valence electrons and shares them with 4 other monovalent atoms.

#### 2. Hydrocarbons:
- **Saturated (Alkanes):** Single $C-C$ bond; General formula $C_n H_{2n+2}$ (e.g., Methane $\\text{CH}_4$, Ethane $\\text{C}_2\\text{H}_6$).
- **Unsaturated:**
  - **Alkenes:** Double $C=C$ bond; $C_n H_{2n}$ (Ethene $\\text{C}_2\\text{H}_4$).
  - **Alkynes:** Triple $C \\equiv C$ bond; $C_n H_{2n-2}$ (Ethyne $\\text{C}_2\\text{H}_2$).

#### 3. Functional Groups:
- Alcohol: $-OH$ (suffix: *-ol*, e.g., Ethanol $\\text{C}_2\\text{H}_5\\text{OH}$)
- Aldehyde: $-CHO$ (suffix: *-al*, e.g., Ethanal)
- Ketone: $>C=O$ (suffix: *-one*, e.g., Propanone)
- Carboxylic Acid: $-COOH$ (suffix: *-oic acid*, e.g., Ethanoic acid $\\text{CH}_3\\text{COOH}$)

#### 4. Saponification & Soap Micelles:
- Ester + $\\text{NaOH} \\rightarrow$ Sodium salt of carboxylic acid (Soap) + Alcohol.
- Soaps form spherical **micelles** where the hydrophobic hydrocarbon tail traps grease/oil at the center and hydrophilic ionic head faces outward in water.`,
  },

  // ==================== BIOLOGY ====================
  {
    keywords: ['life process', 'photosynthesis', 'respiration', 'digestion', 'nephron', 'heart'],
    title: 'Life Processes',
    response: `### 🌿 Life Processes

#### 1. Photosynthesis in Plants:
$$6\\text{CO}_2 + 12\\text{H}_2\\text{O} \\xrightarrow[\\text{Chlorophyll}]{\\text{Sunlight}} \\text{C}_6\\text{H}_{12}\\text{O}_6 + 6\\text{O}_2 + 6\\text{H}_2\\text{O}$$
- **Key Steps:**
  1. Absorption of light energy by chlorophyll.
  2. Conversion of light energy to chemical energy and splitting of water into hydrogen and oxygen.
  3. Reduction of $\\text{CO}_2$ to carbohydrates.

#### 2. Cellular Respiration:
- **Aerobic (with $O_2$):** Occurs in **Mitochondria**; produces $38\\text{ ATP} + 6\\text{CO}_2 + 6\\text{H}_2\\text{O}$.
- **Anaerobic (in yeast):** Produces Ethanol + $\\text{CO}_2 + 2\\text{ ATP}$.
- **In human muscles (during heavy exercise):** Produces **Lactic acid**, leading to muscle cramps.

#### 3. Double Circulation in Human Heart:
- **Pulmonary Circuit:** Deoxygenated blood from Right Ventricle $\\rightarrow$ Lungs $\\rightarrow$ Oxygenated blood to Left Atrium.
- **Systemic Circuit:** Left Ventricle pumps oxygenated blood $\\rightarrow$ whole body $\\rightarrow$ returns deoxygenated to Right Atrium.
- **Why Double Circulation?** Ensures complete separation of oxygenated and deoxygenated blood for high metabolic energy needs.

#### 4. Excretion & The Nephron:
- The functional filtration unit of kidneys is the **Nephron** consisting of Bowman's capsule, Glomerulus, and tubular structures for selective reabsorption of glucose, amino acids, salts, and water.`,
  },

  // ==================== MATHEMATICS ====================
  {
    keywords: ['trigonometry', 'sin', 'cos', 'tan', 'hypotenuse', 'trig formula', 'identities'],
    title: 'Introduction to Trigonometry: Formulas & Identities',
    response: `### 📐 Trigonometry: Essential Formulas & Values

#### 1. Basic Ratios in a Right-Angled Triangle:
$$\\sin \\theta = \\frac{\\text{Perpendicular}}{\\text{Hypotenuse}}, \\quad \\cos \\theta = \\frac{\\text{Base}}{\\text{Hypotenuse}}, \\quad \\tan \\theta = \\frac{\\text{Perpendicular}}{\\text{Base}}$$
$$\\csc \\theta = \\frac{1}{\\sin \\theta}, \\quad \\sec \\theta = \\frac{1}{\\cos \\theta}, \\quad \\cot \\theta = \\frac{1}{\\tan \\theta}$$

#### 2. Specific Angle Values Table:
| Angle ($\\theta$) | $0^\\circ$ | $30^\\circ$ | $45^\\circ$ | $60^\\circ$ | $90^\\circ$ |
|---|---|---|---|---|---|
| $\\sin \\theta$ | $0$ | $\\frac{1}{2}$ | $\\frac{1}{\\sqrt{2}}$ | $\\frac{\\sqrt{3}}{2}$ | $1$ |
| $\\cos \\theta$ | $1$ | $\\frac{\\sqrt{3}}{2}$ | $\\frac{1}{\\sqrt{2}}$ | $\\frac{1}{2}$ | $0$ |
| $\\tan \\theta$ | $0$ | $\\frac{1}{\\sqrt{3}}$ | $1$ | $\\sqrt{3}$ | $\\infty$ (Not defined) |

#### 3. Fundamental Trigonometric Identities:
1. $$\\sin^2 \\theta + \\cos^2 \\theta = 1$$
2. $$1 + \\tan^2 \\theta = \\sec^2 \\theta \\implies \\sec^2 \\theta - \\tan^2 \\theta = 1$$
3. $$1 + \\cot^2 \\theta = \\csc^2 \\theta \\implies \\csc^2 \\theta - \\cot^2 \\theta = 1$$

🎯 **Board Tip:** When proving identities, convert all terms into $\\sin \\theta$ and $\\cos \\theta$ first!`,
  },
  {
    keywords: ['real number', 'hcf', 'lcm', 'irrational', 'prime factorization', 'euclid'],
    title: 'Real Numbers & Fundamental Theorem of Arithmetic',
    response: `### 🔢 Real Numbers: Core Concepts & Formula Sheet

1. **Fundamental Theorem of Arithmetic:**
   - Every composite number can be uniquely expressed (factorised) as a product of primes, except for the order of its factors:
     $$N = p_1^{a_1} \\cdot p_2^{a_2} \\cdots p_k^{a_k}$$

2. **Crucial HCF-LCM Relationship for Two Positive Numbers ($a, b$):**
   $$\\text{HCF}(a, b) \\times \\text{LCM}(a, b) = a \\times b$$
   *(Note: This relationship is valid only for two numbers, not for three or more).*

3. **Proof of Irrationality of $\\sqrt{2}, \\sqrt{3}, \\sqrt{5}$ (Contradiction Method):**
   - Let $\\sqrt{2} = a/b$ where $a, b$ are coprime integers ($b \\neq 0$).
   - $2b^2 = a^2 \\implies 2$ divides $a^2 \\implies 2$ divides $a$. Let $a = 2c$.
   - $2b^2 = 4c^2 \\implies b^2 = 2c^2 \\implies 2$ divides $b$.
   - Contradiction! Since 2 divides both $a$ and $b$, they are not coprime. Therefore $\\sqrt{2}$ is irrational.

4. **Terminating Decimals:**
   - A rational number $p/q$ has a terminating decimal expansion if the prime factorisation of $q$ is strictly of the form $2^n 5^m$ (where $n, m$ are non-negative integers).`,
  },
  {
    keywords: ['quadratic', 'roots', 'discriminant'],
    title: 'Quadratic Equations',
    response: `### 📈 Quadratic Equations: Zeroes & Discriminant

#### 1. Standard Form:
$$a x^2 + b x + c = 0 \\quad (a \\neq 0)$$

#### 2. Quadratic Formula (Shreedhar Acharya Rule):
$$x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$$

#### 3. Nature of Roots (Discriminant $D = b^2 - 4ac$):
- **$D > 0$:** Two distinct real roots.
- **$D = 0$:** Two equal real roots ($x = -b / 2a$).
- **$D < 0$:** No real roots (roots are complex).

#### 4. Relation Between Roots ($\\alpha, \\beta$) and Coefficients:
- **Sum of Roots:** $\\alpha + \\beta = -\\frac{b}{a}$
- **Product of Roots:** $\\alpha \\cdot \\beta = \\frac{c}{a}$
- **Reconstructed Equation:** $x^2 - (\\alpha + \\beta) x + (\\alpha \\beta) = 0$`,
  },
  {
    keywords: ['statistics', 'mean', 'median', 'mode'],
    title: 'Statistics: Mean, Median, Mode Formulas',
    response: `### 📊 Statistics: Essential Formula Sheet

#### 1. Mean ($\\bar{x}$) of Grouped Data:
- **Direct Method:** $\\bar{x} = \\frac{\\sum f_i x_i}{\\sum f_i}$
- **Assumed Mean Method:** $\\bar{x} = a + \\frac{\\sum f_i d_i}{\\sum f_i} \\quad (d_i = x_i - a)$

#### 2. Mode of Grouped Data:
$$\\text{Mode} = l + \\left( \\frac{f_1 - f_0}{2f_1 - f_0 - f_2} \\right) \\times h$$
- $l$ = lower limit of modal class
- $f_1$ = frequency of modal class, $f_0$ = preceding, $f_2$ = succeeding
- $h$ = class width

#### 3. Median of Grouped Data:
$$\\text{Median} = l + \\left( \\frac{\\frac{n}{2} - cf}{f} \\right) \\times h$$

#### 4. Empirical Relationship Between the Three Measures:
$$3 \\times \\text{Median} = \\text{Mode} + 2 \\times \\text{Mean}$$`,
  },

  // ==================== SOCIAL SCIENCE & POLITY ====================
  {
    keywords: ['constitution', 'polity', 'preamble', 'fundamental rights', 'article'],
    title: 'Indian Constitution & Polity: Top High-Yield Facts',
    response: `### 📜 Top High-Yield Facts: Indian Constitution

1. **Adoption & Inception:**
   - Drafted by the Constituent Assembly under the Drafting Committee chaired by **Dr. B.R. Ambedkar**.
   - Adopted on **26th November 1949** (celebrated as National Constitution Day).
   - Came into full force on **26th January 1950** (Republic Day).

2. **The Preamble:**
   - Declares India a **Sovereign, Socialist, Secular, Democratic Republic**, securing Justice, Liberty, Equality, and Fraternity.
   - The words **Socialist, Secular, and Integrity** were added by the **42nd Constitutional Amendment Act, 1976**.

3. **Six Fundamental Rights (Part III, Articles 12-35):**
   - Right to Equality (Articles 14-18)
   - Right to Freedom (Articles 19-22)
   - Right against Exploitation (Articles 23-24)
   - Right to Freedom of Religion (Articles 25-28)
   - Cultural and Educational Rights (Articles 29-30)
   - **Right to Constitutional Remedies (Article 32):** Termed the **"Heart and Soul of the Constitution"** by Dr. Ambedkar.

4. **Directive Principles of State Policy (Part IV, Articles 36-51):**
   - Borrowed from the **Irish Constitution**. Non-justiciable guidelines for creating a welfare state.

5. **Fundamental Duties (Part IV-A, Article 51A):**
   - Recommended by the Swaran Singh Committee; added by 42nd Amendment (1976). Total 11 duties.`,
  },
  {
    keywords: ['nationalism', 'gandhi', 'non-cooperation', 'civil disobedience', 'dandi', 'swaraj'],
    title: 'Nationalism in India',
    response: `### 🇮🇳 Nationalism in India (1915 - 1947)

1. **Mahatma Gandhi's Early Satyagraha Movements:**
   - **Champaran (1917, Bihar):** Against oppressive indigo plantation system.
   - **Kheda (1918, Gujarat):** Revenue relaxation for drought-affected farmers.
   - **Ahmedabad Mill Strike (1918):** Wage hike for cotton mill workers.

2. **Rowlatt Act & Jallianwala Bagh Massacre (1919):**
   - Rowlatt Act allowed detention without trial.
   - On **13th April 1919**, General Dyer fired on a peaceful gathering at Jallianwala Bagh, Amritsar.

3. **Non-Cooperation Movement (1920-1922):**
   - Launched alongside Khilafat agitation; boycotted foreign goods, courts, and schools.
   - Suspended abruptly after the violent **Chauri Chaura incident** in Gorakhpur (Feb 1922).

4. **Civil Disobedience Movement & Salt March (1930):**
   - Mahatma Gandhi marched from **Sabarmati Ashram to Dandi** (240 miles) with 78 volunteers, breaking the salt monopoly on 6th April 1930.
   - Ended temporarily with the **Gandhi-Irwin Pact (1931)**.`,
  },

  // ==================== ENGLISH ====================
  {
    keywords: ['tense', 'tenses', 'grammar', 'verb', 'concord', 'passive', 'active voice', 'narration'],
    title: 'English Grammar: Tenses & Subject-Verb Agreement',
    response: `### 📝 English Grammar: Tenses & Subject-Verb Agreement

#### 1. Complete Tenses Chart:
- **Simple Present:** Subject + $V_1$ (+ s/es). *He writes an exam.*
- **Present Continuous:** Subject + is/am/are + $V_{\\text{ing}}$. *They are solving MCQs.*
- **Present Perfect:** Subject + has/have + $V_3$. *She has completed the revision.*
- **Simple Past:** Subject + $V_2$. *Newton formulated the laws.*
- **Past Perfect:** Subject + had + $V_3$. *The train had departed before we reached.*
- **Future with Will:** Subject + will/shall + $V_1$. *We will score 95%+.*

#### 2. Golden Rules of Subject-Verb Concord:
1. Two singular subjects connected by **and** take a plural verb (*Rohan and Sohan are studying*).
2. Singular nouns preceded by **each** or **every** take a singular verb (*Each student has a notebook*).
3. If subjects are connected by **either...or** or **neither...nor**, the verb agrees with the **closer subject** (*Neither the teacher nor the students were present*).
4. Words like *with, along with, as well as* do not change the number of the subject (*The teacher, along with students, is in the lab*).`,
  },

  // ==================== STUDY PLAN & TIMETABLE ====================
  {
    keywords: ['timetable', 'study plan', 'schedule', 'routine', 'strategy', 'how to score', 'topper'],
    title: 'Smart Daily Study Timetable & Topper Strategy',
    response: `### 📅 Smart & Practical Daily Study Timetable

#### ⏰ Optimized Daily Schedule (Balanced for School + Self-Study):
- **🌅 Morning Power Slot (6:00 AM - 8:00 AM):**
  - High-concentration conceptual subjects: Mathematics numericals, Physics formulas, or Chemistry derivations. Mind retention is highest.
- **☕ Refreshment & School/College (8:30 AM - 2:30 PM)**
- **🍽️ Rest & Power Recharge (2:30 PM - 3:30 PM)**
- **📖 Theory & Note-Making Slot (3:30 PM - 5:30 PM):**
  - Social Science, Biology, or English chapter reading. Summarize into active recall flashcards.
- **🏃 Evening Break & Sports (5:30 PM - 6:30 PM)**
- **📝 MCQ Practice & Test Slot (6:30 PM - 8:30 PM):**
  - Solve 30-50 interactive MCQs on Edu Veda. Document incorrect questions into your **"Mistake Notebook"**.
- **🌙 Final Revision & Wrap (9:30 PM - 10:30 PM):**
  - 30-minute quick recap of everything learned during the day before sleeping.

🎯 **The 50/10 Pomodoro Rule:** Study uninterrupted for 50 minutes, then take a strict 10-minute break. This keeps mental fatigue at zero and retention above 85%!`,
  },
];

/**
 * Searches the knowledge base or generates a dynamic structured response
 */
export function generateVedaAiEducationalResponse(prompt: string): string {
  const p = prompt.trim().toLowerCase();

  // 1. Direct topic keyword search
  for (const topic of EDUCATIONAL_TOPICS) {
    const matched = topic.keywords.some(kw => p.includes(kw.toLowerCase()));
    if (matched) {
      return topic.response;
    }
  }

  // 2. High-Yield General Synthesizer
  const topicTitle = prompt.length > 50 ? `${prompt.slice(0, 50)}...` : prompt;

  return `### 🎓 Veda AI Study Mentor: Concept Breakdown

Here is your comprehensive study breakdown for **"${topicTitle}"**:

#### 1. 📖 Core Concept Overview:
- In board and competitive examinations (CBSE, State Boards, SSC, UPSC), a clear grasp of foundational terminology and definitions carries maximum marks.
- Break down the question into its primary components: identify the given parameters, governing laws, and required outcome.

#### 2. ⚡ Key Principles & Formulas:
- Write standard equations and definitions using unambiguous notation.
- If solving a numerical problem, always specify initial units, write the applicable formula, substitute values systematically, and conclude with the correct SI units.

#### 3. 🎯 High-Yield Exam Points & Common Mistakes:
- **Recurring Question Pattern:** Examiners frequently test exceptions, edge-case conditions, and step-by-step derivations.
- **Common Pitfall:** Skipping intermediate calculation steps or forgetting unit conversion (e.g., $cm$ to $m$, or $minutes$ to $seconds$).

#### 4. 📝 Practice & Retention Strategy:
- Take an interactive MCQ test on Edu Veda to verify your conceptual clarity.
- Note any challenging formula or concept into your dedicated 1-page revision sheet for rapid recap before test day.

💡 *Feel free to ask for a specific numerical solution, Hindi explanation, or top 5 exam MCQs on this topic!*`;
}
