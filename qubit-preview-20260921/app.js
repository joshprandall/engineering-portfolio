import { stateFromAngle, describeState, sampleMeasurements } from "./qubit.js";

const $ = (selector) => document.querySelector(selector);
const theta = $("#theta");
const thetaValue = $("#theta-value");
const angleOutput = $("#angle-output");
const arrow = $("#state-arrow");
const alpha = $("#alpha");
const beta = $("#beta");
const normalization = $("#normalization");
const p0 = $("#p0");
const p1 = $("#p1");
const bar0 = $("#bar0");
const bar1 = $("#bar1");
const description = $("#state-description");
const shots = $("#shots");
const count0 = $("#count0");
const count1 = $("#count1");
const observed0 = $("#observed0");
const observed1 = $("#observed1");

function percent(value) {
  return `${(value * 100).toFixed(1)}%`;
}

function clearResults() {
  count0.textContent = "—";
  count1.textContent = "—";
  observed0.textContent = "—";
  observed1.textContent = "—";
}

function render() {
  const angle = Number(theta.value);
  const state = stateFromAngle(angle);

  thetaValue.textContent = `${angle}°`;
  angleOutput.textContent = `${angle}°`;
  alpha.textContent = state.alpha.toFixed(4);
  beta.textContent = state.beta.toFixed(4);
  normalization.textContent = state.normalization.toFixed(4);
  p0.textContent = percent(state.p0);
  p1.textContent = percent(state.p1);
  bar0.style.width = percent(state.p0);
  bar1.style.width = percent(state.p1);
  description.textContent = describeState(angle);

  // Bloch polar angle: 0° points north and 180° points south.
  arrow.style.transform = `translate(-50%,-100%) rotate(${angle}deg)`;
  clearResults();
}

theta.addEventListener("input", render);

document.querySelectorAll("[data-angle]").forEach((button) => {
  button.addEventListener("click", () => {
    theta.value = button.dataset.angle;
    render();
    theta.focus();
  });
});

$("#measure").addEventListener("click", () => {
  const state = stateFromAngle(Number(theta.value));
  const total = Number(shots.value);
  const result = sampleMeasurements(state.p0, total);

  count0.textContent = result.count0.toLocaleString();
  count1.textContent = result.count1.toLocaleString();
  observed0.textContent = percent(result.count0 / result.shots);
  observed1.textContent = percent(result.count1 / result.shots);
});

$("#reset-results").addEventListener("click", clearResults);

render();
