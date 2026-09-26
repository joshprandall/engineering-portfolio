window.JR_ACADEMIC_COURSES = {
  version: "2026.09.26",
  terms: [{
    id: "fall-2026",
    label: "Fall 2026",
    institution: "Oregon State University",
    courses: [{
      id: "mth-231",
      code: "MTH 231",
      title: "Elements of Discrete Mathematics",
      credits: 4,
      status: "active",
      modules: [{
        id: "week-1-basic-logic",
        title: "Week 1 - Basic Logic",
        lessons: [
          {
            id: "mth231-quantifier-order",
            title: "Reversing Universal and Existential Quantifiers",
            kind: "Discussion lesson",
            level: "Foundation",
            summary: "Understand why ∀x∃y P(x,y) and ∃y∀x P(x,y) generally express different claims.",
            concepts: [
              "universal quantifier",
              "existential quantifier",
              "quantifier scope",
              "order of quantifiers",
              "witness",
              "counterexample"
            ],
            explanation: [
              "In ∀x∃y P(x,y), the chosen y may depend on x.",
              "In ∃y∀x P(x,y), one single y must work for every x.",
              "Changing only the quantifier order can therefore change the truth value and strength of a proposition."
            ],
            examples: [
              "For every satellite s, there exists a ground station g such that g can receive data from s.",
              "There exists a ground station g such that for every satellite s, g can receive data from s.",
              "For every quantum processor q, there exists a calibration routine c used to calibrate q.",
              "There exists a calibration routine c such that for every quantum processor q, c is used to calibrate q."
            ],
            practice: [
              "Create a pair with form ∀x∃y P(x,y) and ∃y∀x P(x,y) without changing the predicate.",
              "Explain in one sentence why the second form is usually stronger than the first.",
              "For a new pair, identify what would count as a witness and what would count as a counterexample."
            ]
          },
          {
            id: "mth231-week1-written-homework",
            title: "Week 1 Written Homework Concepts",
            kind: "Assignment lesson",
            level: "Foundation",
            summary: "Logic translations, conditionals, DeMorgan's laws, logical equivalence, quantifiers, negation, and counterexamples.",
            concepts: [
              "propositional logic",
              "converse",
              "inverse",
              "contrapositive",
              "conditional-disjunction equivalence",
              "DeMorgan's laws",
              "logical equivalence",
              "predicate logic",
              "quantified negation",
              "counterexamples"
            ]
          }
        ]
      }]
    }]
  }]
};