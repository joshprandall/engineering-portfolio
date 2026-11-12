'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const lessons=JSON.parse(fs.readFileSync(path.join(__dirname,'..','deep-learning','physics','momentum.json'),'utf8'));
const sourceRoot='https://openstax.org/books/university-physics-volume-1/pages/';
const cases=[
  {
    "id": "physics-v10-reasoning-check-momentum-conservation",
    "q": "For 0.80 kg and 1.20 kg carts entering a latch at +3 and -1 m/s, what common velocity and energy loss follow from an isolated-system model?",
    "workAnchor": "Initial momentum is 0.80(3)+1.20(-1)=+1.20 kg·m/s. After latching",
    "verifyAnchor": "Invert the shared velocity: (2.00)(0.60)=+1.20 kg·m/s; kinetic-en",
    "falsifyAnchor": "A prediction of +1.80 m/s comes from ignoring the negative incomi",
    "variationAnchor": "Reverse the second cart to +1 m/s while holding both masses and t",
    "source": "9-3-conservation-of-linear-momentum"
  },
  {
    "id": "physics-v10-explain-back-chall-impulse-momentum-theorem-2",
    "q": "A 0.25 kg puck reverses from -6 to +2 m/s in 0.020 s: what impulse and mean net force must an experiment explain?",
    "workAnchor": "Impulse equals the signed momentum change: J=0.25[2-(-6)]=+2.00 N",
    "verifyAnchor": "The incoming momentum -1.50 kg·m/s plus +2.00 N·s equals the outg",
    "falsifyAnchor": "Taking 2-6=-4 m/s produces a negative impulse despite a left-to-r",
    "variationAnchor": "Double contact time to 0.040 s at fixed start and end velocities;",
    "source": "9-2-impulse-and-collisions"
  },
  {
    "id": "physics-v10-hypothesis-lab-impulse-momentum-theorem",
    "q": "Can a triangular +80 N force pulse lasting 0.060 s reverse a 0.60 kg glider initially moving at -1 m/s?",
    "workAnchor": "The signed area is J=(1/2)(80)(0.060)=+2.40 N·s. Initial momentum",
    "verifyAnchor": "Inverse endpoint check: 0.60[3-(-1)]=2.40 N·s equals the triangul",
    "falsifyAnchor": "Rectangularizing the pulse at its 80 N peak incorrectly doubles J",
    "variationAnchor": "Hold pulse duration fixed but lower its peak to +40 N; J=+1.20 N·",
    "source": "9-2-impulse-and-collisions"
  },
  {
    "id": "physics-v10-fault-isolation-lab-impulse-momentum-theorem",
    "q": "Why does a linearly increasing net force F(t)=40t N over 0.30 s give +1.80 rather than +3.60 N·s?",
    "workAnchor": "Integrate the specified function: J=integral(40t dt,0,0.30)=20(0.",
    "verifyAnchor": "Mean force of this linear ramp is (0+12)/2=6 N; 6(0.30)=1.80 N·s.",
    "falsifyAnchor": "Multiplying only the FINAL 12 N by 0.30 s yields 3.60 N·s, which ",
    "variationAnchor": "Shorten the interval to 0.15 s without altering F(t); impulse bec",
    "source": "9-2-impulse-and-collisions"
  },
  {
    "id": "physics-v10-field-note-linear-momentum-2",
    "q": "For a 1.60 kg field rover traveling at (3,-4) m/s, what momentum vector, magnitude and translational kinetic energy should be reported?",
    "workAnchor": "p=1.60(3,-4)=(+4.80,-6.40) kg·m/s. Its magnitude is 1.60 sqrt(3^2",
    "verifyAnchor": "Recover velocity from the measured momentum: (4.80/1.60,-6.40/1.6",
    "falsifyAnchor": "A scalar-only report of +8 kg·m/s destroys the southward directio",
    "variationAnchor": "Rotate the velocity to (4,3) m/s at the same speed; the momentum ",
    "source": "9-1-linear-momentum"
  },
  {
    "id": "physics-v10-confidence-calibration-linear-momentum",
    "q": "A tracker reports momentum +9.60 kg·m/s for a 2.40 kg cart: what speed follows, and how does ±0.10 kg mass uncertainty affect it?",
    "workAnchor": "Invert p=mv: v=9.60/2.40=+4.00 m/s. For masses 2.30 to 2.50 kg, t",
    "verifyAnchor": "Substituting the nominal estimate returns 2.40(4.00)=9.60 kg·m/s.",
    "falsifyAnchor": "An asserted ±0.10 m/s velocity bound is not derived from the give",
    "variationAnchor": "Hold momentum fixed but double nominal mass to 4.80 kg; velocity ",
    "source": "9-1-linear-momentum"
  },
  {
    "id": "physics-v10-concept-mapping-lab-linear-momentum",
    "q": "How do signed x/y momentum, speed and kinetic energy connect for a 0.75 kg glider moving at (-2,+6) m/s?",
    "workAnchor": "Compute p=(0.75)(-2,+6)=(-1.50,+4.50) kg·m/s. Speed is sqrt(4+36)",
    "verifyAnchor": "Recover K from the vector momentum: (1.50^2+4.50^2)/(2*0.75)=22.5",
    "falsifyAnchor": "Adding momentum components to get +3 kg·m/s is NOT the vector mag",
    "variationAnchor": "Reflect the velocity across the y-axis to (+2,+6) m/s; only the x",
    "source": "9-1-linear-momentum"
  },
  {
    "id": "physics-v10-exam-style-practice-momentum-conservation",
    "q": "A 1.0 kg cart at +5 m/s sticks to a 3.0 kg cart at -1 m/s: find their speed, kinetic energy lost and applicable conservation law.",
    "workAnchor": "Conserve signed momentum: p=1(5)+3(-1)=+2 kg·m/s, so common veloc",
    "verifyAnchor": "The final p=4(+0.50)=+2 kg·m/s matches the initial ledger; lost k",
    "falsifyAnchor": "Requiring kinetic energy to remain at 14 J while the carts stick ",
    "variationAnchor": "If cart 2 were stationary, p=+5 and the latched speed would be +1",
    "source": "9-3-conservation-of-linear-momentum"
  },
  {
    "id": "physics-v10-mistake-hunt-momentum-conservation",
    "q": "Two carts, 2 kg at +1 m/s and 1 kg at -2 m/s, latch: why is their final velocity zero even though both initially move?",
    "workAnchor": "Their opposing momenta cancel: 2(+1)+1(-2)=0 kg·m/s. Combined mas",
    "verifyAnchor": "Final momentum 3(0)=0 confirms conservation. The 3 J initial kine",
    "falsifyAnchor": "A mass-weighted sum of SPEED magnitudes gives 4/3 m/s but incorre",
    "variationAnchor": "Change the second initial speed to -1 m/s with masses unchanged: ",
    "source": "9-3-conservation-of-linear-momentum"
  },
  {
    "id": "physics-v10-decision-brief-impulse-momentum-theorem",
    "q": "A 0.40 kg device reverses from +6 to -4 m/s in 0.050 s: what braking impulse and mean force inform a contact-pad design?",
    "workAnchor": "J=0.40[-4-(+6)]=-4.00 N·s. The time-average net horizontal force ",
    "verifyAnchor": "Momentum starts at +2.40 and ends at -1.60 kg·m/s; -1.60-(+2.40)=",
    "falsifyAnchor": "Calling 80 N the measured peak load would overclaim: the endpoint",
    "variationAnchor": "Double contact duration to 0.100 s while preserving endpoint velo",
    "source": "9-2-impulse-and-collisions"
  },
  {
    "id": "physics-v10-decision-matrix-lab-impulse-momentum-theorem",
    "q": "Why do a 100 N triangular pulse and a 50 N rectangular pulse, each lasting 0.040 s, produce equal momentum changes?",
    "workAnchor": "Triangular impulse is 0.5(100)(0.040)=+2.00 N·s; rectangular impu",
    "verifyAnchor": "Both force histories have the same +50 N average over 0.040 s, pr",
    "falsifyAnchor": "Selecting the triangular pulse as twice the impulse based solely ",
    "variationAnchor": "Make the triangular pulse span 0.080 s with unchanged 100 N peak;",
    "source": "9-2-impulse-and-collisions"
  },
  {
    "id": "physics-v10-reasoning-check-impulse-momentum-theorem-2",
    "q": "For a 0.50 kg cart at +3 m/s, can two sequential braking forces (-100 N for 0.030 s and -50 N for 0.020 s) reverse it to -5 m/s?",
    "workAnchor": "The first impulse is -100(0.030)=-3.0 N·s and the second is -50(0",
    "verifyAnchor": "From endpoints, m(vf-vi)=0.50(-5-3)=-4.0 N·s. The total mean forc",
    "falsifyAnchor": "Averaging (-100-50)/2=-75 N and multiplying by 0.050 gives -3.75 ",
    "variationAnchor": "Remove the second pulse entirely; then J=-3 N·s and vf=-3 m/s. Th",
    "source": "9-2-impulse-and-collisions"
  },
  {
    "id": "physics-v10-explain-back-chall-linear-momentum-2",
    "q": "If a 3.0 kg payload has momentum (+9,-12) kg·m/s, what velocity, speed and kinetic energy must an independent reviewer reconstruct?",
    "workAnchor": "Invert each component: v=(+9/3,-12/3)=(+3,-4) m/s; speed=sqrt(3^2",
    "verifyAnchor": "Rebuild vector momentum from mass and recovered velocity: 3(+3,-4",
    "falsifyAnchor": "Treating the +9 and -12 components as algebraic scalars to obtain",
    "variationAnchor": "Double mass to 6 kg at fixed momentum components; velocity halves",
    "source": "9-1-linear-momentum"
  },
  {
    "id": "physics-v10-verification-lab-linear-momentum",
    "q": "How can 0.40 kg moving at +5 m/s and 1.00 kg moving at +2 m/s have identical momentum but different kinetic energies?",
    "workAnchor": "Object A has pA=0.40(5)=+2.00 kg·m/s and KA=0.5(0.40)(25)=5.00 J.",
    "verifyAnchor": "Use K=p^2/(2m): 4/(0.80)=5.00 J versus 4/(2.00)=2.00 J; for fixed",
    "falsifyAnchor": "The claim 'equal momentum means equal kinetic energy' is contradi",
    "variationAnchor": "Increase object A mass to 0.80 kg but hold momentum at +2.00; its",
    "source": "9-1-linear-momentum"
  },
  {
    "id": "physics-v10-checklist-lab-linear-momentum",
    "q": "A 1.25 kg telemetry platform travels west at 7.2 km/h: which unit and sign checks lead to its correct momentum and kinetic energy?",
    "workAnchor": "Convert 7.2 km/h * (1000 m/km)/(3600 s/h)=2.00 m/s, then assign -",
    "verifyAnchor": "Reconstruct velocity from p/m=-2.50/1.25=-2.00 m/s; kinetic energ",
    "falsifyAnchor": "Using -7.2 as if it were m/s returns -9.0 kg·m/s and violates the",
    "variationAnchor": "Reverse direction to east at the same speed; momentum changes sig",
    "source": "9-1-linear-momentum"
  },
  {
    "id": "physics-v10-field-note-momentum-conservation",
    "q": "A 2 kg cart at +4 m/s sticks to a 1 kg cart at -1 m/s: what shared speed and energy conversion belong in the field report?",
    "workAnchor": "Initial momentum=2(4)+1(-1)=+7 kg·m/s. Shared velocity is +7/3≈+2",
    "verifyAnchor": "The final total momentum 3(7/3)=7 matches the input; evaluating 1",
    "falsifyAnchor": "A claim that the latch conserves 16.5 J of translational kinetic ",
    "variationAnchor": "Change only the second cart's velocity to +1 m/s; p=+9 kg·m/s and",
    "source": "9-3-conservation-of-linear-momentum"
  },
  {
    "id": "physics-v10-confidence-calibra-momentum-conservation-2",
    "q": "If a two-cart system gains +0.60 N·s of external impulse, why is a +1.60 m/s latch velocity compatible with momentum bookkeeping?",
    "workAnchor": "Initial system momentum is 0.50(4)+0.50(-2)=+1.00 kg·m/s. Since J",
    "verifyAnchor": "Check the system impulse equation Δp=p_final-p_initial=1.60-1.00=",
    "falsifyAnchor": "Predicting +1.00 m/s by forcing p_final=p_initial ignores an expl",
    "variationAnchor": "Repeat the synthetic trial with J_external=0 N·s; the predicted c",
    "source": "9-3-conservation-of-linear-momentum"
  },
  {
    "id": "physics-v10-runbook-lab-impulse-momentum-theorem-2",
    "q": "A +30 N push for 0.040 s followed by a -10 N pull for 0.080 s acts on a 0.20 kg glider at -1 m/s: what is its final velocity?",
    "workAnchor": "Positive impulse=30(0.040)=+1.20 N·s; negative impulse=-10(0.080)",
    "verifyAnchor": "Inverse impulse from endpoints is 0.20[1-(-1)]=+0.40 N·s. The tim",
    "falsifyAnchor": "Ignoring the negative pull predicts -1+1.20/0.20=+5 m/s and confl",
    "variationAnchor": "Reduce the pull interval to 0.040 s; J_net becomes +0.80 N·s and ",
    "source": "9-2-impulse-and-collisions"
  },
  {
    "id": "physics-v10-exam-style-practic-impulse-momentum-theorem-2",
    "q": "Given a measured -3.0 N·s net impulse on a 0.60 kg cart initially at +4 m/s, what final velocity and mean force over 0.050 s follow?",
    "workAnchor": "J=m(vf-vi), thus vf=4+(-3.0)/0.60=-1.0 m/s. Mean net force equals",
    "verifyAnchor": "Initial momentum=+2.40 and final momentum=-0.60 kg·m/s; their dif",
    "falsifyAnchor": "Reporting final +9 m/s by dividing the magnitude 3 by 0.60 and AD",
    "variationAnchor": "Halve impulse magnitude to -1.50 N·s without changing mass or ini",
    "source": "9-2-impulse-and-collisions"
  },
  {
    "id": "physics-v10-mistake-hunt-impulse-momentum-theorem-2",
    "q": "Why is trapezoidal integration of sampled net forces [0,50,40,0] N at 0.010 s intervals a +0.90 N·s impulse?",
    "workAnchor": "The three trapezoidal areas are (0+50)/2(.010)=0.25, (50+40)/2(.0",
    "verifyAnchor": "Endpoint momentum shift=0.30(4-1)=+0.90 N·s. The mean force over ",
    "falsifyAnchor": "Summing 0+50+40+0 and multiplying by 0.010 gives +0.90 only accid",
    "variationAnchor": "Change the final sample to +20 N while retaining all timestamps; ",
    "source": "9-2-impulse-and-collisions"
  },
  {
    "id": "physics-v10-decision-brief-linear-momentum-2",
    "q": "For a 2.50 kg drone surrogate moving at (2,-1,2) m/s, what three-axis momentum, norm and kinetic energy should a motion report contain?",
    "workAnchor": "Momentum is 2.50(2,-1,2)=(+5,-2.5,+5) kg·m/s; speed sqrt(4+1+4)=3",
    "verifyAnchor": "Invert momentum to (2,-1,2) m/s; also calculate K=|p|^2/(2m)=56.2",
    "falsifyAnchor": "Computing vector norm by summing signed components yields +7.5 as",
    "variationAnchor": "Reverse only the vertical component +2 to -2 m/s: the z momentum ",
    "source": "9-1-linear-momentum"
  },
  {
    "id": "physics-v10-measurement-lab-linear-momentum",
    "q": "A 0.20 kg puck slows from +10 to +6 m/s; how does its momentum change differ from reversing to -6 m/s?",
    "workAnchor": "Initial momentum is +2.00 kg·m/s. Slowing without reversal ends a",
    "verifyAnchor": "Compute via differences in signed velocity: 0.20(6-10)=-0.80 vers",
    "falsifyAnchor": "Treating both final speeds as +6 m/s would falsely predict identi",
    "variationAnchor": "Choose -8 m/s as the reversed endpoint, keeping the starting velo",
    "source": "9-1-linear-momentum"
  },
  {
    "id": "physics-v10-reasoning-check-linear-momentum-2",
    "q": "For mass (2.00±0.05) kg and speed (+3.00±0.10) m/s, what nominal momentum and first-order uncertainty bounds are defensible?",
    "workAnchor": "Nominal p=2.00(3.00)=+6.00 kg·m/s. First-order worst-case bound |",
    "verifyAnchor": "Evaluate product endpoints as a non-linear interval check: (1.95)",
    "falsifyAnchor": "Calling 0.25 the guaranteed worst-case error is incorrect: quadra",
    "variationAnchor": "Halve only mass uncertainty to ±0.025 kg: first-order worst-case ",
    "source": "9-1-linear-momentum"
  },
  {
    "id": "physics-v10-explain-back-challenge-momentum-conservation",
    "q": "A resting 2.0 kg capsule splits into 0.50 kg launched at +6 m/s and 1.50 kg moving oppositely: what recoil speed and energy source are implied?",
    "workAnchor": "Initial total momentum is zero, so 0.50(6)+1.50(v2)=0, giving v2=",
    "verifyAnchor": "Final signed momentum +3.0+(-3.0)=0 confirms isolation; total kin",
    "falsifyAnchor": "Setting the second fragment to +2 m/s because 'momentum is conser",
    "variationAnchor": "Double only first-fragment launch speed to +12 m/s while keeping ",
    "source": "9-3-conservation-of-linear-momentum"
  },
  {
    "id": "physics-v10-diagnostic-lab-momentum-conservation",
    "q": "Two carts (1 kg at (3,1) m/s and 2 kg at (-1,2) m/s) latch in a plane: what vector velocity and energy loss reveal correct momentum conservation?",
    "workAnchor": "Initial momentum is (1·3+2·(-1),1·1+2·2)=(+1,+5) kg·m/s. Final sh",
    "verifyAnchor": "Multiply final velocity by total 3 kg to recover (+1,+5) kg·m/s; ",
    "falsifyAnchor": "Conserving only the magnitudes of the incoming momenta (sqrt(10) ",
    "variationAnchor": "Reverse only the second cart's y component from +2 to -2 m/s; the",
    "source": "9-3-conservation-of-linear-momentum"
  }
];
function near(a,b){assert.ok(Number.isFinite(a)&&Math.abs(a-b)<1e-9, `${a} != ${b}`)}
test('25 individual completion lessons and all 97 momentum records preserve authored contracts',()=>{
 assert.equal(Object.keys(lessons).length,97);
 assert.equal(cases.length,25);
 assert.equal(new Set(cases.map(x=>x.id)).size,25);
 assert.equal(new Set(cases.map(x=>x.q)).size,25);
 assert.equal(Object.values(lessons).filter(x=>x.essentialQuestion.startsWith('What does ')).length,0);
 for(const c of cases){let x=lessons[c.id];assert.ok(x,c.id);assert.equal(x.essentialQuestion,c.q);assert.equal(x.reasoningSteps.length,6);assert.equal(x.labPlan.length,6);assert.ok(x.reasoningSteps.every(s=>s.length>=90),c.id);assert.ok(x.labPlan.every(s=>s.length>=90),c.id);assert.ok(x.reasoningSteps[1].includes(c.workAnchor),c.id);assert.ok(x.reasoningSteps[2].includes(c.verifyAnchor),c.id);assert.ok(x.reasoningSteps[3].includes(c.falsifyAnchor),c.id);assert.ok(x.reasoningSteps[4].includes(c.variationAnchor),c.id);assert.ok(x.labPlan[5].includes(sourceRoot+c.source),c.id);assert.ok(x.reasoningSteps[5].includes(sourceRoot+c.source),c.id);assert.match(x.reasoningSteps[3],/falsif|counterexample|invalid|incorrect|violate|rejected/i,c.id);for(const key of ['verifiedBoundary','analogy','starter','technical','memoryLadder','vocabulary','video'])assert.ok(x[key],c.id)}
});
test('Momentum completion case 01: physics-v10-reasoning-check-momentum-conservation',()=>{near(0.8*3+1.2*(-1),1.2);near((0.5*0.8*9+0.5*1.2*1)-(0.5*2*0.6**2),3.84);});
test('Momentum completion case 02: physics-v10-explain-back-chall-impulse-momentum-theorem-2',()=>{near(0.25*(2-(-6)),2);near(0.25*(2-(-6))/0.02,100);});
test('Momentum completion case 03: physics-v10-hypothesis-lab-impulse-momentum-theorem',()=>{near(0.5*80*0.06,2.4);near((-0.6+2.4)/0.6,3);});
test('Momentum completion case 04: physics-v10-fault-isolation-lab-impulse-momentum-theorem',()=>{near(20*0.30**2,1.8);near(2+20*0.30**2/0.9,4);});
test('Momentum completion case 05: physics-v10-field-note-linear-momentum-2',()=>{near(Math.hypot(1.6*3,1.6*(-4)),8);near((1.6*5)**2/(2*1.6),20);});
test('Momentum completion case 06: physics-v10-confidence-calibration-linear-momentum',()=>{near(9.6/2.4,4);near(9.6/2.3,4.173913043478261);});
test('Momentum completion case 07: physics-v10-concept-mapping-lab-linear-momentum',()=>{near(Math.hypot(-.75*2,.75*6),4.743416490252569);near(0.5*.75*(4+36),15);});
test('Momentum completion case 08: physics-v10-exam-style-practice-momentum-conservation',()=>{near((1*5+3*(-1))/(1+3),0.5);near(0.5*1*25+0.5*3*1-0.5*4*0.5**2,13.5);});
test('Momentum completion case 09: physics-v10-mistake-hunt-momentum-conservation',()=>{near(2*1+1*(-2),0);near(0.5*2*1**2+0.5*1*2**2,3);});
test('Momentum completion case 10: physics-v10-decision-brief-impulse-momentum-theorem',()=>{near(.4*(-4-6),-4);near(.4*(-4-6)/.05,-80);});
test('Momentum completion case 11: physics-v10-decision-matrix-lab-impulse-momentum-theorem',()=>{near(0.5*100*.04,2);near(50*.04,2);});
test('Momentum completion case 12: physics-v10-reasoning-check-impulse-momentum-theorem-2',()=>{near(-100*.03-50*.02,-4);near(3+(-100*.03-50*.02)/.5,-5);});
test('Momentum completion case 13: physics-v10-explain-back-chall-linear-momentum-2',()=>{near(Math.hypot(9,-12)/3,5);near((9**2+(-12)**2)/(2*3),37.5);});
test('Momentum completion case 14: physics-v10-verification-lab-linear-momentum',()=>{near(.4*5,2);near((2**2)/(2*.4),5);});
test('Momentum completion case 15: physics-v10-checklist-lab-linear-momentum',()=>{near(1.25*(-7.2/3.6),-2.5);near(0.5*1.25*(7.2/3.6)**2,2.5);});
test('Momentum completion case 16: physics-v10-field-note-momentum-conservation',()=>{near((2*4+1*(-1))/3,2.3333333333333335);near(16.5-(0.5*3*(7/3)**2),8.333333333333334);});
test('Momentum completion case 17: physics-v10-confidence-calibra-momentum-conservation-2',()=>{near(.5*4+.5*(-2)+.6,1.6);near((1.6-1.0),0.6);});
test('Momentum completion case 18: physics-v10-runbook-lab-impulse-momentum-theorem-2',()=>{near(30*.04-10*.08,0.4);near(-1+(30*.04-10*.08)/.2,1);});
test('Momentum completion case 19: physics-v10-exam-style-practic-impulse-momentum-theorem-2',()=>{near(4+(-3)/.6,-1);near((-3)/.05,-60);});
test('Momentum completion case 20: physics-v10-mistake-hunt-impulse-momentum-theorem-2',()=>{near((.5*(0+50)+.5*(50+40)+.5*(40+0))*.01,0.9);near(1+.9/.3,4);});
test('Momentum completion case 21: physics-v10-decision-brief-linear-momentum-2',()=>{near(Math.hypot(5,-2.5,5),7.5);near(0.5*2.5*(2**2+(-1)**2+2**2),11.25);});
test('Momentum completion case 22: physics-v10-measurement-lab-linear-momentum',()=>{near(.2*(6-10),-0.8);near(.2*(-6-10),-3.2);});
test('Momentum completion case 23: physics-v10-reasoning-check-linear-momentum-2',()=>{near(2*3,6);near(Math.hypot(3*.05,2*.10),0.25);});
test('Momentum completion case 24: physics-v10-explain-back-challenge-momentum-conservation',()=>{near(-(.5*6)/1.5,-2);near(.5*.5*6**2+.5*1.5*2**2,12);});
test('Momentum completion case 25: physics-v10-diagnostic-lab-momentum-conservation',()=>{near((1*3+2*(-1))/(1+2),0.3333333333333333);near(10-(.5*3*((1/3)**2+(5/3)**2)),5.666666666666667);});
