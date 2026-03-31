# THE TWELVE vs Established Profiling Systems

Internal research document. Honest assessment, not marketing.

---

## System Summary

| System | Types | Dimensions | Input Method | Domain |
|--------|-------|-----------|-------------|--------|
| **THE TWELVE** | 12 archetypes | 12 (6 Openness facets + Intellect + 5 MUSIC) | Behavioral inference from creative output | Creative identity / taste |
| **MBTI** | 16 types | 4 dichotomies (E/I, S/N, T/F, J/P) | Self-report questionnaire | Personality preference |
| **Big Five / OCEAN** | Continuous (no types) | 5 traits, 30 facets | Self-report or observer rating | Personality (general) |
| **Enneagram** | 9 types + wings + tritype | 1 core type + growth/stress directions | Self-report, interviews | Core motivations and fears |
| **DISC** | 4 quadrants | 2 axes (task/people, active/passive) | Self-report questionnaire | Behavioral style (workplace) |
| **Belbin** | 9 team roles | 9 role tendencies | Self + observer report | Team dynamics |
| **CliftonStrengths** | 34 themes | 34 themes in 4 domains | Forced-choice questionnaire | Talent identification |

---

## What THE TWELVE Actually Measures

12 psychometric dimensions, drawn from two established models:

**Big Five Openness sub-facets (6):** Fantasy, Aesthetics, Feelings, Actions, Ideas, Values
**Intellect (1):** Treated as a separate dimension from Openness (following DeYoung's distinction)
**MUSIC model (5):** Mellow, Unpretentious, Sophisticated, Intense, Contemporary

These are mapped from behavioral signals:
- **Audio DNA** (sonic palette, taste coherence, genre entropy) -> MUSIC dimensions
- **Visual DNA** (warmth, energy, themes from DINOv2 embeddings) -> Openness facets
- **Writing samples** (word count, reflective depth) -> Intellect + Ideas
- **Project DNA** (domain breadth, tool count, references, anti-taste) -> Openness facets + Intellect

Classification uses cosine-like similarity (mean absolute distance) against each archetype's target weight profile, followed by softmax with temperature=3.0 to produce a probability distribution. Shannon entropy provides a confidence score.

---

## What's Borrowed, What's Novel

### Borrowed (honestly)

- **Dimension selection from Big Five.** THE TWELVE uses 6 of the 30 NEO-PI-R facets, all from Openness. This is a deliberate slice, not a full personality assessment. The MUSIC model dimensions come from Rentfrow et al. (2011), an established music psychology framework.
- **Archetype-as-profile pattern from MBTI.** Mapping continuous dimensions to discrete types is the same structural choice as MBTI. We use softmax to keep the distribution continuous underneath, but the presentation (KETH, STRATA, etc.) is archetypal, like MBTI's INTJ or ENFP.
- **Shadow concept from Enneagram/Jung.** Each archetype has a shadow (e.g., CULL's "Nihilistic rejection"). This mirrors the Enneagram's stress/disintegration paths and Jung's shadow work.

### Novel (genuinely)

- **Behavioral inference, not self-report.** This is the real differentiator. Every system listed above relies on the user answering questions about themselves. THE TWELVE infers from what users actually do: what music they collect, what visuals they gravitate toward, what they build, how they write. Self-report has well-documented problems (social desirability bias, Dunning-Kruger on self-knowledge, mood effects). Behavioral inference sidesteps these.
- **Creative-output-specific.** No other profiling system is purpose-built for creative identity. Big Five can predict artistic interest (high Openness), but it doesn't distinguish between an archivist (VAULT) and an advocate (TOLL). THE TWELVE's archetypes map to creative modes, not personality in general.
- **Multi-modal fusion.** Combining audio, visual, textual, and project signals into a single profile is uncommon. CliftonStrengths uses one questionnaire. THE TWELVE triangulates across modalities, which should (in theory) produce more robust classification.

---

## Honest Weaknesses

### No empirical validation
This is the biggest gap. Big Five has decades of cross-cultural replication studies, factor analyses, and predictive validity research. MBTI, despite its critics, has enormous datasets. THE TWELVE has zero published validation studies, no test-retest reliability data, no convergent/discriminant validity evidence. The 12 archetype weight profiles were designed by hand, not derived from factor analysis of actual user data.

### Small N
We cannot claim the archetypes are real psychological constructs until we have classification data from hundreds (ideally thousands) of users and can show that the clusters actually emerge from the data rather than being imposed by our weight matrix.

### Narrow trait selection
We use only Openness facets from the Big Five. This means THE TWELVE is blind to Conscientiousness, Agreeableness, Extraversion, and Neuroticism. A KETH and a VAULT might differ enormously on Conscientiousness (one ships chaos, the other catalogs meticulously), but our system only captures this indirectly through the Actions facet and Project DNA signals. We chose this narrowness deliberately (creative taste lives in Openness), but it limits what we can say about a person.

### Proxy mappings are speculative
The mappings from behavioral signals to psychometric dimensions involve assumptions that haven't been tested:
- "Bass prominence inversely maps to Mellow" -- plausible but unvalidated
- "Word count in subconscious writing maps to Intellect" -- crude proxy
- "Number of creative domains maps to Openness to Ideas" -- reasonable but untested
- "Abstract visual themes map to Aesthetics" -- thematic inference, not measured preference

### No growth model
Enneagram has integration/disintegration paths. MBTI has cognitive function stacks that develop over a lifetime. THE TWELVE has shadows but no explicit growth trajectory. A user classified as CULL today has no map for how they might develop -- do they grow toward LIMN? SILT? We don't model this.

---

## What We Can Learn From Each System

### From Big Five: Empirical rigor
The gold standard. We should:
1. Run factor analysis on our actual user psychometric profiles to see if 12 clusters naturally emerge (they probably won't map cleanly to our hand-designed archetypes)
2. Measure test-retest reliability: classify the same user at two time points, see if results are stable
3. Measure convergent validity: do users who score high on NEO-PI-R Openness to Aesthetics also get classified as archetypes with high aesthetics weights (KETH, OMEN, VAULT)?

### From MBTI: Accessibility and identity adoption
MBTI is psychometrically weak but culturally dominant. People put their type in their Twitter bios. Why? Because the types are memorable, identity-affirming, and easy to discuss. THE TWELVE's naming (KETH, STRATA, VOID) is designed for this same cultural stickiness. We should lean into this strength -- it's not a flaw, it's a feature -- while being honest that the types are heuristic, not diagnostic.

### From Enneagram: Growth paths and shadow integration
The Enneagram's integration/disintegration arrows are its most powerful feature. A Type 3 under stress moves to Type 9 behaviors; in health, toward Type 6. We should build equivalent paths: "CULL under creative burnout tends toward VOID patterns. CULL in creative health integrates LIMN's connective instinct." This would make THE TWELVE developmental, not just descriptive.

### From Belbin: Team composition
Belbin's insight isn't the 9 roles -- it's that teams need a balance of roles to function. A team of all Plants (creative thinkers) will never ship. We could build team-composition analysis: "Your studio has three CULLs and no TOLLs -- you're over-indexed on criticism and under-indexed on advocacy." This is immediately useful for labels, collectives, and creative teams.

### From DISC: Simplicity for communication
DISC reduces personality to 4 quadrants. It sacrifices nuance for speed. We should consider a simplified "quadrant" view of THE TWELVE for quick communication: perhaps grouping archetypes into Builders (ANVIL, STRATA), Seekers (OMEN, WICK, VOID), Judges (KETH, CULL, SCHISM), and Connectors (LIMN, TOLL, SILT, VAULT).

### From CliftonStrengths: Strength-based framing
CliftonStrengths deliberately avoids deficit language. Everything is a strength. Our shadow descriptions are valuable but we should ensure the primary framing is always "this is what you do well" before "this is your risk." The shadow is for self-awareness, not diagnosis.

---

## Practical Recommendations

1. **Collect validation data now.** Add an optional post-classification feedback mechanism: "Does this feel accurate? (1-5)" Log classifications, inputs, and feedback. This is the minimum viable dataset for future validation work.

2. **Run a convergent validity study.** Give 50-100 users both the Big Five NEO-PI-R (or IPIP-NEO) and THE TWELVE classification. Check if our inferred Openness facets correlate with their self-reported ones. If they do, we have a real claim. If they don't, we need to fix our mappings.

3. **Build growth paths.** Map archetype-to-archetype development trajectories, inspired by Enneagram integration. This makes the system useful for longitudinal self-development, not just one-time classification.

4. **Add team composition analysis.** This is low-hanging fruit with high value for B2B (labels, agencies, collectives). Borrowed directly from Belbin's playbook.

5. **Be honest about what this is.** Internally and externally: THE TWELVE is a creative-taste profiling heuristic built on established psychometric dimensions, inferred from behavioral data rather than self-report. It is not a validated psychometric instrument. The behavioral inference method is genuinely novel and worth developing. The archetype system is a useful fiction until validated by data.

6. **Consider adding Conscientiousness.** Even one additional Big Five trait would substantially improve classification accuracy for distinguishing Builders (ANVIL, STRATA) from Dreamers (OMEN, WICK). Could be inferred from project completion rates, release cadence, tool mastery signals.

---

*Last updated: 2026-03-31*
