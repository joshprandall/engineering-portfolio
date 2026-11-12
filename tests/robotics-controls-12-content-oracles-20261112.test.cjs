'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const lessons = JSON.parse(fs.readFileSync(path.join(__dirname, '../deep-learning/robotics/controls.json'), 'utf8'));
const IDs = [
  "robotics-controls-01-forward-kinematics-2r",
  "robotics-controls-02-inverse-kinematics-branches",
  "robotics-controls-03-jacobian-singularity",
  "robotics-controls-04-frame-transform-inverse",
  "robotics-controls-05-differential-wheel-speeds",
  "robotics-controls-06-differential-drive-arc",
  "robotics-controls-07-wheel-encoder-quantization",
  "robotics-controls-08-two-point-calibration",
  "robotics-controls-09-discrete-p-stability",
  "robotics-controls-10-integrator-antiwindup",
  "robotics-controls-11-scalar-kalman-update",
  "robotics-controls-12-trapezoid-profile"
];
const cases = [
  [
    1,
    2,
    "x=([+-]?\\d+(?:\\.\\d+)?) m, y=([+-]?\\d+(?:\\.\\d+)?) m; Euclidean reach .*?=([+-]?\\d+(?:\\.\\d+)?) m",
    [
      0.4,
      0.3,
      0.5
    ]
  ],
  [
    1,
    4,
    "correct tip is \\(([+-]?\\d+(?:\\.\\d+)?),([+-]?\\d+(?:\\.\\d+)?)\\) m, not \\(([+-]?\\d+(?:\\.\\d+)?),([+-]?\\d+(?:\\.\\d+)?)\\) m",
    [
      -0.3,
      0.4,
      0,
      0.7
    ]
  ],
  [
    2,
    2,
    "theta1=([+-]?\\d+(?:\\.\\d+)?)°; for -90°, theta1=([+-]?\\d+(?:\\.\\d+)?)°",
    [
      0,
      73.73979529168804
    ]
  ],
  [
    2,
    4,
    "target \\(([+-]?\\d+(?:\\.\\d+)?),([+-]?\\d+(?:\\.\\d+)?)\\) m gives radius ([+-]?\\d+(?:\\.\\d+)?) m greater than total link length ([+-]?\\d+(?:\\.\\d+)?) m",
    [
      0.8,
      0,
      0.8,
      0.7
    ]
  ],
  [
    3,
    1,
    "tip velocity v=\\(([+-]?\\d+(?:\\.\\d+)?),([+-]?\\d+(?:\\.\\d+)?)\\) m/s",
    [
      -0.09,
      0.08
    ]
  ],
  [
    3,
    3,
    "det J=.*?=([+-]?\\d+(?:\\.\\d+)?) m²/rad²",
    [
      0.12
    ]
  ],
  [
    4,
    1,
    "world point=\\(([+-]?\\d+(?:\\.\\d+)?),([+-]?\\d+(?:\\.\\d+)?)\\) m",
    [
      0.9,
      2.2
    ]
  ],
  [
    4,
    3,
    "=\\(([+-]?\\d+(?:\\.\\d+)?),([+-]?\\d+(?:\\.\\d+)?)\\) m, not",
    [
      -2.1,
      1.2
    ]
  ],
  [
    5,
    1,
    "left=.*?=([+-]?\\d+(?:\\.\\d+)?) m/s, right=.*?=([+-]?\\d+(?:\\.\\d+)?) m/s",
    [
      0.5,
      0.7
    ]
  ],
  [
    5,
    3,
    "omega to ([+-]?\\d+(?:\\.\\d+)?) rad/s",
    [
      0.2
    ]
  ],
  [
    6,
    2,
    "R=.*?=([+-]?\\d+(?:\\.\\d+)?) m; exact arc integration gives dx=([+-]?\\d+(?:\\.\\d+)?) m, dy=([+-]?\\d+(?:\\.\\d+)?) m, heading=([+-]?\\d+(?:\\.\\d+)?) rad",
    [
      1.25,
      0.24833666349382652,
      0.024916777698447967,
      0.2
    ]
  ],
  [
    6,
    3,
    "chord distance .*?=([+-]?\\d+(?:\\.\\d+)?) m",
    [
      0.2495835416170704
    ]
  ],
  [
    7,
    1,
    "One count represents .*?=([+-]?\\d+(?:\\.\\d+)?) m; 1024 positive counts represent ([+-]?\\d+(?:\\.\\d+)?) m",
    [
      0.00015339807878856412,
      0.15707963267948966
    ]
  ],
  [
    7,
    4,
    "about ([+-]?\\d+(?:\\.\\d+)?) m",
    [
      0.00007669903939428206
    ]
  ],
  [
    8,
    1,
    "gain .*?=([+-]?\\d+(?:\\.\\d+)?) and additive offset .*?=([+-]?\\d+(?:\\.\\d+)?) m",
    [
      1.05,
      0.02
    ]
  ],
  [
    8,
    2,
    "corrected distance .*?=([+-]?\\d+(?:\\.\\d+)?) m",
    [
      2
    ]
  ],
  [
    9,
    1,
    "x1=([+-]?\\d+(?:\\.\\d+)?); next .*?x2=([+-]?\\d+(?:\\.\\d+)?); then .*?x3=([+-]?\\d+(?:\\.\\d+)?)",
    [
      0.4,
      0.64,
      0.784
    ]
  ],
  [
    9,
    4,
    "x1=([+-]?\\d+(?:\\.\\d+)?), x2=([+-]?\\d+(?:\\.\\d+)?)",
    [
      2.5,
      -1.25
    ]
  ],
  [
    10,
    2,
    "I10=([+-]?\\d+(?:\\.\\d+)?), and computed raw command is .*?=([+-]?\\d+(?:\\.\\d+)?)",
    [
      2,
      6
    ]
  ],
  [
    10,
    5,
    "raw output is .*?=([+-]?\\d+(?:\\.\\d+)?) and clips .*?whereas conditional I=0 gives raw ([+-]?\\d+(?:\\.\\d+)?)",
    [
      1.5,
      -0.5
    ]
  ],
  [
    11,
    1,
    "K=.*?=([+-]?\\d+(?:\\.\\d+)?) \\(dimensionless\\)",
    [
      0.7352941176470589
    ]
  ],
  [
    11,
    2,
    "x_post=.*?=([+-]?\\d+(?:\\.\\d+)?) m; covariance .*?=([+-]?\\d+(?:\\.\\d+)?) m²",
    [
      2.4411764705882355,
      0.06617647058823528
    ]
  ],
  [
    12,
    2,
    "cruise lasts ([+-]?\\d+(?:\\.\\d+)?) s and total time is ([+-]?\\d+(?:\\.\\d+)?) s",
    [
      1,
      3
    ]
  ],
  [
    12,
    4,
    "peak is .*?=([+-]?\\d+(?:\\.\\d+)?) m/s and total time is .*?=([+-]?\\d+(?:\\.\\d+)?) s",
    [
      0.6324555320336759,
      1.2649110640673518
    ]
  ]
];
function checkNumericClaim(sentence, spec) {
  const match = sentence.match(new RegExp(spec[2], 'd'));
  assert.ok(match, 'numeric claim not found in lesson reasoning');
  const received = match.slice(1).map(Number);
  assert.equal(received.length, spec[3].length, 'oracle capture count');
  for (let i = 0; i < received.length; i++) {
    const tolerance = Math.max(1e-8, Math.abs(spec[3][i]) * 1e-6);
    assert.ok(Number.isFinite(received[i]) && Math.abs(received[i] - spec[3][i]) <= tolerance,
      'numeric mismatch: expected ' + spec[3][i] + ', received ' + received[i]);
  }
  return match;
}
test('twelve exclusive robotics lessons retain their IDs, scope and teaching evidence', () => {
  assert.deepEqual(Object.keys(lessons), IDs);
  for (const id of IDs) {
    const lesson = lessons[id];
    assert.equal(lesson.reasoningSteps.length, 6, id);
    assert.ok(lesson.labPlan.length >= 3, id);
    assert.match(lesson.technical.scope, /Synthetic, offline educational case\./, id);
    assert.ok(lesson.reasoningSteps.some(s => /https:\/\//.test(s)), 'source absent: ' + id);
  }
});
for (const entry of cases) {
  const id = IDs[entry[0] - 1];
  const step = entry[1];
  test(id + ' numerical oracle for reasoning step ' + (step + 1), () => {
    checkNumericClaim(lessons[id].reasoningSteps[step], entry);
  });
  test(id + ' detects corrupted numerical answer in step ' + (step + 1), () => {
    const original = lessons[id].reasoningSteps[step];
    const match = checkNumericClaim(original, entry);
    const [start, end] = match.indices[1];
    const corrupted = original.slice(0, start) + String(Number(match[1]) + 0.05) + original.slice(end);
    assert.throws(() => checkNumericClaim(corrupted, entry), /numeric mismatch/);
  });
}
